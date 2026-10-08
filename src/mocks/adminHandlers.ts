import { http, HttpResponse } from 'msw'
import { env } from '@/config/env'
import { PIECE_TYPE } from '@/config/enums'
import { PAGE_SIZE } from '@/config/pagination'
import type { KycDossierDetail, KycDossierListItem } from '@/features/kyc/types'
import type { SuspendPayload, UserDetail, UserListItem } from '@/features/users/types'
import { userFromAuthHeader } from './db'
import { db, MOCK_ADMIN, MOCK_NOW, pieceConsultations, type MockDossier, type MockUser } from './people'

const url = (path: string) => `${env.apiUrl}${path}`
const DAY = 24 * 60 * 60 * 1000

const unauthorized = () => HttpResponse.json({ detail: 'Non authentifié.' }, { status: 401 })
const notFound = () => HttpResponse.json({ detail: 'Introuvable.' }, { status: 404 })
const isAdmin = (request: Request) =>
  userFromAuthHeader(request.headers.get('Authorization'))?.role === 'admin'

function paginate<T>(items: T[], request: Request) {
  const page = Math.max(1, Number(new URL(request.url).searchParams.get('page') ?? 1) || 1)
  const start = (page - 1) * PAGE_SIZE
  return {
    count: items.length,
    next: start + PAGE_SIZE < items.length ? `?page=${page + 1}` : null,
    previous: page > 1 ? `?page=${page - 1}` : null,
    results: items.slice(start, start + PAGE_SIZE),
  }
}

const normalize = (value: string) =>
  value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, '')

function matchesSearch(user: MockUser, search: string | null) {
  if (!search) return true
  const needle = normalize(search)
  return [user.nom, user.prenom, `${user.prenom}${user.nom}`, user.email, user.telephone].some(
    (field) => normalize(field).includes(needle),
  )
}

const summary = (user: MockUser) => ({
  id: user.id,
  nom: user.nom,
  prenom: user.prenom,
  email: user.email,
  telephone: user.telephone,
})

function fiabilite(user: MockUser): number | null {
  if (user.reservations_30j === 0) return null
  const incidents = user.annulations_tardives_30j + user.absences_30j
  return Math.max(0, 1 - incidents / user.reservations_30j)
}

const toUserListItem = (user: MockUser): UserListItem => ({
  ...summary(user),
  statut_compte: user.statut_compte,
  kyc_passager: user.kyc_passager,
  kyc_conducteur: user.kyc_conducteur,
  fiabilite: fiabilite(user),
  cree_le: user.cree_le,
})

function toUserDetail(user: MockUser): UserDetail {
  return {
    ...toUserListItem(user),
    telephone_verifie_le: user.telephone_verifie_le,
    mode_actif: user.mode_actif,
    suspendu_jusqu_au: user.suspendu_jusqu_au,
    motif_suspension: user.motif_suspension,
    note_moyenne: user.note_moyenne,
    nb_notes: user.nb_notes,
    fiabilite_detail: {
      reservations_30j: user.reservations_30j,
      annulations_tardives_30j: user.annulations_tardives_30j,
      absences_30j: user.absences_30j,
    },
    vehicule: user.vehicule,
    dossiers_kyc: db.dossiers
      .filter((dossier) => dossier.user_id === user.id)
      .map(({ id, type, statut, soumis_le, traite_le, motif_rejet }) => ({
        id,
        type,
        statut,
        soumis_le,
        traite_le,
        motif_rejet,
      })),
    notes_recues:
      user.nb_notes > 0
        ? [5, 4, 5].map((note, index) => {
            const auteur = db.users[(user.id + index * 5) % db.users.length]!
            return {
              id: user.id * 10 + index,
              note,
              commentaire: index === 1 ? 'Un peu en retard au point de rendez-vous.' : index === 0 ? 'Très ponctuel, merci !' : null,
              auteur: { prenom: auteur.prenom, nom: auteur.nom },
              cree_le: new Date(MOCK_NOW - (index + 1) * 2 * DAY).toISOString(),
            }
          })
        : [],
  }
}

const userOf = (dossier: MockDossier) => db.users.find((user) => user.id === dossier.user_id)!

const toDossierListItem = (dossier: MockDossier): KycDossierListItem => ({
  id: dossier.id,
  type: dossier.type,
  statut: dossier.statut,
  soumis_le: dossier.soumis_le,
  traite_le: dossier.traite_le,
  user: summary(userOf(dossier)),
})

const toDossierDetail = (dossier: MockDossier): KycDossierDetail => ({
  ...toDossierListItem(dossier),
  motif_rejet: dossier.motif_rejet,
  traite_par: dossier.traite_par,
  pieces: dossier.pieces,
  vehicule: dossier.type === 'conducteur' ? userOf(dossier).vehicule : null,
})

