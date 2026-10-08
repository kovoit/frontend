import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { Paginated } from '@/api/types'
import type { KycDossierDetail, KycDossierListItem, KycListFilters, PieceUrl } from './types'

export const kycKeys = {
  all: ['kyc'] as const,
  list: (filters: KycListFilters) => ['kyc', 'list', filters] as const,
  detail: (id: number) => ['kyc', 'detail', id] as const,
  piece: (pieceId: number) => ['kyc', 'piece', pieceId] as const,
}

export function useKycList(filters: KycListFilters) {
  return useQuery({
    queryKey: kycKeys.list(filters),
    queryFn: async () => {
      const { data } = await api.get<Paginated<KycDossierListItem>>('/admin/kyc/', {
        params: {
          statut: filters.statut || undefined,
          type: filters.type || undefined,
          search: filters.search || undefined,
          page: filters.page > 1 ? filters.page : undefined,
        },
      })
      return data
    },
    placeholderData: keepPreviousData,
  })
}

export function useKycDossier(id: number) {
  return useQuery({
    queryKey: kycKeys.detail(id),
    queryFn: async () => {
      const { data } = await api.get<KycDossierDetail>(`/admin/kyc/${id}/`)
      return data
    },
  })
}

/**
 * URL signée d'une pièce KYC, demandée uniquement quand l'admin choisit de l'afficher.
 * Jamais mise en cache (chaque consultation est journalisée côté API).
 */
export function usePieceUrl(pieceId: number, enabled: boolean) {
  return useQuery({
    queryKey: kycKeys.piece(pieceId),
    queryFn: async () => {
      const { data } = await api.get<PieceUrl>(`/admin/kyc/pieces/${pieceId}/url/`)
      return data
    },
    enabled,
    gcTime: 0,
    staleTime: 0,
    retry: false,
  })
}

function useKycDecision<TPayload>(id: number, action: 'valider' | 'rejeter') {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: TPayload) => {
      const { data } = await api.post<KycDossierDetail>(`/admin/kyc/${id}/${action}/`, payload)
      return data
    },
    onSuccess: (dossier) => {
      queryClient.setQueryData(kycKeys.detail(id), dossier)
      // Files de travail, fiches utilisateur et compteurs du tableau de bord sont impactés.
      void queryClient.invalidateQueries({ queryKey: ['kyc', 'list'] })
      void queryClient.invalidateQueries({ queryKey: ['users'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export const useValidateKyc = (id: number) => useKycDecision<Record<string, never>>(id, 'valider')
export const useRejectKyc = (id: number) => useKycDecision<{ motif_rejet: string }>(id, 'rejeter')
