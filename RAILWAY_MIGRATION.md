# Guia de Migração Supabase → Railway PostgreSQL

## 1. Configuração do Railway

### Variáveis de Ambiente Railway
```env
# Banco de Dados Railway
DATABASE_URL=postgresql://postgres:vbjdzitEouJuqzgCfNsiqnjAnLtDsgfu@<SEU_RAILWAY_DOMAIN>:5432/railway

# Para conexão pública (se necessário)
DATABASE_PUBLIC_URL=postgresql://postgres:vbjdzitEouJuqzgCfNsiqnjAnLtDsgfu@<SEU_RAILWAY_TCP_PROXY_DOMAIN>:<SEU_RAILWAY_TCP_PROXY_PORT>/railway
```

## 2. Estrutura do Banco de Dados

### Script de Criação das Tabelas
Execute este script no console do PostgreSQL no Railway:

```sql
-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Criar schema se necessário
CREATE SCHEMA IF NOT EXISTS public;

-- Tabela de perfis (substitui auth.users do Supabase)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone TEXT,
    cpf TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Tabela de usuários (compatibilidade)
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    phone TEXT,
    cpf TEXT UNIQUE,
    password_hash TEXT,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Tabela de rifas
CREATE TABLE public.raffles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    number_price DECIMAL(10,2) NOT NULL,
    total_numbers INTEGER NOT NULL,
    available_numbers INTEGER NOT NULL,
    min_numbers INTEGER DEFAULT 1,
    max_numbers INTEGER DEFAULT 100,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
    draw_date TIMESTAMP WITH TIME ZONE,
    display_order INTEGER DEFAULT 0,
    progress_mode TEXT DEFAULT 'auto' CHECK (progress_mode IN ('auto', 'manual')),
    manual_progress INTEGER DEFAULT 0 CHECK (manual_progress >= 0 AND manual_progress <= 100),
    purchase_config JSONB DEFAULT '{
        "min_purchase": 1,
        "max_purchase": 100,
        "featured_quantities": [1, 5, 10, 20, 50, 100],
        "bonus_config": {
            "enabled": false,
            "rules": []
        }
    }'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    created_by UUID REFERENCES public.users(id)
);

-- Tabela de números da rifa
CREATE TABLE public.raffle_numbers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    raffle_id UUID NOT NULL REFERENCES public.raffles(id) ON DELETE CASCADE,
    number INTEGER NOT NULL,
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold')),
    user_id UUID REFERENCES public.users(id),
    transaction_id UUID,
    reserved_at TIMESTAMP WITH TIME ZONE,
    sold_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    UNIQUE(raffle_id, number)
);

-- Tabela de transações
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id),
    raffle_id UUID NOT NULL REFERENCES public.raffles(id),
    amount DECIMAL(10,2) NOT NULL,
    quantity INTEGER NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded', 'expired')),
    payment_method TEXT DEFAULT 'pix',
    payment_id TEXT,
    pix_code TEXT,
    pix_qrcode TEXT,
    pix_expires_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Tabela de tickets (compatibilidade)
CREATE TABLE public.tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    raffle_id UUID NOT NULL REFERENCES public.raffles(id),
    user_id UUID NOT NULL REFERENCES public.users(id),
    transaction_id UUID REFERENCES public.transactions(id),
    number INTEGER NOT NULL,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Tabela de ganhadores
CREATE TABLE public.winners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    raffle_id UUID NOT NULL REFERENCES public.raffles(id),
    user_id UUID NOT NULL REFERENCES public.users(id),
    ticket_id UUID REFERENCES public.tickets(id),
    winning_number INTEGER NOT NULL,
    prize_description TEXT,
    draw_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    claimed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Tabela de notificações
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    read BOOLEAN DEFAULT false,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Tabela de logs de login
CREATE TABLE public.login_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT,
    user_id UUID REFERENCES public.users(id),
    success BOOLEAN DEFAULT false,
    ip_address TEXT,
    user_agent TEXT,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Criar índices para performance
CREATE INDEX idx_raffles_status ON public.raffles(status);
CREATE INDEX idx_raffles_display_order ON public.raffles(display_order);
CREATE INDEX idx_raffle_numbers_raffle_id ON public.raffle_numbers(raffle_id);
CREATE INDEX idx_raffle_numbers_status ON public.raffle_numbers(status);
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_status ON public.transactions(status);
CREATE INDEX idx_tickets_raffle_id ON public.tickets(raffle_id);
CREATE INDEX idx_tickets_user_id ON public.tickets(user_id);

-- Criar usuário admin padrão
INSERT INTO public.users (email, name, role, password_hash)
VALUES ('admin@rtdasorte.com', 'Admin', 'admin', crypt('Admin@123', gen_salt('bf')))
ON CONFLICT (email) DO NOTHING;
```

