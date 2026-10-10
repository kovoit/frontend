import type { Parametre } from '@/features/settings/types'

// Miroir du registre backend (apps/parametres/defauts.py) : mêmes clés, valeurs, unités, minimums.
type Ligne = [
  cle: string,
  valeur: number,
  type: Parametre['type_valeur'],
  description: string,
  unite: string,
  minimum: number,
]

const GROUPES: Array<{ code: string; libelle: string; lignes: Ligne[] }> = [
  {
    code: 'prix',
    libelle: 'Prix et portefeuille',
    lignes: [
      ['prix_simulation', 300, 'entier', 'Prix temporaire par passager (F CFA).', 'F CFA', 0],
      ['frais_service', 0, 'entier', 'Frais de service Kovoit par passager (F CFA).', 'F CFA', 0],
      [
        'recharge_min',
        500,
        'entier',
        "Montant minimum d'une recharge simulée (F CFA).",
        'F CFA',
        0,
      ],
      ['retrait_min', 500, 'entier', "Montant minimum d'un retrait simulé (F CFA).", 'F CFA', 0],
    ],
  },
  {
    code: 'correspondance',
    libelle: 'Correspondance des trajets',
    lignes: [
      [
        'rayon_depart_km',
        1.5,
        'decimal',
        'Distance max départ passager / point de prise en charge (km).',
        'km',
        0.1,
      ],
      [
        'rayon_arrivee_km',
        1.5,
        'decimal',
        'Distance max arrivée passager / arrivée conducteur (km).',
        'km',
        0.1,
      ],
      [
        'fenetre_horaire_min',
        15,
        'entier',
        'Écart max heure souhaitée / heure de départ (min).',
        'min',
        1,
      ],
    ],
  },
  {
    code: 'reservation',
    libelle: 'Réservation, annulation et clôture',
    lignes: [
      [
        'delai_annulation_min',
        30,
        'entier',
        'En dessous : annulation tardive (min avant départ).',
        'min',
        0,
      ],
      [
        'tolerance_retard_min',
        10,
        'entier',
        'Délai avant de pouvoir déclarer une absence (min).',
        'min',
        0,
      ],
      [
        'delai_confirmation_auto_h',
        3,
        'entier',
        'Clôture automatique après la fin du trajet (h).',
        'h',
        1,
      ],
      [
        'code_depart_max_essais',
        5,
        'entier',
        'Essais max de saisie du code de départ.',
        'essais',
        1,
      ],
    ],
  },
  {
    code: 'fiabilite',
    libelle: 'Fiabilité et suspension',
    lignes: [
      [
        'seuil_incidents',
        3,
        'entier',
        'Incidents (annulations tardives + absences) avant suspension.',
        'incidents',
        1,
      ],
      [
        'periode_incidents_j',
        30,
        'entier',
        'Période de calcul de la fiabilité et des incidents (jours).',
        'jours',
        1,
      ],
      [
        'duree_suspension_j',
        7,
        'entier',
        "Durée d'une suspension automatique (jours).",
        'jours',
        1,
      ],
    ],
  },
  {
    code: 'otp',
    libelle: 'Connexion par code (OTP)',
    lignes: [
      ['otp_validite_min', 10, 'entier', "Durée de validité d'un code OTP (min).", 'min', 1],
      ['otp_max_essais', 5, 'entier', "Essais max de saisie d'un code OTP.", 'essais', 1],
      ['otp_delai_renvoi_s', 60, 'entier', "Délai minimum entre deux envois d'OTP (s).", 's', 0],
      [
        'otp_max_par_heure',
        5,
        'entier',
        "Nombre max d'OTP envoyés par heure et par email.",
        'codes',
        1,
      ],
    ],
  },
]

export function buildParametres(now: number): Parametre[] {
  return GROUPES.flatMap(({ code, libelle, lignes }) =>
    lignes.map(([cle, valeur, type_valeur, description, unite, minimum]) => ({
      cle,
      valeur,
      type_valeur,
      description,
      groupe: { code, libelle },
      unite,
      minimum,
      modifie_le: new Date(now).toISOString(),
      modifie_par: null,
    })),
  )
}
