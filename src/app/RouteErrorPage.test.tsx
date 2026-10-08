import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderAt } from '@/test/renderWithRouter'

vi.mock('@/features/kyc/pages/KycListPage', () => ({
  KycListPage: () => {
    throw new Error('plantage simulé')
  },
}))

describe('page Erreur inattendue', () => {
  it('remplace une page qui plante, sans perdre la navigation', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    renderAt('/admin/kyc', { asAdmin: true })

    expect(await screen.findByText('Une erreur inattendue est survenue')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Réessayer' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Retour au tableau de bord' })).toHaveAttribute(
      'href',
      '/admin',
    )
    // La sidebar reste affichée : l'erreur est contenue dans la zone de contenu.
    expect(screen.getByRole('complementary', { name: 'Navigation principale' })).toBeVisible()
    expect(screen.queryByText('plantage simulé')).not.toBeInTheDocument()
  })
})