/** Image fictive tenant lieu de pièce justificative (aucun vrai document en mode mock). */
function placeholderPiece(label: string, owner: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400"><rect width="640" height="400" rx="24" fill="#EFF3F9"/><rect x="24" y="24" width="592" height="352" rx="16" fill="none" stroke="#93A9CF" stroke-width="4" stroke-dasharray="12 10"/><text x="320" y="180" text-anchor="middle" font-family="sans-serif" font-size="30" font-weight="700" fill="#0F2A55">${label}</text><text x="320" y="225" text-anchor="middle" font-family="sans-serif" font-size="22" fill="#3D63A0">${owner}</text><text x="320" y="290" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#D9731A">Document fictif · démonstration</text></svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

export const adminHandlers = [
  // ---- KYC ----
  http.get(url('/admin/kyc/'), ({ request }) => {
    if (!isAdmin(request)) return unauthorized()
    const params = new URL(request.url).searchParams
    const statut = params.get('statut')
    const type = params.get('type')
    const items = db.dossiers
      .filter((dossier) => !statut || dossier.statut === statut)
      .filter((dossier) => !type || dossier.type === type)
      .filter((dossier) => matchesSearch(userOf(dossier), params.get('search')))
      .sort((a, b) => (a.soumis_le ?? '').localeCompare(b.soumis_le ?? ''))
      .map(toDossierListItem)
    return HttpResponse.json(paginate(items, request))
  }),

  http.get(url('/admin/kyc/pieces/:pieceId/url/'), ({ request, params }) => {
    if (!isAdmin(request)) return unauthorized()
    const pieceId = Number(params.pieceId)
    const dossier = db.dossiers.find((d) => d.pieces.some((piece) => piece.id === pieceId))
    const piece = dossier?.pieces.find((p) => p.id === pieceId)
    if (!dossier || !piece) return notFound()
    pieceConsultations.push({ piece_id: pieceId, admin_id: MOCK_ADMIN.id, consulte_le: new Date().toISOString() })
    const owner = userOf(dossier)
    return HttpResponse.json({
      url: placeholderPiece(PIECE_TYPE[piece.type_piece], `${owner.prenom} ${owner.nom}`),
      expire_le: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    })
  }),

  http.get(url('/admin/kyc/:id/'), ({ request, params }) => {
    if (!isAdmin(request)) return unauthorized()
    const dossier = db.dossiers.find((d) => d.id === Number(params.id))
    return dossier ? HttpResponse.json(toDossierDetail(dossier)) : notFound()
  }),

  http.post(url('/admin/kyc/:id/:action/'), async ({ request, params }) => {
    if (!isAdmin(request)) return unauthorized()
    const dossier = db.dossiers.find((d) => d.id === Number(params.id))
    if (!dossier) return notFound()
    if (dossier.statut !== 'en_attente') {
      return HttpResponse.json({ detail: "Ce dossier n'est plus en attente." }, { status: 409 })
    }
    let statut: 'verifie' | 'rejete'
    if (params.action === 'valider') {
      statut = 'verifie'
      dossier.motif_rejet = null
    } else if (params.action === 'rejeter') {
      const body = (await request.json().catch(() => ({}))) as { motif_rejet?: string }
      const motif = body.motif_rejet?.trim()
      if (!motif) {
        return HttpResponse.json(
          { motif_rejet: ['Le motif de rejet est obligatoire.'] },
          { status: 400 },
        )
      }
      statut = 'rejete'
      dossier.motif_rejet = motif
    } else {
      return notFound()
    }
    dossier.statut = statut
    dossier.traite_le = new Date().toISOString()
    dossier.traite_par = MOCK_ADMIN
    const user = userOf(dossier)
    if (dossier.type === 'passager') user.kyc_passager = statut
    else user.kyc_conducteur = statut
    return HttpResponse.json(toDossierDetail(dossier))
  }),

  // ---- Utilisateurs ----
  http.get(url('/admin/users/'), ({ request }) => {
    if (!isAdmin(request)) return unauthorized()
    const params = new URL(request.url).searchParams
    const statut = params.get('statut_compte')
    const items = db.users
      .filter((user) => !statut || user.statut_compte === statut)
      .filter((user) => matchesSearch(user, params.get('search')))
      .sort((a, b) => b.cree_le.localeCompare(a.cree_le))
      .map(toUserListItem)
    return HttpResponse.json(paginate(items, request))
  }),

  http.get(url('/admin/users/:id/'), ({ request, params }) => {
    if (!isAdmin(request)) return unauthorized()
    const user = db.users.find((u) => u.id === Number(params.id))
    return user ? HttpResponse.json(toUserDetail(user)) : notFound()
  }),

  http.post(url('/admin/users/:id/suspendre/'), async ({ request, params }) => {
    if (!isAdmin(request)) return unauthorized()
    const user = db.users.find((u) => u.id === Number(params.id))
    if (!user) return notFound()
    if (user.statut_compte === 'suspendu') {
      return HttpResponse.json({ detail: 'Ce compte est déjà suspendu.' }, { status: 409 })
    }
    const body = (await request.json().catch(() => ({}))) as Partial<SuspendPayload>
    const motif = body.motif?.trim()
    if (!motif) {
      return HttpResponse.json({ motif: ['Le motif est obligatoire.'] }, { status: 400 })
    }
    user.statut_compte = 'suspendu'
    user.motif_suspension = motif
    user.suspendu_jusqu_au = body.duree_jours
      ? new Date(Date.now() + body.duree_jours * DAY).toISOString()
      : null
    return HttpResponse.json({ user: toUserDetail(user), reservations_annulees: user.id % 3 })
  }),

  http.post(url('/admin/users/:id/reactiver/'), ({ request, params }) => {
    if (!isAdmin(request)) return unauthorized()
    const user = db.users.find((u) => u.id === Number(params.id))
    if (!user) return notFound()
    if (user.statut_compte === 'actif') {
      return HttpResponse.json({ detail: 'Ce compte est déjà actif.' }, { status: 409 })
    }
    user.statut_compte = 'actif'
    user.suspendu_jusqu_au = null
    user.motif_suspension = null
    return HttpResponse.json(toUserDetail(user))
  }),
]
