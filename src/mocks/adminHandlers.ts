import { http, HttpResponse } from 'msw'
import { env } from '@/config/env'
import { fail, invalid, notFound, ok, unauthorized } from './envelope'
import { PIECE_TYPE } from '@/config/enums'
import { PAGE_SIZE } from '@/config/pagination'
import type { KycDossierDetail, KycDossierListItem } from '@/features/kyc/types'
import type { SuspendPayload, UserDetail, UserListItem } from '@/features/users/types'
import { userFromAuthHeader } from './db'
import { db, MOCK_ADMIN, MOCK_NOW, pieceConsultations, type MockDossier, type MockUser } from './people'

const url = (path: string) => `${env.apiUrl}${path}`
const DAY = 24 * 60 * 60 * 1000

const isAdmin = (request: Request) =>
  userFromAuthHeader(request.headers.get('Authorization'))?.is_staff === true

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
  id: String(user.id),
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

// Sérialisation au format du backend (apps/accounts/api/admin_serializers.py)
const fiabilitePct = (user: MockUser) => {
  const ratio = fiabilite(user)
  return ratio === null ? null : Math.round(ratio * 100)
}

const toUserListItem = (user: MockUser): UserListItem => ({
  ...summary(user),
  statut_compte: user.statut_compte,
  kyc: { passager: user.kyc_passager, conducteur: user.kyc_conducteur },
  fiabilite_pct: fiabilitePct(user),
  cree_le: user.cree_le,
})

function toUserDetail(user: MockUser): UserDetail {
  return {
    ...summary(user),
    statut_compte: user.statut_compte,
    kyc: { passager: user.kyc_passager, conducteur: user.kyc_conducteur },
    cree_le: user.cree_le,
    email_verifie: true,
    mode_actif: user.mode_actif,
    is_staff: false,
    last_login: user.telephone_verifie_le,
    suspendu_jusqu_au: user.suspendu_jusqu_au,
    motif_suspension: user.motif_suspension ?? '',
    note_moyenne: user.note_moyenne,
    nombre_notes: user.nb_notes,
    fiabilite: {
      pct: fiabilitePct(user),
      periode_j: 30,
      reservations: user.reservations_30j,
      annulations_tardives: user.annulations_tardives_30j,
      absences: user.absences_30j,
    },
    vehicule: user.vehicule,
    dossiers_kyc: db.dossiers
      .filter((dossier) => dossier.user_id === user.id)
      .map(({ id, type, statut, soumis_le, traite_le, motif_rejet }) => ({
        id: String(id),
        type,
        statut,
        soumis_le,
        traite_le,
        motif_rejet: motif_rejet ?? '',
      })),
    notes_recues:
      user.nb_notes > 0
        ? [5, 4, 5].map((note, index) => {
            const auteur = db.users[(user.id + index * 5) % db.users.length]!
            return {
              id: String(user.id * 10 + index),
              note,
              commentaire: index === 1 ? 'Un peu en retard au point de rendez-vous.' : index === 0 ? 'Très ponctuel, merci !' : '',
              auteur: { prenom: auteur.prenom, nom: auteur.nom },
              cree_le: new Date(MOCK_NOW - (index + 1) * 2 * DAY).toISOString(),
            }
          })
        : [],
  }
}

const userOf = (dossier: MockDossier) => db.users.find((user) => user.id === dossier.user_id)!

const toDossierListItem = (dossier: MockDossier): KycDossierListItem => ({
  id: String(dossier.id),
  type: dossier.type,
  statut: dossier.statut,
  soumis_le: dossier.soumis_le,
  traite_le: dossier.traite_le,
  utilisateur: summary(userOf(dossier)),
})

const toDossierDetail = (dossier: MockDossier): KycDossierDetail => ({
  ...toDossierListItem(dossier),
  motif_rejet: dossier.motif_rejet ?? '',
  traite_par: dossier.traite_par,
  pieces: dossier.pieces.map((piece) => ({
    ...piece,
    id: String(piece.id),
    cree_le: dossier.soumis_le ?? new Date(MOCK_NOW).toISOString(),
  })),
  pieces_manquantes: [],
  vehicule: dossier.type === 'conducteur' ? userOf(dossier).vehicule : null,
})

