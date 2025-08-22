# Guia de Observabilidade - Sistema de Edição de Rifas

## Resumo da Instrumentação Implementada

Este documento descreve a observabilidade completa adicionada ao sistema de edição de rifas para tornar problemas reproduzíveis e diagnosticáveis.

## 1. Sistema de Logging Estruturado

### Arquivo: `/src/lib/logger.ts`
- **Logger estruturado em JSON** com campos padronizados
- **Níveis de log**: debug, info, warn, error
- **Campos obrigatórios**: timestamp, level, msg, service, env, version, trace_id, span_id
- **Sanitização automática** de dados sensíveis (PII, tokens, senhas)
- **Métricas de performance** com timer integrado
- **Armazenamento local** de erros para debug

### Como usar:
```javascript
import logger from '@/lib/logger';

// Log simples
logger.info('Operação iniciada', { operation: 'update_raffle' });

// Log com timer
const timer = logger.startTimer();
// ... operação ...
timer.end('Operação concluída');

// Log de erro
logger.error('Falha na operação', error, { context });
```

## 2. Cliente Supabase Instrumentado

### Arquivo: `/src/lib/supabase/instrumented-client.ts`
- **Wrapper completo** para todas operações do Supabase
- **Logging automático** de todas queries (select, update, insert, delete)
- **Métricas de latência** para cada operação
- **Detecção de operações lentas** (> 1000ms)
- **Rastreamento de erros** com códigos específicos

### Como usar:
```javascript
import createInstrumentedClient from '@/lib/supabase/instrumented-client';

const supabase = createInstrumentedClient();
// Todas operações serão automaticamente logadas
```

## 3. Monitor de Browser

### Arquivo: `/src/lib/browser-monitor.ts`
- **Interceptação de fetch e XHR** para rastrear todas requisições
- **Captura de console.error e console.warn**
- **Detecção de Long Tasks** que bloqueiam a UI
- **Monitoramento de memória** com alertas de uso alto
- **Captura de erros não tratados** e promises rejeitadas

### Como usar:
```javascript
import getBrowserMonitor from '@/lib/browser-monitor';

const monitor = getBrowserMonitor();
monitor.startMonitoring();

// Obter logs coletados
const logs = monitor.getCollectedLogs();
```

## 4. Coletor de Logs do Supabase

### Arquivo: `/src/lib/supabase/log-collector.ts`
- **Verificação de políticas RLS**
- **Teste de permissões CRUD**
- **Verificação de status de autenticação**
- **Medição de latência de conexão**
- **Diagnóstico completo** com um comando

### Como usar:
```javascript
const debugger = new SupabaseDebugger(supabase);
await debugger.runFullDiagnostics('raffles');
```

## 5. Gerador de Relatórios de Diagnóstico

### Arquivo: `/src/lib/diagnostics-report.ts`
- **Coleta automática** de ambiente, performance e sessão
- **Exportação para JSON** para análise offline
- **Formatação para console** com visualização organizada
- **Função global** `generateDiagnosticsReport()` disponível no console

## 6. Instrumentação da Página de Edição

### Arquivo: `/src/app/admin/raffles/[id]/edit/page.tsx`

#### Recursos implementados:
1. **Trace ID único** para cada sessão de edição
2. **Logging detalhado** de todo o fluxo:
   - Carregamento inicial da rifa
   - Verificação de autenticação
   - Preparação de dados para update
   - Execução do update no Supabase
   - Tratamento de erros específicos

3. **Botão de Diagnóstico** visível na UI (🔍)
4. **Atalho de teclado** (Ctrl+Shift+D) para dump de logs
5. **Diagnóstico automático** ao carregar a página

## Como Usar a Observabilidade

### 1. Para Reproduzir um Problema

1. Abra a página de edição de rifa
2. Abra o Console do navegador (F12)
3. Tente reproduzir o problema
4. Clique no botão "🔍 Diagnóstico" ou pressione Ctrl+Shift+D
5. Exporte o relatório JSON quando solicitado

### 2. Analisando os Logs

No console, você verá logs estruturados em JSON com:
- **trace_id**: Para rastrear toda a sessão
- **operation_id**: Para cada operação específica
- **duration_ms**: Tempo de execução
- **error details**: Detalhes completos de erros

### 3. Identificando Problemas Comuns

#### Problema de Autenticação:
```json
{
  "level": "error",
  "msg": "Authentication failed during update",
  "operation": "update_raffle_auth_check"
}
```

#### Problema de Permissão (RLS):
```json
{
  "level": "error",
  "msg": "Supabase update failed",
  "error": {
    "code": "42501",
    "message": "Permission denied"
  }
}
```

#### Operação Lenta:
```json
{
  "level": "warn",
  "msg": "Slow Supabase operation detected",
  "duration_ms": 1500,
  "threshold_ms": 1000
}
```

## Métricas Coletadas

### Performance:
- Tempo de carregamento da página
- Latência de cada operação Supabase
- Uso de memória JavaScript
- Long Tasks que bloqueiam a UI

### Erros:
- Todos os console.error
- Erros não tratados
- Promises rejeitadas
- Falhas de rede

### Estado:
- Dados do formulário no momento do erro
- Status de autenticação
- Permissões do usuário
- Políticas RLS aplicadas

## Comandos Úteis no Console

```javascript
// Gerar relatório completo
generateDiagnosticsReport()

// Ver logs de erro armazenados
JSON.parse(localStorage.getItem('app_error_logs'))

// Limpar logs armazenados
localStorage.removeItem('app_error_logs')
```

## Próximos Passos para Debug

1. **Reproduza o problema** com a observabilidade ativa
2. **Colete o relatório de diagnóstico**
3. **Analise os logs** procurando por:
   - Erros de autenticação (código 401)
   - Erros de permissão (código 42501)
   - Campos faltando ou inválidos
   - Operações que não retornam dados

4. **Verifique no Supabase Dashboard**:
   - Políticas RLS na tabela `raffles`
   - Logs de erro no projeto
   - Permissões do usuário

## Conclusão

A observabilidade implementada fornece:
- ✅ **Rastreamento completo** do fluxo de atualização
- ✅ **Identificação precisa** de erros e suas causas
- ✅ **Métricas de performance** para identificar gargalos
- ✅ **Diagnóstico automático** de permissões e autenticação
- ✅ **Exportação de logs** para análise offline

Com essas ferramentas, qualquer problema na edição de rifas pode ser rapidamente identificado e diagnosticado através dos logs estruturados e relatórios de diagnóstico.