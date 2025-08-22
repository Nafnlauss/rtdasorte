import { chromium } from '@playwright/test';

const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  adminEmail: 'slimc215@gmail.com',
  adminPassword: '62845_Madhouse',
  timeout: 30000
};

async function testMultipleSaves() {
  console.log('🚀 Iniciando teste de múltiplos salvamentos...\n');
  
  const browser = await chromium.launch({ 
    headless: true // Executar sem interface para ser mais rápido
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  let successCount = 0;
  let failureCount = 0;
  const testRounds = 3;
  
  try {
    // Fazer login uma vez
    console.log('📝 Fazendo login no admin...');
    await page.goto(`${TEST_CONFIG.baseUrl}/admin/login`, { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', TEST_CONFIG.adminEmail);
    await page.fill('input[type="password"]', TEST_CONFIG.adminPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin', { timeout: 10000 });
    console.log('✅ Login realizado\n');
    
    // Navegar para lista de rifas
    await page.goto(`${TEST_CONFIG.baseUrl}/admin/raffles`, { waitUntil: 'networkidle' });
    
    // Executar múltiplos testes de salvamento
    for (let round = 1; round <= testRounds; round++) {
      console.log(`\n🔄 Rodada ${round}/${testRounds}`);
      console.log('─'.repeat(40));
      
      try {
        // Abrir edição
        const editButton = await page.locator('a[href*="/admin/raffles/"][href*="/edit"]').first();
        await editButton.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        // Fazer alteração
        const titleInput = await page.locator('#title');
        const currentTitle = await titleInput.inputValue();
        const newTitle = `${currentTitle.split(' - TESTE')[0]} - TESTE ${Date.now()}`;
        await titleInput.fill(newTitle);
        console.log(`  ✏️ Título alterado`);
        
        // Alterar descrição também
        const descInput = await page.locator('#description');
        const currentDesc = await descInput.inputValue();
        await descInput.fill(`${currentDesc}\nAlteração ${round} - ${new Date().toLocaleString('pt-BR')}`);
        console.log(`  ✏️ Descrição alterada`);
        
        // Salvar usando clique programático para garantir que o evento do React seja disparado
        await page.evaluate(() => {
          // Procurar botão de salvar por texto
          const buttons = Array.from(document.querySelectorAll('button[type="submit"], button'));
          const saveButton = buttons.find(btn => 
            btn.textContent.includes('Salvar') || 
            btn.textContent.includes('Alterações')
          );
          
          if (saveButton) {
            // Criar e disparar evento de clique nativo
            const event = new MouseEvent('click', { bubbles: true, cancelable: true });
            saveButton.dispatchEvent(event);
            console.log('Botão de salvar clicado programaticamente');
          } else {
            // Fallback: tentar submeter o formulário diretamente
            const form = document.querySelector('form');
            if (form) {
              const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
              form.dispatchEvent(submitEvent);
              console.log('Formulário submetido programaticamente');
            }
          }
        });
        
        // Aguardar resposta
        await page.waitForTimeout(3000);
        
        // Verificar resultado
        const currentUrl = page.url();
        
        if (currentUrl.includes('/admin/login')) {
          console.log(`  ❌ FALHA: Usuário foi deslogado!`);
          failureCount++;
          
          // Fazer login novamente para continuar o teste
          await page.fill('input[type="email"]', TEST_CONFIG.adminEmail);
          await page.fill('input[type="password"]', TEST_CONFIG.adminPassword);
          await page.click('button[type="submit"]');
          await page.waitForURL('**/admin', { timeout: 10000 });
          await page.goto(`${TEST_CONFIG.baseUrl}/admin/raffles`, { waitUntil: 'networkidle' });
        } else if (currentUrl.includes('/admin/raffles')) {
          console.log(`  ✅ SUCESSO: Salvamento ${round} concluído!`);
          successCount++;
        } else {
          console.log(`  ⚠️ Estado inesperado: ${currentUrl}`);
          failureCount++;
          await page.goto(`${TEST_CONFIG.baseUrl}/admin/raffles`, { waitUntil: 'networkidle' });
        }
        
        // Pequena pausa entre testes
        await page.waitForTimeout(1000);
        
      } catch (error) {
        console.log(`  ❌ Erro na rodada ${round}: ${error.message}`);
        failureCount++;
        
        // Tentar recuperar navegando de volta
        try {
          await page.goto(`${TEST_CONFIG.baseUrl}/admin/raffles`, { waitUntil: 'networkidle' });
        } catch (navError) {
          console.log('    Não foi possível recuperar navegação');
          break;
        }
      }
    }
    
    // Teste adicional: verificar se ainda está logado após todos os salvamentos
    console.log('\n📝 Verificação final de sessão...');
    await page.goto(`${TEST_CONFIG.baseUrl}/admin/raffles`, { waitUntil: 'networkidle' });
    const finalUrl = page.url();
    
    if (finalUrl.includes('/admin/raffles')) {
      console.log('✅ Sessão mantida após múltiplos salvamentos!');
    } else {
      console.log('❌ Sessão perdida após múltiplos salvamentos');
    }
    
  } catch (error) {
    console.error('❌ Erro fatal durante teste:', error);
  } finally {
    await browser.close();
    
    // Relatório final
    console.log('\n' + '='.repeat(50));
    console.log('📊 RELATÓRIO FINAL');
    console.log('='.repeat(50));
    console.log(`Total de rodadas: ${testRounds}`);
    console.log(`✅ Sucessos: ${successCount}`);
    console.log(`❌ Falhas: ${failureCount}`);
    console.log(`Taxa de sucesso: ${((successCount / testRounds) * 100).toFixed(1)}%`);
    
    if (successCount === testRounds) {
      console.log('\n🎉 TODOS OS TESTES PASSARAM!');
      console.log('O problema de deslogamento foi CORRIGIDO com sucesso!');
    } else if (successCount > 0) {
      console.log('\n⚠️ CORREÇÃO PARCIAL');
      console.log('Alguns salvamentos funcionaram, mas ainda há instabilidade.');
    } else {
      console.log('\n❌ CORREÇÃO FALHOU');
      console.log('O problema persiste em todos os casos.');
    }
    console.log('='.repeat(50));
    
    process.exit(successCount === testRounds ? 0 : 1);
  }
}

// Executar teste
testMultipleSaves().catch(error => {
  console.error('Erro ao executar teste:', error);
  process.exit(1);
});