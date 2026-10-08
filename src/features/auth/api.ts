import { api } from '@/api/client'
import type { AuthUser, LoginPayload, LoginResponse } from './types'

export async function loginRequest(payload: LoginPayload): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/login/', payload)
  return data
}

export async function fetchMe(): Promise<AuthUser> {
  const { data } = await api.get<AuthUser>('/auth/me/')
  return data
}

export async function logoutRequest(): Promise<void> {
  await api.post('/auth/logout/')
}
