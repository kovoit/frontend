import type { ApexOptions } from 'apexcharts'
import { colors } from '@/theme/tokens'

/** Couleurs des séries, dans l'ordre fixe validé (jamais recyclées). */
export function seriesColors(isDark: boolean): string[] {
  return isDark ? [colors.chart['dark-1'], colors.chart['dark-2']] : [colors.chart[1], colors.chart[2]]
}

/** Style des libellés d'axes : couleur de texte secondaire. */
export function axisLabelStyle(isDark: boolean) {
  return { colors: isDark ? '#A3AED0' : colors.muted, fontSize: '12px' }
}

/** Options communes : grille et axes discrets, textes en couleurs de texte (jamais celle des séries). */
export function baseChartOptions(isDark: boolean): ApexOptions {
  const ink = axisLabelStyle(isDark).colors
  return {
    chart: {
      fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
      toolbar: { show: false },
      zoom: { enabled: false },
      background: 'transparent',
      animations: { enabled: false },
      foreColor: ink,
    },
    theme: { mode: isDark ? 'dark' : 'light' },
    grid: {
      borderColor: isDark ? 'rgba(255,255,255,0.08)' : colors.line,
      strokeDashArray: 4,
      padding: { left: 8, right: 8 },
    },
    dataLabels: { enabled: false },
    legend: {
      position: 'top',
      horizontalAlign: 'left',
      fontSize: '13px',
      labels: { colors: isDark ? '#FFFFFF' : colors.brand[900] },
      markers: { size: 6, shape: 'circle' },
      itemMargin: { horizontal: 12 },
    },
    tooltip: { theme: isDark ? 'dark' : 'light' },
    xaxis: {
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: ink, fontSize: '12px' } },
    },
    yaxis: { labels: { style: { colors: ink, fontSize: '12px' } } },
  }
}
