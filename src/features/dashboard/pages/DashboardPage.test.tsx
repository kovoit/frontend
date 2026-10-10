import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http } from 'msw'
import { describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { buildMockStats } from '@/mocks/dashboard'
import { fail, ok } from '@/mocks/envelope'
import { server } from '@/mocks/server'
import { renderAt } from '@/test/renderWithRouter'
import type { DashboardStats } from '../types'

const STATS_URL = `${env.apiUrl}/admin/tableau-de-bord/`

function fixedStats(overrides: Partial<DashboardStats> = {}): DashboardStats {
  const stats = buildMockStats('30j', new Date('2026-10-08T12:00:00Z'))
  return {
    ...stats,
    indicateurs: {
      trajets_publies: 1240,
      trajets_termines: 1102,
      passagers_transportes: 2087,
      economies_realisees: 605230,
      utilisateurs_verifies: 412,
      conducteurs_verifies: 87,
    },
    a_traiter: { kyc_en_attente: 14, signalements_ouverts: 0, litiges: 2 },
    ...overrides,
  }
}

describe('tableau de bord', () => {
  it("affiche les indicateurs renvoyés par l'API, formatés", async () => {
    server.use(http.get(STATS_URL, () => ok(fixedStats())))
    renderAt('/admin', { asAdmin: true })

    const kpis = await screen.findByRole('region', { name: 'Indicateurs clés' })
    expect(within(kpis).getByText('1 102')).toBeVisible()
    expect(within(kpis).getByText('sur 1 240 publiés')).toBeVisible()
    expect(within(kpis).getByText('2 087')).toBeVisible()
    expect(within(kpis).getByText('605 230 FCFA')).toBeVisible()
    expect(within(kpis).getByText('dont 87 conducteurs')).toBeVisible()
  })

  it('relie chaque file de travail à la liste filtrée', async () => {
    server.use(http.get(STATS_URL, () => ok(fixedStats())))
    renderAt('/admin', { asAdmin: true })

    expect(await screen.findByRole('link', { name: /Dossiers KYC en attente/ })).toHaveAttribute(
      'href',
      '/admin/kyc?statut=en_attente',
    )
    expect(screen.getByRole('link', { name: /Litiges à trancher/ })).toHaveAttribute(
      'href',
      '/admin/bookings?statut=litige',
    )
    expect(screen.getByText('Signalements ouverts : rien à traiter')).toBeVisible()
  })

  it('change de période, met à jour l’URL et recharge les données', async () => {
    const periodes: string[] = []
    server.use(
      http.get(STATS_URL, ({ request }) => {
        periodes.push(new URL(request.url).searchParams.get('periode') ?? '')
        return ok(fixedStats())
      }),
    )
    const router = renderAt('/admin', { asAdmin: true })
    await screen.findByRole('region', { name: 'Indicateurs clés' })
    expect(screen.getByRole('button', { name: '30 derniers jours' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    await userEvent.click(screen.getByRole('button', { name: '7 derniers jours' }))
    expect(router.state.location.search).toBe('?periode=7j')
    expect(screen.getByRole('button', { name: '7 derniers jours' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await screen.findByRole('region', { name: 'Indicateurs clés' })
    expect(periodes).toEqual(['30j', '7j'])
  })

  it('affiche les deux graphiques avec leur vue tableau', async () => {
    renderAt('/admin', { asAdmin: true })
    expect(await screen.findByTestId('chart-line')).toHaveAttribute(
      'data-series',
      'Trajets terminés|Passagers transportés',
    )
    expect(await screen.findByTestId('chart-bar')).toBeInTheDocument()
    expect(screen.getAllByText('Afficher les données')).toHaveLength(2)
    expect(
      screen.getByRole('table', { name: 'Réservations par statut' }),
    ).toBeInTheDocument()
  })

  it('affiche une erreur avec Réessayer si l’API échoue', async () => {
    let calls = 0
    server.use(
      http.get(STATS_URL, () => {
        calls += 1
        return calls === 1
          ? fail(500, 'Une erreur interne est survenue. Réessayez plus tard.', 'ERREUR_INTERNE')
          : ok(fixedStats())
      }),
    )
    renderAt('/admin', { asAdmin: true })

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Impossible de charger les données')
    expect(alert).toHaveTextContent('Une erreur interne est survenue')

    await userEvent.click(within(alert).getByRole('button', { name: 'Réessayer' }))
    expect(await screen.findByRole('region', { name: 'Indicateurs clés' })).toBeVisible()
  })
})
