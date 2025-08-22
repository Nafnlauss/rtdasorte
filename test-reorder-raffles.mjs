import { chromium } from 'playwright';

console.log('🚀 Iniciando teste de reordenação de rifas...');

const browser = await chromium.launch({ 
  headless: false,
  slowMo: 500
});
const context = await browser.newContext();
const page = await context.newPage();

try {
  // 1. Fazer login como admin
  console.log('\n1️⃣ Fazendo login como admin...');
  await page.goto('http://localhost:3001/admin/login');
  await page.waitForTimeout(1000);
  
  // Preencher email e senha
  await page.fill('input[type="email"]', 'slimc215@gmail.com');
  await page.fill('input[type="password"]', '62845_Madhouse');
  
  // Clicar no botão de entrar
  await page.click('button:has-text("Entrar")');
  
  await page.waitForTimeout(3000);
  
  // 2. Navegar para a página de rifas
  console.log('\n2️⃣ Navegando para a página de rifas...');
  await page.goto('http://localhost:3001/admin/raffles');
  await page.waitForTimeout(1500);
  
  // Capturar screenshot da lista original
  await page.screenshot({ path: 'test-reorder-1-original.png', fullPage: true });
  console.log('   ✅ Screenshot da ordem original salva');
  
  // 3. Clicar no botão Reordenar
  console.log('\n3️⃣ Acessando página de reordenação...');
  await page.click('a[href="/admin/raffles/reorder"]');
  await page.waitForTimeout(2000);
  
  // Capturar screenshot da página de reordenação
  await page.screenshot({ path: 'test-reorder-2-reorder-page.png', fullPage: true });
  console.log('   ✅ Screenshot da página de reordenação salva');
  
  // 4. Verificar se há rifas para reordenar
  const raffleCards = await page.$$('[draggable="true"]');
  console.log(`\n4️⃣ Encontradas ${raffleCards.length} rifas para reordenar`);
  
  if (raffleCards.length >= 2) {
    // 5. Usar os botões para mover a primeira rifa para baixo
    console.log('\n5️⃣ Movendo primeira rifa para baixo usando botão...');
    
    // Encontrar o botão de mover para baixo da primeira rifa
    const firstCard = raffleCards[0];
    const moveDownButton = await firstCard.$('button[title="Mover para baixo"]');
    
    if (moveDownButton) {
      await moveDownButton.click();
      await page.waitForTimeout(1000);
      console.log('   ✅ Primeira rifa movida para baixo');
      
      // Capturar screenshot após mover
      await page.screenshot({ path: 'test-reorder-3-after-move.png', fullPage: true });
      console.log('   ✅ Screenshot após mover salva');
      
      // 6. Salvar a nova ordem
      console.log('\n6️⃣ Salvando nova ordem...');
      await page.click('button:has-text("Salvar Ordem")');
      await page.waitForTimeout(2000);
      
      // Aceitar o alert de sucesso se aparecer
      page.on('dialog', async dialog => {
        console.log('   📢 Alert:', dialog.message());
        await dialog.accept();
      });
      
      await page.waitForTimeout(1000);
      
      // 7. Voltar para a lista de rifas
      console.log('\n7️⃣ Voltando para a lista de rifas...');
      await page.click('a:has-text("Voltar para Rifas")');
      await page.waitForTimeout(2000);
      
      // Capturar screenshot da lista reordenada
      await page.screenshot({ path: 'test-reorder-4-final-order.png', fullPage: true });
      console.log('   ✅ Screenshot da ordem final salva');
      
      // 8. Verificar a página pública
      console.log('\n8️⃣ Verificando ordem na página pública...');
      await page.goto('http://localhost:3001/raffles');
      await page.waitForTimeout(2000);
      
      // Capturar screenshot da página pública
      await page.screenshot({ path: 'test-reorder-5-public-page.png', fullPage: true });
      console.log('   ✅ Screenshot da página pública salva');
      
      console.log('\n✅ Teste de reordenação concluído com sucesso!');
      console.log('\n📸 Screenshots salvos:');
      console.log('   - test-reorder-1-original.png: Ordem original das rifas');
      console.log('   - test-reorder-2-reorder-page.png: Página de reordenação');
      console.log('   - test-reorder-3-after-move.png: Após mover uma rifa');
      console.log('   - test-reorder-4-final-order.png: Ordem final no admin');
      console.log('   - test-reorder-5-public-page.png: Ordem na página pública');
    } else {
      console.log('   ⚠️ Botão de mover não encontrado');
    }
  } else {
    console.log('   ⚠️ Não há rifas suficientes para testar reordenação');
    console.log('   💡 Crie pelo menos 2 rifas para testar esta funcionalidade');
  }
  
} catch (error) {
  console.error('\n❌ Erro durante o teste:', error.message);
  
  // Capturar screenshot de erro
  await page.screenshot({ path: 'test-reorder-error.png', fullPage: true });
  console.log('   📸 Screenshot de erro salvo: test-reorder-error.png');
  
  // Capturar logs do console
  const logs = await page.evaluate(() => {
    const logs = [];
    const originalLog = console.log;
    const originalError = console.error;
    
    console.log = function(...args) {
      logs.push({ type: 'log', message: args.join(' ') });
      originalLog.apply(console, args);
    };
    
    console.error = function(...args) {
      logs.push({ type: 'error', message: args.join(' ') });
      originalError.apply(console, args);
    };
    
    return logs;
  });
  
  if (logs.length > 0) {
    console.log('\n📝 Logs do console:');
    logs.forEach(log => {
      console.log(`   ${log.type === 'error' ? '❌' : '📝'} ${log.message}`);
    });
  }
} finally {
  await browser.close();
  console.log('\n🏁 Teste finalizado');
}