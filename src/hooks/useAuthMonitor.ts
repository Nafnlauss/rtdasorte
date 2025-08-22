/**
 * Hook para monitorar estado de autenticação e detectar problemas
 */

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'

interface AuthMonitorOptions {
  traceId: string
  route: string
  checkInterval?: number
}

export function useAuthMonitor(options: AuthMonitorOptions) {
  const { traceId, route, checkInterval = 30000 } = options // Check every 30 seconds by default
  const supabase = createClient()
  const intervalRef = useRef<NodeJS.Timeout>()
  const lastSessionRef = useRef<string | null>(null)

  useEffect(() => {
    const monitorAuth = async () => {
      try {
        // Check current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        const currentSessionId = session?.access_token?.substring(0, 10) || null
        const sessionChanged = lastSessionRef.current !== null && lastSessionRef.current !== currentSessionId
        
        if (sessionChanged) {
          logger.warn('session change detected', {
            trace_id: traceId,
            route,
            operation: 'auth_monitor',
            auth: {
              previous_session: lastSessionRef.current,
              current_session: currentSessionId,
              has_session: !!session,
              session_error: sessionError?.message
            }
          })
        }
        
        lastSessionRef.current = currentSessionId
        
        // Log session status
        logger.debug('auth monitor check', {
          trace_id: traceId,
          route,
          operation: 'auth_monitor',
          auth: {
            has_session: !!session,
            session_id: currentSessionId,
            token_exp: session?.expires_at,
            expires_in_seconds: session?.expires_at ? (session.expires_at - Date.now() / 1000) : null,
            is_expired: session?.expires_at ? session.expires_at * 1000 < Date.now() : false
          }
        })
        
        // Check if session is about to expire (within 5 minutes)
        if (session?.expires_at) {
          const expiresInMs = (session.expires_at * 1000) - Date.now()
          const expiresInMinutes = expiresInMs / 1000 / 60
          
          if (expiresInMinutes < 5 && expiresInMinutes > 0) {
            logger.warn('session expiring soon', {
              trace_id: traceId,
              route,
              operation: 'auth_monitor',
              auth: {
                expires_in_minutes: expiresInMinutes,
                session_id: currentSessionId
              }
            })
            
            // Try to refresh the session
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
            
            if (refreshError) {
              logger.error('session refresh failed', refreshError, {
                trace_id: traceId,
                route,
                operation: 'auth_monitor_refresh'
              })
            } else {
              logger.info('session refreshed successfully', {
                trace_id: traceId,
                route,
                operation: 'auth_monitor_refresh',
                auth: {
                  new_session_id: refreshData.session?.access_token?.substring(0, 10),
                  new_token_exp: refreshData.session?.expires_at
                }
              })
            }
          }
        }
      } catch (error) {
        logger.error('auth monitor error', error as Error, {
          trace_id: traceId,
          route,
          operation: 'auth_monitor'
        })
      }
    }

    // Initial check
    monitorAuth()

    // Set up interval
    intervalRef.current = setInterval(monitorAuth, checkInterval)

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      logger.authLog('auth_state_change', {
        hasSession: !!session,
        sessionId: session?.access_token?.substring(0, 10),
        userId: session?.user?.id,
        metadata: {
          trace_id: traceId,
          route,
          event,
          user_email: session?.user?.email,
          provider: session?.user?.app_metadata?.provider
        }
      })

      // Capture auth state after change
      const authState = logger.captureAuthState()
      logger.info('auth state changed', {
        trace_id: traceId,
        route,
        operation: 'auth_state_change',
        event,
        auth: authState
      })

      // Special handling for SIGNED_OUT event
      if (event === 'SIGNED_OUT') {
        logger.warn('user signed out detected', {
          trace_id: traceId,
          route,
          operation: 'auth_monitor',
          auth: {
            event,
            last_known_session: lastSessionRef.current
          }
        })
      }

      // Special handling for TOKEN_REFRESHED event
      if (event === 'TOKEN_REFRESHED') {
        logger.info('token refreshed', {
          trace_id: traceId,
          route,
          operation: 'auth_monitor',
          auth: {
            event,
            new_session_id: session?.access_token?.substring(0, 10),
            new_token_exp: session?.expires_at
          }
        })
      }
    })

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      subscription.unsubscribe()
    }
  }, [traceId, route, checkInterval])

  // Return a function to manually check auth
  const checkAuth = async () => {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    logger.info('manual auth check', {
      trace_id: traceId,
      route,
      operation: 'manual_auth_check',
      auth: {
        has_session: !!session,
        session_id: session?.access_token?.substring(0, 10),
        error: error?.message
      }
    })
    
    return { session, error }
  }

  return { checkAuth }
}