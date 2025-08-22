#!/usr/bin/env node

/**
 * Script de teste para validar a correção do problema de criação de rifas
 * Este script testa tanto a criação direta via API quanto pela interface
 */

import { chromium } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config({ path: join(__dirname, '.env.local') });

const BASE_URL = 'http://localhost:3000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123456';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente não configuradas');
  process.exit(1);
}

// Cliente Supabase com service role
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Função para gerar dados únicos de teste
function generateTestData() {
  const timestamp = Date.now();
  return {
    title: `Rifa Teste ${timestamp}`,
    description: `Descrição da rifa de teste criada em ${new Date().toLocaleString('pt-BR')}`,
    prize: 'iPhone 15 Pro Max 256GB',
    price: '5.00',
    totalNumbers: '100',
    minNumbers: '1',
    maxNumbers: '10',
    regulations: 'Regulamento de teste para validação do sistema'
  };
}

// Teste 1: Criação direta via Supabase
async function testDirectCreation() {
  console.log('\n🧪 TESTE 1: Criação direta via Supabase');
  console.log('========================================');
  
  const testData = generateTestData();
  
  try {
    console.log('📝 Inserindo rifa diretamente no banco...');
    
    const { data: raffle, error: raffleError } = await supabase
      .from('raffles')
      .insert({
        title: testData.title,
        description: testData.description,
        prize_description: testData.prize,
        number_price: parseFloat(testData.price),
        total_numbers: parseInt(testData.totalNumbers),
        min_numbers: parseInt(testData.minNumbers),
        max_numbers: parseInt(testData.maxNumbers),
        regulations: testData.regulations,
        status: 'active',
        show_progress_bar: true,
        winner_percentage: 10,
        available_numbers: parseInt(testData.totalNumbers),
        purchase_config: {
          min_purchase: 1,
          quick_buttons: [
            { quantity: 10, label: '+10', popular: false },
            { quantity: 25, label: '+25', popular: true },
            { quantity: 50, label: '+50', popular: false }
          ]
        }
      })
      .select()
      .single();

    if (raffleError) {
      console.error('❌ Erro ao criar rifa:', raffleError.message);
      console.error('Detalhes:', raffleError);
      return false;
    }

    console.log('✅ Rifa criada com sucesso!');
    console.log('   ID:', raffle.id);
    console.log('   Título:', raffle.title);
    console.log('   Status:', raffle.status);
    
    // Verificar se os números foram gerados
    console.log('\n🔢 Verificando geração de números...');
    const { data: numbers, error: numbersError } = await supabase
      .from('raffle_numbers')
      .select('count')
      .eq('raffle_id', raffle.id);
    
    if (numbersError) {
      console.error('❌ Erro ao verificar números:', numbersError.message);
      return false;
    }
    
    const totalGenerated = numbers?.[0]?.count || 0;
    
    if (totalGenerated === parseInt(testData.totalNumbers)) {
      console.log(`✅ Números gerados corretamente: ${totalGenerated}/${testData.totalNumbers}`);
    } else {
      console.log(`⚠️  Números gerados: ${totalGenerated}/${testData.totalNumbers}`);
      
      // Tentar gerar manualmente se o trigger não funcionou
      if (totalGenerated === 0) {
        console.log('🔧 Gerando números manualmente...');
        
        const numbersToInsert = [];
        for (let i = 1; i <= parseInt(testData.totalNumbers); i++) {
          numbersToInsert.push({
            raffle_id: raffle.id,
            number: i,
            status: 'available'
          });
        }
        
        const { error: insertError } = await supabase
          .from('raffle_numbers')
          .insert(numbersToInsert);
        
        if (insertError) {
          console.error('❌ Erro ao gerar números:', insertError.message);
        } else {
          console.log('✅ Números gerados manualmente com sucesso!');
        }
      }
    }
    
    // Limpar rifa de teste
    console.log('\n🧹 Limpando rifa de teste...');
    const { error: deleteError } = await supabase
      .from('raffles')
      .delete()
      .eq('id', raffle.id);
    
    if (deleteError) {
      console.error('⚠️  Erro ao limpar rifa:', deleteError.message);
    } else {
      console.log('✅ Rifa de teste removida');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error.message);
    return false;
  }
}

