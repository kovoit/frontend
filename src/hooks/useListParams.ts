import { useCallback } from 'react'
import { useSearchParams } from 'react-router'

/**
 * Filtres, recherche et page d'une liste, stockés dans l'URL (liens partageables, retour arrière).
 * Toute modification de filtre ramène à la page 1.
 */
export function useListParams<K extends string>(keys: readonly K[]) {
  const [searchParams, setSearchParams] = useSearchParams()

  const values = Object.fromEntries(keys.map((key) => [key, searchParams.get(key) ?? ''])) as Record<
    K,
    string
  >
  const pageParam = Number(searchParams.get('page'))
  const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1

  const setFilters = useCallback(
    (changes: Partial<Record<K, string>>) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current)
          for (const [key, value] of Object.entries(changes) as Array<[K, string | undefined]>) {
            if (value) next.set(key, value)
            else next.delete(key)
          }
          next.delete('page')
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  const setPage = useCallback(
    (nextPage: number) => {
      setSearchParams((current) => {
        const next = new URLSearchParams(current)
        if (nextPage > 1) next.set('page', String(nextPage))
        else next.delete('page')
        return next
      })
    },
    [setSearchParams],
  )

  return { values, page, setFilters, setPage }
}
