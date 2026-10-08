import { Navigate, type RouteObject } from 'react-router'
import { env } from '@/config/env'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { RequireAuth } from '@/features/auth/RequireAuth'
import { AdminLayout } from '@/layouts/AdminLayout'
import { AuthLayout } from '@/layouts/AuthLayout'
import { NotFoundPage } from './NotFoundPage'
import { RouteErrorPage } from './RouteErrorPage'

// Pages admin chargées à la demande (bundle initial léger : seule la connexion est incluse).
const adminPages: RouteObject[] = [
  {
    index: true,
    lazy: () =>
      import('@/features/dashboard/pages/DashboardPage').then((m) => ({ Component: m.DashboardPage })),
  },
  {
    path: 'kyc',
    lazy: () => import('@/features/kyc/pages/KycListPage').then((m) => ({ Component: m.KycListPage })),
  },
  {
    path: 'kyc/:id',
    lazy: () =>
      import('@/features/kyc/pages/KycDetailPage').then((m) => ({ Component: m.KycDetailPage })),
  },
  {
    path: 'users',
    lazy: () =>
      import('@/features/users/pages/UsersListPage').then((m) => ({ Component: m.UsersListPage })),
  },
  {
    path: 'users/:id',
    lazy: () =>
      import('@/features/users/pages/UserDetailPage').then((m) => ({ Component: m.UserDetailPage })),
  },
  {
    path: 'trips',
    lazy: () =>
      import('@/features/trips/pages/TripsListPage').then((m) => ({ Component: m.TripsListPage })),
  },
  {
    path: 'trips/:id',
    lazy: () =>
      import('@/features/trips/pages/TripDetailPage').then((m) => ({ Component: m.TripDetailPage })),
  },
  {
    path: 'bookings',
    lazy: () =>
      import('@/features/bookings/pages/BookingsListPage').then((m) => ({
        Component: m.BookingsListPage,
      })),
  },
  {
    path: 'bookings/:id',
    lazy: () =>
      import('@/features/bookings/pages/BookingDetailPage').then((m) => ({
        Component: m.BookingDetailPage,
      })),
  },
  {
    path: 'reports',
    lazy: () =>
      import('@/features/reports/pages/ReportsListPage').then((m) => ({
        Component: m.ReportsListPage,
      })),
  },
  {
    path: 'reports/:id',
    lazy: () =>
      import('@/features/reports/pages/ReportDetailPage').then((m) => ({
        Component: m.ReportDetailPage,
      })),
  },
  ...(env.featureWallet
    ? [
        {
          path: 'transactions',
          lazy: () =>
            import('@/features/transactions/pages/TransactionsPage').then((m) => ({
              Component: m.TransactionsPage,
            })),
        },
      ]
    : []),
  {
    path: 'settings',
    lazy: () =>
      import('@/features/settings/pages/SettingsPage').then((m) => ({ Component: m.SettingsPage })),
  },
  { path: '*', element: <NotFoundPage /> },
]

// Les routes de détail (/:id) seront ajoutées avec chaque feature.
export const routes: RouteObject[] = [
  // Page d'accueil = connexion admin (redirige vers /admin si une session est active).
  {
    path: '/',
    element: <AuthLayout />,
    errorElement: <RouteErrorPage />,
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
    errorElement: <RouteErrorPage />,
    // Route sans chemin : une erreur dans une page s'affiche dans le layout (sidebar conservée).
    children: [{ errorElement: <RouteErrorPage />, children: adminPages }],
  },
  { path: '*', element: <NotFoundPage /> },
]
