import { MdChevronRight } from 'react-icons/md'
import { Link } from 'react-router'
import type { Column } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDateTime, formatFcfa, shortId } from '@/utils/format'
import type { ReservationListItem } from '../types'

const linkClass =
  'inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-brand-700 hover:bg-brand-50 dark:text-brand-200 dark:hover:bg-white/10'

const personCell = (person: ReservationListItem['passager']) => (
  <Link to={`/admin/users/${person.id}`} className="font-semibold hover:underline">
    {person.prenom} {person.nom}
  </Link>
)

export const bookingIdColumn: Column<ReservationListItem> = {
  id: 'id',
  header: 'N°',
  cell: (res) => <span className="font-semibold tabular-nums">#{shortId(res.id)}</span>,
}

export const bookingPassengerColumn: Column<ReservationListItem> = {
  id: 'passager',
  header: 'Passager',
  cell: (res) => personCell(res.passager),
}

export const bookingDriverColumn: Column<ReservationListItem> = {
  id: 'conducteur',
  header: 'Conducteur',
  cell: (res) => personCell(res.conducteur),
}

export const bookingRouteColumn: Column<ReservationListItem> = {
  id: 'parcours',
  header: 'Parcours du passager',
  cell: (res) => (
    <span className="block max-w-[260px] text-sm">
      {res.point_libelle} <span className="text-muted">→</span> {res.arrivee_libelle}
    </span>
  ),
}

export const bookingDepartureColumn: Column<ReservationListItem> = {
  id: 'depart',
  header: 'Départ',
  cell: (res) => formatDateTime(res.depart_le),
  className: 'whitespace-nowrap',
}

export const bookingPriceColumn: Column<ReservationListItem> = {
  id: 'prix',
  header: 'Prix',
  cell: (res) => formatFcfa(res.prix),
  className: 'whitespace-nowrap text-right tabular-nums',
}

export const bookingStatusColumn: Column<ReservationListItem> = {
  id: 'statut',
  header: 'Statut',
  cell: (res) => <StatusBadge domain="reservation" value={res.statut} />,
}

export const bookingActionColumn: Column<ReservationListItem> = {
  id: 'action',
  header: 'Action',
  className: 'text-right',
  cell: (res) => (
    <Link to={`/admin/bookings/${res.id}`} className={linkClass} aria-label={`Voir la réservation ${res.id}`}>
      Voir
      <MdChevronRight aria-hidden className="h-4 w-4" />
    </Link>
  ),
}
