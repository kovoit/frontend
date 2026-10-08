import { MdArrowBack } from 'react-icons/md'
import { Link } from 'react-router'

export function BackLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="inline-flex w-fit items-center gap-1.5 rounded-lg text-sm font-semibold text-muted hover:text-brand-900 dark:hover:text-white"
    >
      <MdArrowBack aria-hidden className="h-4 w-4" />
      {label}
    </Link>
  )
}
