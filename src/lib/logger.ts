/**
 * Logger estruturado para diagnóstico de problemas de autenticação
 * Formato: JSON estruturado por linha
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  timestamp: string
  level: LogLevel
  msg: string
  service: string
  env: string
  version?: string
  trace_id?: string
  span_id?: string
  request_id?: string
  route?: string
  operation?: string
  method?: string
  status_code?: number
  duration_ms?: number
  user_id_hash?: string
  feature_flag?: string
  error?: {
    type: string
    message: string
    stack?: string
  }
  db?: {
    collection?: string
    table?: string
    duration_ms?: number
  }
  external?: {
    service?: string
    duration_ms?: number
  }
  auth?: {
    session_id?: string
    token_exp?: number
    refresh_token_exp?: number
    provider?: string
    action?: string
    has_session?: boolean
    has_user?: boolean
    cookie_count?: number
    storage_keys?: string[]
  }
  [key: string]: any
}

class StructuredLogger {
  private service: string
  private env: string
  private version: string

  constructor() {
    this.service = typeof window !== 'undefined' ? 'web' : 'api'
    this.env = process.env.NODE_ENV || 'development'
    this.version = process.env.NEXT_PUBLIC_APP_VERSION || 'unknown'
  }

  private generateTraceId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private hashUserId(userId?: string): string | undefined {
    if (!userId) return undefined
    // Simple hash for user ID - not reversible
    let hash = 0
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return hash.toString(36)
  }

  private sanitizePayload(payload: any): any {
    if (!payload) return payload
    
    const sensitive = ['password', 'token', 'secret', 'key', 'authorization', 'cookie']
    
    if (typeof payload === 'string') {
      return payload
    }
    
    if (typeof payload === 'object') {
      const sanitized: any = Array.isArray(payload) ? [] : {}
      
      for (const key in payload) {
        const lowerKey = key.toLowerCase()
        if (sensitive.some(s => lowerKey.includes(s))) {
          sanitized[key] = '***'
        } else if (typeof payload[key] === 'object') {
          sanitized[key] = this.sanitizePayload(payload[key])
        } else {
          sanitized[key] = payload[key]
        }
      }
      
      return sanitized
    }
    
    return payload
  }

  private formatLog(level: LogLevel, msg: string, context?: Partial<LogContext>): string {
    const log: LogContext = {
      timestamp: new Date().toISOString(),
      level,
      msg,
      service: this.service,
      env: this.env,
      version: this.version,
      ...this.sanitizePayload(context)
    }

    if (context?.user_id_hash) {
      log.user_id_hash = this.hashUserId(context.user_id_hash)
    }

    return JSON.stringify(log)
  }

  debug(msg: string, context?: Partial<LogContext>) {
    if (this.env === 'production') return // Skip debug in production
    console.log(this.formatLog('debug', msg, context))
  }

  info(msg: string, context?: Partial<LogContext>) {
    console.log(this.formatLog('info', msg, context))
  }

  warn(msg: string, context?: Partial<LogContext>) {
    console.warn(this.formatLog('warn', msg, context))
  }

  error(msg: string, error?: Error | any, context?: Partial<LogContext>) {
    const errorContext: Partial<LogContext> = {
      ...context,
      error: error ? {
        type: error.name || 'Error',
        message: error.message || String(error),
        stack: error.stack
      } : undefined
    }
    console.error(this.formatLog('error', msg, errorContext))
  }

  // Método especializado para logs de autenticação
  authLog(action: string, details: {
    userId?: string
    sessionId?: string
    hasSession?: boolean
    hasUser?: boolean
    tokenExp?: number
    refreshTokenExp?: number
    provider?: string
    error?: Error
    metadata?: Record<string, any>
  }) {
    const level: LogLevel = details.error ? 'error' : 'info'
    const msg = `auth ${action}`
    
    const context: Partial<LogContext> = {
      auth: {
        action,
        session_id: details.sessionId,
        has_session: details.hasSession,
        has_user: details.hasUser,
        token_exp: details.tokenExp,
        refresh_token_exp: details.refreshTokenExp,
        provider: details.provider,
        ...details.metadata
      }
    }

    if (details.userId) {
      context.user_id_hash = details.userId
    }

    if (details.error) {
      this.error(msg, details.error, context)
    } else {
      this.info(msg, context)
    }
  }

  // Método para capturar estado dos cookies
  captureCookies(): Record<string, any> {
    if (typeof document === 'undefined') return {}
    
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=')
      if (key) {
        // Mask sensitive cookie values
        const masked = key.toLowerCase().includes('token') || 
                      key.toLowerCase().includes('session') ||
                      key.toLowerCase().includes('auth')
                      ? '***' 
                      : value?.substring(0, 10) + '...'
        acc[key] = masked
      }
      return acc
    }, {} as Record<string, any>)

    return cookies
  }

  // Método para capturar estado do localStorage
  captureLocalStorage(): string[] {
    if (typeof window === 'undefined') return []
    
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) keys.push(key)
    }
    return keys
  }

  // Método para capturar estado completo de autenticação
  captureAuthState(): Record<string, any> {
    return {
      cookies: this.captureCookies(),
      cookie_count: Object.keys(this.captureCookies()).length,
      storage_keys: this.captureLocalStorage(),
      storage_count: this.captureLocalStorage().length,
      timestamp: new Date().toISOString()
    }
  }
}

// Singleton instance
export const logger = new StructuredLogger()