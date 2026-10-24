import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { MdLockOutline } from 'react-icons/md'
import { Link, useSearchParams } from 'react-router'
import { z } from 'zod'
import { api, toApiError } from '@/api/client'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { TextField } from '@/components/ui/TextField'

// API : POST /auth/admin/mot-de-passe/reinitialiser/ { uid, jeton, mot_de_passe }
//       400 LIEN_INVALIDE (expiré, déjà utilisé) · 400 MOT_DE_PASSE_FAIBLE (validateurs Django)
const schema = z
  .object({
    motDePasse: z.string().min(10, '10 caractères minimum.'),
    confirmation: z.string(),
  })
  .refine((v) => v.motDePasse === v.confirmation, {
    path: ['confirmation'],
    message: 'Les deux mots de passe sont différents.',
  })
type ResetForm = z.infer<typeof schema>

export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const uid = params.get('uid') ?? ''
  const jeton = params.get('jeton') ?? ''
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetForm>({ resolver: zodResolver(schema) })
  const mutation = useMutation({
    mutationFn: ({ motDePasse }: ResetForm) =>
      api.post('/auth/admin/mot-de-passe/reinitialiser/', { uid, jeton, mot_de_passe: motDePasse }),
  })
  const erreur = mutation.isError ? toApiError(mutation.error) : null

  return (
    <Card className="gap-6 p-6 sm:p-8">
      <h1 className="text-center text-2xl font-bold">Nouveau mot de passe</h1>

      {!uid || !jeton ? (
        <Alert tone="danger">Lien incomplet. Demandez un nouveau lien de réinitialisation.</Alert>
      ) : mutation.isSuccess ? (
        <Alert tone="success">Mot de passe modifié. Vous pouvez vous connecter.</Alert>
      ) : (
        <form
          noValidate
          className="flex flex-col gap-5"
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
        >
          {erreur && (
            <Alert tone="danger">
              {erreur.fieldErrors.mot_de_passe?.join(' ') ?? erreur.message}
            </Alert>
          )}
          <TextField
            label="Nouveau mot de passe"
            type="password"
            autoComplete="new-password"
            icon={<MdLockOutline className="h-5 w-5" />}
            error={errors.motDePasse?.message}
            {...register('motDePasse')}
          />
          <TextField
            label="Confirmer le mot de passe"
            type="password"
            autoComplete="new-password"
            icon={<MdLockOutline className="h-5 w-5" />}
            error={errors.confirmation?.message}
            {...register('confirmation')}
          />
          <Button type="submit" className="h-12 text-base" disabled={mutation.isPending}>
            {mutation.isPending ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </form>
      )}

      <div className="flex justify-center gap-4 text-sm font-semibold text-brand-700 dark:text-brand-200">
        <Link to="/" className="hover:underline">
          Se connecter
        </Link>
        {erreur?.code === 'LIEN_INVALIDE' && (
          <Link to="/mot-de-passe-oublie" className="hover:underline">
            Demander un nouveau lien
          </Link>
        )}
      </div>
    </Card>
  )
}
