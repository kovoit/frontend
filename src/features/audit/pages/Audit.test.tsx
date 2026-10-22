import { act, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { env } from '@/config/env'
import { fail, ok } from '@/mocks/envelope'
import { server } from '@/mocks/server'
import { renderAt } from '@/test/renderWithRouter'
import { LIVE_INTERVAL_MS } from '../api'
import type { AuditEvent, AuditStats } from '../types'

const BASE = `${env.apiUrl}/admin/audit`

function evenement(id: string, overrides: Partial<AuditEvent> = {}): AuditEvent {
  return {
    id,
    survenu_le: '2026-10-22T10:00:00Z',
    enregistre_le: '2026-10-22T10:00:00Z',
    categorie: 'metier',
    action: 'reservation.demander',
    libelle: 'Demande de réservation',
    resultat: 'succes',
    gravite: 'info',
    canal: 'mobile',
    acteur: { id: 'u1', prenom: 'Afi', nom: 'Mensah', email: 'afi@exemple.tg', supprime: false },
    acteur_role: 'passager',
    ressource_type: 'reservation',
    ressource_id: 'aaaaaaaa-0000-0000-0000-000000000001',
    code_motif: '',
    request_id: '0123456789abcdef0123456789abcdef',
    details: {},
    changements: {},
    ...overrides,
  }
}

const STATS: AuditStats = {
  debut: '2026-10-16T00:00:00Z',
  fin: '2026-10-22T12:00:00Z',
  total: 42,
  metier_succes: 30,
  metier_refus: 5,
  securite: 4,
  securite_refus: 3,
  technique: 1,
  admin: 2,
  utilisateurs_actifs: 12,
  derniere_activite: '2026-10-22T10:00:00Z',
}

const page = (results: AuditEvent[]) =>
  ok({ count: results.length, next: null, previous: null, results })
const flux = (evenements: AuditEvent[]) =>
  ok({ evenements, tronque: false, serveur_le: '2026-10-22T10:00:05Z' })

afterEach(() => {
  vi.useRealTimers()
})

describe('journal d’audit', () => {
  it('affiche les indicateurs et les événements renvoyés par le serveur', async () => {
    server.use(
      http.get(`${BASE}/statistiques/`, () => ok(STATS)),
      http.get(`${BASE}/evenements/`, () => page([evenement('e1')])),
    )
    renderAt('/admin/audit', { asAdmin: true })

    // Premier rendu de la page (import à la demande) : plus lent quand toute la suite tourne
    const kpis = await screen.findByRole(
      'region',
      { name: 'Indicateurs du journal' },
      { timeout: 5000 },
    )
    expect(within(kpis).getByText('42')).toBeVisible()
    expect(within(kpis).getByText("dont 3 refus d'accès ou d'authentification")).toBeVisible()
    const table = await screen.findByRole('table', { name: 'Journal d’audit' })
    expect(within(table).getByText('Demande de réservation')).toBeVisible()
    expect(within(table).getByText('Afi Mensah')).toBeVisible()
    expect(within(table).getByText('Application mobile')).toBeVisible()
  })

  it('affiche un état vide sans inventer d’événement', async () => {
    renderAt('/admin/audit', { asAdmin: true })

    expect(await screen.findByText('Aucun événement enregistré pour ces critères.')).toBeVisible()
    expect(await screen.findByText('Aucun événement enregistré')).toBeVisible()
  })

  it('ajoute les nouveaux événements en direct, une seule fois chacun', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    let appels = 0
    server.use(
      http.get(`${BASE}/evenements/`, () => page([evenement('e1')])),
      // Le serveur relit une marge : il renvoie aussi des événements déjà reçus
      http.get(`${BASE}/flux/`, () => {
        appels += 1
        const nouveau = evenement('e2', {
          libelle: 'Acceptation d’une réservation',
          enregistre_le: '2026-10-22T10:00:03Z',
        })
        return flux(appels === 1 ? [evenement('e1'), nouveau] : [nouveau])
      }),
    )
    renderAt('/admin/audit', { asAdmin: true })
    const table = await screen.findByRole('table', { name: 'Journal d’audit' })

    expect(await within(table).findByText('Acceptation d’une réservation')).toBeVisible()
    await act(() => vi.advanceTimersByTimeAsync(LIVE_INTERVAL_MS))
    expect(appels).toBeGreaterThanOrEqual(2)
    expect(within(table).getAllByText('Acceptation d’une réservation')).toHaveLength(1)
    expect(within(table).getAllByText('Demande de réservation')).toHaveLength(1)
    expect(screen.getByText('En direct')).toBeVisible()
  })

  it('signale une coupure du direct puis récupère les événements manqués', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    let panne = true
    const depuis: string[] = []
    server.use(
      http.get(`${BASE}/evenements/`, () => page([evenement('e1')])),
      http.get(`${BASE}/flux/`, ({ request }) => {
        depuis.push(new URL(request.url).searchParams.get('depuis') ?? '')
        if (panne) return fail(503, 'Service indisponible.')
        return flux([evenement('e3', { libelle: 'Rejet d’un dossier KYC' })])
      }),
    )
    renderAt('/admin/audit', { asAdmin: true })

    expect(await screen.findByText('Connexion interrompue, nouvelle tentative…')).toBeVisible()
    panne = false
    await act(() => vi.advanceTimersByTimeAsync(LIVE_INTERVAL_MS))

    expect(await screen.findByText('Rejet d’un dossier KYC')).toBeVisible()
    expect(screen.getByText('En direct')).toBeVisible()
    // Reprise au dernier événement reçu : rien n'est perdu pendant la coupure
    expect(new Set(depuis)).toEqual(new Set(['2026-10-22T10:00:00Z']))
  })

  it('envoie les filtres au serveur, pour la liste comme pour le direct', async () => {
    const listes: string[] = []
    const directs: string[] = []
    server.use(
      http.get(`${BASE}/evenements/`, ({ request }) => {
        listes.push(new URL(request.url).searchParams.get('categorie') ?? '')
        return page([evenement('e1')])
      }),
      http.get(`${BASE}/flux/`, ({ request }) => {
        directs.push(new URL(request.url).searchParams.get('categorie') ?? '')
        return flux([])
      }),
    )
    const router = renderAt('/admin/audit', { asAdmin: true })
    await screen.findByRole('table', { name: 'Journal d’audit' })

    await userEvent.selectOptions(screen.getByLabelText('Catégorie'), 'securite')

    expect(router.state.location.search).toBe('?categorie=securite')
    await vi.waitFor(() => expect(listes).toContain('securite'))
    await vi.waitFor(() => expect(directs).toContain('securite'))
  })

  it('exporte en CSV avec les filtres en cours', async () => {
    const exports: string[] = []
    server.use(
      http.get(`${BASE}/evenements/`, () => page([evenement('e1')])),
      http.get(`${BASE}/export/`, ({ request }) => {
        exports.push(new URL(request.url).search)
        return new HttpResponse('enregistre_le;action', {
          headers: { 'Content-Type': 'text/csv' },
        })
      }),
    )
    renderAt('/admin/audit?categorie=securite', { asAdmin: true })
    await screen.findByRole('table', { name: 'Journal d’audit' })

    await userEvent.click(screen.getByRole('button', { name: 'Exporter (CSV)' }))

    await vi.waitFor(() => expect(exports).toEqual(['?categorie=securite']))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('affiche le détail sans inventer l’acteur d’un compte supprimé', async () => {
    server.use(
      http.get(`${BASE}/evenements/e9/`, () =>
        ok(
          evenement('e9', {
            resultat: 'refus',
            code_motif: 'DEJA_RESERVE',
            acteur: { id: 'deadbeef-0000', prenom: null, nom: null, email: null, supprime: true },
            changements: { statut: ['demandee', 'annulee'] },
          }),
        ),
      ),
    )
    renderAt('/admin/audit/e9', { asAdmin: true })

    expect(await screen.findByText(/Compte supprimé/, { selector: 'dd' })).toBeVisible()
    expect(screen.getByText('DEJA_RESERVE')).toBeVisible()
    expect(screen.getByRole('link', { name: '0123456789abcdef0123456789abcdef' })).toHaveAttribute(
      'href',
      '/admin/audit?correlation=0123456789abcdef0123456789abcdef',
    )
    expect(screen.getByText('annulee')).toBeVisible()
  })

  it('affiche une erreur si l’accès est refusé', async () => {
    server.use(
      http.get(`${BASE}/evenements/`, () =>
        fail(403, "Vous n'avez pas la permission.", 'ACCES_REFUSE'),
      ),
    )
    renderAt('/admin/audit', { asAdmin: true })

    expect(await screen.findByText('Journal indisponible')).toBeVisible()
    expect(screen.queryByRole('table', { name: 'Journal d’audit' })).not.toBeInTheDocument()
  })
})
