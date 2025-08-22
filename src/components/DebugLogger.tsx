/**
 * Componente para exibir logs de debug em desenvolvimento
 * Captura e exibe logs do console em uma interface visual
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { logger } from '@/lib/logger'

interface LogEntry {
  timestamp: string
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  data?: any
}

export default function DebugLogger() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [filter, setFilter] = useState<'all' | 'auth' | 'error'>('all')
  const originalConsole = useRef<{
    log: typeof console.log
    warn: typeof console.warn
    error: typeof console.error
  }>()

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV !== 'development') {
      return
    }

    // Store original console methods
    originalConsole.current = {
      log: console.log,
      warn: console.warn,
      error: console.error
    }

    // Override console methods to capture logs
    const captureLog = (level: LogEntry['level']) => {
      return (...args: any[]) => {
        // Call original method
        if (originalConsole.current) {
          originalConsole.current[level === 'debug' || level === 'info' ? 'log' : level](...args)
        }

        // Parse and capture structured logs
        const logStr = args[0]
        if (typeof logStr === 'string' && logStr.startsWith('{')) {
          try {
            const parsed = JSON.parse(logStr)
            const entry: LogEntry = {
              timestamp: parsed.timestamp || new Date().toISOString(),
              level: parsed.level || level,
              message: parsed.msg || 'No message',
              data: parsed
            }
            
            setLogs(prev => [...prev.slice(-99), entry]) // Keep last 100 logs
          } catch (e) {
            // Not a structured log, ignore for display
          }
        }
      }
    }

    console.log = captureLog('info')
    console.warn = captureLog('warn')
    console.error = captureLog('error')

    // Log that debug logger is active
    logger.info('debug logger activated', {
      operation: 'debug_logger_init'
    })

    return () => {
      // Restore original console methods
      if (originalConsole.current) {
        console.log = originalConsole.current.log
        console.warn = originalConsole.current.warn
        console.error = originalConsole.current.error
      }
    }
  }, [])

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true
    if (filter === 'auth') return log.data?.auth || log.message.includes('auth')
    if (filter === 'error') return log.level === 'error' || log.level === 'warn'
    return true
  })

  const authLogs = logs.filter(log => log.data?.auth || log.message.includes('auth'))
  const errorLogs = logs.filter(log => log.level === 'error')
  const lastAuthState = authLogs[authLogs.length - 1]?.data?.auth

  return (
    <>
      {/* Floating Debug Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 transition-colors"
        title="Toggle Debug Logger"
      >
        <span className="flex items-center gap-2">
          🐛 {errorLogs.length > 0 && (
            <span className="bg-red-500 text-xs px-1.5 py-0.5 rounded-full">
              {errorLogs.length}
            </span>
          )}
        </span>
      </button>

      {/* Debug Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50 w-[600px] max-h-[500px] bg-gray-900 text-gray-100 rounded-lg shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-700">
            <h3 className="font-mono text-sm font-bold">Debug Logger</h3>
            <div className="flex items-center gap-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="bg-gray-700 text-xs px-2 py-1 rounded"
              >
                <option value="all">All ({logs.length})</option>
                <option value="auth">Auth ({authLogs.length})</option>
                <option value="error">Errors ({errorLogs.length})</option>
              </select>
              <button
                onClick={() => setLogs([])}
                className="text-xs bg-red-600 px-2 py-1 rounded hover:bg-red-700"
              >
                Clear
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Auth Status Bar */}
          {lastAuthState && (
            <div className="bg-gray-800 px-4 py-2 border-b border-gray-700">
              <div className="text-xs font-mono">
                <span className="text-gray-400">Auth Status:</span>{' '}
                <span className={lastAuthState.has_session ? 'text-green-400' : 'text-red-400'}>
                  {lastAuthState.has_session ? 'Authenticated' : 'Not Authenticated'}
                </span>
                {lastAuthState.session_id && (
                  <span className="text-gray-500 ml-2">
                    Session: {lastAuthState.session_id}...
                  </span>
                )}
                {lastAuthState.expires_in_seconds && (
                  <span className="text-yellow-400 ml-2">
                    Expires in: {Math.round(lastAuthState.expires_in_seconds / 60)}m
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Logs */}
          <div className="overflow-y-auto max-h-[400px] p-2 space-y-1 font-mono text-xs">
            {filteredLogs.length === 0 ? (
              <div className="text-gray-500 text-center py-4">No logs to display</div>
            ) : (
              filteredLogs.map((log, i) => (
                <div
                  key={i}
                  className={`p-2 rounded ${
                    log.level === 'error' ? 'bg-red-900/30 border border-red-700' :
                    log.level === 'warn' ? 'bg-yellow-900/30 border border-yellow-700' :
                    log.level === 'info' ? 'bg-blue-900/30' :
                    'bg-gray-800'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className={`${
                      log.level === 'error' ? 'text-red-400' :
                      log.level === 'warn' ? 'text-yellow-400' :
                      log.level === 'info' ? 'text-blue-400' :
                      'text-gray-400'
                    }`}>
                      [{log.level.toUpperCase()}]
                    </span>
                    <span className="text-gray-500">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="text-gray-200 flex-1">{log.message}</span>
                  </div>
                  
                  {/* Show important data */}
                  {log.data && (
                    <details className="mt-1 ml-4">
                      <summary className="cursor-pointer text-gray-500 hover:text-gray-300">
                        View details
                      </summary>
                      <pre className="mt-1 text-[10px] text-gray-400 overflow-x-auto">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  )
}