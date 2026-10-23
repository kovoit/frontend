export const env = {
  apiUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1',
  // MSW (données simulées) : serveur de dev uniquement, jamais dans un build de production.
  useMocks: import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS === 'true',
} as const
