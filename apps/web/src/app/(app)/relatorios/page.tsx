'use client'

import { useState, useEffect } from 'react'
import { Download, TrendingUp, Car, DollarSign } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { api } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatarMoeda, formatarData } from '@/lib/utils'
import type { RelatorioFinanceiro } from '@jjcar/shared'

const CORES = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899']

export default function RelatoriosPage() {
  const { usuario } = useAuth()
  const [relatorio, setRelatorio] = useState<RelatorioFinanceiro | null>(null)
  const [loading, setLoading] = useState(true)
  const [filtros, setFiltros] = useState({ de: '', ate: '' })

  const carregar = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filtros.de) params.set('de', filtros.de)
    if (filtros.ate) params.set('ate', filtros.ate)
    api
      .get<RelatorioFinanceiro>(`/relatorios/financeiro?${params}`)
      .then(setRelatorio)
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(carregar, [])

  if (!usuario?.permissoes.verFinanceiro) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <DollarSign size={48} className="text-gray-600 mb-4" />
        <p className="text-gray-400 font-medium">Acesso restrito</p>
        <p className="text-gray-600 text-sm">Você não tem permissão para ver o relatório financeiro</p>
      </div>
    )
  }

  async function exportarCSV() {
    const params = new URLSearchParams({ formato: 'csv' })
    if (filtros.de) params.set('de', filtros.de)
    if (filtros.ate) params.set('ate', filtros.ate)

    const token = document.cookie.match(/jjcar_token=([^;]+)/)?.[1]
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/relatorios/financeiro/exportar?${params}`,
      { headers: { Authorization: `Bearer ${token}` } },
    )
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'relatorio-jjcar.csv'
    a.click()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Relatório Financeiro</h1>
          <p className="text-gray-500 text-sm mt-1">
            {relatorio && `${formatarData(relatorio.periodo.de)} — ${formatarData(relatorio.periodo.ate)}`}
          </p>
        </div>
        <div className="flex gap-2">
          {(usuario?.role === 'admin' || usuario?.role === 'financeiro') && (
            <Button variant="outline" onClick={exportarCSV}>
              <Download size={16} />
              Exportar CSV
            </Button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Data inicial</label>
          <input
            type="date"
            value={filtros.de}
            onChange={(e) => setFiltros({ ...filtros, de: e.target.value })}
            className="bg-gray-800 border border-gray-600 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Data final</label>
          <input
            type="date"
            value={filtros.ate}
            onChange={(e) => setFiltros({ ...filtros, ate: e.target.value })}
            className="bg-gray-800 border border-gray-600 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <Button onClick={carregar} loading={loading}>Filtrar</Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : !relatorio ? null : (
        <>
          {/* Cards resumo */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="flex items-center gap-4">
              <div className="p-3 bg-orange-500/20 rounded-xl">
                <DollarSign className="text-orange-400" size={22} />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-100">
                  {formatarMoeda(relatorio.resumo.receitaTotal)}
                </p>
                <p className="text-sm text-gray-500">Receita total</p>
              </div>
            </Card>

            <Card className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/20 rounded-xl">
                <Car className="text-blue-400" size={22} />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-100">{relatorio.resumo.totalVeiculos}</p>
                <p className="text-sm text-gray-500">Veículos encerrados</p>
              </div>
            </Card>

            <Card className="flex items-center gap-4">
              <div className="p-3 bg-green-500/20 rounded-xl">
                <TrendingUp className="text-green-400" size={22} />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-100">
                  {formatarMoeda(relatorio.resumo.ticketMedio)}
                </p>
                <p className="text-sm text-gray-500">Ticket médio</p>
              </div>
            </Card>
          </div>

          {/* Gráfico receita por mês */}
          {relatorio.graficoReceitaMes.length > 0 && (
            <Card>
              <CardTitle className="mb-4">Receita por mês</CardTitle>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={relatorio.graficoReceitaMes}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="mes" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
                    formatter={(v: number) => [formatarMoeda(v), 'Receita']}
                  />
                  <Bar dataKey="valor" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Por tipo */}
            {relatorio.graficoPorTipo.length > 0 && (
              <Card>
                <CardTitle className="mb-4">Por tipo de serviço</CardTitle>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={relatorio.graficoPorTipo}
                      dataKey="valor"
                      nameKey="tipo"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      label={({ tipo, percent }) => `${tipo} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {relatorio.graficoPorTipo.map((_, idx) => (
                        <Cell key={idx} fill={CORES[idx % CORES.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
                      formatter={(v: number) => [formatarMoeda(v)]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            )}

            {/* Por usuário */}
            {relatorio.graficoPorUsuario.length > 0 && (
              <Card>
                <CardTitle className="mb-4">Por usuário</CardTitle>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={relatorio.graficoPorUsuario} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 11 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="usuarioLogin" tick={{ fill: '#9ca3af', fontSize: 11 }} width={90} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
                      formatter={(v: number) => [formatarMoeda(v)]}
                    />
                    <Bar dataKey="valor" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            )}
          </div>

          {/* Tabela de lançamentos */}
          <Card>
            <CardTitle className="mb-4">Lançamentos ({relatorio.lancamentos.length})</CardTitle>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700 text-gray-400 text-xs uppercase">
                    <th className="text-left py-2 pr-4">Data</th>
                    <th className="text-left py-2 pr-4">Usuário</th>
                    <th className="text-left py-2 pr-4">Placa</th>
                    <th className="text-left py-2 pr-4">Veículo</th>
                    <th className="text-left py-2 pr-4">Tipo</th>
                    <th className="text-left py-2 pr-4">Seguradora</th>
                    <th className="text-right py-2 pr-4">Valor</th>
                    <th className="text-center py-2">NF</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {relatorio.lancamentos.map((l) => (
                    <tr key={l.id} className="hover:bg-gray-700/20">
                      <td className="py-3 pr-4 text-gray-400">{formatarData(l.data)}</td>
                      <td className="py-3 pr-4 font-mono text-xs text-gray-300">{l.usuarioLogin}</td>
                      <td className="py-3 pr-4 font-mono text-orange-400 font-medium">{l.placa}</td>
                      <td className="py-3 pr-4 text-gray-200">{l.nomeVeiculo}</td>
                      <td className="py-3 pr-4 text-gray-400 capitalize">{l.tipoServico.replace('_', ' ')}</td>
                      <td className="py-3 pr-4 text-gray-400">{l.seguradoraCliente || '—'}</td>
                      <td className="py-3 pr-4 text-right font-medium text-gray-100">{formatarMoeda(l.valor)}</td>
                      <td className="py-3 text-center">
                        <Badge status={l.notaFiscalStatus} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
