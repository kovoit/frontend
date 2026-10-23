import { http } from 'msw'
import { env } from '@/config/env'
import { PAGE_SIZE } from '@/config/pagination'
import { fail, invalid, notFound, ok, unauthorized } from './envelope'
import { userFromAuthHeader } from './db'
import { db } from './people'
import type { MockTransaction } from './transactions'

const url = (path: string) => `${env.apiUrl}${path}`
const isAdmin = (request: Request) =>
  userFromAuthHeader(request.headers.get('Authorization'))?.is_staff === true

function toAdmin(t: MockTransaction) {
  const { user_id, ...rest } = t
  const user = db.users.find((u) => u.id === user_id)!
  return {
    ...rest,
    utilisateur: {
      id: String(user.id),
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      telephone: user.telephone,
    },
  }
}

function retraitEnAttente(request: Request, id: string) {
  if (!isAdmin(request)) return { erreur: unauthorized() }
  const t = db.transactions.find((item) => item.id === id)
  if (!t) return { erreur: notFound() }
  if (t.type !== 'retrait' || t.statut !== 'en_attente') {
    return { erreur: fail(409, "Ce retrait n'est pas en attente.", 'RETRAIT_NON_EN_ATTENTE') }
  }
  return { t }
}

export const transactionHandlers = [
  http.get(url('/admin/transactions/'), ({ request }) => {
    if (!isAdmin(request)) return unauthorized()
    const params = new URL(request.url).searchParams
    const [type, statut, moyen] = ['type', 'statut', 'moyen'].map((k) => params.get(k))
    const recherche = params.get('recherche')?.toLowerCase()
    let items = db.transactions
      .filter(
        (t) =>
          (!type || t.type === type) &&
          (!statut || t.statut === statut) &&
          (!moyen || t.moyen_paiement === moyen),
      )
      .map(toAdmin)
      .filter(
        (t) =>
          !recherche ||
          [
            t.utilisateur.email,
            t.utilisateur.nom,
            t.utilisateur.prenom,
            t.telephone,
            t.reference_externe,
            t.reference_operateur,
          ].some((champ) => champ.toLowerCase().includes(recherche)),
      )
    const aVerser = type === 'retrait' && statut === 'en_attente'
    items = items.sort((a, b) => (aVerser ? 1 : -1) * a.cree_le.localeCompare(b.cree_le))
    const page = Math.max(1, Number(params.get('page') ?? 1) || 1)
    const start = (page - 1) * PAGE_SIZE
    return ok({
      count: items.length,
      next: start + PAGE_SIZE < items.length ? `?page=${page + 1}` : null,
      previous: page > 1 ? `?page=${page - 1}` : null,
      results: items.slice(start, start + PAGE_SIZE),
    })
  }),

  http.post(url('/admin/transactions/:id/verser/'), async ({ request, params }) => {
    const { t, erreur } = retraitEnAttente(request, String(params.id))
    if (erreur) return erreur
    const { reference } = (await request.json()) as { reference?: string }
    if (!reference || reference.trim().length < 3)
      return invalid({ reference: ['Au moins 3 caractères.'] })
    Object.assign(t, { statut: 'validee', reference_externe: reference.trim() })
    return ok(toAdmin(t), { message: 'Retrait marqué comme versé.' })
  }),

  http.post(url('/admin/transactions/:id/refuser/'), async ({ request, params }) => {
    const { t, erreur } = retraitEnAttente(request, String(params.id))
    if (erreur) return erreur
    const { motif } = (await request.json()) as { motif?: string }
    if (!motif || motif.trim().length < 3) return invalid({ motif: ['Au moins 3 caractères.'] })
    t.statut = 'echouee'
    return ok(toAdmin(t), { message: 'Retrait refusé.' })
  }),
]
