import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { db } from '@/mocks/people'
import { renderAt } from '@/test/renderWithRouter'

describe('liste des trajets', () => {
  it('affiche les trajets, les plus récents d’abord, avec prix et places', async () => {
    renderAt('/admin/trips', { asAdmin: true })
    const table = await screen.findByRole('table', { name: 'Trajets' })
    const rows = within(table).getAllByRole('row').slice(1)
    expect(rows).toHaveLength(20)
    expect(screen.getByText(`1–20 sur ${db.trajets.length}`)).toBeVisible()

    const latest = [...db.trajets].sort((a, b) => b.depart_le.localeCompare(a.depart_le))[0]!
    expect(rows[0]).toHaveTextContent(latest.depart.libelle)
    expect(rows[0]).toHaveTextContent(`${latest.places_restantes} / ${latest.places_total}`)
  })

  it('filtre par statut', async () => {
    const router = renderAt('/admin/trips', { asAdmin: true })
    await screen.findByRole('table', { name: 'Trajets' })
    await userEvent.selectOptions(screen.getByLabelText('Statut du trajet'), 'termine')

    expect(router.state.location.search).toBe('?statut=termine')
    const expected = db.trajets.filter((t) => t.statut === 'termine').length
    await waitFor(() => expect(screen.getByText(`1–${Math.min(expected, 20)} sur ${expected}`)).toBeVisible())
    screen.getAllByRole('row').slice(1).forEach((row) => expect(row).toHaveTextContent('Terminé'))
  })

  it('recherche par lieu', async () => {
    renderAt('/admin/trips', { asAdmin: true })
    await screen.findByRole('table', { name: 'Trajets' })
    await userEvent.type(screen.getByLabelText('Rechercher un trajet'), 'baguida')
    await waitFor(() => {
      const rows = screen.getAllByRole('row').slice(1)
      expect(rows.length).toBeGreaterThan(0)
      rows.forEach((row) => expect(row).toHaveTextContent('Baguida'))
    })
  })
})

describe('détail d’un trajet', () => {
  it('affiche la carte, les arrêts dans l’ordre et les réservations', async () => {
    const trajet = db.trajets.find((t) => t.points.length === 2 && db.reservations.some((r) => r.trajet_id === t.id))!
    renderAt(`/admin/trips/${trajet.id}`, { asAdmin: true })

    expect(await screen.findByTestId('route-map')).toBeInTheDocument()
    const stops = within(screen.getByRole('list', { name: 'Arrêts du trajet' })).getAllByRole('listitem')
    expect(stops.map((li) => li.textContent)).toEqual([
      `Départ${trajet.depart.libelle}`,
      ...trajet.points.map((p) => `Prise en charge${p.libelle}`),
      `Arrivée${trajet.arrivee.libelle}`,
    ])

    const count = db.reservations.filter((r) => r.trajet_id === trajet.id).length
    expect(screen.getByRole('heading', { name: `Réservations (${count})` })).toBeVisible()
    const table = screen.getByRole('table', { name: 'Réservations du trajet' })
    expect(within(table).getAllByRole('row')).toHaveLength(count + 1)
  })
})
