import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { db, pieceConsultations } from '@/mocks/people'
import { renderAt } from '@/test/renderWithRouter'

const dossierOf = (userId: number, type: 'passager' | 'conducteur') =>
  db.dossiers.find((d) => d.user_id === userId && d.type === type)!

describe('liste des dossiers KYC', () => {
  it('affiche par défaut la file des dossiers en attente, les plus anciens d’abord', async () => {
    renderAt('/admin/kyc', { asAdmin: true })
    const table = await screen.findByRole('table', { name: 'Dossiers KYC' })
    const rows = within(table).getAllByRole('row').slice(1)
    const pending = db.dossiers.filter((d) => d.statut === 'en_attente')

    expect(rows).toHaveLength(Math.min(pending.length, 20))
    rows.forEach((row) => expect(within(row).getByText('En attente')).toBeVisible())
    expect(screen.getByRole('button', { name: 'En attente' })).toHaveAttribute('aria-pressed', 'true')

    const oldest = [...pending].sort((a, b) => a.soumis_le!.localeCompare(b.soumis_le!))[0]!
    const oldestUser = db.users.find((u) => u.id === oldest.user_id)!
    expect(within(rows[0]!).getByText(`${oldestUser.prenom} ${oldestUser.nom}`)).toBeVisible()
  })

  it('filtre par statut et par type, avec les filtres dans l’URL', async () => {
    const router = renderAt('/admin/kyc', { asAdmin: true })
    await screen.findByRole('table', { name: 'Dossiers KYC' })

    await userEvent.click(screen.getByRole('button', { name: 'Rejetés' }))
    await userEvent.selectOptions(screen.getByLabelText('Type de dossier'), 'conducteur')

    expect(router.state.location.search).toBe('?statut=rejete&type=conducteur')
    const expected = db.dossiers.filter((d) => d.statut === 'rejete' && d.type === 'conducteur')
    await waitFor(() =>
      expect(screen.getAllByRole('row')).toHaveLength(expected.length + 1),
    )
    expect(screen.getAllByText('Rejeté')).toHaveLength(expected.length)
  })

  it('recherche un demandeur par nom (sans tenir compte des accents)', async () => {
    renderAt('/admin/kyc?statut=tous', { asAdmin: true })
    await screen.findByRole('table', { name: 'Dossiers KYC' })
    await userEvent.type(screen.getByLabelText('Rechercher un demandeur'), 'amegan')

    await waitFor(() => {
      const rows = screen.getAllByRole('row').slice(1)
      expect(rows.length).toBeGreaterThan(0)
      rows.forEach((row) => expect(row).toHaveTextContent('Amégan'))
    })
  })

  it('affiche un message quand la recherche ne donne rien', async () => {
    renderAt('/admin/kyc?q=personne-inconnue', { asAdmin: true })
    expect(await screen.findByText('Aucun dossier ne correspond à ces critères.')).toBeVisible()
  })
})

describe('détail d’un dossier KYC', () => {
  it('ne charge une pièce que sur demande et trace chaque consultation', async () => {
    const dossier = dossierOf(101, 'passager')
    renderAt(`/admin/kyc/${dossier.id}`, { asAdmin: true })

    await screen.findByRole('heading', { name: /Dossier passager · Afi Ahadji/ })
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(pieceConsultations).toHaveLength(0)

    await userEvent.click(screen.getByRole('button', { name: "Afficher : Pièce d'identité" }))
    expect(await screen.findByRole('img', { name: "Pièce d'identité de Afi Ahadji" })).toBeVisible()
    expect(pieceConsultations).toHaveLength(1)

    // Masquer puis réafficher redemande une URL signée (aucune mise en cache).
    await userEvent.click(screen.getByRole('button', { name: "Masquer : Pièce d'identité" }))
    await userEvent.click(screen.getByRole('button', { name: "Afficher : Pièce d'identité" }))
    await screen.findByRole('img', { name: "Pièce d'identité de Afi Ahadji" })
    expect(pieceConsultations).toHaveLength(2)
  })

  it('affiche le véhicule déclaré pour un dossier conducteur', async () => {
    const dossier = dossierOf(100, 'conducteur')
    renderAt(`/admin/kyc/${dossier.id}`, { asAdmin: true })
    expect(await screen.findByRole('heading', { name: 'Véhicule déclaré' })).toBeVisible()
    expect(screen.getByText('Toyota Yaris')).toBeVisible()
    expect(screen.getAllByRole('button', { name: /^Afficher/ })).toHaveLength(5)
  })

  it('valide un dossier après confirmation', async () => {
    const dossier = dossierOf(101, 'passager')
    renderAt(`/admin/kyc/${dossier.id}`, { asAdmin: true })

    await userEvent.click(await screen.findByRole('button', { name: 'Valider le dossier' }))
    const dialog = screen.getByRole('dialog', { name: 'Valider ce dossier ?' })
    expect(dialog).toHaveTextContent('pourra réserver des places')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Confirmer la validation' }))

    expect(await screen.findByText(/Dossier validé le/)).toBeVisible()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Valider le dossier' })).not.toBeInTheDocument()
    expect(db.dossiers.find((d) => d.id === dossier.id)!.statut).toBe('verifie')
    expect(db.users.find((u) => u.id === 101)!.kyc_passager).toBe('verifie')
  })

  it('exige un motif précis pour rejeter, puis l’affiche', async () => {
    const dossier = dossierOf(101, 'passager')
    renderAt(`/admin/kyc/${dossier.id}`, { asAdmin: true })

    await userEvent.click(await screen.findByRole('button', { name: 'Rejeter' }))
    const dialog = screen.getByRole('dialog', { name: 'Rejeter ce dossier' })
    const motif = within(dialog).getByLabelText('Motif du rejet')
    expect(motif).toHaveFocus()

    await userEvent.click(within(dialog).getByRole('button', { name: 'Confirmer le rejet' }))
    expect(await within(dialog).findByText(/10 caractères minimum/)).toBeVisible()
    expect(db.dossiers.find((d) => d.id === dossier.id)!.statut).toBe('en_attente')

    await userEvent.type(motif, 'Selfie flou, merci de le reprendre.')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Confirmer le rejet' }))

    expect(await screen.findByText('Motif : Selfie flou, merci de le reprendre.')).toBeVisible()
    expect(db.dossiers.find((d) => d.id === dossier.id)!.statut).toBe('rejete')
  })

  it('ferme la fenêtre avec Échap sans rien modifier', async () => {
    const dossier = dossierOf(101, 'passager')
    renderAt(`/admin/kyc/${dossier.id}`, { asAdmin: true })
    await userEvent.click(await screen.findByRole('button', { name: 'Rejeter' }))
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Rejeter' })).toHaveFocus()
  })

  it('affiche une 404 pour un dossier inexistant', async () => {
    renderAt('/admin/kyc/999999', { asAdmin: true })
    expect(await screen.findByText('Page introuvable')).toBeVisible()
  })
})
