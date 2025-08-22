/**
 * Monitor de Browser para Captura de Erros e Performance
 * Intercepta console, network e erros do navegador
 */

import logger from './logger';

export class BrowserMonitor {
  private networkRequests: any[] = [];
  private consoleErrors: any[] = [];
  private originalFetch: typeof fetch;
  private originalXHROpen: typeof XMLHttpRequest.prototype.open;

  constructor() {
    this.originalFetch = window.fetch;
    this.originalXHROpen = XMLHttpRequest.prototype.open;
  }

  /**
   * Inicia monitoramento completo do browser
   */
  startMonitoring(): void {
    this.interceptConsole();
    this.interceptNetwork();
    this.monitorPerformance();
    this.setupErrorHandlers();
    
    logger.info('Browser monitoring started', {
      operation: 'browser_monitor_start',
      monitors: ['console', 'network', 'performance', 'errors']
    });
  }

  /**
   * Intercepta console.error e console.warn
   */
  private interceptConsole(): void {
    const originalError = console.error;
    const originalWarn = console.warn;

    console.error = (...args) => {
      const errorInfo = {
        type: 'console.error',
        message: args[0],
        arguments: args,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        stack: new Error().stack
      };
      
      this.consoleErrors.push(errorInfo);
      
      logger.error('Console error captured', args[0], {
        operation: 'console_error',
        route: window.location.pathname,
        console_args_count: args.length
      });
      
      originalError.apply(console, args);
    };

    console.warn = (...args) => {
      logger.warn('Console warning captured', {
        operation: 'console_warn',
        route: window.location.pathname,
        message: args[0],
        args_count: args.length
      });
      
      originalWarn.apply(console, args);
    };
  }

  /**
   * Intercepta requisições de rede (fetch e XHR)
   */
  private interceptNetwork(): void {
    // Interceptar fetch
    window.fetch = async (...args) => {
      const [resource, config] = args;
      const url = typeof resource === 'string' ? resource : resource.url;
      const method = config?.method || 'GET';
      const startTime = performance.now();
      const requestId = `fetch_${Date.now()}_${Math.random()}`;

      logger.debug('Network request started', {
        operation: 'network_request_start',
        request_id: requestId,
        url: this.sanitizeUrl(url),
        method
      });

      try {
        const response = await this.originalFetch.apply(window, args);
        const duration = Math.round(performance.now() - startTime);
        
        const requestInfo = {
          id: requestId,
          type: 'fetch',
          url: this.sanitizeUrl(url),
          method,
          status: response.status,
          statusText: response.statusText,
          duration,
          timestamp: new Date().toISOString(),
          ok: response.ok
        };
        
        this.networkRequests.push(requestInfo);

        // Log requisições lentas ou com erro
        if (!response.ok) {
          logger.error('Network request failed', null, {
            operation: 'network_request_failed',
            request_id: requestId,
            url: this.sanitizeUrl(url),
            method,
            status_code: response.status,
            duration_ms: duration
          });
        } else if (duration > 1000) {
          logger.warn('Slow network request detected', {
            operation: 'network_request_slow',
            request_id: requestId,
            url: this.sanitizeUrl(url),
            method,
            duration_ms: duration,
            threshold_ms: 1000
          });
        } else {
          logger.debug('Network request completed', {
            operation: 'network_request_complete',
            request_id: requestId,
            status_code: response.status,
            duration_ms: duration
          });
        }

        return response;
      } catch (error) {
        const duration = Math.round(performance.now() - startTime);
        
        logger.error('Network request exception', error, {
          operation: 'network_request_exception',
          request_id: requestId,
          url: this.sanitizeUrl(url),
          method,
          duration_ms: duration
        });
        
        this.networkRequests.push({
          id: requestId,
          type: 'fetch',
          url: this.sanitizeUrl(url),
          method,
          error: true,
          errorMessage: error.message,
          duration,
          timestamp: new Date().toISOString()
        });
        
        throw error;
      }
    };

    // Interceptar XMLHttpRequest
    const self = this;
    XMLHttpRequest.prototype.open = function(method: string, url: string, ...args: any[]) {
      const xhr = this;
      const startTime = performance.now();
      const requestId = `xhr_${Date.now()}_${Math.random()}`;

      xhr.addEventListener('loadend', function() {
        const duration = Math.round(performance.now() - startTime);
        
        const requestInfo = {
          id: requestId,
          type: 'xhr',
          url: self.sanitizeUrl(url),
          method,
          status: xhr.status,
          statusText: xhr.statusText,
          duration,
          timestamp: new Date().toISOString()
        };
        
        self.networkRequests.push(requestInfo);

        if (xhr.status >= 400) {
          logger.error('XHR request failed', null, {
            operation: 'xhr_request_failed',
            request_id: requestId,
            url: self.sanitizeUrl(url),
            method,
            status_code: xhr.status,
            duration_ms: duration
          });
        }
      });

      return self.originalXHROpen.apply(this, [method, url, ...args]);
    };
  }

