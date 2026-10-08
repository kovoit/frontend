import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { RESERVATION_STATUS } from '@/config/enums'
import { db } from '@/mocks/people'
import { renderAt } from '@/test/renderWithRouter'

describe('réservations', () => {
  it('liste les litiges depuis le lien du tableau de bord', async () => {
    renderAt('/admin/bookings?statut=litige', { asAdmin: true })
    const table = await screen.findByRole('table', { name: 'Réservations' })
    const litiges = db.reservations.filter((r) => r.statut === 'litige')
    const rows = within(table).getAllByRole('row').slice(1)
    expect(litiges.length).toBeGreaterThan(0)
    expect(rows).toHaveLength(litiges.length)
    rows.forEach((row) => expect(within(row).getByText('Litige')).toBeVisible())
  })

  it('affiche la chronologie des statuts dans l’ordre du cycle de vie', async () => {
    const res = db.reservations.find((r) => r.statut === 'cloturee')!
    renderAt(`/admin/bookings/${res.id}`, { asAdmin: true })

    const timeline = await screen.findByRole('list', { name: 'Historique des statuts' })
    const steps = within(timeline).getAllByRole('listitem')
    expect(steps.map((step) => within(step).getAllByText(/./)[0]!.textContent)).toEqual(
      ['demandee', 'acceptee', 'en_cours', 'terminee', 'cloturee'].map(
        (s) => RESERVATION_STATUS[s as keyof typeof RESERVATION_STATUS].label,
      ),
    )
  })

  it("n'affiche jamais le code de départ", async () => {
    const res = db.reservations.find((r) => r.code_depart_hash)!
    renderAt(`/admin/bookings/${res.id}`, { asAdmin: true })
    await screen.findByRole('list', { name: 'Historique des statuts' })
    expect(document.body.textContent).not.toContain('NE-DOIT-JAMAIS-SORTIR')
    expect(screen.getByText(/Le code de départ n'est jamais affiché/)).toBeVisible()
  })

  it('signale un litige et renvoie vers son arbitrage', async () => {
    const res = db.reservations.find((r) => r.statut === 'litige')!
    const report = db.signalements.find((s) => s.reservation_id === res.id)!
    renderAt(`/admin/bookings/${res.id}`, { asAdmin: true })

    expect(await screen.findByText(/Litige en cours : le montant est gelé/)).toBeVisible()
    expect(screen.getByRole('link', { name: 'Trancher le litige' })).toHaveAttribute(
      'href',
      `/admin/reports/${report.id}`,
    )
  })
})
