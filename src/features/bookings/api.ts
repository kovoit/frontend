import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { Paginated } from '@/api/types'
import type { ReservationDetail, ReservationListFilters, ReservationListItem } from './types'

export const bookingKeys = {
  list: (filters: ReservationListFilters) => ['bookings', 'list', filters] as const,
  detail: (id: number) => ['bookings', 'detail', id] as const,
}

export function useBookingList(filters: ReservationListFilters) {
  return useQuery({
    queryKey: bookingKeys.list(filters),
    queryFn: async () => {
      const { data } = await api.get<Paginated<ReservationListItem>>('/admin/reservations/', {
        params: {
          statut: filters.statut || undefined,
          search: filters.search || undefined,
          page: filters.page > 1 ? filters.page : undefined,
        },
      })
      return data
    },
    placeholderData: keepPreviousData,
  })
}

export function useBooking(id: number) {
  return useQuery({
    queryKey: bookingKeys.detail(id),
    queryFn: async () => {
      const { data } = await api.get<ReservationDetail>(`/admin/reservations/${id}/`)
      return data
    },
  })
}
