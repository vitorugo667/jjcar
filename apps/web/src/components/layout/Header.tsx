'use client'

import { useState, useEffect } from 'react'
import { Bell, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { api } from '@/lib/api'
import type { NotificacaoPublica } from '@jjcar/shared'
import { cn } from '@/lib/utils'

export function Header() {
  const { usuario, logout } = useAuth()
  const [notificacoes, setNotificacoes] = useState<NotificacaoPublica[]>([])
  const [aberto, setAberto] = useState(false)

  useEffect(() => {
    api.get<NotificacaoPublica[]>('/notificacoes').then(setNotificacoes).catch(() => {})
  }, [])

  const naoLidas = notificacoes.filter((n) => !n.lida).length

  async function marcarTodasLidas() {
    await api.patch('/notificacoes/marcar-todas-lidas', {})
    setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })))
  }

  return (
    <header className="h-16 bg-gray-900 border-b border-gray-700 flex items-center justify-between px-6">
      <div />
      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            onClick={() => setAberto(!aberto)}
            className="relative p-2 text-gray-400 hover:text-gray-100 transition"
          >
            <Bell size={20} />
            {naoLidas > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-orange-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                {naoLidas > 9 ? '9+' : naoLidas}
              </span>
            )}
          </button>

          {aberto && (
            <div className="absolute right-0 top-12 w-80 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl z-50">
              <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <p className="text-sm font-medium text-gray-100">Notificações</p>
                {naoLidas > 0 && (
                  <button onClick={marcarTodasLidas} className="text-xs text-orange-400 hover:text-orange-300">
                    Marcar todas como lidas
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notificacoes.length === 0 ? (
                  <p className="p-4 text-sm text-gray-500 text-center">Nenhuma notificação</p>
                ) : (
                  notificacoes.slice(0, 10).map((n) => (
                    <div
                      key={n.id}
                      className={cn(
                        'p-4 border-b border-gray-700 last:border-0',
                        !n.lida && 'bg-gray-750',
                      )}
                    >
                      <p className="text-sm text-gray-200">{n.mensagem}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(n.criadoEm).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>Olá, <strong className="text-gray-200">{usuario?.nomeDeLogin}</strong></span>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-400 transition"
        >
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </header>
  )
}
