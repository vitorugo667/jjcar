import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  erro?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, erro, id, ...props }, ref) => (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-gray-300">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={cn(
          'bg-gray-800 border border-gray-600 text-gray-100 rounded-lg px-3 py-2 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition',
          erro && 'border-red-500 focus:ring-red-500',
          className,
        )}
        {...props}
      />
      {erro && <p className="text-xs text-red-400">{erro}</p>}
    </div>
  ),
)
Input.displayName = 'Input'
