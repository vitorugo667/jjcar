import Cookies from 'js-cookie'
import type { AuthResponse, LoginPayload, UsuarioPublico } from '@jjcar/shared'
import { api } from './api'

const TOKEN_KEY = 'jjcar_token'
const USER_KEY = 'jjcar_user'

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const data = await api.post<AuthResponse>('/auth/login', payload)
  Cookies.set(TOKEN_KEY, data.token, { expires: 7 })
  localStorage.setItem(USER_KEY, JSON.stringify(data.usuario))
  return data
}

export function logout() {
  Cookies.remove(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  window.location.href = '/login'
}

export function getToken(): string | undefined {
  return Cookies.get(TOKEN_KEY)
}

export function getUsuario(): UsuarioPublico | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(USER_KEY)
  return raw ? JSON.parse(raw) : null
}

export function isAdmin(): boolean {
  return getUsuario()?.role === 'admin'
}

export function temPermissao(perm: keyof UsuarioPublico['permissoes']): boolean {
  return getUsuario()?.permissoes[perm] ?? false
}
