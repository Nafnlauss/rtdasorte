import { chromium } from '@playwright/test';

const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  adminEmail: 'slimc215@gmail.com',
  adminPassword: '62845_Madhouse',
  timeout: 30000
};

async function testAdminRaffleSave() {
  console.log('🚀 Iniciando teste de salvamento de rifa no admin...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true 
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  // Capturar logs do console
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    
    // Filtrar logs importantes de autenticação
    if (text.includes('auth') || text.includes('session') || text.includes('token') || 
        text.includes('submit') || text.includes('error') || text.includes('logout')) {
      console.log(`[${type.toUpperCase()}] ${text}`);
    }
  });
  
  // Capturar requisições de rede
  page.on('request', request => {
    const url = request.url();
    if (url.includes('/api/') || url.includes('supabase')) {
      console.log(`📤 REQUEST: ${request.method()} ${url}`);
    }
  });
  
  page.on('response', response => {
    const url = response.url();
    if (url.includes('/api/') || url.includes('supabase')) {
      console.log(`📥 RESPONSE: ${response.status()} ${url}`);
    }
  });
  
  try {
    // Passo 1: Fazer login no admin
    console.log('\n📝 Passo 1: Fazendo login no admin...');
    await page.goto(`${TEST_CONFIG.baseUrl}/admin/login`, { waitUntil: 'networkidle' });
    
    // Screenshot inicial
    await page.screenshot({ path: 'test-1-login-page.png' });
    
    // Preencher formulário de login
    await page.fill('input[type="email"]', TEST_CONFIG.adminEmail);
    await page.fill('input[type="password"]', TEST_CONFIG.adminPassword);
    
    // Clicar no botão de login
    await page.click('button[type="submit"]');
    
    // Aguardar redirecionamento
    await page.waitForURL('**/admin', { timeout: 10000 });
    console.log('✅ Login realizado com sucesso!');
    
    // Screenshot após login
    await page.screenshot({ path: 'test-2-admin-dashboard.png' });
    
    // Passo 2: Navegar para lista de rifas
    console.log('\n📝 Passo 2: Navegando para lista de rifas...');
    await page.goto(`${TEST_CONFIG.baseUrl}/admin/raffles`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Screenshot lista de rifas
    await page.screenshot({ path: 'test-3-raffles-list.png' });
    
    // Passo 3: Clicar em editar primeira rifa
    console.log('\n📝 Passo 3: Abrindo edição de rifa...');
    const editButton = await page.locator('a[href*="/admin/raffles/"][href*="/edit"]').first();
    
    if (await editButton.count() > 0) {
      await editButton.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      // Screenshot página de edição
      await page.screenshot({ path: 'test-4-edit-page.png' });
      
      // Passo 4: Verificar sessão antes de editar
      console.log('\n📝 Passo 4: Verificando sessão antes de editar...');
      const cookies = await context.cookies();
      const authCookies = cookies.filter(c => c.name.includes('auth') || c.name.includes('supabase'));
      console.log(`Cookies de autenticação encontrados: ${authCookies.length}`);
      authCookies.forEach(cookie => {
        console.log(`  - ${cookie.name}: ${cookie.value.substring(0, 20)}...`);
      });
      
      // Verificar localStorage
      const localStorage = await page.evaluate(() => {
        const items = {};
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          if (key && (key.includes('auth') || key.includes('supabase'))) {
            items[key] = window.localStorage.getItem(key)?.substring(0, 50) + '...';
          }
        }
        return items;
      });
      console.log('LocalStorage auth items:', localStorage);
      
      // Passo 5: Fazer alterações no formulário
      console.log('\n📝 Passo 5: Fazendo alterações no formulário...');
      
      // Alterar título
      const titleInput = await page.locator('#title');
      const currentTitle = await titleInput.inputValue();
      const newTitle = currentTitle + ' - TESTE ' + Date.now();
      await titleInput.fill(newTitle);
      console.log(`Título alterado de "${currentTitle}" para "${newTitle}"`);
      
      // Alterar descrição
      const descInput = await page.locator('#description');
      const currentDesc = await descInput.inputValue();
      await descInput.fill(currentDesc + '\n\nAlteração de teste: ' + new Date().toLocaleString('pt-BR'));
      
      // Screenshot após alterações
      await page.screenshot({ path: 'test-5-after-changes.png' });
      
      // Passo 6: Salvar alterações
      console.log('\n📝 Passo 6: Salvando alterações...');
      
      // Aguardar um pouco antes de salvar
      await page.waitForTimeout(2000);
      
      // Clicar no botão salvar
      const saveButton = await page.locator('button[type="submit"]:has-text("Salvar")');
      
      console.log('Clicando no botão de salvar...');
      await saveButton.click();
      
      // Aguardar resposta
      await page.waitForTimeout(5000);
      
      // Passo 7: Verificar resultado
      console.log('\n📝 Passo 7: Verificando resultado...');
      
      // Verificar se ainda está logado
      const currentUrl = page.url();
      console.log(`URL atual: ${currentUrl}`);
      
      // Screenshot final
      await page.screenshot({ path: 'test-6-after-save.png' });
      
      if (currentUrl.includes('/admin/login')) {
        console.log('❌ ERRO: Usuário foi deslogado após salvar!');
        
        // Verificar cookies após deslogamento
        const cookiesAfter = await context.cookies();
        const authCookiesAfter = cookiesAfter.filter(c => c.name.includes('auth') || c.name.includes('supabase'));
        console.log(`\nCookies após deslogamento: ${authCookiesAfter.length}`);
        
        // Verificar localStorage após deslogamento
        const localStorageAfter = await page.evaluate(() => {
          const items = {};
          for (let i = 0; i < window.localStorage.length; i++) {
            const key = window.localStorage.key(i);
            if (key && (key.includes('auth') || key.includes('supabase'))) {
              items[key] = window.localStorage.getItem(key)?.substring(0, 50) + '...';
            }
          }
          return items;
        });
        console.log('LocalStorage após deslogamento:', localStorageAfter);
        
        return false;
      } else if (currentUrl.includes('/admin/raffles')) {
        console.log('✅ SUCESSO: Rifa salva e usuário continua logado!');
        return true;
      } else {
        console.log(`⚠️ Estado inesperado: ${currentUrl}`);
        
        // Verificar se há algum alerta
        const alertText = await page.evaluate(() => {
          return window.lastAlertMessage || null;
        });
        
        if (alertText) {
          console.log(`Alerta detectado: ${alertText}`);
        }
        
        return false;
      }
      
    } else {
      console.log('❌ Nenhuma rifa encontrada para editar');
      
      // Criar uma rifa para teste
      console.log('Criando uma rifa para teste...');
      await page.goto(`${TEST_CONFIG.baseUrl}/admin/raffles/new`);
      // ... código para criar rifa ...
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
    await page.screenshot({ path: 'test-error.png' });
    throw error;
  } finally {
    await browser.close();
  }
}

// Interceptar alerts
const originalAlert = global.alert;
global.alert = (message) => {
  console.log(`🔔 ALERT: ${message}`);
  global.lastAlertMessage = message;
};

// Executar teste
testAdminRaffleSave()
  .then(success => {
    console.log('\n' + '='.repeat(50));
    if (success) {
      console.log('✅ TESTE CONCLUÍDO COM SUCESSO!');
    } else {
      console.log('❌ TESTE FALHOU - PROBLEMA REPRODUZIDO');
    }
    console.log('='.repeat(50));
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Erro fatal:', error);
    process.exit(1);
  });