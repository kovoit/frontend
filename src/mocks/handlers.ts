import { http, HttpResponse } from 'msw'
import { env } from '@/config/env'
import type { LoginPayload } from '@/features/auth/types'
import { PERIODES, type Periode } from '@/features/dashboard/types'
import { buildMockStats } from './dashboard'
import { accessTokenFor, MOCK_ACCOUNTS, mockSession, toPublicUser, userFromAuthHeader } from './db'

const url = (path: string) => `${env.apiUrl}${path}`

// Réponses simulées de l'API, enrichies à chaque phase (KYC, utilisateurs…).
export const handlers = [
  http.get(url('/health/'), () => HttpResponse.json({ status: 'ok' })),

  http.post(url('/auth/login/'), async ({ request }) => {
    const { email, password } = (await request.json()) as LoginPayload
    const account = MOCK_ACCOUNTS.find(
      (candidate) => candidate.email === email.toLowerCase() && candidate.password === password,
    )
    if (!account) {
      return HttpResponse.json({ detail: 'Email ou mot de passe incorrect.' }, { status: 401 })
    }
    mockSession.start(account.id)
    return HttpResponse.json({ access: accessTokenFor(account.id), user: toPublicUser(account) })
  }),

  http.post(url('/auth/token/refresh/'), () => {
    const userId = mockSession.userId()
    if (userId === null) {
      return HttpResponse.json({ detail: 'Session expirée.' }, { status: 401 })
    }
    return HttpResponse.json({ access: accessTokenFor(userId) })
  }),

  http.get(url('/auth/me/'), ({ request }) => {
    const account = userFromAuthHeader(request.headers.get('Authorization'))
    if (!account) return HttpResponse.json({ detail: 'Non authentifié.' }, { status: 401 })
    return HttpResponse.json(toPublicUser(account))
  }),

  http.post(url('/auth/logout/'), () => {
    mockSession.end()
    return new HttpResponse(null, { status: 204 })
  }),

  http.get(url('/admin/stats/'), ({ request }) => {
    if (userFromAuthHeader(request.headers.get('Authorization'))?.role !== 'admin') {
      return HttpResponse.json({ detail: 'Non authentifié.' }, { status: 401 })
    }
    const periode = new URL(request.url).searchParams.get('periode') ?? '30j'
    if (!(periode in PERIODES)) {
      return HttpResponse.json({ periode: ['Période invalide.'] }, { status: 400 })
    }
    return HttpResponse.json(buildMockStats(periode as Periode))
  }),
]
