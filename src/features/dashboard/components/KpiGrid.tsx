import { MdDirectionsCar, MdGroups, MdSavings, MdVerifiedUser } from 'react-icons/md'
import { Widget } from '@/components/ui/Widget'
import { formatFcfa, formatNumber } from '@/utils/format'
import type { DashboardStats } from '../types'

const icon = 'h-6 w-6'

export function KpiGrid({ indicateurs }: { indicateurs: DashboardStats['indicateurs'] }) {
  return (
    <section aria-label="Indicateurs clés" className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
      <Widget
        icon={<MdDirectionsCar className={icon} />}
        title="Trajets terminés"
        value={formatNumber(indicateurs.trajets_termines)}
        // Terminés : par date de départ ; publiés : par date de publication (pas un ratio).
        hint={`${formatNumber(indicateurs.trajets_publies)} publiés sur la période`}
      />
      <Widget
        icon={<MdGroups className={icon} />}
        title="Passagers transportés"
        value={formatNumber(indicateurs.passagers_transportes)}
        hint="Montés à bord, trajet terminé"
      />
      <Widget
        icon={<MdSavings className={icon} />}
        title="Économies réalisées"
        value={formatFcfa(indicateurs.economies_realisees)}
        hint="Versées aux conducteurs sur la période"
      />
      <Widget
        icon={<MdVerifiedUser className={icon} />}
        title="Utilisateurs vérifiés"
        value={formatNumber(indicateurs.utilisateurs_verifies)}
        hint={`À ce jour, dont ${formatNumber(indicateurs.conducteurs_verifies)} conducteurs`}
      />
    </section>
  )
}
