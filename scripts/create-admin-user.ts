import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Carregar variáveis de ambiente
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas')
  console.error('Certifique-se de ter NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createAdminUser() {
  console.log('🚀 Criando usuário admin no Supabase...')
  
  const adminEmail = 'slimc215@gmail.com'
  const adminPassword = '62845_Madhouse'
  
  try {
    // Primeiro, verificar se o usuário já existe
    const { data: existingUser, error: checkError } = await supabase.auth.admin.getUserByEmail(adminEmail)
    
    if (existingUser) {
      console.log('✅ Usuário admin já existe!')
      console.log('ID:', existingUser.user.id)
      console.log('Email:', existingUser.user.email)
      console.log('Criado em:', existingUser.user.created_at)
      
      // Atualizar metadados se necessário
      const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
        existingUser.user.id,
        {
          user_metadata: {
            role: 'admin',
            is_admin: true
          },
          app_metadata: {
            role: 'admin',
            is_admin: true
          }
        }
      )
      
      if (updateError) {
        console.error('❌ Erro ao atualizar metadados:', updateError)
      } else {
        console.log('✅ Metadados atualizados com sucesso!')
      }
      
      return
    }
    
    // Criar novo usuário admin
    console.log('📝 Criando novo usuário admin...')
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true, // Auto-confirmar email
      user_metadata: {
        role: 'admin',
        is_admin: true
      },
      app_metadata: {
        role: 'admin',
        is_admin: true
      }
    })
    
    if (createError) {
      console.error('❌ Erro ao criar usuário:', createError)
      return
    }
    
    console.log('✅ Usuário admin criado com sucesso!')
    console.log('ID:', newUser.user.id)
    console.log('Email:', newUser.user.email)
    
    // Verificar se consegue fazer login
    console.log('\n🔐 Testando login...')
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword
    })
    
    if (signInError) {
      console.error('❌ Erro ao fazer login:', signInError)
    } else {
      console.log('✅ Login bem-sucedido!')
      console.log('Token de acesso gerado:', signInData.session?.access_token ? 'SIM' : 'NÃO')
    }
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error)
  }
}

// Executar
createAdminUser().then(() => {
  console.log('\n🏁 Processo concluído')
  process.exit(0)
})