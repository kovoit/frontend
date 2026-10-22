import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/app/App'
import { env } from '@/config/env'
import './index.css'

async function enableMocks() {
  // import.meta.env.DEV est remplacé par false au build : MSW est retiré du bundle de production.
  if (!import.meta.env.DEV || !env.useMocks) return
  const { worker } = await import('@/mocks/browser')
  await worker.start({ onUnhandledRequest: 'bypass' })
}

enableMocks().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
