import type { ReactNode } from 'react'
import {
  MdAdminPanelSettings,
  MdCheckCircle,
  MdErrorOutline,
  MdGppMaybe,
  MdHistory,
  MdPeople,
  MdBlock,
} from 'react-icons/md'
import { Widget } from '@/components/ui/Widget'
import { formatDateTime, formatNumber } from '@/utils/format'
import type { AuditStats } from '../types'

const icon = 'h-6 w-6'

type Kpi = { title: string; value: string; hint?: string; icon: ReactNode }

/** Indicateurs calculés par le serveur à partir des événements enregistrés. */
export function AuditStatsGrid({ stats }: { stats: AuditStats }) {
  const kpis: Kpi[] = [
    {
      title: 'Événements',
      value: formatNumber(stats.total),
      hint: stats.derniere_activite
        ? `Dernier : ${formatDateTime(stats.derniere_activite)}`
        : 'Aucun événement enregistré',
      icon: <MdHistory className={icon} />,
    },
    {
      title: 'Actions métier réussies',
      value: formatNumber(stats.metier_succes),
      icon: <MdCheckCircle className={icon} />,
    },
    {
      title: 'Actions métier refusées',
      value: formatNumber(stats.metier_refus),
      hint: 'Règles métier, pas des pannes',
      icon: <MdBlock className={icon} />,
    },
    {
      title: 'Événements de sécurité',
      value: formatNumber(stats.securite),
      hint: `dont ${formatNumber(stats.securite_refus)} refus d'accès ou d'authentification`,
      icon: <MdGppMaybe className={icon} />,
    },
    {
      title: 'Incidents techniques',
      value: formatNumber(stats.technique),
      hint: 'Erreurs internes de l’API',
      icon: <MdErrorOutline className={icon} />,
    },
    {
      title: 'Actions administratives',
      value: formatNumber(stats.admin),
      icon: <MdAdminPanelSettings className={icon} />,
    },
    {
      title: 'Utilisateurs actifs',
      value: formatNumber(stats.utilisateurs_actifs),
      hint: 'Passagers et conducteurs ayant agi',
      icon: <MdPeople className={icon} />,
    },
  ]

  return (
    <section
      aria-label="Indicateurs du journal"
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      {kpis.map((kpi) => (
        <Widget
          key={kpi.title}
          icon={kpi.icon}
          title={kpi.title}
          value={kpi.value}
          hint={kpi.hint}
        />
      ))}
    </section>
  )
}
