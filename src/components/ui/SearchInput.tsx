import { useEffect, useId, useRef, useState } from 'react'
import { FiSearch } from 'react-icons/fi'
import { HiX } from 'react-icons/hi'

type SearchInputProps = {
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  /** Délai avant de déclencher la recherche (ms) */
  delay?: number
}

/** Champ de recherche avec anti-rebond : l'API n'est interrogée qu'une fois la saisie terminée. */
export function SearchInput({ label, placeholder, value, onChange, delay = 300 }: SearchInputProps) {
  const id = useId()
  const [draft, setDraft] = useState(value)
  const onChangeRef = useRef(onChange)
  const lastSent = useRef(value)

  useEffect(() => {
    onChangeRef.current = onChange
  })

  // Valeur modifiée de l'extérieur (navigation arrière, lien) : on resynchronise le champ.
  useEffect(() => {
    if (value !== lastSent.current) {
      lastSent.current = value
      setDraft(value)
    }
  }, [value])

  useEffect(() => {
    const trimmed = draft.trim()
    if (trimmed === lastSent.current) return
    const timer = setTimeout(() => {
      lastSent.current = trimmed
      onChangeRef.current(trimmed)
    }, delay)
    return () => clearTimeout(timer)
  }, [draft, delay])

  return (
    <div className="relative min-w-0 flex-1">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <FiSearch
        aria-hidden
        className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
      />
      <input
        id={id}
        type="search"
        value={draft}
        placeholder={placeholder}
        onChange={(event) => setDraft(event.target.value)}
        className="h-11 w-full rounded-xl border border-line bg-surface pl-11 pr-10 text-sm text-brand-900 outline-none placeholder:text-muted/70 focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-0 dark:border-white/10 dark:bg-navy-800 dark:text-white [&::-webkit-search-cancel-button]:hidden"
      />
      {draft && (
        <button
          type="button"
          aria-label="Effacer la recherche"
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-muted hover:text-brand-900 dark:hover:text-white"
          onClick={() => setDraft('')}
        >
          <HiX className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
