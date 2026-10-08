import { useId, type InputHTMLAttributes, type ReactNode, type Ref } from 'react'
import { cn } from '@/utils/cn'

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  icon?: ReactNode
  /** Élément affiché à droite du champ (ex. bouton afficher le mot de passe) */
  trailing?: ReactNode
  error?: string
  ref?: Ref<HTMLInputElement>
}

// Champ de formulaire au style des maquettes Nana Tech (icône, fond gris clair, coins arrondis).
export function TextField({
  label,
  icon,
  trailing,
  error,
  id,
  className,
  ref,
  ...rest
}: TextFieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const errorId = `${inputId}-error`

  return (
    <div className={className}>
      <label htmlFor={inputId} className="mb-2 block text-sm font-semibold">
        {label}
      </label>
      <div
        className={cn(
          'flex items-center gap-3 rounded-xl border bg-bg px-4 transition-colors focus-within:ring-2 focus-within:ring-accent-500 dark:bg-navy-900',
          error ? 'border-danger-500' : 'border-line dark:border-white/10',
        )}
      >
        {icon && (
          <span aria-hidden className="text-muted">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="h-12 w-full bg-transparent text-sm text-brand-900 outline-none placeholder:text-muted/70 focus-visible:ring-0 focus-visible:ring-offset-0 dark:text-white"
          {...rest}
        />
        {trailing}
      </div>
      {error && (
        <p id={errorId} className="mt-1.5 text-xs font-medium text-danger-600">
          {error}
        </p>
      )}
    </div>
  )
}
