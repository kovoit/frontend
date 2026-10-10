import type { Id } from '@/api/types'

// Contrat de l'API (backend : apps/accounts/api/admin_auth_views.py), préfixe /api/v1 :
//   POST /auth/admin/connexion/        { email, mot_de_passe } → { access, utilisateur }
//                                      + cookie httpOnly de refresh (jamais lisible en JS)
//                                      → 401 IDENTIFIANTS_INVALIDES · 403 COMPTE_NON_ADMIN · 429
//   POST /auth/admin/jeton/rafraichir/ (cookie) → { access } + nouveau cookie | 401 SESSION_EXPIREE
//   GET  /auth/admin/moi/              → AuthUser | 401 | 403
//   POST /auth/admin/deconnexion/      → révoque le refresh et supprime le cookie

/** Sous-ensemble de UtilisateurAdminSerializer utilisé par le back-office. */
export type AuthUser = {
  id: Id
  email: string
  nom: string
  prenom: string
  is_staff: boolean
}

/** Saisie du formulaire de connexion (convertie en { email, mot_de_passe } pour l'API). */
export type LoginPayload = {
  email: string
  password: string
}

export type LoginResponse = {
  access: string
  utilisateur: AuthUser
}
