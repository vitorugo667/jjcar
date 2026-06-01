'use client'

import { useRef, useState } from 'react'
import { Camera, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface FotoUploadProps {
  fotos: string[]
  onChange: (fotos: string[]) => void
  max?: number
  className?: string
}

async function uploadFoto(file: File, token?: string): Promise<string> {
  const form = new FormData()
  form.append('file', file)

  const res = await fetch(`${BASE}/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ erro: 'Erro ao enviar foto' }))
    throw new Error(err.erro || 'Erro ao enviar foto')
  }

  const data = await res.json()
  return data.url as string
}

export function FotoUpload({ fotos, onChange, max = 10, className }: FotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  function getToken() {
    if (typeof document === 'undefined') return undefined
    return document.cookie.match(/jjcar_token=([^;]+)/)?.[1]
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    if (fotos.length >= max) {
      setErro(`Máximo de ${max} fotos`)
      return
    }

    setErro('')
    setEnviando(true)

    const token = getToken()
    const novas: string[] = []

    for (const file of Array.from(files)) {
      if (fotos.length + novas.length >= max) break
      try {
        const url = await uploadFoto(file, token)
        novas.push(url)
      } catch (e: any) {
        setErro(e.message || 'Erro ao enviar foto')
        break
      }
    }

    if (novas.length > 0) onChange([...fotos, ...novas])
    setEnviando(false)
  }

  function remover(idx: number) {
    onChange(fotos.filter((_, i) => i !== idx))
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Área de clique para selecionar fotos */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={enviando || fotos.length >= max}
        className={cn(
          'w-full border-2 border-dashed border-gray-600 rounded-xl py-8 flex flex-col items-center gap-2 transition',
          'hover:border-orange-500 hover:bg-orange-500/5',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          enviando && 'cursor-wait',
        )}
      >
        {enviando ? (
          <>
            <Loader2 size={28} className="text-orange-400 animate-spin" />
            <span className="text-sm text-gray-400">Enviando foto...</span>
          </>
        ) : (
          <>
            <Camera size={28} className="text-gray-400" />
            <span className="text-sm text-gray-300 font-medium">
              Toque para tirar foto ou escolher da galeria
            </span>
            <span className="text-xs text-gray-500">
              {fotos.length}/{max} fotos · JPG, PNG, WEBP · máx. 10MB cada
            </span>
          </>
        )}
      </button>

      {/* Input oculto — aceita câmera no celular */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {erro && (
        <p className="text-sm text-red-400 bg-red-900/30 border border-red-800 rounded-lg px-3 py-2">
          {erro}
        </p>
      )}

      {/* Miniaturas */}
      {fotos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {fotos.map((url, idx) => (
            <div
              key={idx}
              className="relative aspect-video bg-gray-700 rounded-lg overflow-hidden group"
            >
              <img
                src={url}
                alt={`Foto ${idx + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => remover(idx)}
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
  )
}
