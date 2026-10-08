import { Outlet } from 'react-router'
import { Logo } from '@/components/layout/Logo'

export function AuthLayout() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-10">
      <Logo className="mb-8" />
      <div className="w-full max-w-md">
        <Outlet />
      </div>
    </div>
  )
}
