import { render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { AppProviders } from '@/app/providers'
import { createQueryClient } from '@/app/queryClient'
import { routes } from '@/app/routes'
import { mockSession } from '@/mocks/db'

type RenderOptions = {
  /** Démarre une session admin simulée (cookie de refresh valide) avant le rendu. */
  asAdmin?: boolean
}

/** Rend l'application complète à une URL donnée. */
export function renderAt(path: string, { asAdmin = false }: RenderOptions = {}) {
  if (asAdmin) mockSession.start('1')
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(
    <AppProviders queryClient={createQueryClient({ retry: false })}>
      <RouterProvider router={router} />
    </AppProviders>,
  )
  return router
}
