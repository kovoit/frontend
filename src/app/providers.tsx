import { QueryClientProvider, type QueryClient } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { createQueryClient } from './queryClient'

type AppProvidersProps = {
  children: ReactNode
  /** Client injecté (tests) ; sinon un client par défaut est créé. */
  queryClient?: QueryClient
}

export function AppProviders({ children, queryClient: injected }: AppProvidersProps) {
  const [queryClient] = useState(() => injected ?? createQueryClient())
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  )
}
