#!/usr/bin/env node

/**
 * Script para criar usuário admin no Supabase
 * Este script cria um usuário admin que pode ser usado para autenticação no sistema
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config({ path: join(dirname(__dirname), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente não configuradas');
  console.error('Certifique-se de que NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão definidas em .env.local');
  process.exit(1);
}

// Criar cliente Supabase com service role key (bypass RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupAdmin() {
  console.log('🚀 Iniciando setup do usuário admin...\n');

  try {
    // 1. Criar usuário admin no Supabase Auth
    const adminEmail = 'admin@rtdasorte.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
    
    console.log('📧 Criando usuário admin com email:', adminEmail);
    
    // Tentar criar o usuário
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true, // Confirmar email automaticamente
      user_metadata: {
        name: 'Administrador',
        role: 'admin'
      }
    });

    if (authError) {
      if (authError.message?.includes('already been registered')) {
        console.log('⚠️  Usuário admin já existe no Auth');
        
        // Buscar o usuário existente
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        
        if (listError) {
          throw listError;
        }
        
        const existingUser = users?.find(u => u.email === adminEmail);
        if (existingUser) {
          console.log('✅ Usuário encontrado:', existingUser.id);
          
          // Atualizar a senha se necessário
          const { error: updateError } = await supabase.auth.admin.updateUserById(
            existingUser.id,
            { password: adminPassword }
          );
          
          if (updateError) {
            console.log('⚠️  Não foi possível atualizar a senha:', updateError.message);
          } else {
            console.log('✅ Senha atualizada com sucesso');
          }
          
          // Continuar com o setup do perfil
          await setupUserProfile(existingUser.id, adminEmail);
        }
      } else {
        throw authError;
      }
    } else {
      console.log('✅ Usuário criado no Auth:', authData.user.id);
      await setupUserProfile(authData.user.id, adminEmail);
    }

    // 3. Criar entrada na tabela users (compatibilidade)
    console.log('\n📝 Verificando tabela users...');
    
    const { data: existingUser, error: selectError } = await supabase
      .from('users')
      .select('*')
      .eq('email', adminEmail)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      console.error('Erro ao verificar usuário:', selectError);
    }

    if (!existingUser) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
          email: adminEmail,
          name: 'Administrador',
          phone: '+5511999999999',
          cpf: '00000000000',
          is_admin: true,
          status: 'active'
        })
        .select()
        .single();

      if (userError) {
        console.error('⚠️  Erro ao criar usuário na tabela users:', userError.message);
      } else {
        console.log('✅ Usuário criado na tabela users');
      }
    } else {
      // Atualizar usuário existente para garantir que é admin
      const { error: updateError } = await supabase
        .from('users')
        .update({
          is_admin: true,
          status: 'active'
        })
        .eq('email', adminEmail);

      if (updateError) {
        console.error('⚠️  Erro ao atualizar usuário:', updateError.message);
      } else {
        console.log('✅ Usuário atualizado como admin');
      }
    }

    console.log('\n========================================');
    console.log('✅ Setup concluído com sucesso!');
    console.log('========================================');
    console.log('\n📋 Credenciais do Admin:');
    console.log('Email:', adminEmail);
    console.log('Senha:', adminPassword);
    console.log('\n🔐 Acesse o painel em: http://localhost:3000/admin/login');
    console.log('\n⚠️  IMPORTANTE: Mude a senha após o primeiro acesso!');
    
  } catch (error) {
    console.error('\n❌ Erro durante o setup:', error.message);
    process.exit(1);
  }
}

async function setupUserProfile(userId, email) {
  console.log('\n👤 Configurando perfil do usuário...');
  
  // 2. Verificar/criar perfil na tabela profiles
  const { data: profile, error: profileSelectError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (profileSelectError && profileSelectError.code !== 'PGRST116') {
    console.error('Erro ao verificar perfil:', profileSelectError);
  }

  if (!profile) {
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        name: 'Administrador',
        phone: '+5511999999999',
        cpf: '00000000000',
        is_admin: true
      })
      .select()
      .single();

    if (profileError) {
      console.error('⚠️  Erro ao criar perfil:', profileError.message);
    } else {
      console.log('✅ Perfil criado com sucesso');
    }
  } else {
    // Atualizar perfil existente
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        is_admin: true,
        name: profile.name || 'Administrador'
      })
      .eq('id', userId);

    if (updateError) {
      console.error('⚠️  Erro ao atualizar perfil:', updateError.message);
    } else {
      console.log('✅ Perfil atualizado como admin');
    }
  }
}

// Executar o setup
setupAdmin();