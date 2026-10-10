import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http } from 'msw'
import { describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { fail } from '@/mocks/envelope'
import { db } from '@/mocks/people'
import { server } from '@/mocks/server'
import { renderAt } from '@/test/renderWithRouter'

const SUSPENSION = "Durée d'une suspension automatique (jours)."

async function ouvrirEdition(description: string) {
  await userEvent.click(await screen.findByRole('button', { name: `Modifier : ${description}` }))
  return screen.getByRole('dialog', { name: 'Modifier le paramètre' })
}

describe('paramètres', () => {
  it('regroupe les paramètres par thème avec leur unité', async () => {
    renderAt('/admin/settings', { asAdmin: true })

    const correspondance = await screen.findByRole('list', { name: 'Correspondance des trajets' })
    const rayon = within(correspondance)
      .getByText(/point de prise en charge/)
      .closest('li')!
    expect(rayon).toHaveTextContent('1,5 km')
    expect(rayon).toHaveTextContent('rayon_depart_km')

    const prix = screen.getByRole('list', { name: 'Prix et portefeuille' })
    expect(within(prix).getAllByRole('listitem')).toHaveLength(4)
    expect(
      within(prix).getByText('Prix temporaire par passager (F CFA).').closest('li'),
    ).toHaveTextContent('300 FCFA')
  })

  it('modifie une valeur et affiche qui l’a changée', async () => {
    renderAt('/admin/settings', { asAdmin: true })
    const dialog = await ouvrirEdition(SUSPENSION)
    expect(dialog).toHaveTextContent('Valeur actuelle : 7 jours')

    const champ = within(dialog).getByLabelText('Nouvelle valeur (jours)')
    await userEvent.clear(champ)
    await userEvent.type(champ, '14')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Enregistrer' }))

    expect(await screen.findByText(`${SUSPENSION} Nouvelle valeur : 14 jours.`)).toBeVisible()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    const ligne = screen.getByText(SUSPENSION).closest('li')!
    expect(ligne).toHaveTextContent('14 jours')
    expect(ligne).toHaveTextContent('par Admin Kovoit')
    expect(db.parametres.find((p) => p.cle === 'duree_suspension_j')!.valeur).toBe(14)
  })

  it('refuse 0 quand le minimum est 1, sans appeler l’API', async () => {
    renderAt('/admin/settings', { asAdmin: true })
    const dialog = await ouvrirEdition(SUSPENSION)

    const champ = within(dialog).getByLabelText('Nouvelle valeur (jours)')
    await userEvent.clear(champ)
    await userEvent.type(champ, '0')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Enregistrer' }))

    expect(await within(dialog).findByText('Minimum : 1 jours.')).toBeVisible()
    expect(db.parametres.find((p) => p.cle === 'duree_suspension_j')!.valeur).toBe(7)
  })

  it('exige un entier pour un paramètre entier', async () => {
    renderAt('/admin/settings', { asAdmin: true })
    const dialog = await ouvrirEdition('Essais max de saisie du code de départ.')

    const champ = within(dialog).getByLabelText('Nouvelle valeur (essais)')
    await userEvent.clear(champ)
    await userEvent.type(champ, '2.5')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Enregistrer' }))

    expect(await within(dialog).findByText('Saisissez un nombre entier.')).toBeVisible()
  })

  it('affiche sous le champ le refus renvoyé par le backend', async () => {
    server.use(
      http.patch(`${env.apiUrl}/admin/parametres/:cle/`, () =>
        fail(400, 'Valeur refusée.', 'VALEUR_PARAMETRE_INVALIDE', {
          valeur: ['Minimum : 0,1 km.'],
        }),
      ),
    )
    renderAt('/admin/settings', { asAdmin: true })
    const dialog = await ouvrirEdition(
      'Distance max départ passager / point de prise en charge (km).',
    )

    await userEvent.click(within(dialog).getByRole('button', { name: 'Enregistrer' }))

    expect(await within(dialog).findByText('Minimum : 0,1 km.')).toBeVisible()
  })
})
