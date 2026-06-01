'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Car, CheckCircle, Clock, FileText, Plus, AlertCircle } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatarData, labelTipo } from '@/lib/utils'
import type { VeiculoPublico } from '@jjcar/shared'

export default function DashboardPage() {
  const { usuario } = useAuth()
  const [veiculos, setVeiculos] = useState<VeiculoPublico[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<VeiculoPublico[]>('/veiculos').then(setVeiculos).finally(() => setLoading(false))
  }, [])

  const emAndamento = veiculos.filter((v) => v.status === 'em_andamento').length
  const encerrados = veiculos.filter((v) => v.status === 'encerrado').length
  const aguardando = veiculos.filter((v) => v.status === 'aguardando_aprovacao').length
  const pendentesNF = veiculos.filter((v) => v.status === 'encerrado' && v.notaFiscalStatus === 'pendente').length

  const veiculosRecentes = veiculos.slice(0, 8)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Painel</h1>
          <p className="text-gray-500 text-sm mt-1">Visão geral dos serviços</p>
        </div>
        {(usuario?.role === 'admin' || usuario?.role === 'gerente' || usuario?.permissoes.registrarVeiculos) && (
          <Link href="/veiculos/novo">
            <Button>
              <Plus size={16} />
              Novo Veículo
            </Button>
          </Link>
        )}
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-blue-500/20 rounded-xl">
            <Car className="text-blue-400" size={22} />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-100">{emAndamento}</p>
            <p className="text-sm text-gray-500">Em andamento</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 bg-green-500/20 rounded-xl">
            <CheckCircle className="text-green-400" size={22} />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-100">{encerrados}</p>
            <p className="text-sm text-gray-500">Encerrados</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 bg-yellow-500/20 rounded-xl">
            <Clock className="text-yellow-400" size={22} />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-100">{aguardando}</p>
            <p className="text-sm text-gray-500">Aguardando</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 bg-orange-500/20 rounded-xl">
            <FileText className="text-orange-400" size={22} />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-100">{pendentesNF}</p>
            <p className="text-sm text-gray-500">NF Pendentes</p>
          </div>
        </Card>
      </div>

      {/* Alerta NF pendentes (admin) */}
      {pendentesNF > 0 && (usuario?.role === 'admin' || usuario?.role === 'financeiro') && (
        <div className="bg-orange-900/30 border border-orange-700 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="text-orange-400 flex-shrink-0" size={20} />
          <div className="flex-1">
            <p className="text-sm font-medium text-orange-200">
              {pendentesNF} veículo{pendentesNF > 1 ? 's' : ''} com nota fiscal pendente
            </p>
            <p className="text-xs text-orange-400">Acesse a listagem de veículos para emitir as notas</p>
          </div>
          <Link href="/veiculos?status=encerrado">
            <Button size="sm" variant="outline">Ver veículos</Button>
          </Link>
        </div>
      )}

      {/* Veículos recentes */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-100">Veículos recentes</h2>
          <Link href="/veiculos" className="text-sm text-orange-400 hover:text-orange-300">
            Ver todos →
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-gray-700 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : veiculosRecentes.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">Nenhum veículo cadastrado</p>
        ) : (
          <div className="space-y-2">
            {veiculosRecentes.map((v) => (
              <Link
                key={v.id}
                href={`/veiculos/${v.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-750 hover:bg-gray-700/50 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
                    <Car size={18} className="text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-200 group-hover:text-white">
                      [{v.placa}] {v.nomeVeiculo}
                    </p>
                    <p className="text-xs text-gray-500">
                      {v.usuarioResponsavel.nomeDeLogin} · {formatarData(v.criadoEm)} · {labelTipo(v.tipoServico)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {v.status === 'encerrado' && v.notaFiscalStatus === 'pendente' && (usuario?.role === 'admin' || usuario?.role === 'financeiro') && (
                    <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full font-medium">
                      EMITIR NOTA
                    </span>
                  )}
                  <Badge status={v.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
