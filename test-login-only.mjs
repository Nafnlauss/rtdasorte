import { chromium } from '@playwright/test';

const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  adminEmail: 'slimc215@gmail.com',
  adminPassword: '62845_Madhouse',
  timeout: 30000
};

async function testLogin() {
  console.log('🚀 Teste de Login Simples\n');
  
  const browser = await chromium.launch({ 
    headless: false // Vamos ver o que acontece
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  // Adicionar listener para console logs
  page.on('console', msg => {
    if (msg.type() === 'log' || msg.type() === 'error' || msg.type() === 'warning') {
      console.log(`[Browser ${msg.type()}]:`, msg.text());
    }
  });
  
  try {
    console.log('📝 Navegando para página de login...');
    await page.goto(`${TEST_CONFIG.baseUrl}/admin/login`, { 
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    console.log('✅ Página carregada');
    
    // Aguardar os campos estarem visíveis
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    console.log('✅ Campo de email encontrado');
    
    await page.fill('input[type="email"]', TEST_CONFIG.adminEmail);
    console.log('✅ Email preenchido');
    
    await page.fill('input[type="password"]', TEST_CONFIG.adminPassword);
    console.log('✅ Senha preenchida');
    
    // Tirar screenshot antes de clicar
    await page.screenshot({ path: 'before-login.png' });
    console.log('📸 Screenshot antes do login salva');
    
    await page.click('button[type="submit"]');
    console.log('✅ Botão de login clicado');
    
    // Aguardar navegação ou erro
    try {
      await page.waitForURL('**/admin', { timeout: 10000 });
      console.log('✅ Login bem-sucedido! Redirecionado para /admin');
      
      // Tirar screenshot após login
      await page.screenshot({ path: 'after-login.png' });
      console.log('📸 Screenshot após login salva');
      
    } catch (navError) {
      console.log('❌ Não redirecionou para /admin');
      console.log('URL atual:', page.url());
      
      // Verificar se há mensagem de erro
      const errorElement = await page.$('text=Email ou senha incorretos');
      if (errorElement) {
        console.log('❌ Erro de credenciais mostrado na tela');
      }
      
      // Tirar screenshot do erro
      await page.screenshot({ path: 'login-error.png' });
      console.log('📸 Screenshot do erro salva');
    }
    
  } catch (error) {
    console.error('❌ Erro durante teste:', error.message);
    await page.screenshot({ path: 'error-state.png' });
  } finally {
    // Aguardar um pouco para ver o resultado
    await page.waitForTimeout(3000);
    await browser.close();
  }
}

// Executar teste
testLogin().catch(error => {
  console.error('Erro ao executar teste:', error);
  process.exit(1);
});