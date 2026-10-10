import type { ReservationStatus, SignalementStatus, TrajetStatus } from '@/config/enums'
import type { DecisionLitige } from '@/features/reports/types'
import type { MockUser } from './people'

// Trajets, réservations et signalements fictifs à Lomé (coordonnées approximatives de lieux connus).

type Place = { libelle: string; lat: number; lng: number }

const PLACES = {
  franciscain: { libelle: 'Adidogomé · Carrefour Franciscain', lat: 6.1676, lng: 1.1592 },
  universite: { libelle: 'Université de Lomé · Entrée sud', lat: 6.1745, lng: 1.212 },
  zongo: { libelle: 'Agoè · Carrefour Zongo', lat: 6.228, lng: 1.2033 },
  grandMarche: { libelle: 'Grand Marché (Assigamé)', lat: 6.1275, lng: 1.2225 },
  kpota: { libelle: 'Bè · Kpota', lat: 6.142, lng: 1.242 },
  baguida: { libelle: 'Baguida · Centre', lat: 6.16, lng: 1.324 },
  chu: { libelle: 'Tokoin · CHU Sylvanus Olympio', lat: 6.134, lng: 1.216 },
  hedzranawoe: { libelle: 'Hédzranawoé · Marché', lat: 6.161, lng: 1.236 },
  avedji: { libelle: 'Carrefour Avédji', lat: 6.188, lng: 1.181 },
  totsi: { libelle: 'Carrefour Totsi', lat: 6.181, lng: 1.196 },
  deckon: { libelle: 'Déckon', lat: 6.131, lng: 1.222 },
  kegue: { libelle: 'Kégué · Stade', lat: 6.168, lng: 1.252 },
  nyekonakpoe: { libelle: 'Nyékonakpoè', lat: 6.135, lng: 1.205 },
  port: { libelle: 'Port autonome de Lomé', lat: 6.137, lng: 1.284 },
} satisfies Record<string, Place>

const ROUTES: Array<{ depart: Place; points: Place[]; arrivee: Place }> = [
  { depart: PLACES.franciscain, points: [PLACES.avedji, PLACES.totsi], arrivee: PLACES.universite },
  { depart: PLACES.zongo, points: [PLACES.universite], arrivee: PLACES.grandMarche },
  { depart: PLACES.baguida, points: [PLACES.kegue, PLACES.hedzranawoe], arrivee: PLACES.chu },
  { depart: PLACES.kpota, points: [PLACES.deckon], arrivee: PLACES.nyekonakpoe },
  { depart: PLACES.avedji, points: [PLACES.totsi, PLACES.universite, PLACES.chu], arrivee: PLACES.port },
  { depart: PLACES.hedzranawoe, points: [], arrivee: PLACES.grandMarche },
]

export type MockTrajet = {
  id: number
  conducteur_id: number
  depart: Place
  arrivee: Place
  depart_le: string
  places_total: number
  places_restantes: number
  distance_km: number
  prix_place: number
  statut: TrajetStatus
  points: Array<Place & { id: number; ordre: number }>
}

export type MockReservation = {
  id: number
  trajet_id: number
  passager_id: number
  point: Place & { id: number; ordre: number }
  arrivee: Place
  distance_km: number
  prix: number
  frais_service: number
  statut: ReservationStatus
  /** Présent en base, ne doit JAMAIS sortir de l'API */
  code_depart_hash: string | null
  historique: Array<{ statut: ReservationStatus; le: string }>
  cree_le: string
}

export type MockSignalement = {
  id: number
  reservation_id: number
  auteur_id: number
  cible_id: number
  motif: string
  statut: SignalementStatus
  cree_le: string
  resolution: string | null
  decision: DecisionLitige | null
  traite_le: string | null
  traite_par: { id: string; nom: string; prenom: string } | null
}

const MIN = 60 * 1000
const HOUR = 60 * MIN
const DAY = 24 * HOUR
const iso = (ms: number) => new Date(ms).toISOString()

