import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router'
import { getSectionLabel } from '@/app/navigation'
import { Footer } from '@/components/layout/Footer'
import { Navbar } from '@/components/layout/Navbar'
import { Sidebar } from '@/components/layout/Sidebar'
import { Alert } from '@/components/ui/Alert'
import { env } from '@/config/env'

export function AdminLayout() {
  const { pathname } = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const title = getSectionLabel(pathname)

  useEffect(() => {
    document.title = `${title} · Kovoit Admin`
  }, [title])

  return (
    <div className="min-h-full">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="px-4 sm:px-6 xl:ml-[280px]">
        <Navbar title={title} onOpenSidenav={() => setSidebarOpen(true)} />
        {env.useMocks && (
          <Alert tone="warning" className="mb-4">
            Mode démo : toutes les données affichées sont simulées par MSW (VITE_USE_MOCKS=true),
            aucune ne vient du backend.
          </Alert>
        )}
        <main className="min-h-[80vh] pt-2">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  )
}
