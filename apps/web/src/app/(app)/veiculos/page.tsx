'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Search, Filter, Car } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { formatarData, formatarMoeda, labelTipo } from '@/lib/utils'
import type { VeiculoPublico } from '@jjcar/shared'

const statusOpcoes = [
  { value: '', label: 'Todos os status' },
  { value: 'em_andamento', label: 'Em andamento' },
  { value: 'aguardando_aprovacao', label: 'Aguardando aprovação' },
  { value: 'encerrado', label: 'Encerrado' },
]

export default function VeiculosPage() {
  const { usuario } = useAuth()
  const [veiculos, setVeiculos] = useState<VeiculoPublico[]>([])
  const [filtroPlaca, setFiltroPlaca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams()
    if (filtroStatus) params.set('status', filtroStatus)
    if (filtroPlaca) params.set('placa', filtroPlaca)

    api.get<VeiculoPublico[]>(`/veiculos?${params}`).then(setVeiculos).finally(() => setLoading(false))
  }, [filtroStatus, filtroPlaca])

  const podeRegistrar =
    usuario?.role === 'admin' || usuario?.role === 'gerente' || usuario?.permissoes.registrarVeiculos

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Veículos</h1>
          <p className="text-gray-500 text-sm mt-1">{veiculos.length} veículo{veiculos.length !== 1 ? 's' : ''}</p>
        </div>
        {podeRegistrar && (
          <Link href="/veiculos/novo">
            <Button>
              <Plus size={16} />
              Novo Veículo
            </Button>
          </Link>
        )}
      </div>

      {/* Filtros */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por placa..."
            value={filtroPlaca}
            onChange={(e) => setFiltroPlaca(e.target.value.toUpperCase())}
            className="w-full bg-gray-800 border border-gray-600 text-gray-100 rounded-lg pl-9 pr-3 py-2 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <Select
          options={statusOpcoes}
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          className="w-48"
        />
      </div>

      {/* Listagem */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : veiculos.length === 0 ? (
        <div className="text-center py-16">
          <Car size={48} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500">Nenhum veículo encontrado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {veiculos.map((v) => (
            <Link
              key={v.id}
              href={`/veiculos/${v.id}`}
              className="block bg-gray-800 border border-gray-700 rounded-xl p-4 hover:border-orange-500/50 transition group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-700 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Car size={20} className="text-gray-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-orange-400 font-medium">{v.placa}</span>
                      <span className="text-gray-100 font-medium">{v.nomeVeiculo}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {v.usuarioResponsavel.nomeDeLogin} · {formatarData(v.criadoEm)} · {labelTipo(v.tipoServico)}
                      {v.seguradoraCliente && ` — ${v.seguradoraCliente}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {v.valorServico && (
                    <span className="text-sm font-medium text-gray-300">
                      {formatarMoeda(v.valorServico)}
                    </span>
                  )}
                  <div className="flex flex-col items-end gap-1">
                    <Badge status={v.status} />
                    {v.status === 'encerrado' && (
                      <Badge status={v.notaFiscalStatus} />
                    )}
                  </div>
                  {v.status === 'encerrado' && v.notaFiscalStatus === 'pendente' &&
                    (usuario?.role === 'admin' || usuario?.role === 'financeiro') && (
                      <span className="text-xs bg-orange-500 text-white px-2 py-1 rounded-lg font-bold animate-pulse">
                        EMITIR NOTA
                      </span>
                    )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
