import { useId, type Ref, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

type TextAreaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string
  hint?: string
  error?: string
  ref?: Ref<HTMLTextAreaElement>
}

export function TextAreaField({ label, hint, error, id, className, ref, ...rest }: TextAreaFieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const hintId = `${inputId}-hint`
  const errorId = `${inputId}-error`
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ')

  return (
    <div className={className}>
      <label htmlFor={inputId} className="mb-2 block text-sm font-semibold">
        {label}
      </label>
      <textarea
        ref={ref}
        id={inputId}
        rows={4}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={cn(
          'w-full rounded-xl border bg-bg px-4 py-3 text-sm text-brand-900 outline-none placeholder:text-muted/70 focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-0 dark:bg-navy-900 dark:text-white',
          error ? 'border-danger-500' : 'border-line dark:border-white/10',
        )}
        {...rest}
      />
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1.5 text-xs font-medium text-danger-600">
          {error}
        </p>
      )}
    </div>
  )
}
