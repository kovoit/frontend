import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { db } from '@/mocks/people'
import { renderAt } from '@/test/renderWithRouter'

describe('liste des utilisateurs', () => {
  it('affiche les utilisateurs paginés, les plus récents d’abord', async () => {
    renderAt('/admin/users', { asAdmin: true })
    const table = await screen.findByRole('table', { name: 'Utilisateurs' })
    expect(within(table).getAllByRole('row')).toHaveLength(21)
    expect(screen.getByText(`1–20 sur ${db.users.length}`)).toBeVisible()

    await userEvent.click(screen.getByRole('button', { name: 'Page suivante' }))
    expect(await screen.findByText(`21–${db.users.length} sur ${db.users.length}`)).toBeVisible()
  })

  it('filtre les comptes suspendus', async () => {
    const router = renderAt('/admin/users', { asAdmin: true })
    await screen.findByRole('table', { name: 'Utilisateurs' })
    await userEvent.click(screen.getByRole('button', { name: 'Suspendus' }))

    expect(router.state.location.search).toBe('?statut_compte=suspendu')
    await waitFor(() => expect(screen.getAllByRole('row')).toHaveLength(3))
    expect(screen.getByRole('link', { name: /Mawuli Lawson/ })).toBeVisible()
  })

  it('recherche par numéro de téléphone', async () => {
    renderAt('/admin/users', { asAdmin: true })
    await screen.findByRole('table', { name: 'Utilisateurs' })
    const target = db.users[3]!
    await userEvent.type(screen.getByLabelText('Rechercher un utilisateur'), target.telephone)
    await waitFor(() => expect(screen.getAllByRole('row')).toHaveLength(2))
    expect(screen.getByRole('link', { name: new RegExp(`${target.prenom} ${target.nom}`) })).toBeVisible()
  })
})

describe('fiche utilisateur', () => {
  it('affiche identité, fiabilité, véhicule et dossiers KYC', async () => {
    renderAt('/admin/users/103', { asAdmin: true })
    expect(await screen.findByRole('heading', { name: 'Yawa Adjo' })).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Fiabilité (30 jours)' })).toBeVisible()
    expect(screen.getByText('100 %')).toBeVisible()
    expect(screen.getByText('Toyota Corolla')).toBeVisible()

    const kycLinks = screen.getAllByRole('link', { name: /Passager|Conducteur/ })
    expect(kycLinks).toHaveLength(2)
    expect(kycLinks[0]).toHaveAttribute('href', expect.stringMatching(/^\/admin\/kyc\/\d+$/))
  })

  it('suspend un compte avec motif et durée, et annonce les réservations annulées', async () => {
    renderAt('/admin/users/103', { asAdmin: true })
    await userEvent.click(await screen.findByRole('button', { name: 'Suspendre le compte' }))
    const dialog = screen.getByRole('dialog', { name: 'Suspendre Yawa Adjo' })
    expect(dialog).toHaveTextContent('réservations à venir sont annulées et remboursées')

    await userEvent.click(within(dialog).getByRole('button', { name: 'Confirmer la suspension' }))
    expect(await within(dialog).findByText(/10 caractères minimum/)).toBeVisible()

    await userEvent.type(within(dialog).getByLabelText('Motif de la suspension'), 'Comportement dangereux signalé')
    await userEvent.selectOptions(within(dialog).getByLabelText('Durée'), '30')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Confirmer la suspension' }))

    // Réservations annulées : valeur renvoyée par l'API (103 % 3 = 1 dans le mock).
    expect(
      await screen.findByText('Compte suspendu. 1 réservation(s) à venir annulée(s) et remboursée(s).'),
    ).toBeVisible()
    expect(screen.getByText('Motif : Comportement dangereux signalé')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Réactiver le compte' })).toBeVisible()
    expect(db.users.find((u) => u.id === 103)!.statut_compte).toBe('suspendu')
  })

  it('réactive un compte suspendu', async () => {
    renderAt('/admin/users/107', { asAdmin: true })
    expect(await screen.findByText(/Compte suspendu jusqu'au/)).toBeVisible()

    await userEvent.click(screen.getByRole('button', { name: 'Réactiver le compte' }))
    const dialog = screen.getByRole('dialog', { name: 'Réactiver Mawuli Lawson ?' })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Confirmer la réactivation' }))

    expect(await screen.findByText('Compte réactivé.')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Suspendre le compte' })).toBeVisible()
    expect(db.users.find((u) => u.id === 107)!.statut_compte).toBe('actif')
  })

  it('affiche une 404 pour un utilisateur inexistant', async () => {
    renderAt('/admin/users/999999', { asAdmin: true })
    expect(await screen.findByText('Page introuvable')).toBeVisible()
  })
})
