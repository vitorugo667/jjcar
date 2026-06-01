'use client'

import { useState, useCallback } from 'react'

interface Toast {
  id: string
  tipo: 'sucesso' | 'erro' | 'info'
  mensagem: string
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((tipo: Toast['tipo'], mensagem: string) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, tipo, mensagem }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const remover = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return { toasts, toast, remover }
}
