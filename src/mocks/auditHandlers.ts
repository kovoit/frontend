import { http } from 'msw'
import { env } from '@/config/env'
import type { AuditStats } from '@/features/audit/types'
import { userFromAuthHeader } from './db'
import { ok, unauthorized } from './envelope'

const url = (path: string) => `${env.apiUrl}${path}`
const isAdmin = (request: Request) =>
  userFromAuthHeader(request.headers.get('Authorization'))?.is_staff === true

// Journal d'audit simulé VIDE : les événements ne peuvent être produits que par le serveur
// réel (actions mobiles et web). Les tests fournissent leurs propres événements (server.use).
const STATS_VIDES: Omit<AuditStats, 'debut' | 'fin'> = {
  total: 0,
  metier_succes: 0,
  metier_refus: 0,
  securite: 0,
  securite_refus: 0,
  technique: 0,
  admin: 0,
  utilisateurs_actifs: 0,
  derniere_activite: null,
}

export const auditHandlers = [
  http.get(url('/admin/audit/evenements/'), ({ request }) =>
    isAdmin(request) ? ok({ count: 0, next: null, previous: null, results: [] }) : unauthorized(),
  ),
  http.get(url('/admin/audit/flux/'), ({ request }) =>
    isAdmin(request)
      ? ok({ evenements: [], tronque: false, serveur_le: new Date().toISOString() })
      : unauthorized(),
  ),
  http.get(url('/admin/audit/statistiques/'), ({ request }) => {
    if (!isAdmin(request)) return unauthorized()
    const fin = new Date().toISOString()
    return ok({ ...STATS_VIDES, debut: fin, fin })
  }),
]
