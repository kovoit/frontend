// Types partagés de l'API Django REST Framework.
// Les DTO de chaque ressource seront ajoutés ici au fil des phases, avec les champs du PRD.

/** Identifiant d'une ressource : UUID généré par le backend. */
export type Id = string

/** Enveloppe de toutes les réponses du backend (apps/core/api/reponses.py). */
export type ApiEnvelope<T> =
  | { statut: 'success'; message: string; reponse: T }
  | { statut: 'failed'; message: string; reponse: ApiFailure | null }

/** Contenu de `reponse` en échec : code métier + erreurs de champ (validation DRF). */
export type ApiFailure = {
  code: string
  erreurs: Record<string, unknown> | unknown[] | null
}

/** Réponse paginée DRF (PageNumberPagination), placée dans `reponse`. */
export type Paginated<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

/** Identité courte d'un utilisateur, imbriquée dans d'autres ressources. */
export type UserSummary = {
  id: Id
  nom: string
  prenom: string
  email: string
  telephone: string
}

/** Véhicule résumé (backend : VehiculeResumeSerializer). */
export type Vehicule = {
  id: Id
  type_vehicule: 'voiture' | 'moto'
  marque: string
  modele: string
  couleur: string
  immatriculation: string
  nb_places: number
  /** URL de la photo, null si absente */
  photo: string | null
}

/** Point géographique tel que décrit dans le modèle de données (lat, lng, libellé). */
export type GeoPoint = {
  lat: number
  lng: number
  libelle: string
}
