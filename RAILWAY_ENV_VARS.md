# Variáveis de Ambiente para Railway

Configure estas variáveis no seu projeto Railway:

## Variáveis Obrigatórias

```env
# Supabase (NECESSÁRIO para funcionar)
NEXT_PUBLIC_SUPABASE_URL=https://xlabgxtdbasbohvowfod.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsYWJneHRkYmFzYm9odm93Zm9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMxNzcxNDEsImV4cCI6MjA0ODc1MzE0MX0.nTHZqLeFXRkL4DMhOmEQ-A_g7GHGqqs3pL4s6EFKexs
SUPABASE_SERVICE_ROLE_KEY=[ADICIONE_SUA_SERVICE_ROLE_KEY_AQUI]

# PaySamba (para pagamentos PIX)
PAYSAMBA_API_TOKEN=[SEU_TOKEN_PAYSAMBA]
PAYSAMBA_API_URL=https://api.paysamba.com.br/v1
PAYSAMBA_WEBHOOK_URL=https://seu-app.railway.app/api/webhooks/paysamba

# Admin
ADMIN_PASSWORD=Admin@123

# App URL
NEXT_PUBLIC_APP_URL=https://seu-app.railway.app
```

## Como Configurar no Railway

1. **Acesse seu projeto no Railway**
2. **Clique na aba "Variables"**
3. **Adicione cada variável acima**
4. **Clique em "Add Variable" para cada uma**
5. **Deploy será automático após adicionar**

## Variáveis Importantes

### Supabase Service Role Key
- Necessária para operações administrativas
- Encontre em: Supabase Dashboard → Settings → API → Service Role Key
- NUNCA exponha esta chave publicamente

### PaySamba Token
- Necessário para processar pagamentos PIX
- Obtenha em: https://paysamba.com.br
- Use token de sandbox para testes

### App URL
- Substitua `seu-app.railway.app` pelo domínio real do Railway
- Será algo como: `rtdasorte-production.up.railway.app`

## Exemplo de Configuração no Railway

```
NEXT_PUBLIC_SUPABASE_URL = https://xlabgxtdbasbohvowfod.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY = eyJhbGc... (sua chave service role)
PAYSAMBA_API_TOKEN = seu_token_aqui
PAYSAMBA_API_URL = https://api.paysamba.com.br/v1
PAYSAMBA_WEBHOOK_URL = https://rtdasorte-production.up.railway.app/api/webhooks/paysamba
ADMIN_PASSWORD = Admin@123
NEXT_PUBLIC_APP_URL = https://rtdasorte-production.up.railway.app
```

## Notas Importantes

1. **Service Role Key**: Essencial para criar rifas e operações admin
2. **PaySamba**: Sem isso, pagamentos não funcionarão
3. **URLs**: Atualize com o domínio real após deploy
4. **Segurança**: Nunca commite essas chaves no código

## Verificação

Após configurar, o deploy deve funcionar automaticamente.
Se ainda houver erros, verifique:

1. Todas as variáveis foram adicionadas?
2. Service Role Key está correta?
3. URLs estão com domínio correto?