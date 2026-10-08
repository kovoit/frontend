// Contrat attendu de l'API (à implémenter côté backend DRF) :
//   POST /auth/login/          { email, password } → 200 { access, user } + cookie httpOnly de refresh
//                              → 401 { detail } si identifiants invalides, 429 si trop de tentatives
//   POST /auth/token/refresh/  (cookie) → 200 { access } | 401
//   GET  /auth/me/             → 200 AuthUser | 401
//   POST /auth/logout/         → 204, invalide le cookie de refresh

export type UserRole = 'utilisateur' | 'admin'

export type AuthUser = {
  id: number
  email: string
  nom: string
  prenom: string
  role: UserRole
}

export type LoginPayload = {
  email: string
  password: string
}

export type LoginResponse = {
  access: string
  user: AuthUser
}
