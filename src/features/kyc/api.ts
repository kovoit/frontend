import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, getBlob } from '@/api/client'
import type { Id, Paginated } from '@/api/types'
import type { KycDossierDetail, KycDossierListItem, KycListFilters } from './types'

export const kycKeys = {
  all: ['kyc'] as const,
  list: (filters: KycListFilters) => ['kyc', 'list', filters] as const,
  detail: (id: Id) => ['kyc', 'detail', id] as const,
  piece: (pieceId: Id) => ['kyc', 'piece', pieceId] as const,
}

export function useKycList(filters: KycListFilters) {
  return useQuery({
    queryKey: kycKeys.list(filters),
    queryFn: async () => {
      const { data } = await api.get<Paginated<KycDossierListItem>>('/admin/kyc/', {
        params: {
          statut: filters.statut || undefined,
          type: filters.type || undefined,
          recherche: filters.recherche || undefined,
          page: filters.page > 1 ? filters.page : undefined,
        },
      })
      return data
    },
    placeholderData: keepPreviousData,
  })
}

export function useKycDossier(id: Id) {
  return useQuery({
    queryKey: kycKeys.detail(id),
    queryFn: async () => {
      const { data } = await api.get<KycDossierDetail>(`/admin/kyc/${id}/`)
      return data
    },
  })
}

/**
 * Fichier d'une pièce KYC, téléchargé uniquement quand l'admin choisit de l'afficher.
 * Jamais mis en cache (chaque téléchargement est journalisé côté API) ; le composant
 * l'affiche via une URL `blob:` locale qu'il révoque dès qu'il le masque.
 */
export function usePieceFile(pieceId: Id, enabled: boolean) {
  return useQuery({
    queryKey: kycKeys.piece(pieceId),
    queryFn: () => getBlob(`/admin/kyc/pieces/${pieceId}/fichier/`),
    enabled,
    gcTime: 0,
    staleTime: 0,
    retry: false,
  })
}

function useKycDecision<TPayload>(id: Id, action: 'valider' | 'rejeter') {
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

export const useValidateKyc = (id: Id) => useKycDecision<Record<string, never>>(id, 'valider')
export const useRejectKyc = (id: Id) => useKycDecision<{ motif: string }>(id, 'rejeter')
