import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { RESERVATION_STATUS } from '@/config/enums'
import { StatusBadge } from './StatusBadge'

describe('StatusBadge', () => {
  it('a un libellé pour chacun des 9 statuts de réservation du PRD', () => {
    expect(Object.keys(RESERVATION_STATUS).sort()).toEqual(
      [
        'demandee',
        'acceptee',
        'refusee',
        'annulee',
        'absent',
        'en_cours',
        'terminee',
        'litige',
        'cloturee',
      ].sort(),
    )
  })

  it('affiche le libellé français du statut', () => {
    render(<StatusBadge domain="kyc" value="en_attente" />)
    expect(screen.getByText('En attente')).toBeInTheDocument()
  })

  it('affiche la valeur brute pour un statut inconnu de l’UI', () => {
    render(<StatusBadge domain="trajet" value={'nouveau_statut' as 'publie'} />)
    expect(screen.getByText('nouveau_statut')).toBeInTheDocument()
  })
})
