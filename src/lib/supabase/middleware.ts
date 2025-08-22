import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { logger } from '@/lib/logger'

export async function updateSession(request: NextRequest) {
  const middlewareTraceId = `mw-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const startTime = Date.now()
  
  logger.info('middleware request start', {
    trace_id: middlewareTraceId,
    route: request.nextUrl.pathname,
    method: request.method,
    operation: 'middleware_auth_check',
    headers: {
      has_cookie: request.headers.has('cookie'),
      has_authorization: request.headers.has('authorization'),
      referer: request.headers.get('referer'),
      user_agent: request.headers.get('user-agent')?.substring(0, 50)
    }
  })
  
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const cookies = request.cookies.getAll()
          logger.debug('middleware cookies getAll', {
            trace_id: middlewareTraceId,
            cookie_count: cookies.length,
            cookie_names: cookies.map(c => c.name)
          })
          return cookies
        },
        setAll(cookiesToSet) {
          logger.debug('middleware cookies setAll', {
            trace_id: middlewareTraceId,
            cookies_to_set: cookiesToSet.length,
            cookie_names: cookiesToSet.map(c => c.name),
            operation: 'cookie_update'
          })
          
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options)
            
            // Log cookie de autenticação sendo definido
            if (name.includes('auth') || name.includes('session')) {
              logger.authLog('cookie_set', {
                metadata: {
                  trace_id: middlewareTraceId,
                  cookie_name: name,
                  has_value: !!value,
                  max_age: options?.maxAge,
                  http_only: options?.httpOnly,
                  secure: options?.secure,
                  same_site: options?.sameSite
                }
              })
            }
          })
        },
      },
    }
  )

  // Verificar sessão primeiro
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  
  logger.authLog('middleware_session_check', {
    hasSession: !!session,
    sessionId: session?.access_token?.substring(0, 10),
    tokenExp: session?.expires_at,
    error: sessionError,
    metadata: {
      trace_id: middlewareTraceId,
      route: request.nextUrl.pathname,
      expires_in_seconds: session?.expires_at ? (session.expires_at - Date.now() / 1000) : null
    }
  })
  
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()
  
  logger.authLog('middleware_user_check', {
    hasUser: !!user,
    userId: user?.id,
    error: userError,
    metadata: {
      trace_id: middlewareTraceId,
      route: request.nextUrl.pathname,
      user_role: user?.role,
      user_email_domain: user?.email?.split('@')[1]
    }
  })

  // Admin route protection
  if (request.nextUrl.pathname.startsWith('/admin')) {
    logger.info('admin route accessed', {
      trace_id: middlewareTraceId,
      route: request.nextUrl.pathname,
      has_user: !!user,
      has_session: !!session,
      operation: 'admin_route_check'
    })
    
    // Allow access to admin login page
    if (request.nextUrl.pathname === '/admin/login') {
      logger.info('admin login page allowed', {
        trace_id: middlewareTraceId,
        route: request.nextUrl.pathname
      })
      return supabaseResponse
    }

    // For now, we'll skip the Supabase auth check for admin routes
    // This is a temporary solution until the service role key is configured
    // The admin routes will rely on client-side authentication
    logger.warn('admin route bypassing server auth check', {
      trace_id: middlewareTraceId,
      route: request.nextUrl.pathname,
      has_user: !!user,
      has_session: !!session,
      reason: 'temporary_bypass_for_client_auth'
    })
    return supabaseResponse
  }

  // General authentication check for other protected routes
  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/register') &&
    !request.nextUrl.pathname.startsWith('/api') &&
    !request.nextUrl.pathname.startsWith('/raffles') &&
    !request.nextUrl.pathname.startsWith('/admin/login') &&
    request.nextUrl.pathname !== '/'
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  const duration = Date.now() - startTime
  logger.info('middleware request complete', {
    trace_id: middlewareTraceId,
    route: request.nextUrl.pathname,
    duration_ms: duration,
    has_user: !!user,
    has_session: !!session,
    operation: 'middleware_complete'
  })
  
  return supabaseResponse
}