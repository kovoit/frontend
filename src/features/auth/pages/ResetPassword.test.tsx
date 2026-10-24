import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderAt } from '@/test/renderWithRouter'

describe('mot de passe oublié', () => {
  it('depuis la connexion : demande un lien, même réponse que le compte existe ou non', async () => {
    renderAt('/')
    await userEvent.click(await screen.findByRole('link', { name: 'Mot de passe oublié ?' }))
    // Page chargée à la demande : attendre qu'elle remplace la connexion avant de saisir
    await screen.findByRole('heading', { name: 'Mot de passe oublié' })
    await userEvent.type(screen.getByLabelText('Email'), 'chef@kovoittg.com')
    await userEvent.click(screen.getByRole('button', { name: 'Recevoir le lien' }))

    expect(await screen.findByText(/Si cette adresse correspond/)).toBeVisible()
  })

  it('choisit un nouveau mot de passe avec le lien reçu', async () => {
    renderAt('/reinitialiser?uid=MQ&jeton=jeton-valide')
    await userEvent.type(await screen.findByLabelText('Nouveau mot de passe'), 'Kovoit-Lome-2026!')
    await userEvent.type(screen.getByLabelText('Confirmer le mot de passe'), 'Kovoit-Lome-2026!')
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))

    expect(await screen.findByText(/Mot de passe modifié/)).toBeVisible()
  })

  it('refuse deux mots de passe différents avant tout appel API', async () => {
    renderAt('/reinitialiser?uid=MQ&jeton=jeton-valide')
    await userEvent.type(await screen.findByLabelText('Nouveau mot de passe'), 'Kovoit-Lome-2026!')
    await userEvent.type(screen.getByLabelText('Confirmer le mot de passe'), 'Autre-chose-2026!')
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))

    expect(await screen.findByText('Les deux mots de passe sont différents.')).toBeVisible()
  })

  it('lien expiré : message et proposition d’un nouveau lien', async () => {
    renderAt('/reinitialiser?uid=MQ&jeton=expire')
    await userEvent.type(await screen.findByLabelText('Nouveau mot de passe'), 'Kovoit-Lome-2026!')
    await userEvent.type(screen.getByLabelText('Confirmer le mot de passe'), 'Kovoit-Lome-2026!')
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))

    expect(await screen.findByText(/n'est plus valable/)).toBeVisible()
    expect(screen.getByRole('link', { name: 'Demander un nouveau lien' })).toBeVisible()
  })

  it('lien incomplet : aucun formulaire', async () => {
    renderAt('/reinitialiser')
    expect(await screen.findByText(/Lien incomplet/)).toBeVisible()
    expect(screen.queryByLabelText('Nouveau mot de passe')).not.toBeInTheDocument()
  })
})
