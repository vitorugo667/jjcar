'use client'

import { useState, useEffect } from 'react'
import type { UsuarioPublico } from '@jjcar/shared'
import { getUsuario, logout } from '@/lib/auth'

export function useAuth() {
  const [usuario, setUsuario] = useState<UsuarioPublico | null>(null)

  useEffect(() => {
    setUsuario(getUsuario())
  }, [])

  return { usuario, logout }
}
