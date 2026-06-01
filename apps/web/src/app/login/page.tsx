'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Wrench } from 'lucide-react'
import { login } from '@/lib/auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ nomeDeLogin: '', senha: '' })
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setLoading(true)
    try {
      await login(form)
      router.push('/dashboard')
    } catch (err: any) {
      setErro(err.erro || 'Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500/20 rounded-2xl mb-4">
            <Wrench className="text-orange-400" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-100">JJCAR</h1>
          <p className="text-gray-500 text-sm mt-1">Sistema de Gestão de Serviços</p>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-lg font-semibold text-gray-100 mb-6">Entrar na sua conta</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="login"
              label="Login"
              placeholder="JJCAR.JEFF"
              value={form.nomeDeLogin}
              onChange={(e) => setForm({ ...form, nomeDeLogin: e.target.value.toUpperCase() })}
              required
              autoFocus
            />
            <Input
              id="senha"
              label="Senha"
              type="password"
              placeholder="••••••••"
              value={form.senha}
              onChange={(e) => setForm({ ...form, senha: e.target.value })}
              required
            />

            {erro && (
              <p className="text-sm text-red-400 bg-red-900/30 border border-red-800 rounded-lg px-3 py-2">
                {erro}
              </p>
            )}

            <Button type="submit" loading={loading} className="w-full mt-2" size="lg">
              Entrar
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
