import { QueryClient } from '@tanstack/react-query'

type QueryClientOptions = {
  /** false = aucune nouvelle tentative (tests) */
  retry?: boolean
}

export function createQueryClient({ retry = true }: QueryClientOptions = {}) {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: (failureCount, error) => {
          if (!retry) return false
          const status = (error as { response?: { status?: number } }).response?.status
          // Pas de nouvelle tentative sur les erreurs client (401, 403, 404…).
          if (status && status >= 400 && status < 500) return false
          return failureCount < 2
        },
        refetchOnWindowFocus: false,
      },
    },
  })
}
