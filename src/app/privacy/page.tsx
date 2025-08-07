export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container-wrapper max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-8">Política de Privacidade</h1>
        
        <div className="raffle-card space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Informações que Coletamos</h2>
            <p className="text-muted-foreground mb-3">
              Coletamos informações que você nos fornece diretamente, incluindo:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Nome completo</li>
              <li>CPF (Cadastro de Pessoa Física)</li>
              <li>Endereço de email</li>
              <li>Número de telefone</li>
              <li>Endereço de entrega (para envio de prêmios)</li>
              <li>Informações de pagamento via PIX</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Como Usamos suas Informações</h2>
            <p className="text-muted-foreground mb-3">
              Utilizamos as informações coletadas para:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Processar suas compras de títulos de rifas</li>
              <li>Entrar em contato sobre resultados de sorteios</li>
              <li>Enviar prêmios aos ganhadores</li>
              <li>Cumprir obrigações legais e fiscais</li>
              <li>Melhorar nossos serviços e experiência do usuário</li>
              <li>Enviar comunicações sobre rifas e promoções (com consentimento)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Base Legal - LGPD</h2>
            <p className="text-muted-foreground">
              Nosso tratamento de dados pessoais está em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018). 
              As bases legais para o tratamento incluem: execução de contrato, cumprimento de obrigação legal, 
              consentimento do titular e legítimo interesse.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Compartilhamento de Dados</h2>
            <p className="text-muted-foreground mb-3">
              Compartilhamos suas informações apenas com:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Processadores de pagamento (para transações PIX)</li>
              <li>Empresas de logística (para entrega de prêmios)</li>
              <li>Autoridades governamentais (quando exigido por lei)</li>
              <li>Parceiros de tecnologia essenciais para operação do site</li>
            </ul>
            <p className="text-muted-foreground mt-3">
              Não vendemos, alugamos ou compartilhamos suas informações pessoais com terceiros para fins de marketing.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Segurança dos Dados</h2>
            <p className="text-muted-foreground">
              Implementamos medidas técnicas e organizacionais apropriadas para proteger suas informações pessoais contra 
              acesso não autorizado, alteração, divulgação ou destruição. Isso inclui criptografia, firewalls, 
              controles de acesso e monitoramento regular de segurança.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Seus Direitos (LGPD)</h2>
            <p className="text-muted-foreground mb-3">
              De acordo com a LGPD, você tem direito a:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Confirmar a existência de tratamento de dados</li>
              <li>Acessar seus dados pessoais</li>
              <li>Corrigir dados incompletos ou desatualizados</li>
              <li>Anonimizar, bloquear ou eliminar dados desnecessários</li>
              <li>Portabilidade dos dados</li>
              <li>Eliminar dados tratados com consentimento</li>
              <li>Informação sobre compartilhamento</li>
              <li>Revogar consentimento</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Retenção de Dados</h2>
            <p className="text-muted-foreground">
              Mantemos suas informações pessoais apenas pelo tempo necessário para cumprir as finalidades para as quais 
              foram coletadas, incluindo requisitos legais, contábeis ou de relatório. Dados de transações financeiras 
              são mantidos conforme exigências fiscais (mínimo de 5 anos).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Cookies e Tecnologias Similares</h2>
            <p className="text-muted-foreground">
              Utilizamos cookies e tecnologias similares para melhorar sua experiência, analisar o tráfego do site e 
              personalizar conteúdo. Você pode gerenciar suas preferências de cookies através das configurações do seu navegador.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Menores de Idade</h2>
            <p className="text-muted-foreground">
              Nossos serviços não são direcionados a menores de 18 anos. Não coletamos intencionalmente informações 
              pessoais de menores de idade. Se tomarmos conhecimento de que coletamos dados de um menor, 
              tomaremos medidas para deletar essas informações.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Alterações nesta Política</h2>
            <p className="text-muted-foreground">
              Podemos atualizar esta política periodicamente. Notificaremos sobre mudanças significativas por email 
              ou através de um aviso em nosso site. Recomendamos revisar esta política regularmente.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">11. Encarregado de Proteção de Dados</h2>
            <p className="text-muted-foreground">
              Para exercer seus direitos ou esclarecer dúvidas sobre o tratamento de seus dados pessoais, 
              entre em contato com nosso Encarregado de Proteção de Dados através da página de suporte.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">12. Contato</h2>
            <p className="text-muted-foreground">
              Para questões sobre esta Política de Privacidade ou sobre o tratamento de seus dados pessoais, 
              entre em contato através da nossa página de suporte.
            </p>
          </section>

          <div className="pt-6 border-t border-border text-sm text-muted-foreground">
            <p>Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
            <p className="mt-2">Esta política está em conformidade com a Lei Geral de Proteção de Dados (LGPD) - Lei nº 13.709/2018</p>
          </div>
        </div>
      </div>
    </div>
  )
}