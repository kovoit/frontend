import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { Id, Paginated } from '@/api/types'
import type {
  DecisionLitige,
  SignalementDetail,
  SignalementListFilters,
  SignalementListItem,
} from './types'

export const reportKeys = {
  list: (filters: SignalementListFilters) => ['reports', 'list', filters] as const,
  detail: (id: Id) => ['reports', 'detail', id] as const,
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
      // Un litige tranché change le statut de la réservation (et du trajet côté backend).
      for (const key of [['reports', 'list'], ['bookings'], ['trips'], ['users'], ['dashboard']]) {
        void queryClient.invalidateQueries({ queryKey: key })
      }
    },
  })
}

export const useResolveReport = (id: Id) => useReportAction<{ resolution: string }>(id)
export const useArbitrateDispute = (id: Id) =>
  useReportAction<{ decision: DecisionLitige; resolution: string }>(id)
