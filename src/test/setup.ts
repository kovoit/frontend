import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { createElement } from 'react'
import { afterAll, afterEach, beforeAll, vi } from 'vitest'
import { tokenStore } from '@/api/tokenStore'
import { mockSession } from '@/mocks/db'
import { resetMockDb } from '@/mocks/people'
import { server } from '@/mocks/server'

// ApexCharts mesure le SVG (indisponible dans jsdom) : remplacé par un marqueur testable.
vi.mock('react-apexcharts', () => ({
  default: ({ type, series }: { type: string; series: Array<{ name: string }> }) =>
    createElement('div', {
      'data-testid': `chart-${type}`,
      'data-series': series.map((s) => s.name).join('|'),
    }),
}))

// Leaflet a besoin d'un vrai moteur de rendu : la carte est remplacée par un marqueur testable.
vi.mock('react-leaflet', () => ({
  MapContainer: () => createElement('div', { 'data-testid': 'route-map' }),
  TileLayer: () => null,
  Polyline: () => null,
  CircleMarker: () => null,
  Tooltip: () => null,
}))
vi.mock('leaflet/dist/leaflet.css', () => ({}))

// jsdom n'implémente pas les URL blob: (visionneuse des pièces KYC).
let blobCounter = 0
URL.createObjectURL = () => `blob:test/${++blobCounter}`
URL.revokeObjectURL = () => undefined

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  cleanup()
  server.resetHandlers()
  tokenStore.clear()
  mockSession.end()
  resetMockDb()
})
afterAll(() => server.close())
