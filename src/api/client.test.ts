import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { fail, invalid, ok } from '@/mocks/envelope'
import { server } from '@/mocks/server'
import { api, REFRESH_PATH, toApiError } from './client'
import { tokenStore } from './tokenStore'

const url = (path: string) => `${env.apiUrl}${path}`

describe('client API', () => {
  it("ajoute l'access token en en-tête Authorization", async () => {
    let received: string | null = null
    server.use(
      http.get(url('/me/'), ({ request }) => {
        received = request.headers.get('Authorization')
        return ok({ ok: true })
      }),
    )
    tokenStore.set('abc')
    await api.get('/me/')
    expect(received).toBe('Bearer abc')
  })

  it("extrait `reponse` de l'enveloppe du backend", async () => {
    server.use(http.get(url('/me/'), () => ok({ id: 'a1' }, { message: 'Profil récupéré.' })))
    const response = await api.get('/me/')
    expect(response.data).toEqual({ id: 'a1' })
    expect((response as { apiMessage?: string }).apiMessage).toBe('Profil récupéré.')
  })

  it('laisse intactes les réponses non enveloppées (fichiers, JSON brut)', async () => {
    server.use(http.get(url('/brut/'), () => HttpResponse.json({ ok: true })))
    const { data } = await api.get('/brut/')
    expect(data).toEqual({ ok: true })
  })

  it('rafraîchit le token sur 401 puis rejoue la requête', async () => {
    server.use(
      http.get(url('/me/'), ({ request }) =>
        request.headers.get('Authorization') === 'Bearer nouveau'
          ? ok({ ok: true })
          : fail(401, 'Session invalide ou expirée. Reconnectez-vous.'),
      ),
      http.post(url(REFRESH_PATH), () => ok({ access: 'nouveau' })),
    )
    tokenStore.set('expire')
    const { data } = await api.get('/me/')
    expect(data).toEqual({ ok: true })
    expect(tokenStore.get()).toBe('nouveau')
  })

  it('vide la session quand le refresh échoue', async () => {
    server.use(
      http.get(url('/me/'), () => fail(401, 'Session invalide ou expirée. Reconnectez-vous.')),
      http.post(url(REFRESH_PATH), () => fail(401, 'Session expirée.', 'SESSION_EXPIREE')),
    )
    tokenStore.set('expire')
    await expect(api.get('/me/')).rejects.toBeTruthy()
    expect(tokenStore.get()).toBeNull()
  })

  it('normalise les erreurs de validation (enveloppe failed)', async () => {
    server.use(
      http.post(url('/admin/kyc/1/rejeter/'), () =>
        invalid({ motif: ['Ce champ est obligatoire.'] }),
      ),
    )
    const error = await api.post('/admin/kyc/1/rejeter/', {}).catch((e: unknown) => e)
    expect(toApiError(error)).toEqual({
      status: 400,
      code: 'DONNEES_INVALIDES',
      message: 'Les données envoyées sont invalides.',
      fieldErrors: { motif: ['Ce champ est obligatoire.'] },
    })
  })

  it('reprend le message et le code métier du backend', async () => {
    server.use(
      http.post(url('/reservations/'), () =>
        fail(409, 'Plus aucune place disponible.', 'PLUS_DE_PLACE'),
      ),
    )
    const error = await api.post('/reservations/', {}).catch((e: unknown) => e)
    expect(toApiError(error)).toMatchObject({
      status: 409,
      code: 'PLUS_DE_PLACE',
      message: 'Plus aucune place disponible.',
    })
  })

  it('aplatit les erreurs non liées à un champ et imbriquées', async () => {
    server.use(
      http.post(url('/trajets/'), () =>
        fail(400, 'Les données envoyées sont invalides.', 'DONNEES_INVALIDES', {
          non_field_errors: ['Départ et arrivée identiques.'],
          points: { 0: ['Libellé requis.'] },
        }),
      ),
    )
    const error = await api.post('/trajets/', {}).catch((e: unknown) => e)
    expect(toApiError(error)).toMatchObject({
      message: 'Départ et arrivée identiques.',
      fieldErrors: {
        non_field_errors: ['Départ et arrivée identiques.'],
        points: ['Libellé requis.'],
      },
    })
  })
})
