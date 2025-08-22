import { chromium } from 'playwright';

console.log('🚀 Iniciando teste de criação de rifa com debug...');

const browser = await chromium.launch({ 
  headless: false,
  slowMo: 500
});
const context = await browser.newContext();
const page = await context.newPage();

// Capturar logs do console
page.on('console', msg => {
  if (msg.type() === 'error') {
    console.log('❌ Console Error:', msg.text());
  }
});

// Capturar erros de página
page.on('pageerror', error => {
  console.log('❌ Page Error:', error.message);
});

// Capturar requisições de rede
page.on('requestfailed', request => {
  console.log('❌ Request Failed:', request.url(), request.failure());
});

try {
  // 1. Fazer login como admin
  console.log('\n1️⃣ Fazendo login como admin...');
  await page.goto('http://localhost:3001/admin/login');
  await page.waitForTimeout(1000);
  
  await page.fill('input[type="email"]', 'slimc215@gmail.com');
  await page.fill('input[type="password"]', '62845_Madhouse');
  await page.click('button:has-text("Entrar")');
  await page.waitForTimeout(3000);
  
  // 2. Navegar para criar nova rifa
  console.log('\n2️⃣ Navegando para criar nova rifa...');
  await page.goto('http://localhost:3001/admin/raffles/new');
  await page.waitForTimeout(2000);
  
  // Capturar screenshot inicial
  await page.screenshot({ path: 'test-create-1-form.png', fullPage: true });
  console.log('   ✅ Screenshot do formulário salvo');
  
  // 3. Preencher o formulário
  console.log('\n3️⃣ Preenchendo formulário da rifa...');
  
  await page.fill('input[id="title"]', 'Rifa Teste Debug ' + Date.now());
  await page.fill('textarea[id="description"]', 'Esta é uma rifa de teste para debug do sistema');
  await page.fill('input[id="prize_description"]', 'Prêmio de teste no valor de R$ 1.000,00');
  await page.fill('input[id="ticket_price"]', '5.00');
  await page.fill('input[id="total_numbers"]', '100');
  
  // Selecionar status
  await page.selectOption('select[id="status"]', 'active');
  
  // Capturar screenshot após preencher
  await page.screenshot({ path: 'test-create-2-filled.png', fullPage: true });
  console.log('   ✅ Screenshot do formulário preenchido salvo');
  
  // 4. Tentar submeter o formulário
  console.log('\n4️⃣ Submetendo formulário...');
  
  // Interceptar response da API
  const responsePromise = page.waitForResponse(
    response => response.url().includes('/api/') || response.url().includes('supabase'),
    { timeout: 10000 }
  ).catch(() => null);
  
  // Clicar no botão de criar
  await page.click('button:has-text("Criar Rifa")');
  
  // Aguardar resposta ou timeout
  const response = await responsePromise;
  
  if (response) {
    console.log('\n📡 Resposta da API:');
    console.log('   URL:', response.url());
    console.log('   Status:', response.status());
    
    if (!response.ok()) {
      const responseBody = await response.text().catch(() => 'Não foi possível ler o corpo da resposta');
      console.log('   ❌ Erro:', responseBody);
    }
  }
  
  // Aguardar um pouco para ver se há redirecionamento ou erro
  await page.waitForTimeout(5000);
  
  // 5. Verificar o resultado
  console.log('\n5️⃣ Verificando resultado...');
  
  const currentUrl = page.url();
  console.log('   URL atual:', currentUrl);
  
  // Verificar se há mensagens de erro na página
  const errorMessages = await page.$$('.text-red-500, .bg-red-500, [class*="error"]');
  if (errorMessages.length > 0) {
    console.log('   ⚠️ Possíveis mensagens de erro encontradas');
    for (const element of errorMessages) {
      const text = await element.textContent();
      if (text && text.trim()) {
        console.log('   Erro:', text.trim());
      }
    }
  }
  
  // Capturar screenshot final
  await page.screenshot({ path: 'test-create-3-result.png', fullPage: true });
  console.log('   ✅ Screenshot do resultado salvo');
  
  // Verificar se foi redirecionado para a lista de rifas (sucesso)
  if (currentUrl.includes('/admin/raffles') && !currentUrl.includes('/new')) {
    console.log('\n✅ Rifa criada com sucesso!');
  } else {
    console.log('\n❌ Falha ao criar rifa - ainda na página de criação');
    
    // Tentar capturar logs do browser
    console.log('\n📝 Logs do browser:');
    const logs = await page.evaluate(() => {
      return {
        localStorage: Object.keys(localStorage).reduce((acc, key) => {
          acc[key] = localStorage.getItem(key);
          return acc;
        }, {}),
        sessionStorage: Object.keys(sessionStorage).reduce((acc, key) => {
          acc[key] = sessionStorage.getItem(key);
          return acc;
        }, {})
      };
    });
    
    console.log('   LocalStorage:', JSON.stringify(logs.localStorage, null, 2));
    console.log('   SessionStorage:', JSON.stringify(logs.sessionStorage, null, 2));
  }
  
} catch (error) {
  console.error('\n❌ Erro durante o teste:', error.message);
  
  // Capturar screenshot de erro
  await page.screenshot({ path: 'test-create-error.png', fullPage: true });
  console.log('   📸 Screenshot de erro salvo');
  
} finally {
  await browser.close();
  console.log('\n🏁 Teste finalizado');
}