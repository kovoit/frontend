import { http } from 'msw'
import { env } from '@/config/env'
import { fail, invalid, ok } from './envelope'
import { PERIODES, type Periode } from '@/features/dashboard/types'
import { activityHandlers } from './activityHandlers'
import { adminHandlers } from './adminHandlers'
import { settingsHandlers } from './settingsHandlers'
import { buildMockStats } from './dashboard'
import { accessTokenFor, MOCK_ACCOUNTS, mockSession, toPublicUser, userFromAuthHeader } from './db'
import { db } from './people'

const url = (path: string) => `${env.apiUrl}${path}`

// Réponses simulées de l'API, enrichies à chaque phase (KYC, utilisateurs…).
export const handlers = [
  http.get(url('/health/'), () => ok({ status: 'ok' })),

  // Back-office : apps/accounts/api/admin_auth_views.py (refresh simulé par mockSession)
  http.post(url('/auth/admin/connexion/'), async ({ request }) => {
    const { email, mot_de_passe } = (await request.json()) as { email: string; mot_de_passe: string }
    const account = MOCK_ACCOUNTS.find(
      (candidate) =>
        candidate.email === email.trim().toLowerCase() && candidate.password === mot_de_passe,
    )
    if (!account) return fail(401, 'Email ou mot de passe incorrect.', 'IDENTIFIANTS_INVALIDES')
    if (!account.is_staff) {
      return fail(403, 'Accès réservé aux administrateurs Kovoit.', 'COMPTE_NON_ADMIN')
    }
    mockSession.start(account.id)
    return ok(
      { access: accessTokenFor(account.id), utilisateur: toPublicUser(account) },
      { message: 'Connexion réussie.' },
    )
  }),

  http.post(url('/auth/admin/jeton/rafraichir/'), () => {
    const userId = mockSession.userId()
    if (userId === null) {
      return fail(401, 'Session invalide ou expirée. Reconnectez-vous.', 'SESSION_EXPIREE')
    }
    return ok({ access: accessTokenFor(userId) }, { message: 'Jeton renouvelé.' })
  }),

  http.get(url('/auth/admin/moi/'), ({ request }) => {
    const account = userFromAuthHeader(request.headers.get('Authorization'))
    if (!account) return fail(401, 'Session invalide ou expirée. Reconnectez-vous.')
    if (!account.is_staff) return fail(403, "Vous n'avez pas la permission d'effectuer cette action.")
    return ok(toPublicUser(account))
  }),

  http.post(url('/auth/admin/deconnexion/'), () => {
    mockSession.end()
    return ok(null, { message: 'Déconnexion effectuée.' })
  }),

  http.get(url('/admin/tableau-de-bord/'), ({ request }) => {
    if (userFromAuthHeader(request.headers.get('Authorization'))?.is_staff !== true) {
      return fail(401, 'Non authentifié.')
    }
    const periode = new URL(request.url).searchParams.get('periode') ?? '30j'
    if (!(periode in PERIODES)) {
      return invalid({ periode: ['Période invalide.'] })
    }
    const stats = buildMockStats(periode as Periode)
    // Files de travail cohérentes avec les listes simulées (KYC, signalements, litiges).
    stats.a_traiter = {
      kyc_en_attente: db.dossiers.filter((d) => d.statut === 'en_attente').length,
      signalements_ouverts: db.signalements.filter((s) => s.statut === 'ouvert').length,
      litiges: db.reservations.filter((r) => r.statut === 'litige').length,
    }
    return ok(stats)
  }),

  ...adminHandlers,
  ...activityHandlers,
  ...settingsHandlers,
]
