'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { validateAdminCredentials } from '@/lib/auth/admin'
import { createClient } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'

export default function AdminLoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()
  const [traceId] = useState(() => `admin-login-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('=== LOGIN FORM SUBMITTED ===')
    console.log('Email:', formData.email)
    console.log('Password length:', formData.password.length)
    
    setIsLoading(true)
    setError('')

    logger.info('admin login attempt', {
      trace_id: traceId,
      email: formData.email.split('@')[0] + '@***',
      operation: 'admin_login'
    })

    try {
      // First validate admin credentials locally
      if (!validateAdminCredentials(formData.email, formData.password)) {
        setError('Email ou senha incorretos')
        setIsLoading(false)
        return
      }

      // Create a real Supabase session for the admin
      // Try to sign in with Supabase
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      })

      if (signInError) {
        // If user doesn't exist in Supabase, create them
        if (signInError.message?.includes('Invalid login credentials')) {
          logger.info('admin user not found in supabase, creating...', {
            trace_id: traceId,
            operation: 'create_admin_user'
          })

          // Sign up the admin user
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: {
              data: {
                role: 'admin',
                is_admin: true
              }
            }
          })

          if (signUpError) {
            logger.error('failed to create admin user', signUpError, {
              trace_id: traceId
            })
            // Fallback to localStorage auth
            localStorage.setItem('isAdmin', 'true')
            localStorage.setItem('adminEmail', formData.email)
            router.push('/admin')
            return
          }

          // Auto-confirm the user and sign them in
          const { data: finalSignIn, error: finalError } = await supabase.auth.signInWithPassword({
            email: formData.email,
            password: formData.password
          })

          if (finalError) {
            logger.warn('created user but could not sign in, using localStorage fallback', {
              trace_id: traceId,
              error: finalError.message
            })
            // Fallback to localStorage auth
            localStorage.setItem('isAdmin', 'true')
            localStorage.setItem('adminEmail', formData.email)
            router.push('/admin')
            return
          }

          logger.info('admin user created and signed in successfully', {
            trace_id: traceId,
            user_id: finalSignIn.user?.id
          })
        } else {
          logger.error('sign in error', signInError, {
            trace_id: traceId
          })
          // Fallback to localStorage auth
          localStorage.setItem('isAdmin', 'true')
          localStorage.setItem('adminEmail', formData.email)
          router.push('/admin')
          return
        }
      } else {
        logger.info('admin signed in successfully', {
          trace_id: traceId,
          user_id: signInData.user?.id,
          session_id: signInData.session?.access_token?.substring(0, 10)
        })
      }

      // Also set localStorage for backward compatibility
      localStorage.setItem('isAdmin', 'true')
      localStorage.setItem('adminEmail', formData.email)
      
      // Verify session was created
      const { data: { session } } = await supabase.auth.getSession()
      logger.authLog('admin_session_created', {
        hasSession: !!session,
        sessionId: session?.access_token?.substring(0, 10),
        tokenExp: session?.expires_at,
        metadata: {
          trace_id: traceId,
          operation: 'post_login_check'
        }
      })

      // Small delay to ensure session is propagated
      setTimeout(() => {
        router.push('/admin')
      }, 500)
    } catch (error: any) {
      logger.error('admin login failed', error, {
        trace_id: traceId
      })
      setError('Erro ao fazer login. Tente novamente.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="raffle-card">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Painel Administrativo</h1>
            <p className="text-muted-foreground">Faça login para continuar</p>
          </div>

          <form 
            onSubmit={(e) => {
              console.log('Form submit triggered directly')
              handleSubmit(e)
            }}
            className="space-y-4"
          >
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none transition-colors"
                placeholder="admin@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Senha
              </label>
              <input
                type="password"
                id="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none transition-colors"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500 rounded-lg p-3 text-red-500 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              onClick={() => console.log('=== LOGIN BUTTON CLICKED ===')}
              className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}