'use client'

import { useState, useEffect } from 'react'
import { Plus, Check, X, Shield, UserCog } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/ui/Toast'
import type { UsuarioPublico, CriarUsuarioPayload } from '@jjcar/shared'

const roleOpcoes = [
  { value: 'operador', label: 'Operador' },
  { value: 'gerente', label: 'Gerente' },
  { value: 'financeiro', label: 'Financeiro' },
  { value: 'admin', label: 'Admin' },
]

const defaultForm: CriarUsuarioPayload = {
  nomeCompleto: '',
  nomeDeLogin: '',
  email: '',
  senhaInicial: '',
  role: 'operador',
  permissoes: {
    verFinanceiro: false,
    verFotos: true,
    registrarVeiculos: true,
    registrarValorMes: false,
  },
}

function Tick({ value }: { value: boolean }) {
  return value ? (
    <Check size={16} className="text-green-400" />
  ) : (
    <X size={16} className="text-gray-600" />
  )
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<UsuarioPublico[]>([])
  const [loading, setLoading] = useState(true)
  const [modalCriar, setModalCriar] = useState(false)
  const [modalEditar, setModalEditar] = useState<UsuarioPublico | null>(null)
  const [form, setForm] = useState<CriarUsuarioPayload>(defaultForm)
  const [editPerms, setEditPerms] = useState<any>({})
  const { toasts, toast, remover } = useToast()

  const carregar = () => {
    api.get<UsuarioPublico[]>('/usuarios').then(setUsuarios).finally(() => setLoading(false))
  }

  useEffect(carregar, [])

  async function handleCriar(e: React.FormEvent) {
    e.preventDefault()
    try {
      await api.post('/usuarios', form)
      toast('sucesso', 'Usuário criado com sucesso!')
      setModalCriar(false)
      setForm(defaultForm)
      carregar()
    } catch (err: any) {
      toast('erro', err.erro || 'Erro ao criar usuário')
    }
  }

  async function handleAtualizarPerms() {
    if (!modalEditar) return
    try {
      await api.patch(`/usuarios/${modalEditar.id}/permissoes`, {
        role: editPerms.role,
        permissoes: {
          verFinanceiro: editPerms.verFinanceiro,
          verFotos: editPerms.verFotos,
          registrarVeiculos: editPerms.registrarVeiculos,
          registrarValorMes: editPerms.registrarValorMes,
        },
      })
      toast('sucesso', 'Permissões atualizadas!')
      setModalEditar(null)
      carregar()
    } catch {
      toast('erro', 'Erro ao atualizar permissões')
    }
  }

  async function toggleAtivo(u: UsuarioPublico) {
    await api.patch(`/usuarios/${u.id}/ativar`, { ativo: !u.ativo })
    carregar()
  }

  return (
    <>
      <ToastContainer toasts={toasts} remover={remover} />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-100">Usuários e Permissões</h1>
            <p className="text-gray-500 text-sm mt-1">{usuarios.length} usuário{usuarios.length !== 1 ? 's' : ''} cadastrado{usuarios.length !== 1 ? 's' : ''}</p>
          </div>
          <Button onClick={() => setModalCriar(true)}>
            <Plus size={16} />
            Novo Usuário
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400 text-xs uppercase">
                  <th className="text-left px-6 py-3">Usuário</th>
                  <th className="text-center px-4 py-3">Role</th>
                  <th className="text-center px-4 py-3">Ver Fin.</th>
                  <th className="text-center px-4 py-3">Ver Fotos</th>
                  <th className="text-center px-4 py-3">Reg. Veíc.</th>
                  <th className="text-center px-4 py-3">Reg. Valor</th>
                  <th className="text-center px-4 py-3">Status</th>
                  <th className="text-center px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {usuarios.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-700/30 transition">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-100">{u.nomeDeLogin}</p>
                      <p className="text-xs text-gray-500">{u.nomeCompleto}</p>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-block bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded capitalize">
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-center"><Tick value={u.permissoes.verFinanceiro} /></div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-center"><Tick value={u.permissoes.verFotos} /></div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-center"><Tick value={u.permissoes.registrarVeiculos} /></div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-center"><Tick value={u.permissoes.registrarValorMes} /></div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${u.ativo ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-400'}`}>
                        {u.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setModalEditar(u)
                            setEditPerms({
                              role: u.role,
                              ...u.permissoes,
                            })
                          }}
                          className="text-gray-400 hover:text-orange-400 transition"
                          title="Editar permissões"
                        >
                          <UserCog size={16} />
                        </button>
                        <button
                          onClick={() => toggleAtivo(u)}
                          className={`transition ${u.ativo ? 'text-gray-400 hover:text-red-400' : 'text-gray-600 hover:text-green-400'}`}
                          title={u.ativo ? 'Desativar' : 'Ativar'}
                        >
                          <Shield size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Criar usuário */}
      <Modal aberto={modalCriar} onFechar={() => setModalCriar(false)} titulo="Novo Usuário">
        <form onSubmit={handleCriar} className="space-y-4">
          <Input
            label="Nome completo *"
            value={form.nomeCompleto}
            onChange={(e) => setForm({ ...form, nomeCompleto: e.target.value })}
            required
          />
          <Input
            label="Login * (ex: JJCAR.JEFF)"
            value={form.nomeDeLogin}
            onChange={(e) => setForm({ ...form, nomeDeLogin: e.target.value.toUpperCase() })}
            required
            placeholder="JJCAR.NOME"
          />
          <Input
            label="E-mail *"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <Input
            label="Senha inicial *"
            type="password"
            value={form.senhaInicial}
            onChange={(e) => setForm({ ...form, senhaInicial: e.target.value })}
            required
            minLength={6}
          />
          <Select
            label="Role"
            options={roleOpcoes}
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as any })}
          />

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-300">Permissões</p>
            {[
              { key: 'verFinanceiro', label: 'Ver relatório financeiro' },
              { key: 'verFotos', label: 'Ver fotos' },
              { key: 'registrarVeiculos', label: 'Registrar veículos' },
              { key: 'registrarValorMes', label: 'Registrar valor do mês' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(form.permissoes as any)[key]}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      permissoes: { ...form.permissoes, [key]: e.target.checked },
                    })
                  }
                  className="rounded border-gray-600 bg-gray-700 text-orange-500 focus:ring-orange-500"
                />
                <span className="text-sm text-gray-300">{label}</span>
              </label>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" type="button" onClick={() => setModalCriar(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">Criar Usuário</Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Editar permissões */}
      <Modal
        aberto={!!modalEditar}
        onFechar={() => setModalEditar(null)}
        titulo={`Permissões — ${modalEditar?.nomeDeLogin}`}
      >
        <div className="space-y-4">
          <Select
            label="Role"
            options={roleOpcoes}
            value={editPerms.role}
            onChange={(e) => setEditPerms({ ...editPerms, role: e.target.value })}
          />

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-300">Permissões individuais</p>
            {[
              { key: 'verFinanceiro', label: 'Ver relatório financeiro' },
              { key: 'verFotos', label: 'Ver fotos' },
              { key: 'registrarVeiculos', label: 'Registrar veículos' },
              { key: 'registrarValorMes', label: 'Registrar valor do mês' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editPerms[key] ?? false}
                  onChange={(e) => setEditPerms({ ...editPerms, [key]: e.target.checked })}
                  className="rounded border-gray-600 bg-gray-700 text-orange-500 focus:ring-orange-500"
                />
                <span className="text-sm text-gray-300">{label}</span>
              </label>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setModalEditar(null)}>
              Cancelar
            </Button>
            <Button className="flex-1" onClick={handleAtualizarPerms}>Salvar</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
