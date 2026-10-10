import { describe, expect, it } from 'vitest'
import { formatDate, formatDateTime, formatFcfa, formatKm, formatNumber, shortId } from './format'

describe('format', () => {
  it('formate les montants en FCFA sans décimales', () => {
    expect(formatFcfa(18500)).toBe('18 500 FCFA')
    expect(formatFcfa(300)).toBe('300 FCFA')
    expect(formatFcfa(299.6)).toBe('300 FCFA')
  })

  it('formate les grands nombres avec séparateur d’espace', () => {
    expect(formatNumber(44000)).toBe('44 000')
  })

  it("affiche les dates à l'heure de Lomé (UTC+0)", () => {
    expect(formatDate('2026-10-08T07:30:00Z')).toBe('08 oct. 2026')
    expect(formatDateTime('2026-10-08T07:30:00Z')).toBe('08 oct. 2026 · 07:30')
  })

  it('affiche la distance, ou un tiret si le backend ne l’a pas calculée', () => {
    expect(formatKm(12.34)).toBe('12,3 km')
    expect(formatKm(null)).toBe('—')
  })

  it('raccourcit un UUID en référence lisible', () => {
    expect(shortId('3f2a9c1b-5d6e-4f70-8a9b-0c1d2e3f4a5b')).toBe('3F2A9C1B')
  })
})
