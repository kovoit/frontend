import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { tokenStore } from '@/api/tokenStore'
import { env } from '@/config/env'
import { mockSession } from '@/mocks/db'
import { server } from '@/mocks/server'
import { renderAt } from '@/test/renderWithRouter'

async function fillAndSubmit(email: string, password: string) {
  const user = userEvent.setup()
  await user.type(await screen.findByLabelText('Email'), email)
  await user.type(screen.getByLabelText('Mot de passe'), password)
  await user.click(screen.getByRole('button', { name: 'Se connecter' }))
}

describe('connexion administrateur', () => {
  it('redirige un visiteur non connecté de /admin vers la connexion', async () => {
    const router = renderAt('/admin/kyc')
    expect(await screen.findByRole('heading', { name: 'Espace administrateur' })).toBeVisible()
    expect(router.state.location.pathname).toBe('/')
  })

  it('valide les champs avant tout appel API', async () => {
    renderAt('/')
    await userEvent.click(await screen.findByRole('button', { name: 'Se connecter' }))
    expect(await screen.findByText('Saisissez votre adresse email.')).toBeVisible()
    expect(screen.getByText('Saisissez votre mot de passe.')).toBeVisible()

    await userEvent.type(screen.getByLabelText('Email'), 'pas-un-email')
    await userEvent.click(screen.getByRole('button', { name: 'Se connecter' }))
    expect(await screen.findByText('Adresse email invalide.')).toBeVisible()
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true')
  })

  it('connecte un admin et le renvoie vers la page demandée', async () => {
    const router = renderAt('/admin/users')
    await fillAndSubmit('admin@kovoit.tg', 'Admin123!')
    expect(await screen.findByRole('heading', { level: 1, name: 'Utilisateurs' })).toBeVisible()
    expect(router.state.location.pathname).toBe('/admin/users')
    expect(tokenStore.get()).toBe('mock-access-1')
  })

  it('affiche une erreur pour des identifiants incorrects', async () => {
    renderAt('/')
    await fillAndSubmit('admin@kovoit.tg', 'mauvais')
    expect(await screen.findByRole('alert')).toHaveTextContent('Email ou mot de passe incorrect.')
    expect(tokenStore.get()).toBeNull()
  })

  it("refuse un compte valide qui n'est pas administrateur", async () => {
    renderAt('/')
    await fillAndSubmit('conducteur@kovoit.tg', 'Passe123!')
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Accès réservé aux administrateurs Kovoit.',
    )
    expect(tokenStore.get()).toBeNull()
    expect(mockSession.userId()).toBeNull()
  })

  it('affiche un message clair en cas de trop nombreuses tentatives', async () => {
    server.use(
      http.post(`${env.apiUrl}/auth/login/`, () => new HttpResponse(null, { status: 429 })),
    )
    renderAt('/')
    await fillAndSubmit('admin@kovoit.tg', 'Admin123!')
    expect(await screen.findByRole('alert')).toHaveTextContent('Trop de tentatives')
  })

  it('affiche ou masque le mot de passe', async () => {
    renderAt('/')
    const password = await screen.findByLabelText('Mot de passe')
    expect(password).toHaveAttribute('type', 'password')
    await userEvent.click(screen.getByRole('button', { name: 'Afficher le mot de passe' }))
    expect(password).toHaveAttribute('type', 'text')
  })

  it('restaure la session existante sans redemander la connexion', async () => {
    renderAt('/', { asAdmin: true })
    expect(await screen.findByRole('heading', { level: 1, name: 'Tableau de bord' })).toBeVisible()
  })

  it('déconnecte et revient à la page de connexion', async () => {
    const router = renderAt('/admin', { asAdmin: true })
    await userEvent.click(await screen.findByRole('button', { name: 'Se déconnecter' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
    expect(mockSession.userId()).toBeNull()
    expect(tokenStore.get()).toBeNull()
  })
})
