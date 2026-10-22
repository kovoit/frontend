import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { api } from '@/api/client'
import type { Id, Paginated } from '@/api/types'
import type { AuditEvent, AuditFilters, AuditFlux, AuditPeriode, AuditStats } from './types'

/** Intervalle du flux temps réel (interrogation courte du serveur). */
export const LIVE_INTERVAL_MS = 5000
/** Nombre maximal d'événements reçus en direct gardés au-dessus de la liste. */
const LIVE_MAX = 100

export const auditKeys = {
  all: ['audit'] as const,
  list: (filters: AuditFilters, page: number) => ['audit', 'list', filters, page] as const,
  live: (filters: AuditFilters) => ['audit', 'live', filters] as const,
  detail: (id: Id) => ['audit', 'detail', id] as const,
  stats: (periode: AuditPeriode) => ['audit', 'stats', periode] as const,
}

/** Lomé est en UTC toute l'année : les bornes de dates sont exprimées en UTC. */
function toParams(filters: Partial<AuditFilters>) {
  const params: Record<string, string> = {}
  for (const [key, value] of Object.entries(filters)) {
    if (!value) continue
    if (key === 'debut') params.debut = `${value}T00:00:00Z`
    else if (key === 'fin') params.fin = `${value}T23:59:59Z`
    else params[key] = value
  }
  return params
}

export function useAuditEvents(filters: Partial<AuditFilters>, page = 1, enabled = true) {
  return useQuery({
    queryKey: ['audit', 'list', filters, page],
    queryFn: async () => {
      const { data } = await api.get<Paginated<AuditEvent>>('/admin/audit/evenements/', {
        params: { ...toParams(filters), page: page > 1 ? page : undefined },
      })
      return data
    },
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useAuditEvent(id: Id) {
  return useQuery({
    queryKey: auditKeys.detail(id),
    queryFn: async () => {
      const { data } = await api.get<AuditEvent>(`/admin/audit/evenements/${id}/`)
      return data
    },
  })
}

export function useAuditStats(periode: AuditPeriode) {
  return useQuery({
    queryKey: auditKeys.stats(periode),
    queryFn: async () => {
      const { data } = await api.get<AuditStats>('/admin/audit/statistiques/', {
        params: { periode },
      })
      return data
    },
    placeholderData: keepPreviousData,
    refetchInterval: LIVE_INTERVAL_MS * 6,
  })
}

type LiveData = { events: AuditEvent[]; tronque: boolean }

/**
 * Flux temps réel : toutes les 5 s, les événements enregistrés depuis le plus récent déjà
 * reçu (`depuis`). Les nouveaux sont accumulés dans le cache de la requête, plus récents
 * d'abord, et dédoublonnés par id : le serveur relit volontairement quelques secondes.
 * Une coupure ne perd rien : la requête suivante reprend au dernier événement reçu.
 */
export function useAuditLive(
  filters: AuditFilters,
  newestKnown: string | undefined,
  enabled: boolean,
) {
  const queryClient = useQueryClient()
  const key = auditKeys.live(filters)

  const query = useQuery({
    queryKey: key,
    queryFn: async (): Promise<LiveData> => {
      const previous = queryClient.getQueryData<LiveData>(key) ?? { events: [], tronque: false }
      const depuis = previous.events[0]?.enregistre_le ?? newestKnown
      const { data } = await api.get<AuditFlux>('/admin/audit/flux/', {
        params: { ...toParams(filters), depuis },
      })
      const seen = new Set(previous.events.map((event) => event.id))
      const fresh = data.evenements.filter((event) => !seen.has(event.id)).reverse()
      return {
        events: [...fresh, ...previous.events].slice(0, LIVE_MAX),
        tronque: previous.tronque || data.tronque,
      }
    },
    enabled: enabled && Boolean(newestKnown),
    refetchInterval: LIVE_INTERVAL_MS,
    // Onglet masqué : pas de requêtes inutiles ; reprise au retour, sans perte.
    refetchIntervalInBackground: false,
    retry: false,
    staleTime: 0,
    gcTime: 0,
  })

  /** Recharge la liste paginée et repart d'un flux vide (après « trop d'événements »). */
  const reset = useCallback(() => {
    queryClient.removeQueries({ queryKey: auditKeys.live(filters) })
    void queryClient.invalidateQueries({ queryKey: ['audit', 'list'] })
    void queryClient.invalidateQueries({ queryKey: ['audit', 'stats'] })
  }, [queryClient, filters])

  return { ...query, reset }
}

/** Point de départ du flux : le plus récent événement de la liste, ou, liste vide, l'heure de
 *  chargement moins une marge (l'horloge du navigateur peut différer de celle du serveur). */
export function liveStart(newest: AuditEvent | undefined, loadedAt: number): string | undefined {
  if (newest) return newest.enregistre_le
  return loadedAt ? new Date(loadedAt - 5 * 60_000).toISOString() : undefined
}
