import type { ApexOptions } from 'apexcharts'
import { lazy, Suspense } from 'react'
import { baseChartOptions, seriesColors } from '@/components/charts/chartTheme'
import { ChartDataTable } from '@/components/charts/ChartDataTable'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { RESERVATION_STATUS, type ReservationStatus } from '@/config/enums'
import { useIsDark } from '@/hooks/useIsDark'
import { formatNumber } from '@/utils/format'
import type { DashboardStats } from '../types'

const Chart = lazy(() => import('react-apexcharts'))

// Ordre du cycle de vie (PRD), pas un tri par valeur : la lecture suit le parcours d'une réservation.
const ORDER: ReservationStatus[] = [
  'demandee',
  'acceptee',
  'en_cours',
  'terminee',
  'cloturee',
  'refusee',
  'annulee',
  'absent',
  'litige',
]

type StatusChartProps = { parStatut: DashboardStats['reservations_par_statut'] }

// Une seule grandeur (nombre de réservations) : une seule teinte, barres horizontales.
export function StatusChart({ parStatut }: StatusChartProps) {
  const isDark = useIsDark()
  const base = baseChartOptions(isDark)
  const labels = ORDER.map((status) => RESERVATION_STATUS[status].label)
  const values = ORDER.map((status) => parStatut[status] ?? 0)

  const options: ApexOptions = {
    ...base,
    chart: { ...base.chart, id: 'statuts', type: 'bar' },
    colors: [seriesColors(isDark)[0]!],
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: '62%',
        borderRadius: 4,
        borderRadiusApplication: 'end',
      },
    },
    legend: { show: false },
    xaxis: {
      ...base.xaxis,
      categories: labels,
      labels: { ...base.xaxis?.labels, formatter: (v: string) => formatNumber(Number(v)) },
    },
    grid: { ...base.grid, yaxis: { lines: { show: false } }, xaxis: { lines: { show: true } } },
    tooltip: { ...base.tooltip, y: { formatter: (v: number) => formatNumber(v) } },
  }

  return (
    <Card className="p-5">
      <h2 className="text-lg font-bold">Réservations par statut</h2>
      <p className="text-sm text-muted">Réservations créées sur la période, statut actuel</p>
      <div className="mt-2 h-[300px]">
        <Suspense fallback={<Skeleton className="h-full w-full" />}>
          <Chart
            type="bar"
            height={300}
            options={options}
            series={[{ name: 'Réservations', data: values }]}
          />
        </Suspense>
      </div>
      <ChartDataTable
        caption="Réservations par statut"
        columns={['Statut', 'Réservations']}
        rows={labels.map((label, i) => [label, formatNumber(values[i] ?? 0)])}
      />
    </Card>
  )
}
