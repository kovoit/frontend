import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { refreshAccessToken } from '@/api/client'
import { tokenStore } from '@/api/tokenStore'
import { fetchMe, loginRequest, logoutRequest } from './api'
import { AuthContext, NotAdminError, type AuthContextValue, type AuthStatus } from './authContext'
import type { AuthUser, LoginPayload } from './types'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<AuthUser | null>(null)
  const restoreStarted = useRef(false)

  const reset = useCallback(() => {
    tokenStore.clear()
    setUser(null)
    setStatus('anonymous')
  }, [])

  // Au chargement : tentative de reprise de session via le cookie de refresh.
  useEffect(() => {
    if (restoreStarted.current) return
    restoreStarted.current = true
    ;(async () => {
      const token = await refreshAccessToken()
      if (!token) return reset()
      try {
        const me = await fetchMe()
        if (me.role !== 'admin') return reset()
        setUser(me)
        setStatus('authenticated')
      } catch {
        reset()
      }
    })()
  }, [reset])

  // Session expirée (refresh refusé par l'API) : retour à l'état anonyme.
  useEffect(
    () =>
      tokenStore.subscribe((token) => {
        if (token === null) {
          setUser(null)
          setStatus('anonymous')
        }
      }),
    [],
  )

  const login = useCallback(async (payload: LoginPayload) => {
    const { access, user: loggedUser } = await loginRequest(payload)
    if (loggedUser.role !== 'admin') {
      // Compte valide mais non admin : on ferme immédiatement la session ouverte côté serveur.
      tokenStore.set(access)
      await logoutRequest().catch(() => undefined)
      tokenStore.clear()
      throw new NotAdminError()
    }
    tokenStore.set(access)
    setUser(loggedUser)
    setStatus('authenticated')
    return loggedUser
  }, [])

  const logout = useCallback(async () => {
    await logoutRequest().catch(() => undefined)
    reset()
  }, [reset])

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, login, logout }),
    [status, user, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
