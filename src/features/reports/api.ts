import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { Paginated } from '@/api/types'
import type {
  DecisionLitige,
  SignalementDetail,
  SignalementListFilters,
  SignalementListItem,
} from './types'

export const reportKeys = {
  list: (filters: SignalementListFilters) => ['reports', 'list', filters] as const,
  detail: (id: number) => ['reports', 'detail', id] as const,
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

export function useReport(id: number) {
  return useQuery({
    queryKey: reportKeys.detail(id),
    queryFn: async () => {
      const { data } = await api.get<SignalementDetail>(`/admin/signalements/${id}/`)
      return data
    },
  })
}

function useReportAction<TPayload>(id: number, action: 'traiter' | 'trancher') {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: TPayload) => {
      const { data } = await api.post<SignalementDetail>(
        `/admin/signalements/${id}/${action}/`,
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

export const useResolveReport = (id: number) => useReportAction<{ resolution: string }>(id, 'traiter')
export const useArbitrateDispute = (id: number) =>
  useReportAction<{ decision: DecisionLitige; resolution: string }>(id, 'trancher')
