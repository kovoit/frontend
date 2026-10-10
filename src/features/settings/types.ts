import type { Id } from '@/api/types'

// Contrat de l'API (backend : apps/parametres/api/views.py), réservé aux admins :
//   GET   /admin/parametres/         → Parametre[] (ordre du registre backend, groupés par thème)
//   PATCH /admin/parametres/{cle}/ { valeur } → Parametre
//         400 VALEUR_PARAMETRE_INVALIDE (type, ou valeur < minimum) · 404 PARAMETRE_INTROUVABLE
// Le backend vide son cache à chaque modification : la valeur s'applique immédiatement.

export type Parametre = {
  cle: string
  valeur: number
  type_valeur: 'entier' | 'decimal'
  description: string
  groupe: { code: string; libelle: string }
  /** Ex. « F CFA », « km », « min » ; chaîne vide si sans unité */
  unite: string
  /** Plus petite valeur acceptée par le backend */
  minimum: number
  modifie_le: string
  modifie_par: { id: Id; nom: string; prenom: string } | null
}
