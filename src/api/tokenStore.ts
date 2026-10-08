// Access token JWT gardé en mémoire uniquement (jamais localStorage, cf. CLAUDE.md §7).
// Le refresh token est un cookie httpOnly géré par le backend.

type Listener = (token: string | null) => void

let accessToken: string | null = null
const listeners = new Set<Listener>()

export const tokenStore = {
  get: () => accessToken,
  set(token: string | null) {
    accessToken = token
    listeners.forEach((listener) => listener(token))
  },
  clear() {
    tokenStore.set(null)
  },
  subscribe(listener: Listener) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
}
