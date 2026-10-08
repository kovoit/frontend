import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { env } from '@/config/env'
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
        return HttpResponse.json({ ok: true })
      }),
    )
    tokenStore.set('abc')
    await api.get('/me/')
    expect(received).toBe('Bearer abc')
  })

  it('rafraîchit le token sur 401 puis rejoue la requête', async () => {
    server.use(
      http.get(url('/me/'), ({ request }) =>
        request.headers.get('Authorization') === 'Bearer nouveau'
          ? HttpResponse.json({ ok: true })
          : new HttpResponse(null, { status: 401 }),
      ),
      http.post(url(REFRESH_PATH), () => HttpResponse.json({ access: 'nouveau' })),
    )
    tokenStore.set('expire')
    const { data } = await api.get('/me/')
    expect(data).toEqual({ ok: true })
    expect(tokenStore.get()).toBe('nouveau')
  })

  it('vide la session quand le refresh échoue', async () => {
    server.use(
      http.get(url('/me/'), () => new HttpResponse(null, { status: 401 })),
      http.post(url(REFRESH_PATH), () => new HttpResponse(null, { status: 401 })),
    )
    tokenStore.set('expire')
    await expect(api.get('/me/')).rejects.toBeTruthy()
    expect(tokenStore.get()).toBeNull()
  })

  it('normalise les erreurs de champ DRF', async () => {
    server.use(
      http.post(url('/admin/kyc/1/rejeter/'), () =>
        HttpResponse.json({ motif_rejet: ['Ce champ est obligatoire.'] }, { status: 400 }),
      ),
    )
    const error = await api.post('/admin/kyc/1/rejeter/', {}).catch((e: unknown) => e)
    expect(toApiError(error)).toEqual({
      status: 400,
      message: 'La requête a échoué.',
      fieldErrors: { motif_rejet: ['Ce champ est obligatoire.'] },
    })
  })
})
