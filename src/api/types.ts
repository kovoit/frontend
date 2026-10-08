// Types partagés de l'API Django REST Framework.
// Les DTO de chaque ressource seront ajoutés ici au fil des phases, avec les champs du PRD.

/** Réponse paginée DRF (PageNumberPagination). */
export type Paginated<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

/** Identité courte d'un utilisateur, imbriquée dans d'autres ressources. */
export type UserSummary = {
  id: number
  nom: string
  prenom: string
  email: string
  telephone: string
}

/** Table `vehicules` du PRD. */
export type Vehicule = {
  id: number
  marque: string
  modele: string
  couleur: string
  immatriculation: string
  nb_places: number
}

/** Point géographique tel que décrit dans le modèle de données (lat, lng, libellé). */
export type GeoPoint = {
  lat: number
  lng: number
  libelle: string
}
