import { useState } from 'react'
import { MdBadge, MdDirectionsCar, MdFace, MdLock, MdVisibility, MdVisibilityOff } from 'react-icons/md'
import { toApiError } from '@/api/client'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { PIECE_TYPE, type PieceType } from '@/config/enums'
import { usePieceUrl } from '../api'
import type { KycPiece } from '../types'

const ICONS: Record<PieceType, typeof MdBadge> = {
  identite: MdBadge,
  selfie: MdFace,
  permis: MdBadge,
  carte_grise: MdBadge,
  assurance: MdBadge,
  photo_vehicule: MdDirectionsCar,
}

/**
 * Pièce KYC : rien n'est chargé tant que l'admin ne clique pas sur « Afficher ».
 * L'URL signée est demandée à chaque affichage (consultation journalisée par l'API) et jamais conservée.
 */
export function PieceViewer({ piece, ownerName }: { piece: KycPiece; ownerName: string }) {
  const [visible, setVisible] = useState(false)
  const { data, isFetching, isError, error } = usePieceUrl(piece.id, visible)
  const label = PIECE_TYPE[piece.type_piece]
  const Icon = ICONS[piece.type_piece]

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-line dark:border-white/10">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-900 dark:bg-white/10 dark:text-white">
            <Icon aria-hidden className="h-5 w-5" />
          </span>
          <p className="truncate text-sm font-semibold">{label}</p>
        </div>
        <Button
          variant="ghost"
          className="px-3 py-1.5"
          aria-expanded={visible}
          aria-label={`${visible ? 'Masquer' : 'Afficher'} : ${label}`}
          onClick={() => setVisible((value) => !value)}
        >
          {visible ? (
            <MdVisibilityOff aria-hidden className="h-4 w-4" />
          ) : (
            <MdVisibility aria-hidden className="h-4 w-4" />
          )}
          {visible ? 'Masquer' : 'Afficher'}
        </Button>
      </div>

      <div className="aspect-[16/10] bg-bg dark:bg-navy-900">
        {!visible ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center text-xs text-muted">
            <MdLock aria-hidden className="h-5 w-5" />
            Document sensible : affiché sur demande, consultation journalisée.
          </div>
        ) : isFetching ? (
          <Skeleton className="h-full w-full rounded-none" />
        ) : isError ? (
          <p role="alert" className="flex h-full items-center justify-center px-4 text-center text-sm text-danger-600">
            {toApiError(error).message}
          </p>
        ) : data ? (
          <img
            src={data.url}
            alt={`${label} de ${ownerName}`}
            referrerPolicy="no-referrer"
            draggable={false}
            className="h-full w-full object-contain"
          />
        ) : null}
      </div>
    </div>
  )
}
