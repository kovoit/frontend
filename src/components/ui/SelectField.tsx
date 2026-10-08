import { useId, type Ref, type SelectHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string
  options: Array<{ value: string; label: string }>
  /** Libellé visuellement masqué (barres de filtres compactes) */
  hideLabel?: boolean
  ref?: Ref<HTMLSelectElement>
}

export function SelectField({
  label,
  options,
  hideLabel = false,
  id,
  className,
  ref,
  ...rest
}: SelectFieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId

  return (
    <div className={className}>
      <label
        htmlFor={inputId}
        className={hideLabel ? 'sr-only' : 'mb-2 block text-sm font-semibold'}
      >
        {label}
      </label>
      <select
        ref={ref}
        id={inputId}
        className={cn(
          'h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm font-medium text-brand-900 outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-0 dark:border-white/10 dark:bg-navy-800 dark:text-white',
        )}
        {...rest}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