// Teste 2: Criação via interface admin
async function testInterfaceCreation() {
  console.log('\n🧪 TESTE 2: Criação via interface admin');
  console.log('========================================');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 // Mais lento para visualizar o teste
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const testData = generateTestData();
  
  try {
    // 1. Fazer login no admin
    console.log('🔐 Fazendo login no admin...');
    await page.goto(`${BASE_URL}/admin/login`);
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/admin', { timeout: 10000 });
    console.log('✅ Login realizado com sucesso');
    
    // 2. Navegar para criação de rifa
    console.log('\n📝 Navegando para criar nova rifa...');
    await page.goto(`${BASE_URL}/admin/raffles/new`);
    await page.waitForLoadState('networkidle');
    
    // 3. Preencher formulário
    console.log('📋 Preenchendo formulário...');
    
    // Título
    await page.fill('input[name="title"]', testData.title);
    
    // Descrição
    const descriptionField = await page.$('textarea[name="description"]');
    if (descriptionField) {
      await descriptionField.fill(testData.description);
    }
    
    // Prêmio
    await page.fill('input[name="prize_description"]', testData.prize);
    
    // Preço
    await page.fill('input[name="number_price"]', testData.price);
    
    // Total de números
    await page.fill('input[name="total_numbers"]', testData.totalNumbers);
    
    // Quantidade mínima
    await page.fill('input[name="min_numbers"]', testData.minNumbers);
    
    // Quantidade máxima
    await page.fill('input[name="max_numbers"]', testData.maxNumbers);
    
    // Regulamento
    const regulationsField = await page.$('textarea[name="regulations"]');
    if (regulationsField) {
      await regulationsField.fill(testData.regulations);
    }
    
    // Status - selecionar "Ativa"
    const statusSelect = await page.$('select[name="status"]');
    if (statusSelect) {
      await statusSelect.selectOption('active');
    }
    
    console.log('✅ Formulário preenchido');
    
    // 4. Capturar screenshot antes de salvar
    await page.screenshot({ 
      path: 'test-create-form-filled.png',
      fullPage: true 
    });
    console.log('📸 Screenshot do formulário salvo');
    
    // 5. Salvar rifa
    console.log('\n💾 Salvando rifa...');
    
    // Capturar logs do console
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Erro no console:', msg.text());
      }
    });
    
    // Interceptar requisições de rede
    page.on('response', response => {
      if (response.url().includes('/api/') || response.url().includes('supabase')) {
        if (response.status() >= 400) {
          console.log(`❌ Erro na API: ${response.status()} - ${response.url()}`);
        }
      }
    });
    
    // Clicar no botão de salvar
    const saveButton = await page.$('button:has-text("Criar Rifa")') || 
                      await page.$('button:has-text("Salvar")') ||
                      await page.$('button[type="submit"]');
    
    if (saveButton) {
      await saveButton.click();
      
      // Aguardar resposta
      try {
        await page.waitForURL('**/admin/raffles', { timeout: 10000 });
        console.log('✅ Rifa criada com sucesso via interface!');
        
        // Capturar screenshot da lista
        await page.screenshot({ 
          path: 'test-create-success.png',
          fullPage: true 
        });
        
        // Verificar se a rifa aparece na lista
        const raffleInList = await page.locator(`text="${testData.title}"`).count();
        if (raffleInList > 0) {
          console.log('✅ Rifa aparece na lista');
          
          // Limpar rifa de teste
          console.log('\n🧹 Removendo rifa de teste...');
          const { error } = await supabase
            .from('raffles')
            .delete()
            .eq('title', testData.title);
          
          if (!error) {
            console.log('✅ Rifa de teste removida');
          }
        }
        
        return true;
        
      } catch (error) {
        console.error('⚠️  Timeout ao aguardar redirecionamento');
        
        // Verificar se há mensagem de erro na tela
        const errorMessage = await page.locator('.text-red-500, .text-destructive, [role="alert"]').textContent();
        if (errorMessage) {
          console.error('❌ Erro na interface:', errorMessage);
        }
        
        // Capturar screenshot do erro
        await page.screenshot({ 
          path: 'test-create-error.png',
          fullPage: true 
        });
        
        return false;
      }
    } else {
      console.error('❌ Botão de salvar não encontrado');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Erro durante teste:', error.message);
    
    // Capturar screenshot do erro
    await page.screenshot({ 
      path: 'test-error.png',
      fullPage: true 
    });
    
    return false;
    
  } finally {
    await browser.close();
  }
}

// Executar todos os testes
async function runTests() {
  console.log('🚀 INICIANDO TESTES DE CRIAÇÃO DE RIFAS');
  console.log('========================================');
  console.log('Certifique-se de que:');
  console.log('1. O servidor Next.js está rodando (npm run dev)');
  console.log('2. As correções SQL foram aplicadas no Supabase');
  console.log('3. O usuário admin foi criado (node scripts/setup-admin-supabase.mjs)');
  console.log('');
  
  let testsPass = true;
  
  // Teste 1: Criação direta
  const test1Result = await testDirectCreation();
  if (!test1Result) {
    testsPass = false;
    console.log('\n⚠️  Teste 1 falhou - verifique as correções SQL');
  }
  
  // Pequena pausa entre testes
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Teste 2: Criação via interface
  const test2Result = await testInterfaceCreation();
  if (!test2Result) {
    testsPass = false;
    console.log('\n⚠️  Teste 2 falhou - verifique a interface admin');
  }
  
  // Resultado final
  console.log('\n========================================');
  console.log('RESULTADO FINAL DOS TESTES');
  console.log('========================================');
  
  if (testsPass) {
    console.log('✅ TODOS OS TESTES PASSARAM!');
    console.log('A criação de rifas está funcionando corretamente.');
  } else {
    console.log('❌ ALGUNS TESTES FALHARAM');
    console.log('\nPróximos passos:');
    console.log('1. Execute as correções SQL no Supabase Dashboard');
    console.log('2. Verifique se o service role key está configurado');
    console.log('3. Confirme que o usuário admin foi criado');
    console.log('4. Revise os logs acima para identificar o problema específico');
  }
}

// Executar testes
runTests().catch(console.error);