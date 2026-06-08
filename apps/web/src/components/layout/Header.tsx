'use client'

import { useState, useEffect } from 'react'
import { Bell, LogOut, Menu, KeyRound } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { api } from '@/lib/api'
import { trocarSenha } from '@/lib/auth'
import type { NotificacaoPublica } from '@jjcar/shared'
import { cn } from '@/lib/utils'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/ui/Toast'

interface HeaderProps {
  onAbrirMenu?: () => void
}

export function Header({ onAbrirMenu }: HeaderProps) {
  const { usuario, logout } = useAuth()
  const { toasts, toast, remover } = useToast()
  const [notificacoes, setNotificacoes] = useState<NotificacaoPublica[]>([])
  const [aberto, setAberto] = useState(false)
  const [modalSenha, setModalSenha] = useState(false)
  const [menuPerfil, setMenuPerfil] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [senhaForm, setSenhaForm] = useState({ senhaAtual: '', senhaNova: '', confirmar: '' })

  useEffect(() => {
    api.get<NotificacaoPublica[]>('/notificacoes').then(setNotificacoes).catch(() => {})
  }, [])

  const naoLidas = notificacoes.filter((n) => !n.lida).length

  async function marcarTodasLidas() {
    await api.patch('/notificacoes/marcar-todas-lidas', {})
    setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })))
  }

  async function handleTrocarSenha(e: React.FormEvent) {
    e.preventDefault()
    if (senhaForm.senhaNova !== senhaForm.confirmar) {
      toast('erro', 'A confirmação não confere com a nova senha')
      return
    }
    if (senhaForm.senhaNova.length < 6) {
      toast('erro', 'A nova senha deve ter ao menos 6 caracteres')
      return
    }
    setSalvando(true)
    try {
      await trocarSenha(senhaForm.senhaAtual, senhaForm.senhaNova)
      toast('sucesso', 'Senha alterada com sucesso!')
      setModalSenha(false)
      setSenhaForm({ senhaAtual: '', senhaNova: '', confirmar: '' })
    } catch (err: any) {
      toast('erro', err.erro || 'Erro ao trocar senha')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <>
      <ToastContainer toasts={toasts} remover={remover} />

      <header className="h-16 bg-gray-900 border-b border-gray-700 flex items-center justify-between px-4 sm:px-6">
        {/* Botão menu mobile */}
        <button onClick={onAbrirMenu} className="p-2 text-gray-400 hover:text-gray-100 transition lg:hidden">
          <Menu size={22} />
        </button>
        <div className="hidden lg:block" />

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Notificações */}
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
              <div className="absolute right-0 top-12 w-80 max-w-[calc(100vw-2rem)] bg-gray-800 border border-gray-700 rounded-xl shadow-2xl z-50">
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
                      <div key={n.id} className={cn('p-4 border-b border-gray-700 last:border-0', !n.lida && 'bg-gray-750')}>
                        <p className="text-sm text-gray-200">{n.mensagem}</p>
                        <p className="text-xs text-gray-500 mt-1">{new Date(n.criadoEm).toLocaleString('pt-BR')}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Perfil */}
          <div className="relative">
            <button
              onClick={() => setMenuPerfil(!menuPerfil)}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-100 transition"
            >
              <span className="hidden sm:inline">Olá, <strong className="text-gray-200">{usuario?.nomeDeLogin}</strong></span>
              <div className="w-8 h-8 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-xs font-bold">
                {usuario?.nomeDeLogin?.[0] ?? '?'}
              </div>
            </button>

            {menuPerfil && (
              <div className="absolute right-0 top-12 w-52 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl z-50 py-1">
                <div className="px-4 py-2 border-b border-gray-700">
                  <p className="text-sm font-medium text-gray-200">{usuario?.nomeCompleto}</p>
                  <p className="text-xs text-gray-500 capitalize">{usuario?.role}</p>
                </div>
                <button
                  onClick={() => { setMenuPerfil(false); setModalSenha(true) }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700 transition text-left"
                >
                  <KeyRound size={15} /> Trocar senha
                </button>
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-gray-700 transition text-left"
                >
                  <LogOut size={15} /> Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Modal: Trocar senha */}
      <Modal aberto={modalSenha} onFechar={() => setModalSenha(false)} titulo="Trocar Senha">
        <form onSubmit={handleTrocarSenha} className="space-y-4">
          <Input
            label="Senha atual"
            type="password"
            value={senhaForm.senhaAtual}
            onChange={(e) => setSenhaForm({ ...senhaForm, senhaAtual: e.target.value })}
            required
          />
          <Input
            label="Nova senha"
            type="password"
            placeholder="Mínimo 6 caracteres"
            value={senhaForm.senhaNova}
            onChange={(e) => setSenhaForm({ ...senhaForm, senhaNova: e.target.value })}
            required
          />
          <Input
            label="Confirmar nova senha"
            type="password"
            value={senhaForm.confirmar}
            onChange={(e) => setSenhaForm({ ...senhaForm, confirmar: e.target.value })}
            required
          />
          <div className="flex gap-3 pt-2">
            <Button variant="outline" type="button" className="flex-1" onClick={() => setModalSenha(false)}>Cancelar</Button>
            <Button type="submit" className="flex-1" loading={salvando}>Salvar nova senha</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
