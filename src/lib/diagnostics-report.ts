/**
 * Gerador de Relatório de Diagnóstico
 * Coleta e formata todos os logs para análise
 */

import logger from './logger';

interface DiagnosticsReport {
  timestamp: string;
  traceId: string;
  environment: {
    userAgent: string;
    platform: string;
    language: string;
    screenResolution: string;
    viewport: string;
    online: boolean;
    cookiesEnabled: boolean;
  };
  performance: {
    memory?: {
      used: number;
      total: number;
      limit: number;
    };
    timing?: {
      navigationStart: number;
      loadEventEnd: number;
      totalLoadTime: number;
    };
  };
  localStorage: {
    errorLogs: any[];
    otherKeys: string[];
  };
  sessionInfo: {
    currentUrl: string;
    referrer: string;
    sessionDuration: number;
  };
  supabaseInfo?: {
    hasAuth: boolean;
    userId?: string;
    connectionHealthy?: boolean;
  };
}

export class DiagnosticsReporter {
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  /**
   * Gera relatório completo de diagnóstico
   */
  async generateReport(): Promise<DiagnosticsReport> {
    logger.info('Generating diagnostics report', {
      operation: 'diagnostics_report_start'
    });

    const report: DiagnosticsReport = {
      timestamp: new Date().toISOString(),
      traceId: logger.getTraceId(),
      environment: this.getEnvironmentInfo(),
      performance: this.getPerformanceMetrics(),
      localStorage: this.getLocalStorageInfo(),
      sessionInfo: this.getSessionInfo(),
      supabaseInfo: await this.getSupabaseInfo()
    };

    logger.info('Diagnostics report generated', {
      operation: 'diagnostics_report_complete',
      report_keys: Object.keys(report)
    });

    return report;
  }

  /**
   * Coleta informações do ambiente
   */
  private getEnvironmentInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenResolution: `${screen.width}x${screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      online: navigator.onLine,
      cookiesEnabled: navigator.cookieEnabled
    };
  }

  /**
   * Coleta métricas de performance
   */
  private getPerformanceMetrics() {
    const metrics: any = {};

    // Memory info (Chrome only)
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      metrics.memory = {
        used: Math.round(memory.usedJSHeapSize / 1048576),
        total: Math.round(memory.totalJSHeapSize / 1048576),
        limit: Math.round(memory.jsHeapSizeLimit / 1048576)
      };
    }

    // Navigation timing
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      metrics.timing = {
        navigationStart: navigation.fetchStart,
        loadEventEnd: navigation.loadEventEnd,
        totalLoadTime: Math.round(navigation.loadEventEnd - navigation.fetchStart)
      };
    }

    return metrics;
  }

  /**
   * Coleta informações do localStorage
   */
  private getLocalStorageInfo() {
    const errorLogs = JSON.parse(localStorage.getItem('app_error_logs') || '[]');
    const otherKeys = Object.keys(localStorage).filter(key => key !== 'app_error_logs');

    return {
      errorLogs: errorLogs.slice(-10), // Últimos 10 erros
      otherKeys
    };
  }

  /**
   * Coleta informações da sessão
   */
  private getSessionInfo() {
    return {
      currentUrl: window.location.href,
      referrer: document.referrer,
      sessionDuration: Date.now() - this.startTime
    };
  }

  /**
   * Coleta informações do Supabase
   */
  private async getSupabaseInfo() {
    try {
      // Tentar obter informações do Supabase se disponível
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      
      const { data: { user }, error } = await supabase.auth.getUser();
      
      return {
        hasAuth: !error && !!user,
        userId: user?.id,
        connectionHealthy: !error
      };
    } catch (err) {
      logger.debug('Could not collect Supabase info', {
        operation: 'diagnostics_supabase_info',
        error: err.message
      });
      return undefined;
    }
  }

  /**
   * Exporta relatório como JSON para download
   */
  exportAsJSON(report: DiagnosticsReport): void {
    const dataStr = JSON.stringify(report, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `diagnostics_${Date.now()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    logger.info('Diagnostics report exported', {
      operation: 'diagnostics_export',
      filename: exportFileDefaultName
    });
  }

  /**
   * Envia relatório para console formatado
   */
  printToConsole(report: DiagnosticsReport): void {
    console.log('%c=== DIAGNOSTICS REPORT ===', 'color: blue; font-weight: bold; font-size: 16px');
    console.log('%cTimestamp:', 'font-weight: bold', report.timestamp);
    console.log('%cTrace ID:', 'font-weight: bold', report.traceId);
    
    console.group('%cEnvironment', 'color: green; font-weight: bold');
    console.table(report.environment);
    console.groupEnd();
    
    console.group('%cPerformance', 'color: orange; font-weight: bold');
    if (report.performance.memory) {
      console.log('Memory (MB):', report.performance.memory);
    }
    if (report.performance.timing) {
      console.log('Load Time (ms):', report.performance.timing.totalLoadTime);
    }
    console.groupEnd();
    
    console.group('%cLocal Storage', 'color: purple; font-weight: bold');
    console.log('Error Logs Count:', report.localStorage.errorLogs.length);
    if (report.localStorage.errorLogs.length > 0) {
      console.log('Recent Errors:');
      report.localStorage.errorLogs.forEach((log, i) => {
        console.log(`  ${i + 1}.`, log.msg || log.message);
      });
    }
    console.groupEnd();
    
    console.group('%cSession Info', 'color: teal; font-weight: bold');
    console.table(report.sessionInfo);
    console.groupEnd();
    
    if (report.supabaseInfo) {
      console.group('%cSupabase Info', 'color: brown; font-weight: bold');
      console.table(report.supabaseInfo);
      console.groupEnd();
    }
    
    console.log('%c=== END OF REPORT ===', 'color: blue; font-weight: bold; font-size: 16px');
  }
}

// Função global para facilitar debug
if (typeof window !== 'undefined') {
  (window as any).generateDiagnosticsReport = async () => {
    const reporter = new DiagnosticsReporter();
    const report = await reporter.generateReport();
    reporter.printToConsole(report);
    
    // Perguntar se deseja exportar
    if (confirm('Deseja exportar o relatório como JSON?')) {
      reporter.exportAsJSON(report);
    }
    
    return report;
  };
  
  console.log('%c💡 Dica: Execute generateDiagnosticsReport() no console para gerar um relatório de diagnóstico', 
    'background: yellow; color: black; padding: 5px; border-radius: 3px');
}

export default DiagnosticsReporter;