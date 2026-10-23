import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { Id, Paginated } from '@/api/types'
import type { TransactionAdmin, TransactionFilters } from './types'

export const transactionKeys = {
  list: (filters: TransactionFilters) => ['transactions', 'list', filters] as const,
}

export function useTransactionList(filters: TransactionFilters) {
  return useQuery({
    queryKey: transactionKeys.list(filters),
    queryFn: async () => {
      const { data } = await api.get<Paginated<TransactionAdmin>>('/admin/transactions/', {
        params: {
          type: filters.type || undefined,
          statut: filters.statut || undefined,
          moyen: filters.moyen || undefined,
          recherche: filters.recherche || undefined,
          page: filters.page > 1 ? filters.page : undefined,
        },
      })
      return data
    },
    placeholderData: keepPreviousData,
  })
}

function useRetraitAction<TPayload>(action: 'verser' | 'refuser') {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: TPayload & { id: Id }) => {
      const { data } = await api.post<TransactionAdmin>(
        `/admin/transactions/${id}/${action}/`,
        payload,
      )
      return data
    },
    onSuccess: () => {
      for (const key of [['transactions'], ['dashboard'], ['audit']]) {
        void queryClient.invalidateQueries({ queryKey: key })
      }
    },
  })
}

export const useVerserRetrait = () => useRetraitAction<{ reference: string }>('verser')
export const useRefuserRetrait = () => useRetraitAction<{ motif: string }>('refuser')
