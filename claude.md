# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Interações

- Sempre fale comigo em pt-br

## Comandos Essenciais

```bash
# Desenvolvimento
npm run dev           # Servidor de desenvolvimento (http://localhost:3000)
npm run build        # Build para produção
npm run start        # Executar build de produção
npm run lint         # Linting do código

# Admin
npm run setup:admin  # Configurar usuário admin inicial (scripts/setup-admin.ts)
```

## Arquitetura Principal

### Stack Técnica
- **Framework**: Next.js 15 com App Router
- **UI**: React 19 + Tailwind CSS + shadcn/ui
- **Database**: Supabase (PostgreSQL + Auth + Storage)
- **Estado**: Zustand para carrinho e autenticação
- **Formulários**: React Hook Form + Zod
- **Pagamentos**: PaySamba (PIX brasileiro)
- **Gráficos**: Recharts para métricas
- **Animações**: Framer Motion

### Estrutura de Rotas

```
/                       # Landing page pública
/raffles               # Lista de rifas ativas
/raffles/[id]          # Detalhes e compra de números
/payment/[id]          # Fluxo de pagamento PIX

/admin                 # Painel administrativo
  /login               # Login separado para admin
  /raffles             # Gestão de rifas
    /new               # Criar nova rifa
    /[id]/edit         # Editar rifa existente
    /[id]/draw         # Realizar sorteio
    /[id]/metrics      # Métricas da rifa
    /reorder           # Reordenar rifas
  /transactions        # Controle de transações
  /users               # Gestão de usuários
  /winners             # Registro de ganhadores
  /settings            # Configurações do sistema

/api
  /checkout/create-payment  # Criar pagamento PIX
  /webhooks/paysamba       # Webhook de confirmação PIX
  /raffles/[id]/numbers    # Status dos números
  /lottery/check           # Verificar resultado loteria
```

### Fluxo de Pagamento PIX

1. **Seleção de Números**: Interface visual com grid de números
2. **Carrinho**: Sistema lateral com Zustand (`useCartStore`)
3. **Checkout**: Criação de transação via `/api/checkout/create-payment`
4. **QR Code PIX**: Geração via PaySamba com expiração de 15 minutos
5. **Webhook**: Callback em `/api/webhooks/paysamba` para confirmar pagamento
6. **Confirmação**: Atualização de status e reserva de números

### Integrações Externas

- **PaySamba**: Gateway PIX (`src/lib/services/paysamba.ts`)
  - Sandbox e produção configuráveis
  - Webhook para confirmação de pagamento
  
- **Loteria Federal**: Verificação de resultados (`src/lib/services/loteria-federal.ts`)
  - API oficial para sorteios
  - Integração com sistema de draw

- **Raffle Numbers Service**: (`src/lib/services/raffle-numbers.ts`)
  - Geração e validação de números
  - Controle de disponibilidade

### Banco de Dados (Supabase)

Principais tabelas (detalhes em DATABASE_STRUCTURE.md):
- `profiles`: Perfis de usuários (auth.users)
- `users`: Compatibilidade com sistema legado
- `raffles`: Campanhas de rifa com configurações de compra
- `raffle_numbers`: Controle individual de números
- `transactions`: Transações de pagamento
- `tickets`: Números vendidos (tabela legada)
- `winners`: Registro de ganhadores
- `notifications`: Sistema de notificações
- `login_logs`: Auditoria de acessos

RLS habilitado em todas as tabelas com políticas específicas.

### Sistema de Autenticação

- **Usuários**: Supabase Auth padrão
- **Admin**: Autenticação separada com senha mestre
  - Login em `/admin/login`
  - Sessão gerenciada via `admin-session`
  - Middleware em `src/lib/supabase/middleware.ts`
  - Logs detalhados em `src/lib/logger.ts`

### Monitoramento e Observabilidade

- **Logger**: Sistema centralizado (`src/lib/logger.ts`)
  - Logs estruturados com trace_id
  - Diferentes níveis: info, warn, error, debug
  - authLog para eventos de autenticação
  
- **Auth Monitor**: Hook para diagnóstico (`src/hooks/useAuthMonitor.ts`)
- **Browser Monitor**: Monitoramento client-side (`src/lib/browser-monitor.ts`)
- **Debug Logger**: Componente visual para desenvolvimento (`src/components/DebugLogger.tsx`)

### Variáveis de Ambiente Necessárias

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Pagamentos
PAYSAMBA_API_TOKEN=
PAYSAMBA_API_URL=
PAYSAMBA_WEBHOOK_URL=

# Admin
ADMIN_PASSWORD=

# Projeto Supabase
# ID: xlabgxtdbasbohvowfod
# Region: sa-east-1
```

## Padrões de Desenvolvimento

### Componentes
- Usar componentes shadcn/ui existentes em `src/components/ui/`
- Componentes admin em `src/components/admin/`
- Componentes de rifa em `src/components/raffle/`
- Mobile-first com Tailwind CSS
- Validação com Zod em todos os formulários

### API Routes
- Sempre validar dados de entrada
- Usar service role key para operações administrativas
- Retornar status HTTP apropriados
- Logs estruturados com trace_id

### Supabase
- Usar `createClient` para cliente público
- Usar service role apenas quando necessário
- Sempre verificar permissões RLS
- Cliente instrumentado em `src/lib/supabase/instrumented-client.ts`

### Sistema Brasileiro
- Formatação de valores em BRL (R$)
- Telefones no formato +55
- CPF como identificador principal
- PIX como método de pagamento exclusivo

### Testes E2E (Playwright)
Scripts de teste disponíveis em `test-*.mjs`:
- `test-login-only.mjs`: Teste de login admin
- `test-admin-save.mjs`: Teste de salvamento
- `test-create-raffle.mjs`: Criação de rifa
- `test-reorder-raffles.mjs`: Reordenação de rifas

### Migrações
- Scripts SQL em `src/migrations/`
- Aplicador de migrações em `src/lib/apply-migration.ts`
- Histórico de correções em `FIX_REPORT.md`