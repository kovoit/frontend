import type { ApexOptions } from 'apexcharts'
import { lazy, Suspense } from 'react'
import { axisLabelStyle, baseChartOptions, seriesColors } from '@/components/charts/chartTheme'
import { ChartDataTable } from '@/components/charts/ChartDataTable'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { useIsDark } from '@/hooks/useIsDark'
import { formatDayShort, formatNumber } from '@/utils/format'
import type { DashboardStats } from '../types'

// ApexCharts est lourd : chargé à la demande, hors du bundle initial.
const Chart = lazy(() => import('react-apexcharts'))

type EvolutionChartProps = { evolution: DashboardStats['evolution'] }

// Deux séries de même unité (nombre par jour) sur un seul axe : trajets et passagers.
export function EvolutionChart({ evolution }: EvolutionChartProps) {
  const isDark = useIsDark()
  const base = baseChartOptions(isDark)
  const categories = evolution.map((point) => formatDayShort(point.date))

  const options: ApexOptions = {
    ...base,
    chart: { ...base.chart, id: 'evolution', type: 'line' },
    colors: seriesColors(isDark),
    stroke: { width: 2, curve: 'smooth' },
    markers: { size: 0, hover: { size: 6 }, strokeColors: isDark ? '#111C44' : '#FFFFFF', strokeWidth: 2 },
    xaxis: {
      ...base.xaxis,
      categories,
      tickAmount: Math.min(categories.length, 8),
      crosshairs: { show: true },
      tooltip: { enabled: false },
    },
    yaxis: {
      ...base.yaxis,
      min: 0,
      forceNiceScale: true,
      labels: { style: axisLabelStyle(isDark), formatter: (v: number) => formatNumber(v) },
    },
    tooltip: { ...base.tooltip, shared: true, intersect: false },
  }

  const series = [
    { name: 'Trajets terminés', data: evolution.map((point) => point.trajets) },
    { name: 'Passagers transportés', data: evolution.map((point) => point.passagers) },
  ]

  return (
    <Card className="p-5">
      <h2 className="text-lg font-bold">Activité quotidienne</h2>
      <p className="text-sm text-muted">Trajets terminés et passagers transportés par jour</p>
      <div className="mt-2 h-[300px]">
        <Suspense fallback={<Skeleton className="h-full w-full" />}>
          <Chart type="line" height={300} options={options} series={series} />
        </Suspense>
      </div>
      <ChartDataTable
        caption="Activité quotidienne : trajets terminés et passagers transportés"
        columns={['Jour', 'Trajets terminés', 'Passagers transportés']}
        rows={evolution.map((point, i) => [
          categories[i] ?? point.date,
          formatNumber(point.trajets),
          formatNumber(point.passagers),
        ])}
      />
    </Card>
  )
}
