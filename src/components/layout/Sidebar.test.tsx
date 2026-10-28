import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http } from 'msw'
import { describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { mockSession } from '@/mocks/db'
import { ok } from '@/mocks/envelope'
import { db } from '@/mocks/people'
import { server } from '@/mocks/server'
import { renderAt } from '@/test/renderWithRouter'

const COMPTEUR_URL = `${env.apiUrl}/admin/signalements/compteur/`
const reportsLink = () => screen.findByRole('link', { name: /^Signalements & litiges/ })

/** Compteur simulé qui enregistre ses appels. */
function stubCompteur(count: () => number) {
  const calls = { value: 0 }
  server.use(
    http.get(COMPTEUR_URL, () => {
      calls.value += 1
      return ok({ signalements_ouverts: count() }, { message: 'Compteur récupéré.' })
    }),
  )
  return calls
}

describe('badge « signalements ouverts » du menu', () => {
  it("affiche 2 pour un modérateur quand l'API renvoie 2", async () => {
    stubCompteur(() => 2)
    renderAt('/admin', { asAdmin: true })

    const link = await reportsLink()
    expect(await within(link).findByText('2')).toBeVisible()
    expect(link).toHaveAccessibleName(/^Signalements & litiges ?\(2 signalements ouverts\)$/)
  })

  it('ne s’affiche pas quand le nombre vaut 0', async () => {
    const calls = stubCompteur(() => 0)
    renderAt('/admin', { asAdmin: true })

    const link = await reportsLink()
    await waitFor(() => expect(calls.value).toBe(1))
    expect(link).toHaveAccessibleName('Signalements & litiges')
    expect(within(link).queryByText('0')).not.toBeInTheDocument()
  })

  it("n'apparaît pas pour un admin finance, et la route n'est pas appelée", async () => {
    const calls = stubCompteur(() => 2)
    mockSession.start('3') // rôle finance seul
    renderAt('/admin')

    expect(await screen.findByRole('link', { name: /Retraits à verser/ })).toBeVisible()
    expect(screen.queryByRole('link', { name: /Signalements & litiges/ })).not.toBeInTheDocument()
    expect(screen.queryByText(/signalements? ouverts?\)/)).not.toBeInTheDocument()
    expect(calls.value).toBe(0)
  })

  it('relit le compteur après une décision de litige : le badge baisse aussitôt', async () => {
    const ouverts = () => db.signalements.filter((s) => s.statut === 'ouvert').length
    const avant = ouverts()
    const calls = stubCompteur(ouverts)
    const report = db.signalements.find(
      (s) =>
        s.statut === 'ouvert' &&
        db.reservations.find((r) => r.id === s.reservation_id)!.statut === 'litige',
    )!
    renderAt(`/admin/reports/${report.id}`, { asAdmin: true })

    const link = await reportsLink()
    expect(await within(link).findByText(String(avant))).toBeVisible()
    expect(calls.value).toBe(1)

    await userEvent.click(await screen.findByRole('button', { name: 'Trancher le litige' }))
    const dialog = screen.getByRole('dialog', { name: 'Trancher le litige' })
    await userEvent.click(within(dialog).getByRole('radio', { name: /En faveur du conducteur/ }))
    await userEvent.type(
      within(dialog).getByLabelText('Justification'),
      'Trajet effectué, confirmé par le GPS.',
    )
    await userEvent.click(within(dialog).getByRole('button', { name: 'Confirmer la décision' }))

    await waitFor(() => expect(calls.value).toBe(2))
    expect(await within(link).findByText(String(avant - 1))).toBeVisible()
  })
})
