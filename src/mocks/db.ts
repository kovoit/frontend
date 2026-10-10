import type { AuthUser } from '@/features/auth/types'

// Données fictives pour le mode mock (VITE_USE_MOCKS=true) et les tests.
type MockAccount = AuthUser & { password: string }

export const MOCK_ACCOUNTS: MockAccount[] = [
  {
    id: '1',
    email: 'admin@kovoit.tg',
    password: 'Admin123!',
    nom: 'Kovoit',
    prenom: 'Admin',
    is_staff: true,
  },
  {
    id: '2',
    email: 'conducteur@kovoit.tg',
    password: 'Passe123!',
    nom: 'Mensah',
    prenom: 'Kodjo',
    is_staff: false,
  },
]

export const toPublicUser = ({ id, email, nom, prenom, is_staff }: MockAccount): AuthUser => ({
  id,
  email,
  nom,
  prenom,
  is_staff,
})

// Simule le cookie httpOnly de refresh : conservé en sessionStorage pour survivre au rechargement.
const SESSION_KEY = 'kovoit-mock-session'

export const mockSession = {
  userId(): string | null {
    try {
      const value = sessionStorage.getItem(SESSION_KEY)
      return value || null
    } catch {
      return null
    }
  },
  start(userId: string) {
    try {
      sessionStorage.setItem(SESSION_KEY, userId)
    } catch {
      // stockage indisponible : session non persistée
    }
  },
  end() {
    try {
      sessionStorage.removeItem(SESSION_KEY)
    } catch {
      // rien à nettoyer
    }
  },
}

export const accessTokenFor = (userId: string) => `mock-access-${userId}`

export function userFromAuthHeader(header: string | null): MockAccount | undefined {
  const id = header?.replace('Bearer mock-access-', '')
  return MOCK_ACCOUNTS.find((account) => account.id === id)
}
