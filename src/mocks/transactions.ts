import type { TransactionAdmin } from '@/features/transactions/types'
import type { MockUser } from './people'

// Transactions fictives (mode mock et tests) : recharges, retraits à verser et déjà traités.

const HOUR = 60 * 60 * 1000
const iso = (ms: number) => new Date(ms).toISOString()

export type MockTransaction = Omit<TransactionAdmin, 'utilisateur'> & { user_id: number }

export function buildTransactions(users: MockUser[], now: number): MockTransaction[] {
  const items: MockTransaction[] = []
  const add = (
    i: number,
    item: Omit<MockTransaction, 'id' | 'cree_le' | 'user_id' | 'reservation_id'>,
  ) => {
    const user = users[i % users.length]!
    items.push({
      id: `tx-${items.length + 1}`,
      cree_le: iso(now - (items.length + 1) * 3 * HOUR),
      user_id: user.id,
      reservation_id: null,
      ...item,
      telephone: item.moyen_paiement ? user.telephone : '',
    })
  }
  const mm = { reference_externe: '', reference_operateur: '', telephone: '' }
  add(1, { ...mm, type: 'retrait', statut: 'en_attente', montant: 5000, moyen_paiement: 'flooz' })
  add(2, { ...mm, type: 'retrait', statut: 'en_attente', montant: 2500, moyen_paiement: 'mixx' })
  add(3, {
    ...mm,
    type: 'recharge',
    statut: 'validee',
    montant: 2000,
    moyen_paiement: 'flooz',
    reference_externe: 'PG-1001',
    reference_operateur: 'FLZ-88412',
  })
  add(4, {
    ...mm,
    type: 'recharge',
    statut: 'echouee',
    montant: 1000,
    moyen_paiement: 'mixx',
    reference_externe: 'PG-1002',
  })
  add(5, {
    ...mm,
    type: 'retrait',
    statut: 'validee',
    montant: 3000,
    moyen_paiement: 'mixx',
    reference_externe: 'MIXX-VIR-17',
  })
  add(6, { ...mm, type: 'credit', statut: 'validee', montant: 300, moyen_paiement: '' })
  // Le plus ancien retrait en attente est versé en premier : tri croissant côté API.
  return items
}
