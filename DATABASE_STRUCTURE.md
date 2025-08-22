# 🗄️ Estrutura Completa do Banco de Dados - Sistema de Rifas

## ✅ Implementação Completa no Supabase

### 📊 Status da Implementação
- ✅ **Tabelas Principais**: Criadas e otimizadas
- ✅ **RLS (Row Level Security)**: Habilitado em todas as tabelas
- ✅ **Políticas de Segurança**: Configuradas para cada tabela
- ✅ **Índices**: Criados para otimização de consultas
- ✅ **Triggers**: Automação de processos
- ✅ **Storage**: Buckets configurados para imagens
- ✅ **Views**: Views úteis para consultas

## 📁 Estrutura das Tabelas

### 1. **profiles** (Perfis de Usuários - auth.users)
```sql
- id: UUID (PK, FK → auth.users.id)
- name: TEXT NOT NULL
- phone: TEXT
- cpf: TEXT UNIQUE
- birth_date: DATE
- avatar_url: TEXT
- is_admin: BOOLEAN DEFAULT false
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### 2. **users** (Compatibilidade - Tabela Existente)
```sql
- id: UUID (PK)
- email: TEXT
- phone: TEXT NOT NULL
- name: TEXT NOT NULL
- cpf: TEXT UNIQUE
- birth_date: DATE
- avatar_url: TEXT
- is_admin: BOOLEAN
- status: TEXT (active|suspended|banned)
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### 3. **raffles** (Rifas)
```sql
- id: UUID (PK)
- title: TEXT NOT NULL
- description: TEXT
- prize_description: TEXT
- image_url: TEXT
- number_price: NUMERIC(10,2)
- total_numbers: INTEGER
- available_numbers: INTEGER
- min_numbers: INTEGER DEFAULT 1
- max_numbers: INTEGER DEFAULT 1000
- regulations: TEXT
- status: TEXT (draft|active|paused|finished|cancelled)
- draw_date: TIMESTAMPTZ
- draw_type: TEXT (manual|lottery|auto)
- winner_percentage: NUMERIC(5,2)
- show_progress_bar: BOOLEAN DEFAULT true
- progress_override: BOOLEAN DEFAULT false
- manual_progress: INTEGER (0-100)
- purchase_config: JSONB
- created_by: UUID (FK → users.id)
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### 4. **raffle_numbers** (Números das Rifas)
```sql
- id: UUID (PK)
- raffle_id: UUID (FK → raffles.id)
- number: INTEGER
- status: TEXT (available|reserved|paid)
- user_id: UUID (FK → users.id)
- reserved_at: TIMESTAMPTZ
- paid_at: TIMESTAMPTZ
- expires_at: TIMESTAMPTZ
- transaction_id: UUID
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
- UNIQUE(raffle_id, number)
```

### 5. **transactions** (Transações)
```sql
- id: UUID (PK)
- user_id: UUID (FK → users.id)
- raffle_id: UUID (FK → raffles.id)
- amount: NUMERIC(10,2)
- quantity: INTEGER
- status: TEXT (pending|processing|completed|failed|refunded)
- payment_method: TEXT (pix|credit_card|debit_card|boleto)
- payment_id: TEXT
- pix_code: TEXT
- pix_qrcode: TEXT
- numbers: INTEGER[]
- paid_at: TIMESTAMPTZ
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### 6. **winners** (Ganhadores)
```sql
- id: UUID (PK)
- raffle_id: UUID (FK → raffles.id)
- user_id: UUID (FK → users.id)
- position: INTEGER DEFAULT 1
- winning_number: INTEGER
- prize_description: TEXT
- lottery_contest_number: TEXT
- draw_date: TIMESTAMPTZ
- status: TEXT (pending|contacted|delivered)
- prize_delivered: BOOLEAN DEFAULT false
- delivered_at: TIMESTAMPTZ
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### 7. **notifications** (Notificações)
```sql
- id: UUID (PK)
- user_id: UUID (FK → users.id)
- type: TEXT NOT NULL
- title: TEXT NOT NULL
- message: TEXT
- data: JSONB
- read: BOOLEAN DEFAULT false
- read_at: TIMESTAMPTZ
- created_at: TIMESTAMPTZ
```

### 8. **login_logs** (Logs de Login)
```sql
- id: UUID (PK)
- user_id: UUID (FK → users.id)
- login_at: TIMESTAMPTZ
- ip_address: INET
- user_agent: TEXT
- device_info: TEXT
```

## 🔒 Políticas RLS Implementadas

### profiles
- ✅ Usuários veem apenas seu próprio perfil
- ✅ Admins veem todos os perfis
- ✅ Usuários podem inserir/atualizar próprio perfil

### raffles
- ✅ Visualização pública (todos podem ver)
- ✅ Apenas admins podem criar/editar/deletar

### raffle_numbers
- ✅ Visualização pública
- ✅ Usuários podem reservar números
- ✅ Usuários podem atualizar próprios números

### transactions
- ✅ Usuários veem próprias transações
- ✅ Admins veem todas
- ✅ Apenas sistema/admin pode atualizar

### winners
- ✅ Visualização pública
- ✅ Apenas admins podem gerenciar

### notifications
- ✅ Usuários veem próprias notificações
- ✅ Usuários podem marcar como lidas

## 📈 Índices Criados

```sql
- idx_raffle_numbers_raffle_status (raffle_id, status)
- idx_raffle_numbers_user (user_id)
- idx_raffle_numbers_expires (expires_at)
- idx_transactions_user (user_id)
- idx_transactions_raffle (raffle_id)
- idx_transactions_status (status)
- idx_winners_raffle (raffle_id)
- idx_winners_user (user_id)
- idx_raffles_status (status)
- idx_raffles_created_by (created_by)
- idx_notifications_user (user_id)
- idx_notifications_read (user_id, read)
- idx_login_logs_user (user_id)
```

## ⚡ Triggers Implementados

### 1. **update_updated_at_column**
Atualiza automaticamente o campo `updated_at` em todas as tabelas

### 2. **generate_raffle_numbers**
Gera automaticamente todos os números quando uma rifa é criada

## 🔧 Funções Úteis

### 1. **clean_expired_reservations()**
Limpa reservas expiradas e libera números

### 2. **get_raffle_stats(raffle_id)**
Retorna estatísticas completas de uma rifa

### 3. **update_updated_at_column()**
Função auxiliar para o trigger de updated_at

## 🖼️ Storage Buckets

### 1. **raffles-images**
- Público para visualização
- Limite: 5MB por arquivo
- Formatos: JPEG, PNG, GIF, WebP
- Políticas: Admins podem fazer upload/editar/deletar

### 2. **avatars**
- Público para visualização
- Limite: 2MB por arquivo
- Formatos: JPEG, PNG, GIF, WebP
- Políticas: Usuários gerenciam próprio avatar

## 📊 Views Criadas

### 1. **raffle_summary**
View consolidada com estatísticas de cada rifa:
- Todos campos da rifa
- Compradores únicos
- Números vendidos/reservados/disponíveis
- Receita total

### 2. **user_stats**
View com estatísticas por usuário:
- Todos campos do usuário
- Rifas participadas
- Total de números comprados
- Total gasto
- Prêmios ganhos

## 🔐 Segurança

### Implementações de Segurança:
1. ✅ **RLS habilitado** em todas as tabelas
2. ✅ **Políticas específicas** por tipo de usuário
3. ✅ **Search path fixo** nas funções (corrigido)
4. ✅ **Validações de dados** via CHECK constraints
5. ✅ **Índices únicos** para evitar duplicação

## 📝 Configuração purchase_config

Estrutura JSON para configuração de compra:
```json
{
  "min_purchase": 1,
  "quick_buttons": [
    {"quantity": 100, "label": "+100", "popular": false},
    {"quantity": 250, "label": "+250", "popular": true},
    {"quantity": 500, "label": "+500", "popular": false},
    {"quantity": 750, "label": "+750", "popular": false},
    {"quantity": 1000, "label": "+1000", "popular": false},
    {"quantity": 1500, "label": "+1500", "popular": false}
  ]
}
```

## 🚀 Como Usar

### Exemplos de Queries Úteis:

```sql
-- Estatísticas de uma rifa
SELECT * FROM get_raffle_stats('raffle-id-here');

-- Limpar reservas expiradas
SELECT clean_expired_reservations();

-- Ver resumo de todas as rifas
SELECT * FROM raffle_summary WHERE status = 'active';

-- Estatísticas de usuário
SELECT * FROM user_stats WHERE id = 'user-id-here';
```

## ✅ Status Final

**Banco de dados 100% configurado e otimizado para produção!**

- Estrutura robusta e escalável
- Segurança implementada em todas as camadas
- Performance otimizada com índices
- Automação via triggers
- Storage configurado para mídia
- Pronto para ambiente de produção

---

**Projeto ID**: xlabgxtdbasbohvowfod
**Region**: sa-east-1
**Status**: ACTIVE_HEALTHY