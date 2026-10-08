import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { MdErrorOutline, MdLockOutline, MdMailOutline } from 'react-icons/md'
import { RiEyeLine, RiEyeOffLine } from 'react-icons/ri'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { z } from 'zod'
import { toApiError } from '@/api/client'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { TextField } from '@/components/ui/TextField'
import { NotAdminError, useAuth } from '../authContext'

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Saisissez votre adresse email.')
    .pipe(z.email('Adresse email invalide.')),
  password: z.string().min(1, 'Saisissez votre mot de passe.'),
})

type LoginForm = z.infer<typeof loginSchema>

function loginErrorMessage(error: unknown): string {
  if (error instanceof NotAdminError) return error.message
  const apiError = toApiError(error)
  if (apiError.status === 401 || apiError.status === 400) {
    return apiError.message !== 'La requête a échoué.'
      ? apiError.message
      : 'Email ou mot de passe incorrect.'
  }
  return apiError.message
}

export function LoginPage() {
  const { status, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/admin'
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: () => navigate(from, { replace: true }),
  })

  if (status === 'authenticated' && !mutation.isPending) {
    return <Navigate to={from} replace />
  }

  return (
    <Card className="gap-6 p-6 sm:p-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Espace administrateur</h1>
        <p className="mt-1 text-sm text-muted">Connectez-vous pour gérer Kovoit.</p>
      </div>

      {mutation.isError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl bg-danger-50 px-4 py-3 text-sm font-medium text-danger-700 dark:bg-danger-700/30 dark:text-danger-100"
        >
          <MdErrorOutline aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
          {loginErrorMessage(mutation.error)}
        </div>
      )}

      <form
        noValidate
        className="flex flex-col gap-5"
        onSubmit={handleSubmit((values) => mutation.mutate(values))}
      >
        <TextField
          label="Email"
          type="email"
          autoComplete="username"
          placeholder="admin@kovoit.tg"
          icon={<MdMailOutline className="h-5 w-5" />}
          error={errors.email?.message}
          {...register('email')}
        />
        <TextField
          label="Mot de passe"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          placeholder="••••••••"
          icon={<MdLockOutline className="h-5 w-5" />}
          error={errors.password?.message}
          trailing={
            <button
              type="button"
              className="rounded-lg p-1 text-muted hover:text-brand-900 dark:hover:text-white"
              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((value) => !value)}
            >
              {showPassword ? (
                <RiEyeOffLine className="h-5 w-5" />
              ) : (
                <RiEyeLine className="h-5 w-5" />
              )}
            </button>
          }
          {...register('password')}
        />

        <Button type="submit" className="mt-1 h-12 text-base" disabled={mutation.isPending}>
          {mutation.isPending ? 'Connexion…' : 'Se connecter'}
        </Button>
      </form>

      <p className="text-center text-xs text-muted">
        Accès réservé à l'équipe Kovoit.
      </p>
    </Card>
  )
}
