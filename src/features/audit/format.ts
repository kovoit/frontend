import { AUDIT_CANAL, AUDIT_RESULTAT, AUDIT_ROLE } from '@/config/enums'
import { formatDateTime, shortId } from '@/utils/format'
import type { AuditEvent } from './types'

export const NON_DISPONIBLE = 'Non disponible'

/** Nom affichable de l'acteur ; rien n'est inventé quand le compte n'existe plus. */
export function actorLabel(event: AuditEvent): string {
  if (event.acteur_role === 'systeme') return 'Système Kovoit'
  if (!event.acteur) return AUDIT_ROLE[event.acteur_role] ?? NON_DISPONIBLE
  if (event.acteur.supprime) return `Compte supprimé (#${shortId(event.acteur.id)})`
  const nom = [event.acteur.prenom, event.acteur.nom].filter(Boolean).join(' ')
  return nom || event.acteur.email || `#${shortId(event.acteur.id)}`
}

const RESSOURCES: Record<string, { label: string; path?: string }> = {
  utilisateur: { label: 'Utilisateur', path: '/admin/users' },
  reservation: { label: 'Réservation', path: '/admin/bookings' },
  trajet: { label: 'Trajet', path: '/admin/trips' },
  dossier_kyc: { label: 'Dossier KYC', path: '/admin/kyc' },
  signalement: { label: 'Signalement', path: '/admin/reports' },
  piece_kyc: { label: 'Pièce KYC' },
  vehicule: { label: 'Véhicule' },
  parametre: { label: 'Paramètre', path: '/admin/settings' },
}

export function resourceLabel(event: AuditEvent): string {
  if (!event.ressource_type) return '—'
  const label = RESSOURCES[event.ressource_type]?.label ?? event.ressource_type
  const id =
    event.ressource_type === 'parametre' ? event.ressource_id : `#${shortId(event.ressource_id)}`
  return `${label} ${id}`
}

/** Lien vers la fiche de la ressource dans le back-office, s'il en existe une. */
export function resourcePath(event: AuditEvent): string | null {
  const path = RESSOURCES[event.ressource_type]?.path
  if (!path || !event.ressource_id) return null
  return event.ressource_type === 'parametre' ? path : `${path}/${event.ressource_id}`
}

/** « Afi Mensah (passager) — Demande de réservation : refusé (DEJA_RESERVE), depuis
 *  l'application mobile, le 22 oct. 2026 · 10:05. » */
export function eventSummary(event: AuditEvent): string {
  const role = event.acteur_role === 'systeme' ? '' : ` (${AUDIT_ROLE[event.acteur_role] ?? ''})`
  const resultat = AUDIT_RESULTAT[event.resultat]?.label.toLowerCase() ?? event.resultat
  const motif = event.code_motif ? ` (${event.code_motif})` : ''
  const canal = AUDIT_CANAL[event.canal]?.toLowerCase() ?? event.canal
  return (
    `${actorLabel(event)}${role.replace(' ()', '')} — ${event.libelle} : ${resultat}${motif}, ` +
    `canal ${canal}, le ${formatDateTime(event.survenu_le)}.`
  )
}

/** Valeur JSON lisible (détails, changements). */
export function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}
