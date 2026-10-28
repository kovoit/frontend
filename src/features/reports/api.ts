import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { Id, Paginated } from '@/api/types'
import { useAuth } from '@/features/auth/authContext'
import { aLeRole } from '@/features/auth/types'
import type {
  CompteurSignalements,
  DecisionLitige,
  SignalementDetail,
  SignalementListFilters,
  SignalementListItem,
} from './types'

export const reportKeys = {
  list: (filters: SignalementListFilters) => ['reports', 'list', filters] as const,
  detail: (id: Id) => ['reports', 'detail', id] as const,
  compteur: ['reports', 'compteur'] as const,
}

/** Rafraîchissement du badge « signalements ouverts » du menu */
export const COMPTEUR_REFETCH_MS = 60_000

/**
 * Nombre de signalements ouverts (badge du menu). Interrogé seulement si l'admin a le rôle
 * modération : la route répond 403 aux autres rôles.
 */
export function useOpenReportsCount() {
  const { user } = useAuth()
  return useQuery({
    queryKey: reportKeys.compteur,
    queryFn: async () => {
      const { data } = await api.get<CompteurSignalements>('/admin/signalements/compteur/')
      return data
    },
    enabled: user !== null && aLeRole(user, 'moderation'),
    refetchInterval: COMPTEUR_REFETCH_MS,
  })
}

export function useReportList(filters: SignalementListFilters) {
  return useQuery({
    queryKey: reportKeys.list(filters),
    queryFn: async () => {
      const { data } = await api.get<Paginated<SignalementListItem>>('/admin/signalements/', {
        params: {
          statut: filters.statut || undefined,
          page: filters.page > 1 ? filters.page : undefined,
        },
      })
      return data
    },
    placeholderData: keepPreviousData,
  })
}

export function useReport(id: Id) {
  return useQuery({
    queryKey: reportKeys.detail(id),
    queryFn: async () => {
      const { data } = await api.get<SignalementDetail>(`/admin/signalements/${id}/`)
      return data
    },
  })
}

/** Traitement simple ou arbitrage : un seul endpoint, la décision n'est exigée que pour un litige. */
function useReportAction<TPayload>(id: Id) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: TPayload) => {
      const { data } = await api.post<SignalementDetail>(
        `/admin/signalements/${id}/traiter/`,
        payload,
      )
      return data
    },
    onSuccess: (signalement) => {
      queryClient.setQueryData(reportKeys.detail(id), signalement)
      // Un litige tranché change le statut de la réservation (et du trajet côté backend) ;
      // le badge du menu doit baisser aussitôt.
      const keys = [
        ['reports', 'list'],
        reportKeys.compteur,
        ['bookings'],
        ['trips'],
        ['users'],
        ['dashboard'],
      ]
      for (const key of keys) {
        void queryClient.invalidateQueries({ queryKey: key })
      }
    },
  })
}

export const useResolveReport = (id: Id) => useReportAction<{ resolution: string }>(id)
export const useArbitrateDispute = (id: Id) =>
  useReportAction<{ decision: DecisionLitige; resolution: string }>(id)
