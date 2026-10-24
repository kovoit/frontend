import { http } from 'msw'
import { env } from '@/config/env'
import { fail, invalid, ok } from './envelope'
import { PERIODES, type Periode } from '@/features/dashboard/types'
import { activityHandlers } from './activityHandlers'
import { adminHandlers } from './adminHandlers'
import { auditHandlers } from './auditHandlers'
import { settingsHandlers } from './settingsHandlers'
import { transactionHandlers } from './transactionHandlers'
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

  // Mot de passe oublié (apps/accounts/api/admin_mot_de_passe.py) : jeton de test « jeton-valide »
  http.post(url('/auth/admin/mot-de-passe/oublie/'), () =>
    ok(null, {
      message:
        "Si cette adresse correspond à un compte administrateur, un lien de réinitialisation vient d'y être envoyé.",
    }),
  ),

  http.post(url('/auth/admin/mot-de-passe/reinitialiser/'), async ({ request }) => {
    const { jeton, mot_de_passe } = (await request.json()) as { jeton: string; mot_de_passe: string }
    if (jeton !== 'jeton-valide') {
      return fail(
        400,
        "Ce lien n'est plus valable. Demandez un nouveau lien de réinitialisation.",
        'LIEN_INVALIDE',
      )
    }
    if (/^\d+$/.test(mot_de_passe)) {
      return fail(400, 'Mot de passe trop faible.', 'MOT_DE_PASSE_FAIBLE', {
        mot_de_passe: ['Ce mot de passe est entièrement numérique.'],
      })
    }
    return ok(null, { message: 'Mot de passe modifié.' })
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
  ...auditHandlers,
  ...transactionHandlers,
]
