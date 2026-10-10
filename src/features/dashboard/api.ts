import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { DashboardStats, Periode } from './types'

export const dashboardKeys = {
  stats: (periode: Periode) => ['dashboard', 'stats', periode] as const,
}

export function useDashboardStats(periode: Periode) {
  return useQuery({
    queryKey: dashboardKeys.stats(periode),
    queryFn: async () => {
      const { data } = await api.get<DashboardStats>('/admin/tableau-de-bord/', { params: { periode } })
      return data
    },
    // Garde l'affichage précédent pendant le changement de période (pas de clignotement).
    placeholderData: keepPreviousData,
  })
}
