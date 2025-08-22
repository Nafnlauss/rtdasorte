/**
 * Utilitário de diagnóstico para problemas de autenticação e RLS
 */

import { createClient } from './supabase/client';

export interface AuthDiagnostics {
  timestamp: string;
  localStorage: {
    isAdmin: string | null;
    adminEmail: string | null;
    adminAuth: string | null;
    supabaseToken: any;
  };
  cookies: string[];
  supabaseSession: {
    hasSession: boolean;
    userId?: string;
    userEmail?: string;
    expiresAt?: number;
    tokenType?: string;
    provider?: string;
  };
  supabaseUser: {
    hasUser: boolean;
    userId?: string;
    userEmail?: string;
    userRole?: string;
    emailConfirmed?: string;
    createdAt?: string;
  };
  headers: {
    authorization?: string;
    cookie?: string;
  };
  errors: string[];
}

export async function collectAuthDiagnostics(): Promise<AuthDiagnostics> {
  const supabase = createClient();
  const errors: string[] = [];
  
  console.log('=== COLETANDO DIAGNÓSTICOS DE AUTENTICAÇÃO ===');
  
  // 1. LocalStorage
  let supabaseTokenData: any = null;
  try {
    const tokenString = localStorage.getItem('sb-xlabgxtdbasbohvowfod-auth-token');
    if (tokenString) {
      supabaseTokenData = JSON.parse(tokenString);
      // Ocultar tokens sensíveis
      if (supabaseTokenData?.access_token) {
        supabaseTokenData.access_token = '***HIDDEN***';
      }
      if (supabaseTokenData?.refresh_token) {
        supabaseTokenData.refresh_token = '***HIDDEN***';
      }
    }
  } catch (e) {
    errors.push(`Erro ao parsear token Supabase: ${e}`);
  }
  
  const localStorageData = {
    isAdmin: localStorage.getItem('isAdmin'),
    adminEmail: localStorage.getItem('adminEmail'),
    adminAuth: localStorage.getItem('adminAuth'),
    supabaseToken: supabaseTokenData
  };
  
  // 2. Cookies
  const cookies = document.cookie.split(';').map(c => {
    const [name] = c.trim().split('=');
    return name;
  });
  
  // 3. Sessão Supabase
  let sessionData: any = {};
  try {
    const sessionResult = await supabase.auth.getSession();
    if (sessionResult.error) {
      errors.push(`Erro ao obter sessão: ${sessionResult.error.message}`);
    }
    if (sessionResult.data.session) {
      sessionData = {
        hasSession: true,
        userId: sessionResult.data.session.user?.id,
        userEmail: sessionResult.data.session.user?.email,
        expiresAt: sessionResult.data.session.expires_at,
        tokenType: sessionResult.data.session.token_type,
        provider: sessionResult.data.session.user?.app_metadata?.provider
      };
    } else {
      sessionData = { hasSession: false };
    }
  } catch (e) {
    errors.push(`Exceção ao obter sessão: ${e}`);
    sessionData = { hasSession: false };
  }
  
  // 4. Usuário Supabase
  let userData: any = {};
  try {
    const userResult = await supabase.auth.getUser();
    if (userResult.error) {
      errors.push(`Erro ao obter usuário: ${userResult.error.message}`);
    }
    if (userResult.data.user) {
      userData = {
        hasUser: true,
        userId: userResult.data.user.id,
        userEmail: userResult.data.user.email,
        userRole: userResult.data.user.role,
        emailConfirmed: userResult.data.user.email_confirmed_at,
        createdAt: userResult.data.user.created_at
      };
    } else {
      userData = { hasUser: false };
    }
  } catch (e) {
    errors.push(`Exceção ao obter usuário: ${e}`);
    userData = { hasUser: false };
  }
  
  // 5. Headers (simulação - em produção seria diferente)
  const headers: any = {};
  if (supabaseTokenData?.access_token) {
    headers.authorization = 'Bearer ***HIDDEN***';
  }
  if (document.cookie) {
    headers.cookie = 'presente';
  }
  
  const diagnostics: AuthDiagnostics = {
    timestamp: new Date().toISOString(),
    localStorage: localStorageData,
    cookies,
    supabaseSession: sessionData,
    supabaseUser: userData,
    headers,
    errors
  };
  
  console.log('Diagnósticos coletados:', JSON.stringify(diagnostics, null, 2));
  
  // Análise e recomendações
  console.log('\n=== ANÁLISE DE PROBLEMAS ===');
  
  if (!sessionData.hasSession && !userData.hasUser) {
    console.warn('⚠️ AVISO: Nenhuma sessão Supabase ativa (usando autenticação local admin)');
  }
  
  if (sessionData.hasSession && !userData.hasUser) {
    console.warn('⚠️ AVISO: Sessão existe mas usuário não pode ser recuperado');
  }
  
  if (!localStorageData.isAdmin && localStorageData.adminEmail) {
    console.warn('⚠️ AVISO: Email admin presente mas flag isAdmin ausente');
    console.log('📋 AÇÃO: Verificar processo de login admin');
  }
  
  if (sessionData.userId !== userData.userId && sessionData.userId && userData.userId) {
    console.error('❌ PROBLEMA: IDs de usuário não correspondem entre sessão e user');
    console.log('📋 AÇÃO: Limpar cache e fazer login novamente');
  }
  
  if (errors.length > 0) {
    console.warn('⚠️ AVISOS:', errors);
  }
  
  console.log('=== FIM DOS DIAGNÓSTICOS ===\n');
  
  return diagnostics;
}

// Função para verificar políticas RLS
export async function checkRLSPolicies(tableName: string = 'raffles') {
  const supabase = createClient();
  
  console.log(`\n=== VERIFICANDO POLÍTICAS RLS PARA TABELA: ${tableName} ===`);
  
  // Tentar uma operação simples de SELECT
  console.log('1. Testando SELECT...');
  const { data: selectData, error: selectError } = await supabase
    .from(tableName)
    .select('id')
    .limit(1);
  
  if (selectError) {
    console.error('❌ SELECT falhou:', selectError.message);
  } else {
    console.log('✅ SELECT permitido');
  }
  
  // Info sobre o usuário atual
  const { data: { user } } = await supabase.auth.getUser();
  
  console.log('\n2. Usuário para teste RLS:');
  console.log('- ID:', user?.id || 'NENHUM');
  console.log('- Email:', user?.email || 'NENHUM');
  console.log('- Role:', user?.role || 'NENHUM');
  
  console.log('\n3. Recomendações para INSERT:');
  console.log('- Certifique-se de que created_by = user_id autenticado');
  console.log('- Verifique se a política permite INSERT para authenticated role');
  console.log('- Confirme que todos os campos obrigatórios estão preenchidos');
  
  console.log('=== FIM DA VERIFICAÇÃO RLS ===\n');
}

// Exportar função global para uso no console
if (typeof window !== 'undefined') {
  (window as any).authDiagnostics = collectAuthDiagnostics;
  (window as any).checkRLS = checkRLSPolicies;
  console.log('💡 Funções de diagnóstico disponíveis no console:');
  console.log('   - authDiagnostics() - Coleta diagnósticos completos');
  console.log('   - checkRLS("table_name") - Verifica políticas RLS');
}