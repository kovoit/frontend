import { createContext, useContext } from 'react'
import type { AuthUser, LoginPayload } from './types'

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous'

export type AuthContextValue = {
  status: AuthStatus
  user: AuthUser | null
  login: (payload: LoginPayload) => Promise<AuthUser>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

/** Erreur levée quand un compte valide n'a pas le rôle administrateur. */
export class NotAdminError extends Error {
  constructor() {
    super('Accès réservé aux administrateurs Kovoit.')
    this.name = 'NotAdminError'
  }
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth doit être utilisé dans <AuthProvider>.')
  return value
}
