'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Upload, X, Image } from 'lucide-react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/ui/Toast'
import type { OrcamentoPublico } from '@jjcar/shared'

const tipoOpcoes = [
  { value: 'seguradora', label: 'Seguradora' },
  { value: 'servico_interno', label: 'Serviço Interno' },
  { value: 'outro', label: 'Outro' },
]

export default function NovoVeiculoPage() {
  const router = useRouter()
  const { toasts, toast, remover } = useToast()
  const [loading, setLoading] = useState(false)
  const [orcamentos, setOrcamentos] = useState<OrcamentoPublico[]>([])
  const [fotos, setFotos] = useState<string[]>([])
  const [fotoInput, setFotoInput] = useState('')

  const [form, setForm] = useState({
    placa: '',
    nomeVeiculo: '',
    descricaoServico: '',
    tipoServico: 'seguradora',
    seguradoraCliente: '',
    valorServico: '',
    orcamentoId: '',
  })

  useEffect(() => {
    api.get<OrcamentoPublico[]>('/orcamentos').then(setOrcamentos).catch(() => {})
  }, [])

  function adicionarFoto() {
    if (!fotoInput.startsWith('http')) {
      toast('erro', 'URL da foto deve começar com http')
      return
    }
    if (fotos.length >= 10) {
      toast('erro', 'Máximo de 10 fotos')
      return
    }
    setFotos([...fotos, fotoInput.trim()])
    setFotoInput('')
  }

  function removerFoto(idx: number) {
    setFotos(fotos.filter((_, i) => i !== idx))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const payload: any = {
        placa: form.placa.toUpperCase(),
        nomeVeiculo: form.nomeVeiculo,
        descricaoServico: form.descricaoServico || undefined,
        tipoServico: form.tipoServico,
        seguradoraCliente: form.seguradoraCliente || undefined,
        valorServico: form.valorServico ? Number(form.valorServico) : undefined,
        fotos,
        orcamentoId: form.orcamentoId || null,
      }
      await api.post('/veiculos', payload)
      toast('sucesso', 'Veículo cadastrado com sucesso!')
      setTimeout(() => router.push('/veiculos'), 1000)
    } catch (err: any) {
      toast('erro', err.erro || 'Erro ao cadastrar veículo')
    } finally {
      setLoading(false)
    }
  }

  const orcamentoOpcoes = [
    { value: '', label: 'Nenhum' },
    ...orcamentos.map((o) => ({
      value: o.id,
      label: `${o.descricao} — R$ ${Number(o.valor).toFixed(2)}`,
    })),
  ]

  return (
    <>
      <ToastContainer toasts={toasts} remover={remover} />
      <div className="max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/veiculos" className="text-gray-400 hover:text-gray-100 transition">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-100">Novo Veículo</h1>
            <p className="text-gray-500 text-sm">Preencha os dados do serviço</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 space-y-4">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Identificação</h2>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Placa *"
                placeholder="ABC-1234"
                value={form.placa}
                onChange={(e) => setForm({ ...form, placa: e.target.value.toUpperCase() })}
                required
              />
              <Input
                label="Nome do veículo *"
                placeholder="Honda Civic 2021"
                value={form.nomeVeiculo}
                onChange={(e) => setForm({ ...form, nomeVeiculo: e.target.value })}
                required
              />
            </div>

            <Select
              label="Tipo de serviço *"
              options={tipoOpcoes}
              value={form.tipoServico}
              onChange={(e) => setForm({ ...form, tipoServico: e.target.value })}
            />

            <Input
              label="Seguradora / Cliente"
              placeholder="Porto Seguro"
              value={form.seguradoraCliente}
              onChange={(e) => setForm({ ...form, seguradoraCliente: e.target.value })}
            />

            <Input
              label="Valor do serviço (R$)"
              type="number"
              step="0.01"
              min="0"
              placeholder="3500.00"
              value={form.valorServico}
              onChange={(e) => setForm({ ...form, valorServico: e.target.value })}
            />
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 space-y-4">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Serviço</h2>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-300">Descrição do serviço</label>
              <textarea
                rows={4}
                placeholder="Descreva o serviço a ser realizado (mínimo 20 caracteres para encerrar)"
                value={form.descricaoServico}
                onChange={(e) => setForm({ ...form, descricaoServico: e.target.value })}
                className="bg-gray-700 border border-gray-600 text-gray-100 rounded-lg px-3 py-2 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              />
              <p className="text-xs text-gray-500">{form.descricaoServico.length} caracteres</p>
            </div>

            <Select
              label="Vincular orçamento"
              options={orcamentoOpcoes}
              value={form.orcamentoId}
              onChange={(e) => setForm({ ...form, orcamentoId: e.target.value })}
            />
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 space-y-4">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
              Fotos ({fotos.length}/10) {fotos.length < 3 && <span className="text-orange-400">— mínimo 3 para encerrar</span>}
            </h2>

            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://... (URL da foto)"
                value={fotoInput}
                onChange={(e) => setFotoInput(e.target.value)}
                className="flex-1 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg px-3 py-2 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), adicionarFoto())}
              />
              <Button type="button" variant="outline" onClick={adicionarFoto}>
                <Upload size={16} />
                Adicionar
              </Button>
            </div>

            {fotos.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {fotos.map((url, idx) => (
                  <div key={idx} className="relative group aspect-video bg-gray-700 rounded-lg overflow-hidden">
                    <img
                      src={url}
                      alt={`Foto ${idx + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).src = ''
                      }}
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => removerFoto(idx)}
                        className="bg-red-600 text-white p-1.5 rounded-lg"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <span className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                      {idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Link href="/veiculos" className="flex-1">
              <Button variant="outline" className="w-full">Cancelar</Button>
            </Link>
            <Button type="submit" loading={loading} className="flex-1">
              Cadastrar Veículo
            </Button>
          </div>
        </form>
      </div>
    </>
  )
}
