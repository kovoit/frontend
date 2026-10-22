import { HiX } from 'react-icons/hi'
import { Button } from '@/components/ui/Button'
import { SearchInput } from '@/components/ui/SearchInput'
import { SelectField } from '@/components/ui/SelectField'
import { AUDIT_CANAL, AUDIT_CATEGORIE, AUDIT_RESULTAT, AUDIT_ROLE } from '@/config/enums'
import { shortId } from '@/utils/format'
import type { AuditFilters } from '../types'

const options = (entries: Record<string, string | { label: string }>, all: string) => [
  { value: '', label: all },
  ...Object.entries(entries).map(([value, meta]) => ({
    value,
    label: typeof meta === 'string' ? meta : meta.label,
  })),
]

type AuditFiltersBarProps = {
  filters: AuditFilters
  onChange: (changes: Partial<AuditFilters>) => void
}

const dateClass =
  'h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm text-brand-900 outline-none focus-visible:ring-2 focus-visible:ring-accent-500 dark:border-white/10 dark:bg-navy-800 dark:text-white'

/** Filtres combinables, tous appliqués par le serveur (et conservés dans l'URL). */
export function AuditFiltersBar({ filters, onChange }: AuditFiltersBarProps) {
  // Filtres posés par un lien (fiche utilisateur, même requête, ressource) : affichés en puces
  const pinned = [
    filters.utilisateur && {
      key: 'utilisateur',
      label: `Utilisateur #${shortId(filters.utilisateur)}`,
    },
    filters.correlation && {
      key: 'correlation',
      label: `Requête ${filters.correlation.slice(0, 8)}`,
    },
    filters.ressource_id && {
      key: 'ressource_id',
      label: `${filters.ressource_type || 'Ressource'} #${shortId(filters.ressource_id)}`,
    },
  ].filter(Boolean) as Array<{ key: keyof AuditFilters; label: string }>

  return (
    <section aria-label="Filtres du journal" className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SelectField
          label="Catégorie"
          hideLabel
          options={options(AUDIT_CATEGORIE, 'Toutes les catégories')}
          value={filters.categorie}
          onChange={(event) => onChange({ categorie: event.target.value })}
        />
        <SelectField
          label="Résultat"
          hideLabel
          options={options(AUDIT_RESULTAT, 'Tous les résultats')}
          value={filters.resultat}
          onChange={(event) => onChange({ resultat: event.target.value })}
        />
        <SelectField
          label="Canal"
          hideLabel
          options={options(AUDIT_CANAL, 'Tous les canaux')}
          value={filters.canal}
          onChange={(event) => onChange({ canal: event.target.value })}
        />
        <SelectField
          label="Rôle de l'acteur"
          hideLabel
          options={options(AUDIT_ROLE, 'Tous les rôles')}
          value={filters.role}
          onChange={(event) => onChange({ role: event.target.value })}
        />
      </div>
      <div className="flex flex-col gap-3 md:flex-row">
        <SearchInput
          label="Rechercher dans le journal"
          placeholder="Action, code de motif, identifiant de ressource ou de requête"
          value={filters.recherche}
          onChange={(recherche) => onChange({ recherche })}
        />
        <label className="flex items-center gap-2 text-sm font-semibold md:w-56">
          Du
          <input
            type="date"
            className={dateClass}
            value={filters.debut}
            max={filters.fin || undefined}
            onChange={(event) => onChange({ debut: event.target.value })}
          />
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold md:w-56">
          au
          <input
            type="date"
            className={dateClass}
            value={filters.fin}
            min={filters.debut || undefined}
            onChange={(event) => onChange({ fin: event.target.value })}
          />
        </label>
      </div>
      {pinned.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Filtres actifs">
          {pinned.map((item) => (
            <li key={item.key}>
              <Button
                variant="secondary"
                onClick={() =>
                  onChange(
                    item.key === 'ressource_id'
                      ? { ressource_id: '', ressource_type: '' }
                      : { [item.key]: '' },
                  )
                }
                aria-label={`Retirer le filtre ${item.label}`}
              >
                {item.label}
                <HiX aria-hidden className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
