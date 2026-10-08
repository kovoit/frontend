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
        hint={`sur ${formatNumber(indicateurs.trajets_publies)} publiés`}
      />
      <Widget
        icon={<MdGroups className={icon} />}
        title="Passagers transportés"
        value={formatNumber(indicateurs.passagers_transportes)}
      />
      <Widget
        icon={<MdSavings className={icon} />}
        title="Économies réalisées"
        value={formatFcfa(indicateurs.economies_realisees)}
        hint="Partagées par les passagers avec les conducteurs"
      />
      <Widget
        icon={<MdVerifiedUser className={icon} />}
        title="Utilisateurs vérifiés"
        value={formatNumber(indicateurs.utilisateurs_verifies)}
        hint={`dont ${formatNumber(indicateurs.conducteurs_verifies)} conducteurs`}
      />
    </section>
  )
}
