import { chromium } from '@playwright/test';

const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  adminEmail: 'slimc215@gmail.com',
  adminPassword: '62845_Madhouse',
  timeout: 30000
};

async function testCompleteAdminFlow() {
  console.log('🚀 Teste Completo do Fluxo Administrativo\n');
  console.log('='.repeat(50));
  
  const browser = await chromium.launch({ 
    headless: true
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  const results = {
    login: false,
    navigation: false,
    editRaffle: false,
    multipleEdits: false,
    sessionPersistence: false
  };
  
  try {
    // TESTE 1: Login
    console.log('\n📝 TESTE 1: Login Administrativo');
    console.log('─'.repeat(40));
    
    await page.goto(`${TEST_CONFIG.baseUrl}/admin/login`, { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', TEST_CONFIG.adminEmail);
    await page.fill('input[type="password"]', TEST_CONFIG.adminPassword);
    await page.click('button[type="submit"]');
    
    try {
      await page.waitForURL('**/admin', { timeout: 10000 });
      results.login = true;
      console.log('✅ Login bem-sucedido');
    } catch {
      console.log('❌ Falha no login');
    }
    
    // TESTE 2: Navegação entre páginas
    console.log('\n📝 TESTE 2: Navegação entre Páginas Admin');
    console.log('─'.repeat(40));
    
    const pages = [
      { url: '/admin/raffles', name: 'Rifas' },
      { url: '/admin/users', name: 'Usuários' },
      { url: '/admin/transactions', name: 'Transações' },
      { url: '/admin/winners', name: 'Ganhadores' },
      { url: '/admin/settings', name: 'Configurações' }
    ];
    
    let navSuccess = true;
    for (const pageInfo of pages) {
      await page.goto(`${TEST_CONFIG.baseUrl}${pageInfo.url}`, { waitUntil: 'networkidle' });
      const currentUrl = page.url();
      
      if (currentUrl.includes('/admin/login')) {
        console.log(`❌ Deslogado ao acessar ${pageInfo.name}`);
        navSuccess = false;
        break;
      } else {
        console.log(`✅ Acessou ${pageInfo.name}`);
      }
    }
    results.navigation = navSuccess;
    
    // TESTE 3: Editar Rifa
    console.log('\n📝 TESTE 3: Editar e Salvar Rifa');
    console.log('─'.repeat(40));
    
    await page.goto(`${TEST_CONFIG.baseUrl}/admin/raffles`, { waitUntil: 'networkidle' });
    const editButton = await page.locator('a[href*="/admin/raffles/"][href*="/edit"]').first();
    
    if (await editButton.count() > 0) {
      await editButton.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      // Fazer alterações
      const titleInput = await page.locator('#title');
      const originalTitle = await titleInput.inputValue();
      await titleInput.fill(`${originalTitle.split(' - VALIDAÇÃO')[0]} - VALIDAÇÃO ${Date.now()}`);
      
      // Salvar
      await page.click('button[type="submit"]:has-text("Salvar")');
      await page.waitForTimeout(3000);
      
      const afterSaveUrl = page.url();
      if (afterSaveUrl.includes('/admin/raffles') && !afterSaveUrl.includes('/login')) {
        results.editRaffle = true;
        console.log('✅ Rifa editada e salva com sucesso');
      } else {
        console.log('❌ Falha ao salvar rifa ou foi deslogado');
      }
    } else {
      console.log('⚠️ Nenhuma rifa encontrada para editar');
    }
    
    // TESTE 4: Múltiplas Edições Consecutivas
    console.log('\n📝 TESTE 4: Múltiplas Edições Consecutivas');
    console.log('─'.repeat(40));
    
    let multiEditSuccess = true;
    for (let i = 1; i <= 3; i++) {
      await page.goto(`${TEST_CONFIG.baseUrl}/admin/raffles`, { waitUntil: 'networkidle' });
      
      const editBtn = await page.locator('a[href*="/admin/raffles/"][href*="/edit"]').first();
      if (await editBtn.count() > 0) {
        await editBtn.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1500);
        
        // Alterar campo
        const descInput = await page.locator('#description');
        const currentDesc = await descInput.inputValue();
        await descInput.fill(`${currentDesc}\nEdição ${i} - ${new Date().toISOString()}`);
        
        // Salvar
        await page.click('button[type="submit"]:has-text("Salvar")');
        await page.waitForTimeout(2000);
        
        const url = page.url();
        if (url.includes('/admin/login')) {
          console.log(`❌ Deslogado na edição ${i}`);
          multiEditSuccess = false;
          break;
        } else {
          console.log(`✅ Edição ${i} concluída`);
        }
      }
    }
    results.multipleEdits = multiEditSuccess;
    
    // TESTE 5: Persistência de Sessão
    console.log('\n📝 TESTE 5: Persistência de Sessão');
    console.log('─'.repeat(40));
    
    // Aguardar 5 segundos e verificar se ainda está logado
    await page.waitForTimeout(5000);
    await page.goto(`${TEST_CONFIG.baseUrl}/admin/raffles`, { waitUntil: 'networkidle' });
    
    const finalUrl = page.url();
    if (finalUrl.includes('/admin/raffles') && !finalUrl.includes('/login')) {
      results.sessionPersistence = true;
      console.log('✅ Sessão persistiu após todas as operações');
    } else {
      console.log('❌ Sessão perdida');
    }
    
  } catch (error) {
    console.error('\n❌ Erro durante teste:', error.message);
  } finally {
    await browser.close();
    
    // RELATÓRIO FINAL
    console.log('\n' + '='.repeat(50));
    console.log('📊 RELATÓRIO FINAL DE VALIDAÇÃO');
    console.log('='.repeat(50));
    
    const tests = [
      { name: 'Login Administrativo', passed: results.login },
      { name: 'Navegação entre Páginas', passed: results.navigation },
      { name: 'Editar e Salvar Rifa', passed: results.editRaffle },
      { name: 'Múltiplas Edições', passed: results.multipleEdits },
      { name: 'Persistência de Sessão', passed: results.sessionPersistence }
    ];
    
    tests.forEach(test => {
      console.log(`${test.passed ? '✅' : '❌'} ${test.name}`);
    });
    
    const totalPassed = tests.filter(t => t.passed).length;
    const totalTests = tests.length;
    const successRate = (totalPassed / totalTests * 100).toFixed(0);
    
    console.log('\n' + '─'.repeat(50));
    console.log(`Taxa de Sucesso: ${successRate}% (${totalPassed}/${totalTests})`);
    console.log('─'.repeat(50));
    
    if (totalPassed === totalTests) {
      console.log('\n🎉 CORREÇÃO VALIDADA COM SUCESSO!');
      console.log('Todos os testes passaram. O problema foi completamente resolvido.');
    } else if (totalPassed >= 3) {
      console.log('\n✅ CORREÇÃO PARCIALMENTE VALIDADA');
      console.log('A maioria dos testes passou, mas alguns problemas persistem.');
    } else {
      console.log('\n❌ CORREÇÃO NÃO VALIDADA');
      console.log('Muitos testes falharam. Necessária revisão da solução.');
    }
    
    console.log('\n' + '='.repeat(50));
    process.exit(totalPassed === totalTests ? 0 : 1);
  }
}

// Executar teste completo
testCompleteAdminFlow().catch(error => {
  console.error('Erro fatal:', error);
  process.exit(1);
});