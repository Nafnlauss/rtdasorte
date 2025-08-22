# Instruções para Aplicar a Migração de Controle de Progresso

## Passo a Passo

1. Acesse o Supabase Dashboard do seu projeto
2. Navegue até a seção **SQL Editor**
3. Copie e cole o conteúdo do arquivo `run-migration.sql`
4. Execute o script SQL

## O que foi implementado

### 1. ✅ Ícones de olho removidos
- Removidos todos os ícones de olho sem função das páginas:
  - Lista de rifas (admin)
  - Lista de transações
  - Lista de usuários  
  - Lista de vencedores

### 2. ✅ Progresso com dados reais
- Corrigido cálculo de progresso para usar dados reais do banco
- Removidos valores mock (70% disponível)
- Agora calcula: `números vendidos / total de números`

### 3. ✅ Controle de Progresso Manual/Real
- Adicionado componente `ProgressControl` no formulário de edição de rifas
- Permite alternar entre:
  - **Modo Real**: Usa cálculo automático baseado em vendas
  - **Modo Manual**: Define manualmente a porcentagem exibida
- Inclui preview da barra de progresso
- Botões rápidos para valores comuns (25%, 50%, 75%, 90%, 95%, 100%)

### 4. ⚠️ Migração do Banco Pendente
Execute o arquivo `run-migration.sql` no SQL Editor do Supabase para adicionar os campos:
- `progress_mode`: Define se usa modo 'real' ou 'manual'
- `manual_progress`: Armazena a porcentagem manual (0-100)

### Páginas Atualizadas
- `/` (Home) - Usa modo de progresso configurado
- `/raffles` - Usa modo de progresso configurado
- `/raffles/[id]` - Usa modo de progresso configurado
- `/admin/raffles/[id]/edit` - Integrado controle de progresso

## Como Testar

1. Execute a migração SQL
2. Edite uma rifa no painel admin
3. Role até a seção "Controle da Barra de Progresso"
4. Ative o "Controle manual do progresso"
5. Ajuste o valor com o slider ou botões rápidos
6. Salve e verifique nas páginas públicas

## Observações
- O valor manual só é usado quando o modo está configurado como manual
- Quando desativado, volta a usar o cálculo real automaticamente
- A diferença entre valor real e manual é exibida como aviso no admin