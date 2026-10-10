import { http } from 'msw'
import { env } from '@/config/env'
import { fail, invalid, notFound, ok, unauthorized } from './envelope'
import { PAGE_SIZE } from '@/config/pagination'
import type { ReservationDetail, ReservationListItem } from '@/features/bookings/types'
import type { DecisionLitige, SignalementDetail, SignalementListItem } from '@/features/reports/types'
import type { TrajetDetail, TrajetListItem } from '@/features/trips/types'
import { userFromAuthHeader } from './db'
import { db, MOCK_ADMIN, type MockUser } from './people'
import type { MockReservation, MockSignalement, MockTrajet } from './trips'

const url = (path: string) => `${env.apiUrl}${path}`
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
const matches = (search: string | null, fields: string[]) =>
  !search || fields.some((field) => normalize(field).includes(normalize(search)))

const userById = (id: number) => db.users.find((user) => user.id === id)!
const summary = (user: MockUser) => ({
  id: String(user.id),
  nom: user.nom,
  prenom: user.prenom,
  email: user.email,
  telephone: user.telephone,
})
const userFields = (user: MockUser) => [user.nom, user.prenom, `${user.prenom}${user.nom}`, user.telephone]
const trajetById = (id: number) => db.trajets.find((trajet) => trajet.id === id)!

// ---- Sérialisation (le code de départ n'est jamais inclus) ----

function toReservationListItem(res: MockReservation): ReservationListItem {
  const trajet = trajetById(res.trajet_id)
  return {
    id: String(res.id),
    trajet_id: String(res.trajet_id),
    passager: summary(userById(res.passager_id)),
    conducteur: summary(userById(trajet.conducteur_id)),
    point_libelle: res.point.libelle,
    arrivee_libelle: res.arrivee.libelle,
    depart_le: trajet.depart_le,
    prix: res.prix,
    frais_service: res.frais_service,
    statut: res.statut,
    cree_le: res.cree_le,
  }
}

function toReservationDetail(res: MockReservation): ReservationDetail {
  return {
    ...toReservationListItem(res),
    point: {
      id: String(res.point.id),
      lat: res.point.lat,
      lng: res.point.lng,
      libelle: res.point.libelle,
      ordre: res.point.ordre,
    },
    arrivee: res.arrivee,
    distance_km: res.distance_km,
    annulation_tardive: false,
    historique: res.historique,
    signalements: db.signalements
      .filter((s) => s.reservation_id === res.id)
      .map(({ id, motif, statut, cree_le }) => ({ id: String(id), motif, statut, cree_le })),
  }
}

function toTrajetListItem(trajet: MockTrajet): TrajetListItem {
  return {
    id: String(trajet.id),
    conducteur: summary(userById(trajet.conducteur_id)),
    depart: trajet.depart,
    arrivee: trajet.arrivee,
    depart_le: trajet.depart_le,
    places_total: trajet.places_total,
    places_restantes: trajet.places_restantes,
    distance_km: trajet.distance_km,
    prix_place: trajet.prix_place,
    statut: trajet.statut,
  }
}

function toTrajetDetail(trajet: MockTrajet): TrajetDetail {
  return {
    ...toTrajetListItem(trajet),
    vehicule: userById(trajet.conducteur_id).vehicule!,
    points: trajet.points.map((point) => ({ ...point, id: String(point.id) })),
    reservations: db.reservations.filter((r) => r.trajet_id === trajet.id).map(toReservationListItem),
  }
}

function toSignalementListItem(s: MockSignalement): SignalementListItem {
  const res = db.reservations.find((r) => r.id === s.reservation_id)!
  return {
    id: String(s.id),
    reservation: { id: String(res.id), statut: res.statut, trajet_id: String(res.trajet_id) },
    auteur: summary(userById(s.auteur_id)),
    cible: summary(userById(s.cible_id)),
    motif: s.motif,
    statut: s.statut,
    cree_le: s.cree_le,
  }
}

function toSignalementDetail(s: MockSignalement): SignalementDetail {
  const res = db.reservations.find((r) => r.id === s.reservation_id)!
  return {
    ...toSignalementListItem(s),
    reservation: toReservationListItem(res),
    resolution: s.resolution ?? '',
    decision: s.decision ?? '',
    traite_le: s.traite_le,
    traite_par: s.traite_par,
  }
}

const requireResolution = (resolution: unknown) =>
  typeof resolution === 'string' && resolution.trim().length >= 10 ? resolution.trim() : null