## 3. Configuração do Projeto Next.js

### Instalar Dependências
```bash
npm install pg @types/pg
npm install bcryptjs @types/bcryptjs
npm install jsonwebtoken @types/jsonwebtoken
```

### Arquivo .env.local para Railway
```env
# Railway Database
DATABASE_URL=postgresql://postgres:vbjdzitEouJuqzgCfNsiqnjAnLtDsgfu@<SEU_RAILWAY_DOMAIN>:5432/railway

# App Config
NEXT_PUBLIC_APP_URL=https://seu-app.railway.app

# PaySamba (manter igual)
PAYSAMBA_API_TOKEN=seu_token_aqui
PAYSAMBA_API_URL=https://api.paysamba.com.br/v1
PAYSAMBA_WEBHOOK_URL=https://seu-app.railway.app/api/webhooks/paysamba

# Admin
ADMIN_PASSWORD=Admin@123
JWT_SECRET=seu_jwt_secret_aqui
```

## 4. Criar Cliente PostgreSQL

Criar arquivo `src/lib/db/client.ts`:

```typescript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export default pool;
```

## 5. Adaptar Funções do Supabase

### Exemplo de função para buscar rifas
Criar arquivo `src/lib/db/raffles.ts`:

```typescript
import pool from './client';

export async function getRaffles(status = 'active') {
  const query = `
    SELECT * FROM raffles 
    WHERE status = $1 
    ORDER BY display_order ASC, created_at DESC
  `;
  
  const result = await pool.query(query, [status]);
  return result.rows;
}

export async function getRaffleById(id: string) {
  const query = 'SELECT * FROM raffles WHERE id = $1';
  const result = await pool.query(query, [id]);
  return result.rows[0];
}

export async function createRaffle(data: any) {
  const query = `
    INSERT INTO raffles (
      title, description, image_url, number_price, 
      total_numbers, available_numbers, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;
  
  const values = [
    data.title,
    data.description,
    data.image_url,
    data.number_price,
    data.total_numbers,
    data.total_numbers, // available = total inicialmente
    'active'
  ];
  
  const result = await pool.query(query, values);
  return result.rows[0];
}
```

## 6. Sistema de Autenticação Simples

Criar arquivo `src/lib/auth/simple-auth.ts`:

```typescript
import pool from '../db/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function login(email: string, password: string) {
  const query = 'SELECT * FROM users WHERE email = $1';
  const result = await pool.query(query, [email]);
  const user = result.rows[0];
  
  if (!user) {
    throw new Error('Usuário não encontrado');
  }
  
  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) {
    throw new Error('Senha inválida');
  }
  
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  
  return { user, token };
}

export async function register(data: any) {
  const hashedPassword = await bcrypt.hash(data.password, 10);
  
  const query = `
    INSERT INTO users (email, name, phone, cpf, password_hash)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, email, name, phone, cpf, role
  `;
  
  const values = [
    data.email,
    data.name,
    data.phone,
    data.cpf,
    hashedPassword
  ];
  
  const result = await pool.query(query, values);
  const user = result.rows[0];
  
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  
  return { user, token };
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}
```

## 7. Deploy no Railway

### Passos:
1. Fazer commit do código
2. Conectar repositório GitHub ao Railway
3. Configurar variáveis de ambiente no Railway
4. Deploy automático será feito

### Comandos Railway CLI:
```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link projeto
railway link

# Deploy
railway up

# Ver logs
railway logs
```

## 8. Migração de Dados (Opcional)

Se você tiver dados no Supabase para migrar:

```sql
-- Exportar dados do Supabase
pg_dump postgresql://[SUPABASE_URL] -t raffles -t users > backup.sql

-- Importar no Railway
psql postgresql://postgres:vbjdzitEouJuqzgCfNsiqnjAnLtDsgfu@[RAILWAY_URL]/railway < backup.sql
```

## Observações Importantes

1. **Autenticação**: Railway não tem auth built-in como Supabase, então implementamos JWT simples
2. **Storage**: Para imagens, considere usar Cloudinary ou AWS S3
3. **Realtime**: Se precisar, use Socket.io ou Pusher
4. **RLS**: Implemente validações no backend (middleware)
5. **SSL**: Railway fornece SSL automático em produção

## Próximos Passos

1. Executar script SQL no Railway PostgreSQL
2. Atualizar código para usar pool PostgreSQL ao invés de Supabase client
3. Implementar middleware de autenticação
4. Testar localmente com DATABASE_URL do Railway
5. Deploy no Railway