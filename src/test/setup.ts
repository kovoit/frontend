import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { createElement } from 'react'
import { afterAll, afterEach, beforeAll, vi } from 'vitest'
import { tokenStore } from '@/api/tokenStore'
import { mockSession } from '@/mocks/db'
import { server } from '@/mocks/server'

// ApexCharts mesure le SVG (indisponible dans jsdom) : remplacé par un marqueur testable.
vi.mock('react-apexcharts', () => ({
  default: ({ type, series }: { type: string; series: Array<{ name: string }> }) =>
    createElement('div', {
      'data-testid': `chart-${type}`,
      'data-series': series.map((s) => s.name).join('|'),
    }),
}))

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  cleanup()
  server.resetHandlers()
  tokenStore.clear()
  mockSession.end()
})
afterAll(() => server.close())
