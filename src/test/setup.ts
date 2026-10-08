import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { tokenStore } from '@/api/tokenStore'
import { mockSession } from '@/mocks/db'
import { server } from '@/mocks/server'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  cleanup()
  server.resetHandlers()
  tokenStore.clear()
  mockSession.end()
})
afterAll(() => server.close())
