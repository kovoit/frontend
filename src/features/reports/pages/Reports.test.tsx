import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { db } from '@/mocks/people'
import { renderAt } from '@/test/renderWithRouter'

const reservationOf = (reportId: number) =>
  db.reservations.find((r) => r.id === db.signalements.find((s) => s.id === reportId)!.reservation_id)!

describe('signalements et litiges', () => {
  it('affiche par défaut les signalements ouverts, avec « Trancher » pour les litiges', async () => {
    renderAt('/admin/reports', { asAdmin: true })
    const table = await screen.findByRole('table', { name: 'Signalements' })
    const open = db.signalements.filter((s) => s.statut === 'ouvert')
    expect(within(table).getAllByRole('row')).toHaveLength(open.length + 1)

    const disputes = open.filter((s) => reservationOf(s.id).statut === 'litige')
    expect(within(table).getAllByRole('link', { name: /^Trancher/ })).toHaveLength(disputes.length)
    expect(within(table).getAllByRole('link', { name: /^Traiter/ })).toHaveLength(open.length - disputes.length)
  })

  it('traite un signalement simple avec une résolution obligatoire', async () => {
    const report = db.signalements.find((s) => s.statut === 'ouvert' && reservationOf(s.id).statut !== 'litige')!
    renderAt(`/admin/reports/${report.id}`, { asAdmin: true })

    await userEvent.click(await screen.findByRole('button', { name: 'Marquer comme traité' }))
    const dialog = screen.getByRole('dialog', { name: 'Marquer comme traité' })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Confirmer' }))
    expect(await within(dialog).findByText(/10 caractères minimum/)).toBeVisible()

    await userEvent.type(within(dialog).getByLabelText('Résolution'), 'Conducteur contacté et averti.')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Confirmer' }))

    expect(await screen.findByText('Résolution : Conducteur contacté et averti.')).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Marquer comme traité' })).not.toBeInTheDocument()
    expect(db.signalements.find((s) => s.id === report.id)!.statut).toBe('traite')
  })

  it('tranche un litige : décision obligatoire, réservation clôturée', async () => {
    const report = db.signalements.find((s) => reservationOf(s.id).statut === 'litige')!
    renderAt(`/admin/reports/${report.id}`, { asAdmin: true })

    await userEvent.click(await screen.findByRole('button', { name: 'Trancher le litige' }))
    const dialog = screen.getByRole('dialog', { name: 'Trancher le litige' })
    await userEvent.type(within(dialog).getByLabelText('Justification'), 'Arrêt à 2 km confirmé par le GPS.')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Confirmer la décision' }))
    expect(await within(dialog).findByText('Choisissez en faveur de qui trancher.')).toBeVisible()

    await userEvent.click(within(dialog).getByRole('radio', { name: /En faveur du passager/ }))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Confirmer la décision' }))

    expect(await screen.findByText(/litige tranché en faveur du passager/)).toBeVisible()
    expect(screen.getByText('Clôturée')).toBeVisible()
    expect(reservationOf(report.id).statut).toBe('cloturee')
  })

  it('affiche la résolution d’un signalement déjà traité, sans action', async () => {
    const report = db.signalements.find((s) => s.statut === 'traite')!
    renderAt(`/admin/reports/${report.id}`, { asAdmin: true })
    expect(await screen.findByText(`Résolution : ${report.resolution}`)).toBeVisible()
    expect(screen.queryByRole('button', { name: /Marquer comme traité|Trancher/ })).not.toBeInTheDocument()
  })
})
