import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { db } from '@/mocks/people'
import { renderAt } from '@/test/renderWithRouter'

const enAttente = () =>
  db.transactions.filter((t) => t.type === 'retrait' && t.statut === 'en_attente')
const nomDe = (userId: number) => {
  const user = db.users.find((u) => u.id === userId)!
  return `${user.prenom} ${user.nom}`
}

describe('transactions et retraits à verser', () => {
  it('affiche par défaut les retraits à verser, les plus anciens d’abord', async () => {
    renderAt('/admin/transactions', { asAdmin: true })
    const table = await screen.findByRole('table', { name: 'Retraits à verser' })
    const rows = within(table).getAllByRole('row').slice(1)

    const attendus = enAttente().sort((a, b) => a.cree_le.localeCompare(b.cree_le))
    expect(rows).toHaveLength(attendus.length)
    expect(rows[0]).toHaveTextContent(nomDe(attendus[0]!.user_id))
    expect(within(table).getAllByRole('button', { name: /^Marquer versé/ })).toHaveLength(
      attendus.length,
    )
  })

  it('marque un retrait versé avec la référence du transfert', async () => {
    const retrait = enAttente()[0]!
    renderAt('/admin/transactions', { asAdmin: true })

    await userEvent.click(
      await screen.findByRole('button', {
        name: `Marquer versé le retrait de ${nomDe(retrait.user_id)}`,
      }),
    )
    const dialog = screen.getByRole('dialog', { name: 'Confirmer le versement' })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Retrait versé' }))
    expect(
      await within(dialog).findByText(/référence du transfert \(3 caractères minimum\)/),
    ).toBeVisible()

    await userEvent.type(within(dialog).getByLabelText('Référence du transfert'), 'FLZ-VIR-42')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Retrait versé' }))

    await waitFor(() =>
      expect(screen.getByRole('table', { name: 'Retraits à verser' })).not.toHaveTextContent(
        nomDe(retrait.user_id),
      ),
    )
    expect(db.transactions.find((t) => t.id === retrait.id)).toMatchObject({
      statut: 'validee',
      reference_externe: 'FLZ-VIR-42',
    })
  })

  it('refuse un retrait avec un motif obligatoire', async () => {
    const retrait = enAttente()[1]!
    renderAt('/admin/transactions', { asAdmin: true })

    await userEvent.click(
      await screen.findByRole('button', {
        name: `Refuser le retrait de ${nomDe(retrait.user_id)}`,
      }),
    )
    const dialog = screen.getByRole('dialog', { name: 'Refuser le retrait' })
    expect(dialog).toHaveTextContent(/redeviendra disponible/)
    await userEvent.type(within(dialog).getByLabelText('Motif'), 'Numéro Mixx invalide')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Refuser le retrait' }))

    await waitFor(() =>
      expect(screen.getByRole('table', { name: 'Retraits à verser' })).not.toHaveTextContent(
        nomDe(retrait.user_id),
      ),
    )
    expect(db.transactions.find((t) => t.id === retrait.id)!.statut).toBe('echouee')
  })

  it('liste toutes les transactions avec filtres et statut', async () => {
    renderAt('/admin/transactions?vue=toutes', { asAdmin: true })
    const table = await screen.findByRole('table', { name: 'Transactions' })
    expect(within(table).getAllByRole('row')).toHaveLength(db.transactions.length + 1)
    expect(within(table).getByText('FLZ-88412')).toBeVisible()

    await userEvent.selectOptions(screen.getByLabelText('Type'), 'recharge')
    const recharges = db.transactions.filter((t) => t.type === 'recharge')
    expect(
      await within(await screen.findByRole('table', { name: 'Transactions' })).findAllByText(
        'Recharge',
      ),
    ).toHaveLength(recharges.length)
  })
})
