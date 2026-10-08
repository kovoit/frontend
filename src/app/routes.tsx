import { Navigate, type RouteObject } from 'react-router'
import { env } from '@/config/env'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { RequireAuth } from '@/features/auth/RequireAuth'
import { BookingsListPage } from '@/features/bookings/pages/BookingsListPage'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'
import { KycListPage } from '@/features/kyc/pages/KycListPage'
import { ReportsListPage } from '@/features/reports/pages/ReportsListPage'
import { SettingsPage } from '@/features/settings/pages/SettingsPage'
import { TransactionsPage } from '@/features/transactions/pages/TransactionsPage'
import { TripsListPage } from '@/features/trips/pages/TripsListPage'
import { UsersListPage } from '@/features/users/pages/UsersListPage'
import { AdminLayout } from '@/layouts/AdminLayout'
import { AuthLayout } from '@/layouts/AuthLayout'
import { NotFoundPage } from './NotFoundPage'

// Les routes de détail (/:id) seront ajoutées avec chaque feature.
export const routes: RouteObject[] = [
  // Page d'accueil = connexion admin (redirige vers /admin si une session est active).
  {
    path: '/',
    element: <AuthLayout />,
    children: [{ index: true, element: <LoginPage /> }],
  },
  // Ancienne URL de connexion, conservée pour les liens existants.
  { path: '/auth/*', element: <Navigate to="/" replace /> },
  {
    path: '/admin',
    element: (
      <RequireAuth>
        <AdminLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'kyc', element: <KycListPage /> },
      { path: 'users', element: <UsersListPage /> },
      { path: 'trips', element: <TripsListPage /> },
      { path: 'bookings', element: <BookingsListPage /> },
      { path: 'reports', element: <ReportsListPage /> },
      ...(env.featureWallet ? [{ path: 'transactions', element: <TransactionsPage /> }] : []),
      { path: 'settings', element: <SettingsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]
