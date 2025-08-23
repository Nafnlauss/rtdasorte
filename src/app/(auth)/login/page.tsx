'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/useAuthStore'

export default function LoginPage() {
  const [loginField, setLoginField] = useState('') // Email ou telefone
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const setUser = useAuthStore((state) => state.setUser)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      
      // Verificar se é email ou telefone
      const isEmail = loginField.includes('@')
      let loginEmail = loginField
      
      if (!isEmail) {
        // Se for telefone, buscar o usuário pelo telefone
        const { data: userData } = await supabase
          .from('users')
          .select('email')
          .eq('phone', loginField)
          .single()
        
        if (!userData) {
          throw new Error('Usuário não encontrado')
        }
        
        loginEmail = userData.email
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: password,
      })

      if (error) throw error

      if (data.user) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single()

        if (userData) {
          setUser(userData)
          router.push('/dashboard')
        }
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/10 to-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Entrar na sua conta</h2>
          <p className="mt-2 text-muted-foreground">
            Use seu e-mail ou telefone para acessar
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="loginField" className="block text-sm font-medium mb-2">
                E-mail ou Telefone
              </label>
              <input
                id="loginField"
                type="text"
                required
                value={loginField}
                onChange={(e) => setLoginField(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="seu@email.com ou (11) 99999-9999"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Senha
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </div>

          <div className="flex items-center justify-between text-sm">
            <Link
              href="/forgot-password"
              className="text-primary hover:underline"
            >
              Esqueceu sua senha?
            </Link>
            <Link href="/register" className="text-primary hover:underline">
              Criar conta
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}