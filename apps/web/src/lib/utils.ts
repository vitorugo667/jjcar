import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor)
}

export function formatarData(data: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(data))
}

export function labelStatus(status: string): string {
  const map: Record<string, string> = {
    em_andamento: 'Em andamento',
    aguardando_aprovacao: 'Aguardando aprovação',
    encerrado: 'Encerrado',
    cancelado: 'Cancelado',
    pendente: 'Pendente',
    emitida: 'Emitida',
    cancelada: 'Cancelada',
    nao_aplicavel: 'N/A',
  }
  return map[status] ?? status
}

export function labelTipo(tipo: string): string {
  const map: Record<string, string> = {
    servico_interno: 'Serviço Interno',
    seguradora: 'Seguradora',
    outro: 'Outro',
  }
  return map[tipo] ?? tipo
}

export function corStatus(status: string): string {
  const map: Record<string, string> = {
    em_andamento: 'bg-blue-100 text-blue-800',
    aguardando_aprovacao: 'bg-yellow-100 text-yellow-800',
    encerrado: 'bg-green-100 text-green-800',
    cancelado: 'bg-red-100 text-red-800',
    pendente: 'bg-orange-100 text-orange-800',
    emitida: 'bg-green-100 text-green-800',
    cancelada: 'bg-red-100 text-red-800',
    nao_aplicavel: 'bg-gray-100 text-gray-800',
  }
  return map[status] ?? 'bg-gray-100 text-gray-800'
}
