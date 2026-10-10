import axios, { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { env } from '@/config/env'
import type { ApiEnvelope, ApiFailure } from './types'
import { tokenStore } from './tokenStore'

export const REFRESH_PATH = '/auth/admin/jeton/rafraichir/'

export const api = axios.create({
  baseURL: env.apiUrl,
  withCredentials: true,
  headers: { Accept: 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = tokenStore.get()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

function isEnvelope(data: unknown): data is ApiEnvelope<unknown> {
  return typeof data === 'object' && data !== null && 'statut' in data && 'reponse' in data
}

/**
 * Le backend enveloppe toutes ses réponses : { statut, message, reponse }.
 * On remplace `data` par `reponse` pour que les hooks reçoivent directement les données ;
 * le message du backend reste disponible dans `apiMessage`.
 */
export function unwrapEnvelope<T>(response: AxiosResponse): AxiosResponse<T> & { apiMessage?: string } {
  if (!isEnvelope(response.data)) return response
  return Object.assign(response, { data: response.data.reponse as T, apiMessage: response.data.message })
}

let pendingRefresh: Promise<string | null> | null = null

/** Demande un nouvel access token grâce au cookie de refresh. Renvoie null si la session est expirée. */
export async function refreshAccessToken(): Promise<string | null> {
  try {
    const response = await axios.post(`${env.apiUrl}${REFRESH_PATH}`, {}, { withCredentials: true })
    const { data } = unwrapEnvelope<{ access: string }>(response)
    tokenStore.set(data.access)
    return data.access
  } catch {
    // Session expirée : les abonnés de tokenStore (AuthProvider) redirigent vers la connexion.
    tokenStore.clear()
    return null
  }
}

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean }

// Sur 401 : un seul refresh partagé entre les requêtes concurrentes, puis rejeu de la requête.
api.interceptors.response.use(
  (response) => unwrapEnvelope(response),
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined
    // Les endpoints /auth/* (login, me, logout) gèrent eux-mêmes leurs 401 : pas de refresh.
    const isAuthEndpoint = original?.url?.startsWith('/auth/') ?? false
    if (error.response?.status !== 401 || !original || original._retry || isAuthEndpoint) {
      return Promise.reject(error)
    }
    original._retry = true
    pendingRefresh ??= refreshAccessToken().finally(() => {
      pendingRefresh = null
    })
    const token = await pendingRefresh
    if (!token) return Promise.reject(error)
    original.headers.Authorization = `Bearer ${token}`
    return api(original)
  },
)

/**
 * Télécharge un fichier protégé (ex. pièce KYC) avec le jeton de l'admin.
 * En erreur, le corps reçu est un Blob : on le relit en JSON pour que toApiError retrouve
 * le message et le code du backend.
 */
export async function getBlob(url: string): Promise<Blob> {
  try {
    const { data } = await api.get<Blob>(url, { responseType: 'blob' })
    return data
  } catch (error) {
    const body: unknown = axios.isAxiosError(error) ? error.response?.data : null
    if (axios.isAxiosError(error) && error.response && body instanceof Blob) {
      try {
        error.response.data = JSON.parse(await body.text())
      } catch {
        error.response.data = null
      }
    }
    throw error
  }
}

export type ApiError = {
  status: number | null
  /** Code d'erreur métier du backend (ex. PLUS_DE_PLACE, DONNEES_INVALIDES), null si absent */
  code: string | null
  message: string
  /** Erreurs de champ DRF : { champ: ["message"] } */
  fieldErrors: Record<string, string[]>
}

/** Aplatit les erreurs de validation DRF (listes, objets imbriqués) en { champ: [messages] }. */
function flattenFieldErrors(erreurs: ApiFailure['erreurs']): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {}
  if (Array.isArray(erreurs)) {
    if (erreurs.length) fieldErrors.non_field_errors = erreurs.map(String)
    return fieldErrors
  }
  for (const [key, value] of Object.entries(erreurs ?? {})) {
    if (Array.isArray(value)) fieldErrors[key] = value.map(String)
    else if (typeof value === 'string') fieldErrors[key] = [value]
    else if (value && typeof value === 'object') fieldErrors[key] = Object.values(value).flat().map(String)
  }
  return fieldErrors
}

/** Normalise une erreur axios (enveloppe `failed` du backend) pour l'UI et react-hook-form. */
export function toApiError(error: unknown): ApiError {
  if (!axios.isAxiosError(error)) {
    return { status: null, code: null, message: 'Une erreur inattendue est survenue.', fieldErrors: {} }
  }
  const status = error.response?.status ?? null

  if (!error.response) {
    return {
      status,
      code: null,
      message: 'Serveur injoignable. Vérifiez votre connexion.',
      fieldErrors: {},
    }
  }

  const data: unknown = error.response.data
  const failure = isEnvelope(data) ? (data.reponse as ApiFailure | null) : null
  const fieldErrors = flattenFieldErrors(failure?.erreurs ?? null)
  const code = failure?.code ?? null
  // Les erreurs de validation portent un message générique : on préfère le premier message utile.
  let message = isEnvelope(data) ? data.message : ''
  if (code === 'DONNEES_INVALIDES' && fieldErrors.non_field_errors?.[0]) {
    message = fieldErrors.non_field_errors[0]
  }

  if (!message) {
    message =
      status === 403
        ? "Vous n'avez pas les droits pour cette action."
        : status === 429
          ? 'Trop de tentatives. Réessayez dans quelques minutes.'
        : status === 404
          ? 'Ressource introuvable.'
          : status !== null && status >= 500
            ? 'Erreur du serveur. Réessayez plus tard.'
            : 'La requête a échoué.'
  }
  return { status, code, message, fieldErrors }
}
