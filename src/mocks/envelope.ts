import { HttpResponse } from 'msw'

// Réponses simulées au format exact du backend (apps/core/api/reponses.py et exceptions.py) :
//   { statut: "success", message, reponse: <données> }
//   { statut: "failed",  message, reponse: { code, erreurs } }

const CODES_PAR_STATUT: Record<number, string> = {
  400: 'DONNEES_INVALIDES',
  401: 'NON_AUTHENTIFIE',
  403: 'ACCES_REFUSE',
  404: 'RESSOURCE_INTROUVABLE',
  409: 'CONFLIT',
  429: 'TROP_DE_REQUETES',
}

export function ok<T>(data: T, { message = 'Opération réussie.', status = 200 } = {}) {
  return HttpResponse.json({ statut: 'success', message, reponse: data }, { status })
}

export function fail(status: number, message: string, code?: string, erreurs: unknown = null) {
  return HttpResponse.json(
    {
      statut: 'failed',
      message,
      reponse: { code: code ?? CODES_PAR_STATUT[status] ?? 'ERREUR', erreurs },
    },
    { status },
  )
}

/** Erreur de validation DRF : message générique + détail champ par champ. */
export const invalid = (erreurs: Record<string, string[]>) =>
  fail(400, 'Les données envoyées sont invalides.', 'DONNEES_INVALIDES', erreurs)

export const unauthorized = () => fail(401, "Informations d'authentification non fournies.")
export const notFound = () => fail(404, 'Ressource introuvable.')
