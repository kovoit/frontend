export const env = {
  apiUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api',
  useMocks: import.meta.env.VITE_USE_MOCKS === 'true',
  featureWallet: import.meta.env.VITE_FEATURE_WALLET === 'true',
} as const
