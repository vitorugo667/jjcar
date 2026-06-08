'use client'

import { useState, useEffect } from 'react'
import {
  Download, DatabaseBackup, Car, FileText, DollarSign,
  Users, CheckCircle, Clock, AlertTriangle, RefreshCw,
} from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/ui/Toast'
import { formatarMoeda } from '@/lib/utils'

interface Resumo {
  veiculos: number
  orcamentos: number
  lancamentos: number
  usuarios: number
  receitaTotal: number
}

interface HistoricoItem {
  tipo: string
  data: string
  tamanho: string
}

function formatarDataHora(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function baixarArquivo(conteudo: string, nome: string, tipo: string) {
  const blob = new Blob([conteudo], { type: tipo })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nome
  a.click()
  URL.revokeObjectURL(url)
}

function jsonParaCSV(dados: Record<string, any>[]): string {
  if (!dados.length) return ''
  const cabecalho = Object.keys(dados[0])
  const linhas = dados.map((row) =>
    cabecalho.map((col) => {
      const v = row[col]
      if (v === null || v === undefined) return ''
      const s = typeof v === 'object' ? JSON.stringify(v) : String(v)
      return s.includes(',') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"`
        : s
    }).join(',')
  )
  return [cabecalho.join(','), ...linhas].join('\n')
}

function tamanhoTexto(str: string): string {
  const bytes = new Blob([str]).size
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

function salvarHistorico(item: HistoricoItem) {
  const existentes: HistoricoItem[] = JSON.parse(
    localStorage.getItem('jjcar_backup_historico') || '[]'
  )
  localStorage.setItem(
    'jjcar_backup_historico',
    JSON.stringify([item, ...existentes].slice(0, 10))
  )
}

export default function BackupPage() {
  const { toasts, toast, remover } = useToast()
  const [resumo, setResumo] = useState<Resumo | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [baixando, setBaixando] = useState<string | null>(null)
  const [historico, setHistorico] = useState<HistoricoItem[]>([])

  useEffect(() => {
    api.get<Resumo>('/backup/resumo')
      .then(setResumo)
      .catch(() => toast('erro', 'Erro ao carregar resumo'))
      .finally(() => setCarregando(false))

    const h = JSON.parse(localStorage.getItem('jjcar_backup_historico') || '[]')
    setHistorico(h)
  }, [])

  async function exportarCSV(secao: 'veiculos' | 'orcamentos' | 'lancamentos' | 'usuarios') {
    setBaixando(secao)
    try {
      const dados = await api.get<any>('/backup')
      const lista = dados[secao] as Record<string, any>[]

      // Achatar objetos aninhados para CSV
      const achatado = lista.map((item: any) => {
        const flat: Record<string, any> = {}
        for (const [k, v] of Object.entries(item)) {
          if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
            for (const [k2, v2] of Object.entries(v)) flat[`${k}_${k2}`] = v2
          } else if (Array.isArray(v)) {
            flat[k] = v.join(' | ')
          } else {
            flat[k] = v
          }
        }
        return flat
      })

      const csv = jsonParaCSV(achatado)
      const nome = `jjcar_${secao}_${new Date().toISOString().split('T')[0]}.csv`
      baixarArquivo('﻿' + csv, nome, 'text/csv;charset=utf-8')

      const item: HistoricoItem = { tipo: `CSV — ${secao}`, data: new Date().toISOString(), tamanho: tamanhoTexto(csv) }
      salvarHistorico(item)
      setHistorico((h) => [item, ...h].slice(0, 10))
      toast('sucesso', `${secao} exportado com sucesso!`)
    } catch {
      toast('erro', 'Erro ao exportar')
    } finally {
      setBaixando(null)
    }
  }

  async function exportarJSON() {
    setBaixando('json')
    try {
      const dados = await api.get<any>('/backup')
      const json = JSON.stringify(dados, null, 2)
      const nome = `jjcar_backup_completo_${new Date().toISOString().split('T')[0]}.json`
      baixarArquivo(json, nome, 'application/json')

      const item: HistoricoItem = { tipo: 'JSON Completo', data: new Date().toISOString(), tamanho: tamanhoTexto(json) }
      salvarHistorico(item)
      setHistorico((h) => [item, ...h].slice(0, 10))
      toast('sucesso', 'Backup completo exportado!')
    } catch {
      toast('erro', 'Erro ao exportar backup')
    } finally {
      setBaixando(null)
    }
  }

  const cartoes = resumo ? [
    { label: 'Veículos', valor: resumo.veiculos, icone: Car, cor: 'text-blue-400', bg: 'bg-blue-900/20 border-blue-700/40', secao: 'veiculos' as const },
    { label: 'Orçamentos', valor: resumo.orcamentos, icone: FileText, cor: 'text-purple-400', bg: 'bg-purple-900/20 border-purple-700/40', secao: 'orcamentos' as const },
    { label: 'Lançamentos', valor: resumo.lancamentos, icone: DollarSign, cor: 'text-green-400', bg: 'bg-green-900/20 border-green-700/40', secao: 'lancamentos' as const },
    { label: 'Usuários', valor: resumo.usuarios, icone: Users, cor: 'text-orange-400', bg: 'bg-orange-900/20 border-orange-700/40', secao: 'usuarios' as const },
  ] : []

  return (
    <>
      <ToastContainer toasts={toasts} remover={remover} />

      <div className="max-w-3xl space-y-8">

        {/* Cabeçalho */}
        <div>
          <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-3">
            <DatabaseBackup size={26} className="text-orange-400" />
            Backup de Dados
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Exporte os dados da oficina para guardar uma cópia de segurança ou migrar para outro sistema.
          </p>
        </div>

        {/* Aviso */}
        <div className="bg-amber-900/20 border border-amber-700/50 rounded-xl p-4 flex gap-3">
          <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-200">
            Recomendamos fazer backup <strong>pelo menos uma vez por semana</strong>. Os arquivos exportados contêm todos os dados cadastrados no sistema.
          </p>
        </div>

        {/* Resumo do banco */}
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Resumo do banco de dados</h2>
          {carregando ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => <div key={i} className="h-20 bg-gray-800 rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {cartoes.map(({ label, valor, icone: Icone, cor, bg, secao }) => (
                <div key={label} className={`border rounded-xl p-4 flex items-center justify-between ${bg}`}>
                  <div>
                    <p className="text-xs text-gray-400">{label}</p>
                    <p className={`text-2xl font-bold ${cor}`}>{valor}</p>
                    <p className="text-xs text-gray-500">registros</p>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <Icone size={22} className={cor} />
                    <button
                      onClick={() => exportarCSV(secao)}
                      disabled={!!baixando}
                      className="text-xs text-gray-400 hover:text-orange-400 transition flex items-center gap-1 disabled:opacity-40"
                    >
                      {baixando === secao ? <RefreshCw size={11} className="animate-spin" /> : <Download size={11} />}
                      CSV
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {resumo && (
            <p className="text-sm text-gray-500 mt-3">
              Receita total registrada: <span className="text-green-400 font-medium">{formatarMoeda(resumo.receitaTotal)}</span>
            </p>
          )}
        </div>

        {/* Exportações */}
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Exportar por seção</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Veículos', desc: 'Placa, nome, status, valor, datas', secao: 'veiculos' as const },
              { label: 'Orçamentos', desc: 'Valor, tipo, seguradora, arquivo', secao: 'orcamentos' as const },
              { label: 'Lançamentos Financeiros', desc: 'Datas, valores, NF, tipo', secao: 'lancamentos' as const },
              { label: 'Usuários', desc: 'Logins, roles, permissões', secao: 'usuarios' as const },
            ].map(({ label, desc, secao }) => (
              <div key={secao} className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                <p className="text-sm font-medium text-gray-200">{label}</p>
                <p className="text-xs text-gray-500 mt-0.5 mb-3">{desc}</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  loading={baixando === secao}
                  onClick={() => exportarCSV(secao)}
                >
                  <Download size={13} /> Baixar CSV
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Backup completo */}
        <div className="bg-gray-800 border border-orange-700/40 rounded-xl p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-gray-100 flex items-center gap-2">
                <DatabaseBackup size={18} className="text-orange-400" />
                Backup Completo
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                Exporta <strong className="text-gray-200">todos os dados</strong> em um único arquivo JSON — veículos, orçamentos, lançamentos e usuários. Ideal para guardar uma cópia completa do sistema.
              </p>
            </div>
            <Button
              loading={baixando === 'json'}
              onClick={exportarJSON}
              className="shrink-0"
            >
              <Download size={15} /> Baixar JSON
            </Button>
          </div>
        </div>

        {/* Histórico */}
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Histórico de exports (este dispositivo)</h2>
          {historico.length === 0 ? (
            <div className="bg-gray-800/50 border border-dashed border-gray-700 rounded-xl p-6 text-center">
              <Clock size={32} className="text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Nenhum export realizado neste dispositivo ainda.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {historico.map((h, i) => (
                <div key={i} className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle size={15} className="text-green-400 shrink-0" />
                    <div>
                      <p className="text-sm text-gray-200">{h.tipo}</p>
                      <p className="text-xs text-gray-500">{formatarDataHora(h.data)}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 bg-gray-700 px-2 py-0.5 rounded">{h.tamanho}</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </>
  )
}
