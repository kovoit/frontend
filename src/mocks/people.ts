import type { Vehicule } from '@/api/types'
import type { CompteStatus, KycStatus, KycType, PieceType } from '@/config/enums'
import { buildTrips } from './trips'

// Base de données fictive en mémoire (mode mock et tests). Personnes et documents imaginaires.

const DAY = 24 * 60 * 60 * 1000
const HOUR = 60 * 60 * 1000
export const MOCK_NOW = Date.UTC(2026, 9, 8, 10, 0)

const PRENOMS = [
  'Kodjo', 'Afi', 'Kossi', 'Yawa', 'Komi', 'Akossiwa', 'Edem', 'Mawuli', 'Sena', 'Dela',
  'Kafui', 'Esso', 'Abla', 'Folly', 'Ayélé', 'Elom', 'Sélom', 'Enyonam', 'Yao', 'Ama',
]
const NOMS = [
  'Mensah', 'Amégan', 'Akakpo', 'Agbéko', 'Lawson', 'Kpodar', 'Adjo', 'Ahadji', 'Dossou',
  'Tchalla', 'Gbadoé', 'Attiogbé', 'Amouzou', 'Kodjovi', 'Sodji',
]
const VEHICULES: Array<Pick<Vehicule, 'marque' | 'modele' | 'couleur'>> = [
  { marque: 'Toyota', modele: 'Yaris', couleur: 'Gris' },
  { marque: 'Kia', modele: 'Picanto', couleur: 'Blanc' },
  { marque: 'Hyundai', modele: 'i10', couleur: 'Rouge' },
  { marque: 'Toyota', modele: 'Corolla', couleur: 'Noir' },
  { marque: 'Suzuki', modele: 'Swift', couleur: 'Bleu' },
]

export type MockUser = {
  id: number
  nom: string
  prenom: string
  email: string
  telephone: string
  cree_le: string
  telephone_verifie_le: string
  mode_actif: 'passager' | 'conducteur'
  statut_compte: CompteStatus
  suspendu_jusqu_au: string | null
  motif_suspension: string | null
  kyc_passager: KycStatus
  kyc_conducteur: KycStatus
  reservations_30j: number
  annulations_tardives_30j: number
  absences_30j: number
  note_moyenne: number | null
  nb_notes: number
  vehicule: Vehicule | null
}

export type MockPiece = { id: number; type_piece: PieceType }

export type MockDossier = {
  id: number
  user_id: number
  type: KycType
  statut: KycStatus
  soumis_le: string | null
  traite_le: string | null
  traite_par: { id: number; nom: string; prenom: string } | null
  motif_rejet: string | null
  pieces: MockPiece[]
}

const PIECES: Record<KycType, PieceType[]> = {
  passager: ['identite', 'selfie'],
  conducteur: ['identite', 'selfie', 'permis', 'carte_grise', 'photo_vehicule'],
}

const PASSAGER_CYCLE: KycStatus[] = ['verifie', 'en_attente', 'verifie', 'rejete', 'en_attente', 'non_verifie']
const CONDUCTEUR_CYCLE: KycStatus[] = ['en_attente', 'verifie', 'verifie', 'rejete']
const ADMIN = { id: 1, nom: 'Kovoit', prenom: 'Admin' }

const slug = (value: string) =>
  value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const pad = (value: number) => String(value % 100).padStart(2, '0')
const iso = (ms: number) => new Date(ms).toISOString()

function build() {
  const users: MockUser[] = []
  const dossiers: MockDossier[] = []
  let dossierId = 500
  let pieceId = 9000

  for (let i = 0; i < 36; i += 1) {
    const prenom = PRENOMS[i % PRENOMS.length]!
    const nom = NOMS[(i * 7) % NOMS.length]!
    const isDriver = i % 3 === 0
    const reservations = (i * 5) % 14
    const vehicle = VEHICULES[i % VEHICULES.length]!
    const user: MockUser = {
      id: 100 + i,
      nom,
      prenom,
      email: `${slug(prenom)}.${slug(nom)}${i}@exemple.tg`,
      telephone: `+228 9${i % 10} ${pad(12 + i)} ${pad(i * 17)} ${pad(i * 29)}`,
      cree_le: iso(MOCK_NOW - (i * 2 + 5) * DAY),
      telephone_verifie_le: iso(MOCK_NOW - (i * 2 + 5) * DAY + HOUR),
      mode_actif: isDriver ? 'conducteur' : 'passager',
      statut_compte: i === 7 || i === 20 ? 'suspendu' : 'actif',
      suspendu_jusqu_au: i === 7 ? iso(MOCK_NOW + 4 * DAY) : null,
      motif_suspension:
        i === 7 ? '3 absences sur 30 jours (suspension automatique)' : i === 20 ? 'Signalement grave' : null,
      kyc_passager: PASSAGER_CYCLE[i % PASSAGER_CYCLE.length]!,
      kyc_conducteur: isDriver ? CONDUCTEUR_CYCLE[(i / 3) % CONDUCTEUR_CYCLE.length]! : 'non_verifie',
      reservations_30j: reservations,
      annulations_tardives_30j: i % 5 === 0 && reservations > 0 ? 2 : i % 7 === 0 && reservations > 0 ? 1 : 0,
      absences_30j: i % 11 === 0 && reservations > 0 ? 1 : 0,
      note_moyenne: reservations > 0 ? Math.min(5, 3.6 + (i % 14) / 10) : null,
      nb_notes: reservations * 2,
      vehicule: isDriver
        ? {
            id: 300 + i,
            ...vehicle,
            immatriculation: `TG ${1000 + ((i * 37) % 9000)} ${String.fromCharCode(65 + (i % 26))}${String.fromCharCode(65 + ((i * 3) % 26))}`,
            nb_places: 4,
          }
        : null,
    }
    users.push(user)

    const addDossier = (type: KycType, statut: KycStatus) => {
      if (statut === 'non_verifie') return
      const soumis = MOCK_NOW - (i * 3 + (type === 'conducteur' ? 1 : 0)) * HOUR - DAY
      const treated = statut === 'verifie' || statut === 'rejete'
      dossiers.push({
        id: dossierId++,
        user_id: user.id,
        type,
        statut,
        soumis_le: iso(soumis),
        traite_le: treated ? iso(soumis + 5 * HOUR) : null,
        traite_par: treated ? ADMIN : null,
        motif_rejet: statut === 'rejete' ? "Photo de la pièce d'identité illisible." : null,
        pieces: PIECES[type].map((type_piece) => ({ id: pieceId++, type_piece })),
      })
    }
    addDossier('passager', user.kyc_passager)
    if (isDriver) addDossier('conducteur', user.kyc_conducteur)
  }

  return { users, dossiers, ...buildTrips(users, MOCK_NOW, ADMIN) }
}

export let db = build()
/** Journal des consultations de pièces (PRD : chaque consultation est tracée). */
export let pieceConsultations: Array<{ piece_id: number; admin_id: number; consulte_le: string }> = []

export function resetMockDb() {
  db = build()
  pieceConsultations = []
}

export const MOCK_ADMIN = ADMIN
