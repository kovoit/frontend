import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { env } from '@/config/env'
import { tokenStore } from './tokenStore'

export const REFRESH_PATH = '/auth/token/refresh/'

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

let pendingRefresh: Promise<string | null> | null = null

/** Demande un nouvel access token grâce au cookie de refresh. Renvoie null si la session est expirée. */
export async function refreshAccessToken(): Promise<string | null> {
  try {
    const { data } = await axios.post<{ access: string }>(
      `${env.apiUrl}${REFRESH_PATH}`,
      {},
      { withCredentials: true },
    )
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
  (response) => response,
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

export type ApiError = {
  status: number | null
  message: string
  /** Erreurs de champ DRF : { champ: ["message"] } */
  fieldErrors: Record<string, string[]>
}

/** Normalise une erreur axios / DRF pour l'UI et react-hook-form. */
export function toApiError(error: unknown): ApiError {
  if (!axios.isAxiosError(error)) {
    return { status: null, message: 'Une erreur inattendue est survenue.', fieldErrors: {} }
  }
  const status = error.response?.status ?? null
  const data = error.response?.data as Record<string, unknown> | undefined

  if (!error.response) {
    return { status, message: 'Serveur injoignable. Vérifiez votre connexion.', fieldErrors: {} }
  }

  const fieldErrors: Record<string, string[]> = {}
  let message = typeof data?.detail === 'string' ? data.detail : ''
  if (data && typeof data === 'object') {
    for (const [key, value] of Object.entries(data)) {
      if (key === 'detail') continue
      if (Array.isArray(value)) fieldErrors[key] = value.map(String)
      else if (typeof value === 'string') fieldErrors[key] = [value]
    }
    const nonField = fieldErrors.non_field_errors?.[0]
    if (!message && nonField) message = nonField
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
  return { status, message, fieldErrors }
}
