/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  // Port fixe : c'est l'origine autorisée par le CORS du backend (CORS_ALLOWED_ORIGINS).
  // Si 5173 est déjà pris, Vite s'arrête avec une erreur au lieu de passer en silence sur 5174.
  server: { port: 5173, strictPort: true },
  build: {
    // ApexCharts (~950 ko) est un chunk chargé à la demande sur le tableau de bord uniquement ;
    // le bundle initial (~535 ko, ~170 ko gzip) reste sous ce seuil.
    chunkSizeWarningLimit: 1000,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
})