  /**
   * Monitora métricas de performance
   */
  private monitorPerformance(): void {
    // Observar Long Tasks (tarefas que bloqueiam a thread principal)
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) {
              logger.warn('Long task detected', {
                operation: 'performance_long_task',
                duration_ms: Math.round(entry.duration),
                start_time: Math.round(entry.startTime),
                name: entry.name
              });
            }
          }
        });
        
        observer.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        // PerformanceObserver might not support longtask
      }
    }

    // Monitorar mudanças de memória (se disponível)
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        const usedMB = Math.round(memory.usedJSHeapSize / 1048576);
        const totalMB = Math.round(memory.totalJSHeapSize / 1048576);
        
        if (usedMB > totalMB * 0.9) {
          logger.warn('High memory usage detected', {
            operation: 'performance_memory_high',
            used_mb: usedMB,
            total_mb: totalMB,
            percentage: Math.round((usedMB / totalMB) * 100)
          });
        }
      }, 30000); // Check every 30 seconds
    }
  }

  /**
   * Configura handlers para erros não tratados
   */
  private setupErrorHandlers(): void {
    window.addEventListener('error', (event) => {
      logger.error('Unhandled error in browser', event.error || event.message, {
        operation: 'browser_error',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        route: window.location.pathname
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      logger.error('Unhandled promise rejection', event.reason, {
        operation: 'browser_unhandled_rejection',
        route: window.location.pathname
      });
    });
  }

  /**
   * Sanitiza URLs removendo informações sensíveis
   */
  private sanitizeUrl(url: string): string {
    try {
      const urlObj = new URL(url, window.location.origin);
      // Remove query parameters que podem conter dados sensíveis
      const sensitiveParams = ['token', 'key', 'secret', 'password', 'auth'];
      sensitiveParams.forEach(param => {
        if (urlObj.searchParams.has(param)) {
          urlObj.searchParams.set(param, '***');
        }
      });
      return urlObj.toString();
    } catch {
      return url;
    }
  }

  /**
   * Retorna logs coletados para diagnóstico
   */
  getCollectedLogs(): { network: any[], console: any[] } {
    return {
      network: this.networkRequests.slice(-50), // Últimas 50 requisições
      console: this.consoleErrors.slice(-50)    // Últimos 50 erros de console
    };
  }

  /**
   * Limpa logs coletados
   */
  clearLogs(): void {
    this.networkRequests = [];
    this.consoleErrors = [];
    logger.debug('Browser monitor logs cleared', {
      operation: 'browser_monitor_clear'
    });
  }

  /**
   * Para o monitoramento e restaura funções originais
   */
  stopMonitoring(): void {
    window.fetch = this.originalFetch;
    XMLHttpRequest.prototype.open = this.originalXHROpen;
    
    logger.info('Browser monitoring stopped', {
      operation: 'browser_monitor_stop'
    });
  }
}

// Singleton
let browserMonitor: BrowserMonitor | null = null;

export function getBrowserMonitor(): BrowserMonitor {
  if (typeof window === 'undefined') {
    throw new Error('BrowserMonitor can only be used in browser environment');
  }
  
  if (!browserMonitor) {
    browserMonitor = new BrowserMonitor();
  }
  
  return browserMonitor;
}

export default getBrowserMonitor;