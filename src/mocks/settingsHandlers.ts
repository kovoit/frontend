import { http } from 'msw'
import { env } from '@/config/env'
import { userFromAuthHeader } from './db'
import { fail, notFound, ok, unauthorized } from './envelope'
import { db, MOCK_ADMIN } from './people'

const url = (path: string) => `${env.apiUrl}${path}`
const isAdmin = (request: Request) =>
  userFromAuthHeader(request.headers.get('Authorization'))?.is_staff === true

// Même validation que apps/parametres/services.py (type, puis minimum).
function erreurValeur(cle: string, valeur: unknown, type: string, minimum: number, unite: string) {
  if (typeof valeur !== 'number' || Number.isNaN(valeur)) return `« ${cle} » doit être un nombre.`
  if (type === 'entier' && !Number.isInteger(valeur))
    return `« ${cle} » doit être un nombre entier.`
  if (valeur < minimum)
    return `« ${cle} » doit valoir au moins ${minimum}${unite ? ` ${unite}` : ''}.`
  return null
}

export const settingsHandlers = [
  http.get(url('/admin/parametres/'), ({ request }) => {
    if (!isAdmin(request)) return unauthorized()
    return ok(db.parametres, { message: 'Paramètres récupérés.' })
  }),

  http.patch(url('/admin/parametres/:cle/'), async ({ request, params }) => {
    if (!isAdmin(request)) return unauthorized()
    const parametre = db.parametres.find((p) => p.cle === params.cle)
    if (!parametre) return notFound()
    const { valeur } = (await request.json().catch(() => ({}))) as { valeur?: unknown }
    const { type_valeur, minimum, unite } = parametre
    const erreur = erreurValeur(parametre.cle, valeur, type_valeur, minimum, unite)
    if (erreur) {
      return fail(400, erreur, 'VALEUR_PARAMETRE_INVALIDE', {
        valeur: [`Minimum : ${minimum}${unite ? ` ${unite}` : ''}.`],
      })
    }
    parametre.valeur = valeur as number
    parametre.modifie_le = new Date().toISOString()
    parametre.modifie_par = MOCK_ADMIN
    return ok(parametre, { message: 'Paramètre modifié.' })
  }),
]