function haversineKm(a: Place, b: Place): number {
  const rad = (deg: number) => (deg * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.asin(Math.sqrt(h))
}

// En production : distance par la route (OSRM / Google). Ici : vol d'oiseau × 1,3.
const roadKm = (a: Place, b: Place) => Math.round(haversineKm(a, b) * 1.3 * 10) / 10
// Grille du PRD (valeurs de départ du paramètre grille_prix).
const prixFor = (km: number) => (km < 5 ? 200 : km <= 10 ? 300 : 500)

const PATHS: Record<ReservationStatus, ReservationStatus[]> = {
  demandee: ['demandee'],
  acceptee: ['demandee', 'acceptee'],
  refusee: ['demandee', 'refusee'],
  annulee: ['demandee', 'acceptee', 'annulee'],
  absent: ['demandee', 'acceptee', 'absent'],
  en_cours: ['demandee', 'acceptee', 'en_cours'],
  terminee: ['demandee', 'acceptee', 'en_cours', 'terminee'],
  litige: ['demandee', 'acceptee', 'en_cours', 'terminee', 'litige'],
  cloturee: ['demandee', 'acceptee', 'en_cours', 'terminee', 'cloturee'],
}

const OCCUPYING: ReservationStatus[] = ['acceptee', 'en_cours', 'terminee', 'cloturee', 'litige', 'absent']

function timestampFor(statut: ReservationStatus, depart: number, cree: number): number {
  switch (statut) {
    case 'demandee':
      return cree
    case 'acceptee':
      return cree + HOUR
    case 'refusee':
      return cree + 2 * HOUR
    case 'annulee':
      return depart - 2 * HOUR
    case 'absent':
      return depart + 15 * MIN
    case 'en_cours':
      return depart + 5 * MIN
    case 'terminee':
      return depart + 40 * MIN
    case 'litige':
      return depart + 70 * MIN
    case 'cloturee':
      return depart + 100 * MIN
  }
}

/** Statuts particuliers forcés pour avoir tous les cas en démonstration (clé : trajet-réservation). */
// Trajets terminés avec au moins une réservation : k = 3, 7, 9, 13, 19…
const SPECIAL: Record<string, ReservationStatus> = {
  '3-0': 'litige',
  '9-0': 'litige',
  '7-1': 'absent',
  '13-0': 'annulee',
  '19-0': 'terminee',
}

export function buildTrips(users: MockUser[], now: number, admin: MockSignalement['traite_par']) {
  const drivers = users.filter((user) => user.vehicule)
  const passengers = users.filter((user) => !user.vehicule)
  const trajets: MockTrajet[] = []
  const reservations: MockReservation[] = []
  const signalements: MockSignalement[] = []
  let pointId = 7000
  let reservationId = 3000

  drivers.forEach((driver, d) => {
    for (let t = 0; t < 3; t += 1) {
      const k = d * 3 + t
      const route = ROUTES[k % ROUTES.length]!
      const departMs =
        t === 0
          ? now - (2 + d) * DAY + 7 * HOUR
          : t === 1
            ? d % 4 === 0
              ? now - 20 * MIN
              : now - (d + 5) * HOUR
            : now + (d + 1) * 5 * HOUR
      let statut: TrajetStatus =
        departMs > now ? 'publie' : now - departMs < HOUR ? 'en_cours' : 'termine'
      if (d === 5 && t === 0) statut = 'annule'

      const trajetId = 1000 + k
      const points = route.points.map((place, index) => ({ ...place, id: pointId++, ordre: index + 1 }))
      const distance = roadKm(route.depart, route.arrivee)
      const trajet: MockTrajet = {
        id: trajetId,
        conducteur_id: driver.id,
        depart: route.depart,
        arrivee: route.arrivee,
        depart_le: iso(departMs),
        places_total: 3,
        places_restantes: 3,
        distance_km: distance,
        prix_place: prixFor(distance),
        statut,
        points,
      }

      const count = Math.min(3, k % 4)
      for (let r = 0; r < count; r += 1) {
        const passenger = passengers[(k * 2 + r) % passengers.length]!
        const point = points[r % Math.max(points.length, 1)] ?? { ...route.depart, id: pointId++, ordre: 0 }
        const km = roadKm(point, route.arrivee)
        let resStatut: ReservationStatus =
          statut === 'annule'
            ? 'annulee'
            : statut === 'termine'
              ? 'cloturee'
              : statut === 'en_cours'
                ? r === 0
                  ? 'en_cours'
                  : 'acceptee'
                : (['acceptee', 'demandee', 'refusee'] as const)[r % 3]!
        resStatut = SPECIAL[`${k}-${r}`] && statut === 'termine' ? SPECIAL[`${k}-${r}`]! : resStatut
        const cree = departMs - 20 * HOUR - r * HOUR
        reservations.push({
          id: reservationId++,
          trajet_id: trajetId,
          passager_id: passenger.id,
          point,
          arrivee: route.arrivee,
          distance_km: km,
          prix: prixFor(km),
          frais_service: 0,
          statut: resStatut,
          code_depart_hash: OCCUPYING.includes(resStatut) ? 'pbkdf2_sha256$fictif$NE-DOIT-JAMAIS-SORTIR' : null,
          historique: PATHS[resStatut].map((s) => ({ statut: s, le: iso(timestampFor(s, departMs, cree)) })),
          cree_le: iso(cree),
        })
      }

      const occupied = reservations.filter(
        (res) => res.trajet_id === trajetId && OCCUPYING.includes(res.statut),
      ).length
      trajet.places_restantes = trajet.places_total - occupied
      if (trajet.statut === 'publie' && trajet.places_restantes === 0) trajet.statut = 'complet'
      trajets.push(trajet)
    }
  })

  // Signalements : un par litige (ouvert), plus quelques cas ouverts et traités.
  let signalementId = 800
  const conducteurOf = (res: MockReservation) => trajets.find((t) => t.id === res.trajet_id)!.conducteur_id
  const addSignalement = (
    res: MockReservation,
    fromDriver: boolean,
    motif: string,
    traite?: { resolution: string },
  ) => {
    const terminee = res.historique.find((h) => h.statut === 'terminee')?.le ?? res.cree_le
    signalements.push({
      id: signalementId++,
      reservation_id: res.id,
      auteur_id: fromDriver ? conducteurOf(res) : res.passager_id,
      cible_id: fromDriver ? res.passager_id : conducteurOf(res),
      motif,
      statut: traite ? 'traite' : 'ouvert',
      cree_le: iso(new Date(terminee).getTime() + 30 * MIN),
      resolution: traite?.resolution ?? null,
      decision: null,
      traite_le: traite ? iso(new Date(terminee).getTime() + DAY) : null,
      traite_par: traite ? admin : null,
    })
  }

  const litiges = reservations.filter((res) => res.statut === 'litige')
  const motifsLitige = [
    'Le conducteur a demandé 200 F de plus que le prix affiché.',
    "Le conducteur m'a déposé à 2 km de ma destination sans explication.",
  ]
  litiges.forEach((res, index) => addSignalement(res, false, motifsLitige[index % 2]!))

  const closed = reservations.filter((res) => res.statut === 'cloturee')
  if (closed[0]) addSignalement(closed[0], false, 'Conduite dangereuse : excès de vitesse sur le boulevard du 13 janvier.')
  if (closed[2]) addSignalement(closed[2], true, 'Passager arrivé avec 15 minutes de retard et impoli.')
  if (closed[4])
    addSignalement(closed[4], false, 'Climatisation en panne, trajet inconfortable.', {
      resolution: 'Conducteur informé, aucune sanction : incident mineur.',
    })
  if (closed[6])
    addSignalement(closed[6], true, 'Objet oublié dans le véhicule (sac noir).', {
      resolution: 'Mise en relation effectuée, sac restitué au passager.',
    })

  return { trajets, reservations, signalements }
}
