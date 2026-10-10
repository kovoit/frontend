import { useEffect, useRef, useState } from 'react'
import { MdBadge, MdDirectionsCar, MdFace, MdLock, MdVisibility, MdVisibilityOff } from 'react-icons/md'
import { toApiError } from '@/api/client'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { PIECE_TYPE, type PieceType } from '@/config/enums'
import { usePieceFile } from '../api'
import type { KycPiece } from '../types'

const ICONS: Record<PieceType, typeof MdBadge> = {
  identite: MdBadge,
  selfie: MdFace,
  permis: MdBadge,
  carte_grise: MdBadge,
  assurance: MdBadge,
  photo_vehicule: MdDirectionsCar,
}

/** Affiche le fichier via une URL `blob:` locale, révoquée dès que l'aperçu disparaît. */
function BlobPreview({ blob, title }: { blob: Blob; title: string }) {
  const imageRef = useRef<HTMLImageElement>(null)
  const frameRef = useRef<HTMLIFrameElement>(null)
  const isPdf = blob.type === 'application/pdf'

  useEffect(() => {
    const element = isPdf ? frameRef.current : imageRef.current
    if (!element) return
    const url = URL.createObjectURL(blob)
    element.src = url
    return () => {
      element.removeAttribute('src')
      URL.revokeObjectURL(url)
    }
  }, [blob, isPdf])

  return isPdf ? (
    <iframe ref={frameRef} title={title} className="h-full w-full" />
  ) : (
    <img ref={imageRef} alt={title} draggable={false} className="h-full w-full object-contain" />
  )
}

/**
 * Pièce KYC : rien n'est chargé tant que l'admin ne clique pas sur « Afficher ».
 * Le fichier est retéléchargé à chaque affichage (consultation journalisée par l'API),
 * gardé en mémoire uniquement le temps de l'affichage, jamais via une URL publique.
 */
export function PieceViewer({ piece, ownerName }: { piece: KycPiece; ownerName: string }) {
  const [visible, setVisible] = useState(false)
  const { data, isFetching, isError, error } = usePieceFile(piece.id, visible)
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
          <BlobPreview blob={data} title={`${label} de ${ownerName}`} />
        ) : null}
      </div>
    </div>
  )
}