/** Image SVG fictive tenant lieu de pièce justificative (aucun vrai document en mode mock). */
function placeholderPiece(label: string, owner: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400"><rect width="640" height="400" rx="24" fill="#EFF3F9"/><rect x="24" y="24" width="592" height="352" rx="16" fill="none" stroke="#93A9CF" stroke-width="4" stroke-dasharray="12 10"/><text x="320" y="180" text-anchor="middle" font-family="sans-serif" font-size="30" font-weight="700" fill="#0F2A55">${label}</text><text x="320" y="225" text-anchor="middle" font-family="sans-serif" font-size="22" fill="#3D63A0">${owner}</text><text x="320" y="290" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#D9731A">Document fictif · démonstration</text></svg>`
  return svg
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
      .filter((dossier) => matchesSearch(userOf(dossier), params.get('recherche')))
      .sort((a, b) => (a.soumis_le ?? '').localeCompare(b.soumis_le ?? ''))
      .map(toDossierListItem)
    return ok(paginate(items, request))
  }),

  // Le fichier lui-même, comme PieceFichierVue (journalisé, jamais mis en cache)
  http.get(url('/admin/kyc/pieces/:pieceId/fichier/'), ({ request, params }) => {
    if (!isAdmin(request)) return unauthorized()
    const pieceId = Number(params.pieceId)
    const dossier = db.dossiers.find((d) => d.pieces.some((piece) => piece.id === pieceId))
    const piece = dossier?.pieces.find((p) => p.id === pieceId)
    if (!dossier || !piece) return notFound()
    pieceConsultations.push({ piece_id: pieceId, admin_id: MOCK_ADMIN.id, consulte_le: new Date().toISOString() })
    const owner = userOf(dossier)
    return new HttpResponse(
      placeholderPiece(PIECE_TYPE[piece.type_piece], `${owner.prenom} ${owner.nom}`),
      { headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-store, private' } },
    )
  }),

  http.get(url('/admin/kyc/:id/'), ({ request, params }) => {
    if (!isAdmin(request)) return unauthorized()
    const dossier = db.dossiers.find((d) => d.id === Number(params.id))
    return dossier ? ok(toDossierDetail(dossier)) : notFound()
  }),

  http.post(url('/admin/kyc/:id/:action/'), async ({ request, params }) => {
    if (!isAdmin(request)) return unauthorized()
    const dossier = db.dossiers.find((d) => d.id === Number(params.id))
    if (!dossier) return notFound()
    if (dossier.statut !== 'en_attente') {
      return fail(409, 'Seul un dossier en attente peut être traité.', 'DOSSIER_NON_EN_ATTENTE')
    }
    let statut: 'verifie' | 'rejete'
    if (params.action === 'valider') {
      statut = 'verifie'
      dossier.motif_rejet = ''
    } else if (params.action === 'rejeter') {
      const body = (await request.json().catch(() => ({}))) as { motif?: string }
      const motif = body.motif?.trim() ?? ''
      if (motif.length < 10) {
        return invalid({ motif: ['Assurez-vous que ce champ comporte au moins 10 caractères.'] })
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
    return ok(toDossierDetail(dossier))
  }),

  // ---- Utilisateurs ----
  http.get(url('/admin/utilisateurs/'), ({ request }) => {
    if (!isAdmin(request)) return unauthorized()
    const params = new URL(request.url).searchParams
    const statut = params.get('statut')
    const items = db.users
      .filter((user) => !statut || user.statut_compte === statut)
      .filter((user) => matchesSearch(user, params.get('recherche')))
      .sort((a, b) => b.cree_le.localeCompare(a.cree_le))
      .map(toUserListItem)
    return ok(paginate(items, request))
  }),

  http.get(url('/admin/utilisateurs/:id/'), ({ request, params }) => {
    if (!isAdmin(request)) return unauthorized()
    const user = db.users.find((u) => u.id === Number(params.id))
    return user ? ok(toUserDetail(user)) : notFound()
  }),

  http.post(url('/admin/utilisateurs/:id/suspendre/'), async ({ request, params }) => {
    if (!isAdmin(request)) return unauthorized()
    const user = db.users.find((u) => u.id === Number(params.id))
    if (!user) return notFound()
    const body = (await request.json().catch(() => ({}))) as Partial<SuspendPayload>
    const motif = body.motif?.trim() ?? ''
    if (motif.length < 10) {
      return invalid({ motif: ['Assurez-vous que ce champ comporte au moins 10 caractères.'] })
    }
    if (user.statut_compte === 'suspendu') {
      return fail(409, 'Ce compte est déjà suspendu.', 'DEJA_SUSPENDU')
    }
    user.statut_compte = 'suspendu'
    user.motif_suspension = motif
    user.suspendu_jusqu_au = body.jours
      ? new Date(Date.now() + body.jours * DAY).toISOString()
      : null
    return ok(
      { utilisateur: toUserDetail(user), reservations_annulees: user.id % 3 },
      { message: 'Compte suspendu.' },
    )
  }),

  http.post(url('/admin/utilisateurs/:id/reactiver/'), ({ request, params }) => {
    if (!isAdmin(request)) return unauthorized()
    const user = db.users.find((u) => u.id === Number(params.id))
    if (!user) return notFound()
    if (user.statut_compte === 'actif') {
      return fail(409, 'Ce compte est déjà actif.', 'DEJA_ACTIF')
    }
    user.statut_compte = 'actif'
    user.suspendu_jusqu_au = null
    user.motif_suspension = null
    return ok(toUserDetail(user))
  }),
]
