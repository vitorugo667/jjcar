'use client'

import { useState, useEffect } from 'react'
import { Plus, FileText } from 'lucide-react'
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

export default function OrcamentosPage() {
  const { usuario } = useAuth()
  const [orcamentos, setOrcamentos] = useState<OrcamentoPublico[]>([])
  const [veiculos, setVeiculos] = useState<VeiculoPublico[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const { toasts, toast, remover } = useToast()

  const [form, setForm] = useState({
    tipo: 'seguradora',
    descricao: '',
    arquivoUrl: '',
    valor: '',
    seguradoraCliente: '',
    veiculoId: '',
  })

  const carregar = () => {
    Promise.all([
      api.get<OrcamentoPublico[]>('/orcamentos'),
      api.get<VeiculoPublico[]>('/veiculos?status=em_andamento'),
    ])
      .then(([o, v]) => { setOrcamentos(o); setVeiculos(v) })
      .finally(() => setLoading(false))
  }

  useEffect(carregar, [])

  async function handleCriar(e: React.FormEvent) {
    e.preventDefault()
    try {
      await api.post('/orcamentos', {
        tipo: form.tipo,
        descricao: form.descricao,
        arquivoUrl: form.arquivoUrl || undefined,
        valor: Number(form.valor),
        seguradoraCliente: form.seguradoraCliente || undefined,
        veiculoId: form.veiculoId || undefined,
      })
      toast('sucesso', 'Orçamento criado!')
      setModal(false)
      setForm({ tipo: 'seguradora', descricao: '', arquivoUrl: '', valor: '', seguradoraCliente: '', veiculoId: '' })
      carregar()
    } catch (err: any) {
      toast('erro', err.erro || 'Erro ao criar orçamento')
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-100">Orçamentos</h1>
            <p className="text-gray-500 text-sm mt-1">{orcamentos.length} orçamento{orcamentos.length !== 1 ? 's' : ''}</p>
          </div>
          {usuario?.role === 'admin' && (
            <Button onClick={() => setModal(true)}>
              <Plus size={16} />
              Novo Orçamento
            </Button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-gray-800 rounded-xl animate-pulse" />)}
          </div>
        ) : orcamentos.length === 0 ? (
          <div className="text-center py-16">
            <FileText size={48} className="text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500">Nenhum orçamento cadastrado</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orcamentos.map((o) => (
              <div key={o.id} className="bg-gray-800 border border-gray-700 rounded-xl p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-100">{o.descricao}</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {labelTipo(o.tipo)}
                      {o.seguradoraCliente && ` — ${o.seguradoraCliente}`}
                      {' · '}{formatarData(o.criadoEm)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-100">{formatarMoeda(o.valor)}</span>
                    {o.arquivoUrl && (
                      <a href={o.arquivoUrl} target="_blank" rel="noreferrer">
                        <Button size="sm" variant="outline">Ver arquivo</Button>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal aberto={modal} onFechar={() => setModal(false)} titulo="Novo Orçamento">
        <form onSubmit={handleCriar} className="space-y-4">
          <Select label="Tipo *" options={tipoOpcoes} value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} />
          <Input label="Descrição *" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} required />
          <Input label="Valor (R$) *" type="number" step="0.01" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} required />
          <Input label="Seguradora / Cliente" value={form.seguradoraCliente} onChange={(e) => setForm({ ...form, seguradoraCliente: e.target.value })} />
          <Input label="URL do arquivo (PDF/imagem)" type="url" value={form.arquivoUrl} onChange={(e) => setForm({ ...form, arquivoUrl: e.target.value })} placeholder="https://..." />
          <Select label="Vincular ao veículo" options={veiculoOpcoes} value={form.veiculoId} onChange={(e) => setForm({ ...form, veiculoId: e.target.value })} />
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" type="button" onClick={() => setModal(false)}>Cancelar</Button>
            <Button type="submit" className="flex-1">Criar Orçamento</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
