import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { Paginated } from '@/api/types'
import type { TrajetDetail, TrajetListFilters, TrajetListItem } from './types'

export const tripKeys = {
  list: (filters: TrajetListFilters) => ['trips', 'list', filters] as const,
  detail: (id: number) => ['trips', 'detail', id] as const,
}

export function useTripList(filters: TrajetListFilters) {
  return useQuery({
    queryKey: tripKeys.list(filters),
    queryFn: async () => {
      const { data } = await api.get<Paginated<TrajetListItem>>('/admin/trajets/', {
        params: {
          statut: filters.statut || undefined,
          search: filters.search || undefined,
          date: filters.date || undefined,
          page: filters.page > 1 ? filters.page : undefined,
        },
      })
      return data
    },
    placeholderData: keepPreviousData,
  })
}

export function useTrip(id: number) {
  return useQuery({
    queryKey: tripKeys.detail(id),
    queryFn: async () => {
      const { data } = await api.get<TrajetDetail>(`/admin/trajets/${id}/`)
      return data
    },
  })
}
