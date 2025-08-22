/**
 * Script para aplicar migration de configuração de compra
 * Execute com: npx tsx src/lib/apply-migration.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration() {
  try {
    console.log('📦 Aplicando migration de configuração de compra...')
    
    // Adicionar coluna purchase_config se não existir
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE raffles 
        ADD COLUMN IF NOT EXISTS purchase_config JSONB DEFAULT jsonb_build_object(
          'min_purchase', 1,
          'quick_buttons', jsonb_build_array(
            jsonb_build_object('quantity', 100, 'label', '+100', 'popular', false),
            jsonb_build_object('quantity', 250, 'label', '+250', 'popular', true),
            jsonb_build_object('quantity', 500, 'label', '+500', 'popular', false),
            jsonb_build_object('quantity', 750, 'label', '+750', 'popular', false),
            jsonb_build_object('quantity', 1000, 'label', '+1000', 'popular', false),
            jsonb_build_object('quantity', 1500, 'label', '+1500', 'popular', false)
          )
        );
      `
    })
    
    if (alterError) {
      console.log('⚠️ Coluna já existe ou erro ao criar:', alterError.message)
    } else {
      console.log('✅ Coluna purchase_config adicionada com sucesso!')
    }
    
    // Adicionar comentário
    const { error: commentError } = await supabase.rpc('exec_sql', {
      sql: `
        COMMENT ON COLUMN raffles.purchase_config IS 
        'Configurações de compra: min_purchase (mínimo de números), quick_buttons (botões de quantidade rápida)';
      `
    })
    
    if (commentError) {
      console.log('⚠️ Erro ao adicionar comentário:', commentError.message)
    } else {
      console.log('✅ Comentário adicionado com sucesso!')
    }
    
    console.log('🎉 Migration aplicada com sucesso!')
    
  } catch (error) {
    console.error('❌ Erro ao aplicar migration:', error)
    process.exit(1)
  }
}

// Executar
applyMigration()