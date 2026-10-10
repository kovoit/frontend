import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { Id, Paginated } from '@/api/types'
import type {
  SuspendPayload,
  SuspendResponse,
  UserDetail,
  UserListFilters,
  UserListItem,
} from './types'

export const userKeys = {
  all: ['users'] as const,
  list: (filters: UserListFilters) => ['users', 'list', filters] as const,
  detail: (id: Id) => ['users', 'detail', id] as const,
}

export function useUserList(filters: UserListFilters) {
  return useQuery({
    queryKey: userKeys.list(filters),
    queryFn: async () => {
      const { data } = await api.get<Paginated<UserListItem>>('/admin/utilisateurs/', {
        params: {
          recherche: filters.recherche || undefined,
          statut: filters.statut || undefined,
          page: filters.page > 1 ? filters.page : undefined,
        },
      })
      return data
    },
    placeholderData: keepPreviousData,
  })
}

export function useUser(id: Id) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: async () => {
      const { data } = await api.get<UserDetail>(`/admin/utilisateurs/${id}/`)
      return data
    },
  })
}

function useInvalidateAfterAccountChange() {
  const queryClient = useQueryClient()
  return (user: UserDetail) => {
    queryClient.setQueryData(userKeys.detail(user.id), user)
    void queryClient.invalidateQueries({ queryKey: ['users', 'list'] })
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  }
}

export function useSuspendUser(id: Id) {
  const refresh = useInvalidateAfterAccountChange()
  return useMutation({
    mutationFn: async (payload: SuspendPayload) => {
      const { data } = await api.post<SuspendResponse>(`/admin/utilisateurs/${id}/suspendre/`, payload)
      return data
    },
    onSuccess: (data) => refresh(data.utilisateur),
  })
}

export function useReactivateUser(id: Id) {
  const refresh = useInvalidateAfterAccountChange()
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<UserDetail>(`/admin/utilisateurs/${id}/reactiver/`)
      return data
    },
    onSuccess: refresh,
  })
}
