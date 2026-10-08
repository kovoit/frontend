import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderAt } from '@/test/renderWithRouter'

describe('routing du back-office', () => {
  it('redirige un admin déjà connecté de la racine vers le tableau de bord', async () => {
    const router = renderAt('/', { asAdmin: true })
    expect(await screen.findByRole('heading', { level: 1, name: 'Tableau de bord' })).toBeVisible()
    expect(router.state.location.pathname).toBe('/admin')
  })

  it('affiche la connexion à la racine pour un visiteur non connecté', async () => {
    const router = renderAt('/')
    expect(await screen.findByRole('heading', { name: 'Espace administrateur' })).toBeVisible()
    expect(router.state.location.pathname).toBe('/')
  })

  it("redirige l'ancienne URL /auth/login vers la racine", async () => {
    const router = renderAt('/auth/login')
    expect(await screen.findByRole('heading', { name: 'Espace administrateur' })).toBeVisible()
    expect(router.state.location.pathname).toBe('/')
  })

  it('navigue via la sidebar et met à jour le titre', async () => {
    const router = renderAt('/admin', { asAdmin: true })
    const nav = await screen.findByRole('complementary', { name: 'Navigation principale' })
    await userEvent.click(within(nav).getByRole('link', { name: /Dossiers KYC/ }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Dossiers KYC' })).toBeVisible()
    expect(router.state.location.pathname).toBe('/admin/kyc')
  })

  it('garde le titre de section sur une sous-route', async () => {
    renderAt('/admin/users/42', { asAdmin: true })
    expect(await screen.findByRole('heading', { level: 1, name: 'Utilisateurs' })).toBeVisible()
  })

  it('affiche une 404 pour une route inconnue', async () => {
    renderAt('/nimporte-quoi')
    expect(await screen.findByText('Page introuvable')).toBeVisible()
  })

  it("n'expose pas l'écran Transactions quand l'option portefeuille est désactivée", async () => {
    renderAt('/admin', { asAdmin: true })
    await screen.findByRole('heading', { level: 1 })
    expect(screen.queryByRole('link', { name: /Transactions/ })).not.toBeInTheDocument()
  })
})
