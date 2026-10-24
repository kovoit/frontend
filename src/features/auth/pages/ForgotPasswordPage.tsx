import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { MdMailOutline } from 'react-icons/md'
import { Link } from 'react-router'
import { z } from 'zod'
import { api, toApiError } from '@/api/client'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { TextField } from '@/components/ui/TextField'

// API : POST /auth/admin/mot-de-passe/oublie/ { email } → même réponse que le compte existe ou non.
const schema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Saisissez votre adresse email.')
    .pipe(z.email('Adresse email invalide.')),
})

export function ForgotPasswordPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) })
  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof schema>) => {
      const response = await api.post('/auth/admin/mot-de-passe/oublie/', values)
      return (response as { apiMessage?: string }).apiMessage ?? ''
    },
  })

  return (
    <Card className="gap-6 p-6 sm:p-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Mot de passe oublié</h1>
        <p className="mt-1 text-sm text-muted">
          Saisissez l'email de votre compte administrateur : vous recevrez un lien valable 1 heure.
        </p>
      </div>

      {mutation.isSuccess ? (
        <Alert tone="success">{mutation.data}</Alert>
      ) : (
        <form
          noValidate
          className="flex flex-col gap-5"
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
        >
          {mutation.isError && <Alert tone="danger">{toApiError(mutation.error).message}</Alert>}
          <TextField
            label="Email"
            type="email"
            autoComplete="username"
            icon={<MdMailOutline className="h-5 w-5" />}
            error={errors.email?.message}
            {...register('email')}
          />
          <Button type="submit" className="h-12 text-base" disabled={mutation.isPending}>
            {mutation.isPending ? 'Envoi…' : 'Recevoir le lien'}
          </Button>
        </form>
      )}

      <Link
        to="/"
        className="text-center text-sm font-semibold text-brand-700 hover:underline dark:text-brand-200"
      >
        Retour à la connexion
      </Link>
    </Card>
  )
}
