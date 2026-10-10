import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { Id, Paginated } from '@/api/types'
import type { TrajetDetail, TrajetListFilters, TrajetListItem } from './types'

export const tripKeys = {
  list: (filters: TrajetListFilters) => ['trips', 'list', filters] as const,
  detail: (id: Id) => ['trips', 'detail', id] as const,
}

export function useTripList(filters: TrajetListFilters) {
  return useQuery({
    queryKey: tripKeys.list(filters),
    queryFn: async () => {
      const { data } = await api.get<Paginated<TrajetListItem>>('/admin/trajets/', {
        params: {
          statut: filters.statut || undefined,
          recherche: filters.recherche || undefined,
          date: filters.date || undefined,
          page: filters.page > 1 ? filters.page : undefined,
        },
      })
      return data
    },
    placeholderData: keepPreviousData,
  })
}

export function useTrip(id: Id) {
  return useQuery({
    queryKey: tripKeys.detail(id),
    queryFn: async () => {
      const { data } = await api.get<TrajetDetail>(`/admin/trajets/${id}/`)
      return data
    },
  })
}
