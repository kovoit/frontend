import { Card } from '@/components/ui/Card'
import { DescriptionList } from '@/components/ui/DescriptionList'
import { formatFcfa } from '@/utils/format'
import type { Tarification } from '../types'

const nombre = (valeur: string, decimales = 2) =>
  Number(valeur).toLocaleString('fr-FR', { maximumFractionDigits: decimales })
const fcfa = (valeur: string) => `${nombre(valeur)} FCFA`

/** Détail du prix tel que calculé par le backend à la publication (aucun recalcul ici). */
export function TarificationCard({ tarification: t }: { tarification: Tarification | null }) {
  if (!t) {
    return (
      <Card className="gap-2 p-5">
        <h2 className="text-lg font-bold">Calcul du prix</h2>
        <p className="text-sm text-muted">
          Trajet publié avant la tarification automatique : prix fixe, sans commission.
        </p>
      </Card>
    )
  }
  const p = t.parametres
  const consommation =
    p.source_consommation === 'vehicule' ? 'déclarée pour ce véhicule' : 'référence du type'
  return (
    <Card className="gap-4 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-bold">Calcul du prix</h2>
        <span className="text-xs text-muted">
          Formule {t.formule_version}, figée à la publication
        </span>
      </div>
      {t.source_itineraire === 'estimation' && (
        <p className="rounded-xl bg-accent-50 px-3 py-2 text-sm text-accent-700 dark:bg-accent-700/30 dark:text-accent-200">
          Itinéraire indisponible à la publication : distance et durée estimées.
        </p>
      )}
      <div className="grid gap-5 lg:grid-cols-2">
        <DescriptionList
          items={[
            { label: 'Véhicule', value: t.type_vehicule === 'moto' ? 'Moto' : 'Voiture' },
            {
              label: 'Distance · durée',
              value: `${nombre(t.distance_km)} km · ${t.duree_min} min`,
            },
            {
              label: 'Consommation retenue',
              value: `${nombre(t.consommation_retenue_l_100km)} L/100 km (${consommation})`,
            },
            {
              label: 'Carburant',
              value: `${nombre(t.carburant_litres, 3)} L × ${nombre(p.prix_carburant_litre)} FCFA = ${fcfa(t.cout_carburant)}`,
            },
            { label: 'Temps du conducteur', value: fcfa(t.cout_temps) },
            { label: 'Entretien et usure', value: fcfa(t.cout_entretien) },
            { label: 'Coût total estimé', value: fcfa(t.cout_total) },
          ]}
        />
        <DescriptionList
          items={[
            { label: 'Passagers prévus (places proposées)', value: String(t.passagers_prevus) },
            { label: 'Participation du conducteur', value: fcfa(t.part_conducteur) },
            { label: 'Contribution des passagers', value: fcfa(t.contribution_passagers) },
            { label: 'Prix par place', value: formatFcfa(t.prix_place) },
            {
              label: `Commission Kovoit (${nombre(p.taux_commission_pct)} %) par place`,
              value: formatFcfa(t.commission_place),
            },
            { label: 'Net conducteur par place', value: formatFcfa(t.net_conducteur_place) },
            {
              label: 'Si toutes les places sont prises',
              value: `${formatFcfa(t.total_paye_passagers)} payés · ${formatFcfa(t.commission_kovoit)} de commission · ${formatFcfa(t.net_conducteur)} au conducteur`,
            },
          ]}
        />
      </div>
    </Card>
  )
}
