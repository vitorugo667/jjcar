'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Camera, FileText, AlertTriangle, Trash2 } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { FotoUpload } from '@/components/ui/FotoUpload'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/ui/Toast'
import { formatarData, formatarMoeda, labelTipo } from '@/lib/utils'
import { validarEncerramento } from '@jjcar/shared'
import type { VeiculoPublico } from '@jjcar/shared'

const nfOpcoes = [
  { value: 'emitida', label: 'Emitida' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'cancelada', label: 'Cancelada' },
  { value: 'nao_aplicavel', label: 'Não aplicável' },
]

export default function VeiculoDetalhePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { usuario } = useAuth()
  const { toasts, toast, remover } = useToast()

  const [veiculo, setVeiculo] = useState<VeiculoPublico | null>(null)
  const [loading, setLoading] = useState(true)
  const [modalNF, setModalNF] = useState(false)
  const [modalEncerrar, setModalEncerrar] = useState(false)
  const [modalExcluir, setModalExcluir] = useState(false)
  const [excluindo, setExcluindo] = useState(false)
  const [nfStatus, setNfStatus] = useState('')
  const [nfNumero, setNfNumero] = useState('')
  const [fotoAmpliada, setFotoAmpliada] = useState<string | null>(null)

  const [encerrarForm, setEncerrarForm] = useState({
    descricaoServico: '',
    valorServico: '',
    fotos: [] as string[],
  })

  useEffect(() => {
    api.get<VeiculoPublico>(`/veiculos/${id}`)
      .then((v) => {
        setVeiculo(v)
        setEncerrarForm((f) => ({
          ...f,
          descricaoServico: v.descricaoServico || '',
          valorServico: v.valorServico ? String(v.valorServico) : '',
          fotos: v.fotos,
        }))
        setNfStatus(v.notaFiscalStatus)
        setNfNumero(v.notaFiscalNumero || '')
      })
      .catch(() => toast('erro', 'Veículo não encontrado'))
      .finally(() => setLoading(false))
  }, [id])

  const podeEncerrar =
    veiculo &&
    veiculo.status === 'em_andamento' &&
    (usuario?.role === 'admin' ||
      usuario?.role === 'gerente' ||
      veiculo.usuarioResponsavel.id === usuario?.id)

  const podeEditarNF = usuario?.role === 'admin' || usuario?.role === 'financeiro'

  async function handleEncerrar() {
    const erros = validarEncerramento({
      placa: veiculo!.placa,
      nomeVeiculo: veiculo!.nomeVeiculo,
      descricaoServico: encerrarForm.descricaoServico,
      valorServico: Number(encerrarForm.valorServico),
      fotos: encerrarForm.fotos,
    })

    if (erros) {
      toast('erro', erros.erros.join(' | '))
      return
    }

    try {
      const atualizado = await api.patch<VeiculoPublico>(`/veiculos/${id}/encerrar`, {
        descricaoServico: encerrarForm.descricaoServico,
        valorServico: Number(encerrarForm.valorServico),
        fotos: encerrarForm.fotos,
      })
      setVeiculo(atualizado)
      setModalEncerrar(false)
      toast('sucesso', 'Veículo encerrado com sucesso!')
    } catch (err: any) {
      toast('erro', err.erros?.join(' | ') || err.erro || 'Erro ao encerrar')
    }
  }

  async function handleAtualizarNF() {
    try {
      const atualizado = await api.patch<VeiculoPublico>(`/veiculos/${id}/nota-fiscal`, {
        notaFiscalStatus: nfStatus,
        notaFiscalNumero: nfNumero || undefined,
      })
      setVeiculo(atualizado)
      setModalNF(false)
      toast('sucesso', 'Nota fiscal atualizada!')
    } catch {
      toast('erro', 'Erro ao atualizar nota fiscal')
    }
  }

  async function handleExcluir() {
    setExcluindo(true)
    try {
      await api.delete(`/veiculos/${id}`)
      toast('sucesso', 'Serviço excluído com sucesso!')
      setTimeout(() => router.push('/veiculos'), 800)
    } catch {
      toast('erro', 'Erro ao excluir serviço')
      setExcluindo(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-800 rounded w-48 animate-pulse" />
        <div className="h-64 bg-gray-800 rounded-xl animate-pulse" />
      </div>
    )
  }

  if (!veiculo) return null

  return (
    <>
      <ToastContainer toasts={toasts} remover={remover} />

      {/* Foto ampliada */}
      {fotoAmpliada && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setFotoAmpliada(null)}
        >
          <img src={fotoAmpliada} alt="Foto ampliada" className="max-w-full max-h-full rounded-xl" />
        </div>
      )}

      <div className="max-w-3xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Link href="/veiculos" className="text-gray-400 hover:text-gray-100 transition">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-orange-400 text-lg font-bold">{veiculo.placa}</span>
                <h1 className="text-xl font-bold text-gray-100">{veiculo.nomeVeiculo}</h1>
              </div>
              <p className="text-sm text-gray-500">
                {veiculo.usuarioResponsavel.nomeDeLogin} · {formatarData(veiculo.criadoEm)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge status={veiculo.status} />
            {usuario?.role === 'admin' && (
              <button
                onClick={() => setModalExcluir(true)}
                className="ml-2 p-2 text-gray-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition"
                title="Excluir serviço"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Fotos */}
        {veiculo.fotos.length > 0 && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4 flex items-center gap-2">
              <Camera size={16} />
              Fotos ({veiculo.fotos.length})
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {veiculo.fotos.map((url, idx) => (
                <button
                  key={idx}
                  onClick={() => setFotoAmpliada(url)}
                  className="aspect-video bg-gray-700 rounded-lg overflow-hidden hover:ring-2 hover:ring-orange-500 transition"
                >
                  <img src={url} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Detalhes */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Detalhes do serviço</h2>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Tipo</p>
              <p className="text-gray-100 font-medium">{labelTipo(veiculo.tipoServico)}</p>
            </div>
            {veiculo.seguradoraCliente && (
              <div>
                <p className="text-gray-500">Seguradora / Cliente</p>
                <p className="text-gray-100 font-medium">{veiculo.seguradoraCliente}</p>
              </div>
            )}
            {veiculo.valorServico && (
              <div>
                <p className="text-gray-500">Valor</p>
                <p className="text-gray-100 font-medium text-lg">{formatarMoeda(veiculo.valorServico)}</p>
              </div>
            )}
            {veiculo.encerradoEm && (
              <div>
                <p className="text-gray-500">Encerrado em</p>
                <p className="text-gray-100 font-medium">{formatarData(veiculo.encerradoEm)}</p>
              </div>
            )}
          </div>

          {veiculo.descricaoServico && (
            <div>
              <p className="text-gray-500 text-sm mb-1">Descrição</p>
              <p className="text-gray-200 text-sm leading-relaxed">{veiculo.descricaoServico}</p>
            </div>
          )}

          {veiculo.orcamento && (
            <div className="bg-gray-700/50 rounded-lg p-3">
              <p className="text-gray-500 text-xs mb-1">Orçamento vinculado</p>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-200">{veiculo.orcamento.descricao}</p>
                {veiculo.orcamento.arquivoUrl && (
                  <a href={veiculo.orcamento.arquivoUrl} target="_blank" rel="noreferrer" className="text-xs text-orange-400 hover:underline">
                    Ver arquivo →
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Nota Fiscal */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-2">
              <FileText size={16} />
              Nota Fiscal
            </h2>
            {podeEditarNF && veiculo.status === 'encerrado' && (
              <Button size="sm" variant="outline" onClick={() => setModalNF(true)}>
                Atualizar NF
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Badge status={veiculo.notaFiscalStatus} />
            {veiculo.notaFiscalNumero && (
              <span className="text-sm text-gray-400">Nº {veiculo.notaFiscalNumero}</span>
            )}
          </div>

          {veiculo.status === 'encerrado' && veiculo.notaFiscalStatus === 'pendente' && podeEditarNF && (
            <div className="mt-3 bg-orange-900/30 border border-orange-700 rounded-lg p-3 flex items-center gap-2">
              <AlertTriangle size={16} className="text-orange-400" />
              <p className="text-sm text-orange-200">Nota fiscal pendente — ação necessária</p>
            </div>
          )}
        </div>

        {/* Ações */}
        {podeEncerrar && (
          <Button onClick={() => setModalEncerrar(true)} size="lg" className="w-full">
            Encerrar Veículo
          </Button>
        )}
      </div>

      {/* Modal: Atualizar NF */}
      <Modal aberto={modalNF} onFechar={() => setModalNF(false)} titulo="Atualizar Nota Fiscal">
        <div className="space-y-4">
          <Select
            label="Status da nota fiscal"
            options={nfOpcoes}
            value={nfStatus}
            onChange={(e) => setNfStatus(e.target.value)}
          />
          <Input
            label="Número da NF (opcional)"
            placeholder="NF-12345"
            value={nfNumero}
            onChange={(e) => setNfNumero(e.target.value)}
          />
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setModalNF(false)}>
              Cancelar
            </Button>
            <Button className="flex-1" onClick={handleAtualizarNF}>
              Salvar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Encerrar veículo */}
      <Modal
        aberto={modalEncerrar}
        onFechar={() => setModalEncerrar(false)}
        titulo="Encerrar Veículo"
        className="max-w-xl"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            Confirme os dados abaixo. Após encerrar, será criado um lançamento financeiro automaticamente.
          </p>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-300">Descrição do serviço</label>
            <textarea
              rows={3}
              value={encerrarForm.descricaoServico}
              onChange={(e) => setEncerrarForm({ ...encerrarForm, descricaoServico: e.target.value })}
              className="bg-gray-700 border border-gray-600 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            />
          </div>

          <Input
            label="Valor do serviço (R$)"
            type="number"
            step="0.01"
            min="0"
            value={encerrarForm.valorServico}
            onChange={(e) => setEncerrarForm({ ...encerrarForm, valorServico: e.target.value })}
          />

          <div>
            <p className="text-sm font-medium text-gray-300 mb-2">
              Fotos
            </p>
            <FotoUpload
              fotos={encerrarForm.fotos}
              onChange={(fotos) => setEncerrarForm({ ...encerrarForm, fotos })}
              max={10}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setModalEncerrar(false)}>
              Cancelar
            </Button>
            <Button variant="danger" className="flex-1" onClick={handleEncerrar}>
              Confirmar Encerramento
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Confirmar exclusão */}
      <Modal aberto={modalExcluir} onFechar={() => setModalExcluir(false)} titulo="Excluir serviço">
        <div className="space-y-4">
          <div className="bg-red-900/30 border border-red-800 rounded-xl p-4 flex items-start gap-3">
            <Trash2 size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-200">Esta ação não pode ser desfeita</p>
              <p className="text-xs text-red-400 mt-1">
                O serviço <span className="font-mono font-bold">{veiculo?.placa}</span> — {veiculo?.nomeVeiculo} será excluído permanentemente.
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-400">
            Tem certeza que deseja excluir este serviço? Todos os dados associados serão removidos.
          </p>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setModalExcluir(false)} disabled={excluindo}>
              Cancelar
            </Button>
            <Button variant="danger" className="flex-1" onClick={handleExcluir} loading={excluindo}>
              <Trash2 size={15} />
              Excluir serviço
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
