import { formatDecimal, formatFcfa } from '@/utils/format'
import type { Parametre } from './types'

/** Valeur d'un paramètre avec son unité : « 300 FCFA », « 1,5 km », « 5 essais ». */
export function formatValeur(parametre: Parametre, valeur: number = parametre.valeur): string {
  if (parametre.unite === 'F CFA') return formatFcfa(valeur)
  const nombre = formatDecimal(valeur)
  return parametre.unite ? `${nombre} ${parametre.unite}` : nombre
}
