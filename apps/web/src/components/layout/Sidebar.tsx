'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Car, FileText, Users, BarChart3, DatabaseBackup } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import type { Role } from '@jjcar/shared'

const navItems: {
  href: string
  label: string
  icon: any
  rolesAllowed?: Role[]
  permRequired?: 'verFinanceiro'
}[] = [
  { href: '/dashboard', label: 'Painel', icon: LayoutDashboard },
  { href: '/veiculos', label: 'Veículos', icon: Car },
  { href: '/orcamentos', label: 'Orçamentos', icon: FileText, rolesAllowed: ['admin'] },
  { href: '/usuarios', label: 'Usuários', icon: Users, rolesAllowed: ['admin'] },
  { href: '/relatorios', label: 'Relatórios', icon: BarChart3, permRequired: 'verFinanceiro' },
  { href: '/backup', label: 'Backup', icon: DatabaseBackup, rolesAllowed: ['admin', 'financeiro'] },
]

export function Sidebar() {
  const pathname = usePathname()
  const { usuario } = useAuth()

  const itensVisiveis = navItems.filter((item) => {
    if (item.rolesAllowed && !item.rolesAllowed.includes(usuario?.role as Role)) return false
    if (item.permRequired && !usuario?.permissoes[item.permRequired]) return false
    return true
  })

  return (
    <aside className="w-60 bg-gray-900 border-r border-gray-700 flex flex-col min-h-screen">
      <div className="flex items-center justify-center py-4 border-b border-gray-700" style={{ backgroundColor: '#000' }}>
        <img src="/logo.png" alt="JJ CAR" className="h-20 w-auto object-contain" />
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {itensVisiveis.map((item) => {
          const Icon = item.icon
          const ativo = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                ativo
                  ? 'bg-orange-500/20 text-orange-400'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100',
              )}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-700">
        <div className="text-xs text-gray-500">
          <p className="font-medium text-gray-400">{usuario?.nomeDeLogin}</p>
          <p className="capitalize">{usuario?.role}</p>
        </div>
      </div>
    </aside>
  )
}
