'use client'

import { CheckCircle, XCircle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ToastItem {
  id: string
  tipo: 'sucesso' | 'erro' | 'info'
  mensagem: string
}

const configs = {
  sucesso: { icon: CheckCircle, className: 'bg-green-900 border-green-700 text-green-100' },
  erro: { icon: XCircle, className: 'bg-red-900 border-red-700 text-red-100' },
  info: { icon: Info, className: 'bg-blue-900 border-blue-700 text-blue-100' },
}

export function ToastContainer({
  toasts,
  remover,
}: {
  toasts: ToastItem[]
  remover: (id: string) => void
}) {
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-80">
      {toasts.map((t) => {
        const { icon: Icon, className } = configs[t.tipo]
        return (
          <div
            key={t.id}
            className={cn(
              'flex items-start gap-3 p-4 rounded-lg border shadow-lg animate-in slide-in-from-right',
              className,
            )}
          >
            <Icon size={18} className="mt-0.5 flex-shrink-0" />
            <p className="text-sm flex-1">{t.mensagem}</p>
            <button onClick={() => remover(t.id)} className="opacity-70 hover:opacity-100">
              <X size={16} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
