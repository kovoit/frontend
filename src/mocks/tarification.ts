import type { Tarification } from '@/features/trips/types'

// Mode mock et tests uniquement : instantané au format de l'API (apps/tarification/calcul.py),
// valeurs de départ des paramètres (voiture, 7 L/100 km, 817 F/L, commission 15 %, arrondi 5 F).
// En production, le back-office n'effectue aucun calcul de prix : il affiche celui de l'API.

const TAUX = 15
const s = (n: number, d = 2) => n.toFixed(d)

export const repartir = (prix: number) => {
  const commission = Math.round((prix * TAUX) / 100)
  return { commission, net_conducteur: prix - commission }
}

export function mockTarification(km: number, places: number): Tarification {
  const minutes = Math.round((km / 25) * 60)
  const litres = (km * 7) / 100
  const total = litres * 817
  const part = total / (places + 1)
  const contribution = total - part
  const brut = contribution / (1 - TAUX / 100)
  const prix = Math.ceil(brut / places / 5) * 5
  const { commission, net_conducteur } = repartir(prix)
  return {
    formule_version: 'v1',
    type_vehicule: 'voiture',
    distance_km: s(km, 3),
    duree_min: minutes,
    source_itineraire: 'routage',
    passagers_prevus: places,
    consommation_retenue_l_100km: '7.000',
    carburant_litres: s(litres, 3),
    cout_carburant: s(total, 3),
    cout_temps: '0.000',
    cout_entretien: '0.000',
    cout_total: s(total, 3),
    part_conducteur: s(part, 3),
    contribution_passagers: s(contribution, 3),
    montant_brut_passagers: s(brut, 3),
    prix_place: prix,
    commission_place: commission,
    net_conducteur_place: net_conducteur,
    total_paye_passagers: prix * places,
    commission_kovoit: commission * places,
    net_conducteur: net_conducteur * places,
    parametres: {
      prix_carburant_litre: '817.000',
      consommation_l_100km: '7.000',
      source_consommation: 'reference_voiture',
      majoration_charge_par_passager_pct: '0.000',
      cout_horaire_conducteur: '0.000',
      entretien_par_km: '0.000',
      taux_commission_pct: '15.000',
      arrondi_prix_fcfa: 5,
      prix_minimum_place: 0,
    },
  }
}