export const activityHandlers = [
  // ---- Trajets ----
  http.get(url('/admin/trajets/'), ({ request }) => {
    if (!isAdmin(request)) return unauthorized()
    const params = new URL(request.url).searchParams
    const statut = params.get('statut')
    const date = params.get('date')
    const search = params.get('recherche')
    const items = db.trajets
      .filter((t) => !statut || t.statut === statut)
      // Comparaison sur la date à Lomé (UTC+0).
      .filter((t) => !date || t.depart_le.slice(0, 10) === date)
      .filter((t) =>
        matches(search, [
          ...userFields(userById(t.conducteur_id)),
          t.depart.libelle,
          t.arrivee.libelle,
          ...t.points.map((p) => p.libelle),
        ]),
      )
      .sort((a, b) => b.depart_le.localeCompare(a.depart_le))
      .map(toTrajetListItem)
    return ok(paginate(items, request))
  }),

  http.get(url('/admin/trajets/:id/'), ({ request, params }) => {
    if (!isAdmin(request)) return unauthorized()
    const trajet = db.trajets.find((t) => t.id === Number(params.id))
    return trajet ? ok(toTrajetDetail(trajet)) : notFound()
  }),

  // ---- Réservations ----
  http.get(url('/admin/reservations/'), ({ request }) => {
    if (!isAdmin(request)) return unauthorized()
    const params = new URL(request.url).searchParams
    const statut = params.get('statut')
    const trajet = params.get('trajet')
    const search = params.get('recherche')
    const items = db.reservations
      .filter((r) => !statut || r.statut === statut)
      .filter((r) => !trajet || r.trajet_id === Number(trajet))
      .filter((r) =>
        matches(search, [
          ...userFields(userById(r.passager_id)),
          ...userFields(userById(trajetById(r.trajet_id).conducteur_id)),
          String(r.id),
        ]),
      )
      .sort((a, b) => b.cree_le.localeCompare(a.cree_le))
      .map(toReservationListItem)
    return ok(paginate(items, request))
  }),

  http.get(url('/admin/reservations/:id/'), ({ request, params }) => {
    if (!isAdmin(request)) return unauthorized()
    const res = db.reservations.find((r) => r.id === Number(params.id))
    return res ? ok(toReservationDetail(res)) : notFound()
  }),

  // ---- Signalements & litiges ----
  http.get(url('/admin/signalements/'), ({ request }) => {
    if (!isAdmin(request)) return unauthorized()
    const statut = new URL(request.url).searchParams.get('statut')
    const items = db.signalements
      .filter((s) => !statut || s.statut === statut)
      .sort((a, b) => a.cree_le.localeCompare(b.cree_le))
      .map(toSignalementListItem)
    return ok(paginate(items, request))
  }),

  http.get(url('/admin/signalements/:id/'), ({ request, params }) => {
    if (!isAdmin(request)) return unauthorized()
    const s = db.signalements.find((item) => item.id === Number(params.id))
    return s ? ok(toSignalementDetail(s)) : notFound()
  }),

  // Un seul endpoint, comme SignalementTraiterVue : la décision n'est exigée que pour un litige.
  http.post(url('/admin/signalements/:id/traiter/'), async ({ request, params }) => {
    if (!isAdmin(request)) return unauthorized()
    const s = db.signalements.find((item) => item.id === Number(params.id))
    if (!s) return notFound()
    if (s.statut === 'traite') {
      return fail(409, 'Ce signalement est déjà traité.', 'DEJA_TRAITE')
    }
    const res = db.reservations.find((r) => r.id === s.reservation_id)!
    const body = (await request.json().catch(() => ({}))) as {
      resolution?: string
      decision?: DecisionLitige
    }
    const resolution = requireResolution(body.resolution)
    if (!resolution) {
      return invalid({ resolution: ['Assurez-vous que ce champ comporte au moins 10 caractères.'] })
    }

    if (res.statut === 'litige') {
      if (body.decision !== 'crediter_conducteur' && body.decision !== 'rembourser_passager') {
        return fail(
          400,
          'Ce signalement porte sur un litige : une décision est requise.',
          'DECISION_REQUISE',
        )
      }
      res.statut = 'cloturee'
      res.historique.push({ statut: 'cloturee', le: new Date().toISOString() })
    }
    s.decision = body.decision ?? null

    s.statut = 'traite'
    s.resolution = resolution
    s.traite_le = new Date().toISOString()
    s.traite_par = MOCK_ADMIN
    return ok(toSignalementDetail(s))
  }),
]
