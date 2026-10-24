import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { mockSession } from '@/mocks/db'
import { renderAt } from '@/test/renderWithRouter'

describe('rôles du back-office', () => {
  it('un admin Finance ne voit que ses menus', async () => {
    mockSession.start('3')
    renderAt('/admin')
    expect(await screen.findByRole('link', { name: /Transactions/ })).toBeVisible()
    expect(screen.queryByRole('link', { name: /Dossiers KYC/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Audit et activités/ })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Paramètres/ })).toBeVisible()
  })

  it('accès direct à une page hors de son rôle : message, aucune donnée', async () => {
    mockSession.start('3')
    renderAt('/admin/kyc')
    expect(await screen.findByText(/Accès non autorisé/)).toBeVisible()
  })

  it('paramètres consultables sans bouton Modifier hors du rôle Paramètres', async () => {
    mockSession.start('3')
    renderAt('/admin/settings')
    expect(await screen.findByText('Prix du carburant (F CFA par litre).')).toBeVisible()
    expect(screen.queryByRole('button', { name: /^Modifier :/ })).not.toBeInTheDocument()
  })
})
