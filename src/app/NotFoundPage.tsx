import { Link } from 'react-router'
import { Card } from '@/components/ui/Card'

export function NotFoundPage() {
  return (
    <div className="flex min-h-full items-center justify-center px-4">
      <Card className="max-w-md items-center gap-3 px-6 py-12 text-center">
        <p className="text-5xl font-extrabold text-accent-500">404</p>
        <h1 className="text-lg font-bold">Page introuvable</h1>
        <p className="text-sm text-muted">Cette page n'existe pas ou a été déplacée.</p>
        <Link
          to="/admin"
          className="mt-2 rounded-xl bg-brand-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Retour au tableau de bord
        </Link>
      </Card>
    </div>
  )
}
