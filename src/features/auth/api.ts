import { api } from '@/api/client'
import type { AuthUser, LoginPayload, LoginResponse } from './types'

export async function loginRequest({ email, password }: LoginPayload): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/admin/connexion/', {
    email,
    mot_de_passe: password,
  })
  return data
}

export async function fetchMe(): Promise<AuthUser> {
  const { data } = await api.get<AuthUser>('/auth/admin/moi/')
  return data
}

export async function logoutRequest(): Promise<void> {
  await api.post('/auth/admin/deconnexion/')
}
