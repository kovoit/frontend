import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { Parametre } from './types'

export const settingsKeys = {
  all: ['parametres'] as const,
}

export function useParametres() {
  return useQuery({
    queryKey: settingsKeys.all,
    queryFn: async () => {
      const { data } = await api.get<Parametre[]>('/admin/parametres/')
      return data
    },
  })
}

export function useUpdateParametre(cle: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (valeur: number) => {
      const { data } = await api.patch<Parametre>(`/admin/parametres/${cle}/`, { valeur })
      return data
    },
    onSuccess: (parametre) => {
      queryClient.setQueryData<Parametre[]>(settingsKeys.all, (liste) =>
        liste?.map((p) => (p.cle === parametre.cle ? parametre : p)),
      )
      // Prix, délais et seuils influencent les indicateurs et les fiches (fiabilité…)
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      void queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}
