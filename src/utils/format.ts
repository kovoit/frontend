const TIMEZONE = 'Africa/Lome'

const fcfa = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 })
const integer = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 })

// Intl insère des espaces insécables (U+202F / U+00A0) : on les normalise en espace simple.
const normalizeSpaces = (value: string) => value.replace(/[\u202F\u00A0]/g, ' ')

/** 18500 → "18 500 FCFA" */
export function formatFcfa(amount: number): string {
  return `${normalizeSpaces(fcfa.format(amount))} FCFA`
}

/** 4400 → "4 400" */
export function formatNumber(value: number): string {
  return normalizeSpaces(integer.format(value))
}

/** ISO → "08 oct. 2026" (heure de Lomé) */
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: TIMEZONE,
  }).format(new Date(iso))
}

/** Jour ISO "2026-10-08" → "08 oct." (axes de graphiques) */
export function formatDayShort(isoDay: string): string {
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', timeZone: TIMEZONE })
    .format(new Date(`${isoDay}T12:00:00Z`))
}

/** ISO → "08 oct. 2026 · 07:30" (heure de Lomé) */
export function formatDateTime(iso: string): string {
  const time = new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TIMEZONE,
  }).format(new Date(iso))
  return `${formatDate(iso)} · ${time}`
}
