'use client'

import { useState, useEffect } from 'react'
import { Plus, FileText, Pencil, Trash2, Link2, Car } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/ui/Toast'
import { formatarData, formatarMoeda, labelTipo } from '@/lib/utils'
import type { OrcamentoPublico, VeiculoPublico } from '@jjcar/shared'

const tipoOpcoes = [
  { value: 'seguradora', label: 'Seguradora' },
  { value: 'servico_interno', label: 'Serviço Interno' },
  { value: 'outro', label: 'Outro' },
]

const formVazio = {
  tipo: 'seguradora',
  descricao: '',
  arquivoUrl: '',
  valor: '',
  seguradoraCliente: '',
  veiculoId: '',
}

export default function OrcamentosPage() {
  const { usuario } = useAuth()
  const [orcamentos, setOrcamentos] = useState<OrcamentoPublico[]>([])
  const [veiculos, setVeiculos] = useState<VeiculoPublico[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState<OrcamentoPublico | null>(null)
  const [excluindo, setExcluindo] = useState<OrcamentoPublico | null>(null)
  const [salvando, setSalvando] = useState(false)
  const { toasts, toast, remover } = useToast()
  const [form, setForm] = useState(formVazio)

  const isAdmin = usuario?.role === 'admin'

  const carregar = () => {
    Promise.all([
      api.get<OrcamentoPublico[]>('/orcamentos'),
      api.get<VeiculoPublico[]>('/veiculos?status=em_andamento'),
    ])
      .then(([o, v]) => { setOrcamentos(o); setVeiculos(v) })
      .finally(() => setLoading(false))
  }

  useEffect(carregar, [])

  function abrirNovo() {
    setForm(formVazio)
    setEditando(null)
    setModal(true)
  }

  function abrirEditar(o: OrcamentoPublico) {
    setForm({
      tipo: o.tipo,
      descricao: o.descricao,
      arquivoUrl: o.arquivoUrl || '',
      valor: String(o.valor),
      seguradoraCliente: o.seguradoraCliente || '',
      veiculoId: '',
    })
    setEditando(o)
    setModal(true)
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)
    try {
      const payload = {
        tipo: form.tipo,
        descricao: form.descricao,
        arquivoUrl: form.arquivoUrl || undefined,
        valor: Number(form.valor),
        seguradoraCliente: form.seguradoraCliente || undefined,
        veiculoId: form.veiculoId || undefined,
      }

      if (editando) {
        await api.patch(`/orcamentos/${editando.id}`, payload)
        toast('sucesso', 'Orçamento atualizado!')
      } else {
        await api.post('/orcamentos', payload)
        toast('sucesso', 'Orçamento criado!')
      }

      setModal(false)
      carregar()
    } catch (err: any) {
      toast('erro', err.erro || 'Erro ao salvar orçamento')
    } finally {
      setSalvando(false)
    }
  }

  async function handleExcluir() {
    if (!excluindo) return
    setSalvando(true)
    try {
      await api.delete(`/orcamentos/${excluindo.id}`)
      toast('sucesso', 'Orçamento excluído.')
      setExcluindo(null)
      carregar()
    } catch (err: any) {
      toast('erro', err.erro || 'Erro ao excluir')
    } finally {
      setSalvando(false)
    }
  }

  const veiculoOpcoes = [
    { value: '', label: 'Nenhum' },
    ...veiculos.map((v) => ({ value: v.id, label: `${v.placa} — ${v.nomeVeiculo}` })),
  ]

  return (
    <>
      <ToastContainer toasts={toasts} remover={remover} />
      <div className="space-y-6">

        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-100">Orçamentos</h1>
            <p className="text-gray-500 text-sm mt-1">
              Registre orçamentos recebidos de seguradoras ou clientes e vincule a veículos em andamento.
            </p>
          </div>
          {isAdmin && (
            <Button onClick={abrirNovo}>
              <Plus size={16} /> Novo Orçamento
            </Button>
          )}
        </div>

        {/* Dica didática */}
        {isAdmin && (
          <div className="bg-blue-900/20 border border-blue-700/50 rounded-xl p-4 flex gap-3">
            <Link2 size={18} className="text-blue-400 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-200">
              <p className="font-medium mb-1">Como funciona</p>
              <p className="text-blue-300">Crie um orçamento com o valor recebido da seguradora ou cliente. Você pode vincular diretamente a um veículo em andamento. O valor do orçamento será usado como referência no lançamento financeiro ao encerrar o serviço.</p>
            </div>
          </div>
        )}

        {/* Lista */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-gray-800 rounded-xl animate-pulse" />)}
          </div>
        ) : orcamentos.length === 0 ? (
          <div className="text-center py-20 bg-gray-800/50 rounded-xl border border-dashed border-gray-700">
            <FileText size={48} className="text-gray-600 mx-auto mb-3" />
            <p className="text-gray-300 font-medium">Nenhum orçamento cadastrado</p>
            <p className="text-gray-500 text-sm mt-1">
              {isAdmin ? 'Clique em "Novo Orçamento" para registrar o primeiro.' : 'Aguarde o administrador registrar os orçamentos.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {orcamentos.map((o) => (
              <div key={o.id} className="bg-gray-800 border border-gray-700 rounded-xl p-5 hover:border-gray-600 transition">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-gray-100">{o.descricao}</p>
                      <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full">
                        {labelTipo(o.tipo)}
                      </span>
                      {o.seguradoraCliente && (
                        <span className="text-xs bg-orange-900/40 text-orange-300 px-2 py-0.5 rounded-full">
                          {o.seguradoraCliente}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{formatarData(o.criadoEm)}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-lg font-bold text-gray-100">{formatarMoeda(o.valor)}</span>
                    {o.arquivoUrl && (
                      <a href={o.arquivoUrl} target="_blank" rel="noreferrer">
                        <Button size="sm" variant="outline">Ver arquivo</Button>
                      </a>
                    )}
                    {isAdmin && (
                      <>
                        <button onClick={() => abrirEditar(o)} className="p-2 rounded-lg text-gray-400 hover:text-orange-400 hover:bg-gray-700 transition" title="Editar">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => setExcluindo(o)} className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-gray-700 transition" title="Excluir">
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Criar / Editar */}
      <Modal aberto={modal} onFechar={() => setModal(false)} titulo={editando ? 'Editar Orçamento' : 'Novo Orçamento'}>
        <form onSubmit={handleSalvar} className="space-y-4">
          {!editando && (
            <div className="bg-gray-700/50 rounded-lg p-3 text-sm text-gray-300">
              <p className="font-medium text-gray-200 mb-1">Instruções</p>
              <ul className="space-y-1 text-gray-400 list-disc list-inside">
                <li>Selecione o tipo (seguradora, serviço interno ou outro)</li>
                <li>Informe a descrição e o valor acordado</li>
                <li>Se quiser, vincule a um veículo já cadastrado</li>
                <li>O arquivo PDF é opcional</li>
              </ul>
            </div>
          )}

          <Select label="Tipo *" options={tipoOpcoes} value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} />

          <Input
            label="Descrição *"
            placeholder="Ex: Orçamento funilaria lateral — Porto Seguro"
            value={form.descricao}
            onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            required
          />

          <Input
            label="Valor (R$) *"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={form.valor}
            onChange={(e) => setForm({ ...form, valor: e.target.value })}
            required
          />

          <Input
            label="Seguradora / Cliente"
            placeholder="Ex: Porto Seguro, Allianz, João Silva..."
            value={form.seguradoraCliente}
            onChange={(e) => setForm({ ...form, seguradoraCliente: e.target.value })}
          />

          <Input
            label="URL do arquivo (PDF ou imagem)"
            type="url"
            placeholder="https://... (opcional)"
            value={form.arquivoUrl}
            onChange={(e) => setForm({ ...form, arquivoUrl: e.target.value })}
          />

          {!editando && (
            <div>
              <Select
                label="Vincular ao veículo em andamento"
                options={veiculoOpcoes}
                value={form.veiculoId}
                onChange={(e) => setForm({ ...form, veiculoId: e.target.value })}
              />
              {form.veiculoId && (
                <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                  <Car size={12} /> O orçamento será vinculado automaticamente ao veículo selecionado.
                </p>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" type="button" onClick={() => setModal(false)}>Cancelar</Button>
            <Button type="submit" className="flex-1" loading={salvando}>
              {editando ? 'Salvar alterações' : 'Criar Orçamento'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Confirmar exclusão */}
      <Modal aberto={!!excluindo} onFechar={() => setExcluindo(null)} titulo="Excluir Orçamento">
        <div className="space-y-4">
          <p className="text-sm text-gray-300">
            Tem certeza que deseja excluir o orçamento <strong className="text-white">"{excluindo?.descricao}"</strong>?
          </p>
          <p className="text-xs text-gray-500">Se estiver vinculado a algum veículo, o vínculo será desfeito.</p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setExcluindo(null)}>Cancelar</Button>
            <Button variant="danger" className="flex-1" loading={salvando} onClick={handleExcluir}>Excluir</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
