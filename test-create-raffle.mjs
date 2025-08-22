#!/usr/bin/env node

/**
 * Script de teste para criar uma rifa e capturar logs de observabilidade
 * 
 * INSTRUÇÕES:
 * 1. Abra o navegador em http://localhost:3002/admin/login
 * 2. Faça login com as credenciais de admin
 * 3. Navegue para http://localhost:3002/admin/raffles/new
 * 4. Abra o Console do navegador (F12)
 * 5. Preencha o formulário de criação de rifa
 * 6. Clique em "Criar Rifa"
 * 7. Observe os logs no console
 * 
 * CAMPOS PARA TESTE:
 * - Nome da Rifa: "Teste RLS Debug"
 * - Descrição: "Teste de criação com observabilidade"
 * - Descrição do Prêmio: "iPhone 15 Pro Max"
 * - Valor por Número: 10
 * - Quantidade de Cotas: 1000
 * - Status: Ativa
 */

console.log(`
================================================================================
                        TESTE DE CRIAÇÃO DE RIFA COM LOGS
================================================================================

Este script documenta o processo de teste para debug do erro RLS.

PASSOS PARA EXECUTAR O TESTE:

1. ABRIR O NAVEGADOR
   URL: http://localhost:3002/admin/login

2. FAZER LOGIN
   - Use as credenciais de administrador
   - Observe se há mensagens no console sobre autenticação

3. NAVEGAR PARA CRIAÇÃO DE RIFA
   URL: http://localhost:3002/admin/raffles/new
   
4. ABRIR O CONSOLE DO NAVEGADOR (F12)
   - Limpe o console antes de começar
   - Mantenha a aba Console aberta

5. PREENCHER O FORMULÁRIO:
   ┌─────────────────────────────────────────────┐
   │ Nome da Rifa:         Teste RLS Debug       │
   │ Descrição:            Teste com logs        │
   │ Descrição do Prêmio:  iPhone 15 Pro Max     │
   │ Valor por Número:     10                    │
   │ Quantidade de Cotas:  1000                  │
   │ Status:               Ativa                  │
   └─────────────────────────────────────────────┘

6. CLICAR EM "CRIAR RIFA"

7. OBSERVAR OS LOGS NO CONSOLE

LOGS ESPERADOS:
================================================================================

Você deve ver a seguinte sequência de logs:

1. === INICIANDO CRIAÇÃO DE RIFA ===
2. ESTADO DE AUTENTICAÇÃO (localStorage)
3. SESSÃO SUPABASE (verificação de token)
4. USUÁRIO ATUAL (ID do usuário)
5. PREPARAÇÃO DOS DADOS
6. VALIDAÇÃO DE CAMPOS
7. DIAGNÓSTICOS PRÉ-INSERT
8. VERIFICAÇÃO RLS
9. EXECUTANDO INSERT
10. RESPOSTA DO SUPABASE

SE HOUVER ERRO RLS:
================================================================================

Procure por:
- "=== ERRO RLS DETECTADO ==="
- "Política RLS bloqueou a operação INSERT"
- Código de erro: 42501

INFORMAÇÕES CRÍTICAS A COLETAR:
================================================================================

1. User ID está presente? (created_by)
2. Sessão Supabase existe? (hasSession: true/false)
3. Token está expirado? (expiresAt)
4. localStorage tem isAdmin=true?

COMANDOS ÚTEIS NO CONSOLE:
================================================================================

// Coletar diagnósticos completos
await authDiagnostics()

// Verificar políticas RLS
await checkRLS('raffles')

// Ver localStorage
Object.keys(localStorage).forEach(k => console.log(k, localStorage[k]))

// Ver cookies
document.cookie

================================================================================
`);

console.log('\nPara executar o teste, siga as instruções acima.');
console.log('Após coletar os logs, copie todo o conteúdo do console para análise.\n');