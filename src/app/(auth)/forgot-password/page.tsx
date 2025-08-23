'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    if (!email) {
      setError('Por favor, insira seu e-mail')
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()
      
      // Configurar URL de redirecionamento
      const redirectUrl = process.env.NEXT_PUBLIC_APP_URL 
        ? `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`
        : `${window.location.origin}/reset-password`
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      })

      if (error) throw error

      setSuccess(true)
      setEmail('')
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar e-mail de recuperação')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/10 to-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Esqueceu sua senha?</h2>
          <p className="mt-2 text-muted-foreground">
            Digite seu e-mail para receber as instruções de recuperação
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-500/10 text-green-600 p-3 rounded-md text-sm">
              <strong>E-mail enviado com sucesso!</strong>
              <p className="mt-1">
                Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
              </p>
              <p className="mt-2 text-xs">
                Não recebeu? Verifique a pasta de spam ou tente novamente em alguns minutos.
              </p>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              E-mail cadastrado
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="seu@email.com"
              disabled={loading || success}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || success}
              className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            >
              {loading ? 'Enviando...' : success ? 'E-mail Enviado ✓' : 'Enviar E-mail de Recuperação'}
            </button>
          </div>

          <div className="flex items-center justify-between text-sm">
            <Link href="/login" className="text-primary hover:underline">
              ← Voltar para o login
            </Link>
            <Link href="/register" className="text-primary hover:underline">
              Criar nova conta
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}