'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ConfirmPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    // Verificar se o email foi confirmado
    const checkConfirmation = async () => {
      try {
        // Aguardar um momento para garantir que o Supabase processou a confirmação
        setTimeout(() => {
          setStatus('success')
          // Redirecionar para login após 3 segundos
          setTimeout(() => {
            router.push('/login')
          }, 3000)
        }, 1000)
      } catch (error) {
        setStatus('error')
      }
    }

    checkConfirmation()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/10 to-background px-4">
      <div className="w-full max-w-md space-y-8 text-center">
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <h2 className="text-2xl font-bold">Confirmando seu e-mail...</h2>
            <p className="text-muted-foreground">
              Por favor, aguarde enquanto confirmamos seu cadastro
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
              <span className="text-white text-3xl">✓</span>
            </div>
            <h2 className="text-2xl font-bold text-green-600">E-mail confirmado com sucesso!</h2>
            <p className="text-muted-foreground">
              Você será redirecionado para a página de login em instantes...
            </p>
            <Link 
              href="/login"
              className="inline-block mt-4 px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Ir para Login
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto">
              <span className="text-white text-3xl">✗</span>
            </div>
            <h2 className="text-2xl font-bold text-red-600">Erro ao confirmar e-mail</h2>
            <p className="text-muted-foreground">
              Houve um problema ao confirmar seu e-mail. Por favor, tente novamente.
            </p>
            <Link 
              href="/login"
              className="inline-block mt-4 px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Ir para Login
            </Link>
          </>
        )}
      </div>
    </div>
  )
}