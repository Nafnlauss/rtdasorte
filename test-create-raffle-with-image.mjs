import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Iniciando teste de criação de rifa com imagem...');

const browser = await chromium.launch({ 
  headless: false,
  slowMo: 500
});
const context = await browser.newContext();
const page = await context.newPage();

// Capturar logs do console
page.on('console', msg => {
  const type = msg.type();
  const text = msg.text();
  if (type === 'error') {
    console.log('❌ Console Error:', text);
  } else if (type === 'log' && (text.includes('SUPABASE') || text.includes('INSERT') || text.includes('ERRO'))) {
    console.log('📝 Console Log:', text);
  }
});

// Capturar erros de página
page.on('pageerror', error => {
  console.log('❌ Page Error:', error.message);
});

// Capturar requisições de rede para Supabase
page.on('response', async response => {
  const url = response.url();
  if (url.includes('supabase') && !response.ok()) {
    console.log('❌ Supabase Error Response:');
    console.log('   URL:', url);
    console.log('   Status:', response.status());
    try {
      const body = await response.text();
      console.log('   Body:', body);
    } catch (e) {
      // Ignora erro ao ler body
    }
  }
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
  
  // 3. Preencher o formulário
  console.log('\n3️⃣ Preenchendo formulário da rifa...');
  
  const timestamp = Date.now();
  await page.fill('input[id="title"]', `Rifa Premium com Logo ${timestamp}`);
  await page.fill('textarea[id="description"]', 'Esta é uma rifa especial com imagem da logo RT da Sorte. Concorra a prêmios incríveis!');
  await page.fill('input[id="prize_description"]', 'Prêmio especial no valor de R$ 5.000,00');
  await page.fill('input[id="ticket_price"]', '10.00');
  await page.fill('input[id="total_numbers"]', '1000');
  
  // Selecionar status
  await page.selectOption('select[id="status"]', 'active');
  
  // 4. Upload da imagem
  console.log('\n4️⃣ Fazendo upload da logo...');
  
  // Caminho para a logo
  const logoPath = join(__dirname, 'public', 'logo-rt.png');
  console.log('   Arquivo:', logoPath);
  
  // Fazer upload do arquivo
  const fileInput = await page.$('input[type="file"]');
  if (fileInput) {
    await fileInput.setInputFiles(logoPath);
    console.log('   ✅ Arquivo selecionado');
    await page.waitForTimeout(2000); // Aguardar preview carregar
    
    // Verificar se o preview apareceu
    const preview = await page.$('img[alt="Preview"]');
    if (preview) {
      console.log('   ✅ Preview da imagem carregado');
    } else {
      console.log('   ⚠️ Preview não encontrado');
    }
  } else {
    console.log('   ❌ Input de arquivo não encontrado');
  }
  
  // Capturar screenshot com a imagem
  await page.screenshot({ path: 'test-create-with-image-1-form.png', fullPage: true });
  console.log('   ✅ Screenshot do formulário com imagem salvo');
  
  // 5. Submeter o formulário
  console.log('\n5️⃣ Submetendo formulário...');
  
  // Interceptar logs antes de clicar
  await page.evaluate(() => {
    const originalLog = console.log;
    const originalError = console.error;
    
    console.log = function(...args) {
      originalLog.apply(console, args);
      // Enviar para o Playwright também
      if (args[0]?.includes('SUPABASE') || args[0]?.includes('INSERT')) {
        window.lastLog = args.join(' ');
      }
    };
    
    console.error = function(...args) {
      originalError.apply(console, args);
      window.lastError = args.join(' ');
    };
  });
  
  // Clicar no botão de criar
  await page.click('button:has-text("Criar Rifa")');
  
  // Aguardar processamento
  console.log('   ⏳ Aguardando processamento...');
  await page.waitForTimeout(5000);
  
  // 6. Verificar o resultado
  console.log('\n6️⃣ Verificando resultado...');
  
  const currentUrl = page.url();
  console.log('   URL atual:', currentUrl);
  
  // Capturar logs do browser
  const logs = await page.evaluate(() => {
    return {
      lastLog: window.lastLog,
      lastError: window.lastError
    };
  });
  
  if (logs.lastLog) {
    console.log('   Último log:', logs.lastLog);
  }
  if (logs.lastError) {
    console.log('   Último erro:', logs.lastError);
  }
  
  // Verificar se há mensagens de erro na página
  const errorMessages = await page.$$('.text-red-500, .bg-red-500, [class*="error"]');
  if (errorMessages.length > 0) {
    console.log('   ⚠️ Possíveis mensagens de erro encontradas:');
    for (const element of errorMessages) {
      const text = await element.textContent();
      if (text && text.trim()) {
        console.log('      -', text.trim());
      }
    }
  }
  
  // Capturar screenshot final
  await page.screenshot({ path: 'test-create-with-image-2-result.png', fullPage: true });
  console.log('   ✅ Screenshot do resultado salvo');
  
  // Verificar se foi redirecionado para a lista de rifas (sucesso)
  if (currentUrl.includes('/admin/raffles') && !currentUrl.includes('/new')) {
    console.log('\n✅ Rifa criada com sucesso!');
    
    // Verificar se a rifa aparece na lista
    await page.waitForTimeout(2000);
    const raffleTitle = await page.$(`text="Rifa Premium com Logo ${timestamp}"`);
    if (raffleTitle) {
      console.log('   ✅ Rifa encontrada na listagem');
      
      // Verificar se a imagem está sendo exibida
      const raffleImages = await page.$$('img[alt*="Rifa Premium"]');
      if (raffleImages.length > 0) {
        console.log('   ✅ Imagem da rifa está sendo exibida');
      } else {
        console.log('   ⚠️ Imagem não está sendo exibida na listagem');
      }
    }
    
    // Verificar no Supabase se foi salva
    console.log('\n7️⃣ Verificando no banco de dados...');
    
    // Executar query diretamente na página
    const dbResult = await page.evaluate(async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        
        const { data, error } = await supabase
          .from('raffles')
          .select('id, title, image_url, created_at')
          .order('created_at', { ascending: false })
          .limit(1);
        
        return { data, error };
      } catch (e) {
        return { error: e.message };
      }
    }).catch(err => ({ error: 'Não foi possível executar query' }));
    
    if (dbResult.data && dbResult.data[0]) {
      console.log('   ✅ Última rifa no banco:');
      console.log('      ID:', dbResult.data[0].id);
      console.log('      Título:', dbResult.data[0].title);
      console.log('      Tem imagem:', dbResult.data[0].image_url ? 'SIM' : 'NÃO');
      
      if (dbResult.data[0].image_url) {
        console.log('      Tipo de imagem:', dbResult.data[0].image_url.substring(0, 30) + '...');
      }
    }
    
  } else {
    console.log('\n❌ Falha ao criar rifa - ainda na página de criação');
  }
  
} catch (error) {
  console.error('\n❌ Erro durante o teste:', error.message);
  
  // Capturar screenshot de erro
  await page.screenshot({ path: 'test-create-with-image-error.png', fullPage: true });
  console.log('   📸 Screenshot de erro salvo');
  
} finally {
  await browser.close();
  console.log('\n🏁 Teste finalizado');
  console.log('\n📸 Screenshots salvos:');
  console.log('   - test-create-with-image-1-form.png: Formulário com imagem');
  console.log('   - test-create-with-image-2-result.png: Resultado final');
}