// Types partagés de l'API Django REST Framework.
// Les DTO de chaque ressource seront ajoutés ici au fil des phases, avec les champs du PRD.

/** Réponse paginée DRF (PageNumberPagination). */
export type Paginated<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

/** Point géographique tel que décrit dans le modèle de données (lat, lng, libellé). */
export type GeoPoint = {
  lat: number
  lng: number
  libelle: string
}
