export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container-wrapper max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-8">Termos de Uso</h1>
        
        <div className="raffle-card space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Aceitação dos Termos</h2>
            <p className="text-muted-foreground">
              Ao acessar e usar este site de rifas online, você aceita e concorda em cumprir os termos e condições estabelecidos neste documento. Se você não concordar com alguma parte destes termos, não deve usar nossos serviços.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Elegibilidade</h2>
            <p className="text-muted-foreground">
              Para participar das rifas, você deve ter pelo menos 18 anos de idade e possuir CPF válido. É de sua responsabilidade garantir que sua participação seja legal em sua jurisdição.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Registro e Conta</h2>
            <p className="text-muted-foreground mb-3">
              Para participar das rifas, você deve criar uma conta fornecendo informações verdadeiras e completas. Você é responsável por:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Manter a confidencialidade de sua senha</li>
              <li>Todas as atividades que ocorram em sua conta</li>
              <li>Notificar imediatamente sobre qualquer uso não autorizado</li>
              <li>Manter suas informações de contato atualizadas</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Compra de Títulos</h2>
            <p className="text-muted-foreground mb-3">
              Ao comprar números da rifa:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Os pagamentos devem ser realizados via PIX</li>
              <li>As compras são finais e não reembolsáveis</li>
              <li>Os números são reservados por 10 minutos até a confirmação do pagamento</li>
              <li>Após confirmação do pagamento, os números são definitivamente seus</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Sorteios</h2>
            <p className="text-muted-foreground mb-3">
              Os sorteios são realizados de forma transparente:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Baseados nos resultados da Loteria Federal</li>
              <li>As datas dos sorteios são definidas previamente</li>
              <li>Os ganhadores são notificados por telefone e email</li>
              <li>Os resultados são publicados no site</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Entrega de Prêmios</h2>
            <p className="text-muted-foreground">
              Os ganhadores têm até 90 dias para reclamar seus prêmios. Após este período, o prêmio pode ser considerado abandonado. A entrega será combinada diretamente com o ganhador, podendo haver custos de envio dependendo da localização.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Política de Privacidade</h2>
            <p className="text-muted-foreground">
              Respeitamos sua privacidade e protegemos seus dados pessoais conforme a LGPD (Lei Geral de Proteção de Dados). Suas informações são usadas apenas para operação das rifas e comunicação relacionada.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Proibições</h2>
            <p className="text-muted-foreground mb-3">
              É expressamente proibido:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Usar o site para qualquer finalidade ilegal</li>
              <li>Criar múltiplas contas</li>
              <li>Usar informações falsas</li>
              <li>Tentar manipular ou fraudar o sistema</li>
              <li>Revender números de rifas</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Limitação de Responsabilidade</h2>
            <p className="text-muted-foreground">
              Nossa plataforma não se responsabiliza por problemas técnicos, falhas de sistema ou perdas indiretas. Nossa responsabilidade limita-se ao valor pago pelos títulos adquiridos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Alterações nos Termos</h2>
            <p className="text-muted-foreground">
              Reservamos o direito de modificar estes termos a qualquer momento. As alterações entram em vigor imediatamente após a publicação no site. O uso continuado do site após as alterações constitui aceitação dos novos termos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">11. Contato</h2>
            <p className="text-muted-foreground">
              Para dúvidas sobre estes termos, entre em contato através da página de suporte.
            </p>
          </section>

          <div className="pt-6 border-t border-border text-sm text-muted-foreground">
            <p>Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}