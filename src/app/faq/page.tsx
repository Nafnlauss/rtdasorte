'use client'

import { useState } from 'react'

interface FAQItem {
  question: string
  answer: string
  category: string
}

const faqData: FAQItem[] = [
  {
    category: 'Geral',
    question: 'O que é uma rifa online?',
    answer: 'Uma rifa online é um sorteio virtual onde você compra números para concorrer a prêmios. Os sorteios são baseados nos resultados da Loteria Federal, garantindo transparência e confiabilidade.'
  },
  {
    category: 'Geral',
    question: 'É legal participar de rifas online?',
    answer: 'Sim, desde que a rifa siga as regulamentações brasileiras. Nossas rifas são regularizadas e os sorteios são baseados na Loteria Federal, órgão oficial do governo.'
  },
  {
    category: 'Geral',
    question: 'Preciso ter conta para participar?',
    answer: 'Sim, é necessário criar uma conta gratuita para participar das rifas. Isso garante a segurança das transações e facilita o contato caso você seja o ganhador.'
  },
  {
    category: 'Compra',
    question: 'Como compro números da rifa?',
    answer: 'Escolha a rifa desejada, selecione os números disponíveis, adicione ao carrinho e finalize o pagamento via PIX. Após a confirmação do pagamento, os números são automaticamente reservados em seu nome.'
  },
  {
    category: 'Compra',
    question: 'Quais formas de pagamento são aceitas?',
    answer: 'Atualmente aceitamos apenas pagamento via PIX, que é instantâneo e seguro. Após gerar o QR Code, você tem 10 minutos para realizar o pagamento.'
  },
  {
    category: 'Compra',
    question: 'Posso cancelar minha compra?',
    answer: 'De acordo com nossos termos de uso, as compras são finais e não reembolsáveis. Certifique-se de escolher os números corretos antes de finalizar o pagamento.'
  },
  {
    category: 'Compra',
    question: 'Quantos números posso comprar?',
    answer: 'Você pode comprar quantos números desejar, desde que estejam disponíveis. Quanto mais números comprar, maiores suas chances de ganhar!'
  },
  {
    category: 'Pagamento',
    question: 'Quanto tempo tenho para pagar?',
    answer: 'Após gerar o PIX, você tem 10 minutos para realizar o pagamento. Caso o tempo expire, os números voltam a ficar disponíveis para outros participantes.'
  },
  {
    category: 'Pagamento',
    question: 'Meu pagamento não foi confirmado, o que fazer?',
    answer: 'Aguarde alguns minutos, pois o PIX pode levar até 5 minutos para ser processado. Se após 30 minutos o pagamento não for confirmado, entre em contato com nosso suporte.'
  },
  {
    category: 'Pagamento',
    question: 'Paguei mas não recebi meus números',
    answer: 'Verifique sua área "Meus Títulos" no menu. Se os números não aparecerem após 30 minutos, entre em contato com o suporte enviando o comprovante de pagamento.'
  },
  {
    category: 'Sorteio',
    question: 'Como funciona o sorteio?',
    answer: 'Os sorteios são baseados nos resultados da Loteria Federal. Usamos os últimos dígitos do primeiro prêmio para determinar o número vencedor, garantindo total transparência.'
  },
  {
    category: 'Sorteio',
    question: 'Quando acontecem os sorteios?',
    answer: 'Cada rifa tem sua data de sorteio específica, geralmente alinhada com os sorteios da Loteria Federal (quartas e sábados). Verifique a data na página da rifa.'
  },
  {
    category: 'Sorteio',
    question: 'Como sei se ganhei?',
    answer: 'Entramos em contato com os ganhadores por telefone e email cadastrados. Você também pode verificar os resultados na página "Ganhadores" ou em "Meus Títulos".'
  },
  {
    category: 'Prêmios',
    question: 'Como recebo meu prêmio?',
    answer: 'Após o sorteio, entramos em contato para combinar a entrega. Prêmios pequenos podem ser enviados pelos Correios. Prêmios maiores são entregues pessoalmente ou retirados em local combinado.'
  },
  {
    category: 'Prêmios',
    question: 'Tenho que pagar para receber o prêmio?',
    answer: 'Depende da sua localização. Entregas na região metropolitana geralmente são gratuitas. Para outras regiões, o frete pode ser cobrado ou dividido.'
  },
  {
    category: 'Prêmios',
    question: 'Quanto tempo tenho para reclamar o prêmio?',
    answer: 'Você tem 90 dias após o sorteio para reclamar seu prêmio. Após esse período, o prêmio pode ser considerado abandonado conforme nossos termos de uso.'
  },
  {
    category: 'Conta',
    question: 'Esqueci minha senha, como recuperar?',
    answer: 'Na página de login, clique em "Esqueci minha senha" e siga as instruções. Enviaremos um link de recuperação para seu email cadastrado.'
  },
  {
    category: 'Conta',
    question: 'Como altero meus dados cadastrais?',
    answer: 'Acesse seu perfil através do menu do usuário e clique em "Meu Perfil". Lá você pode atualizar suas informações pessoais.'
  },
  {
    category: 'Conta',
    question: 'Posso deletar minha conta?',
    answer: 'Sim, você tem o direito de solicitar a exclusão de sua conta e dados pessoais conforme a LGPD. Entre em contato com nosso suporte para solicitar a exclusão.'
  },
  {
    category: 'Segurança',
    question: 'Meus dados estão seguros?',
    answer: 'Sim! Utilizamos criptografia de ponta e seguimos rigorosamente a LGPD. Seus dados são armazenados com segurança e nunca são compartilhados com terceiros sem sua autorização.'
  },
  {
    category: 'Segurança',
    question: 'Como sei que o site é confiável?',
    answer: 'Somos uma empresa regularizada, seguimos a legislação brasileira, usamos a Loteria Federal para sorteios e temos histórico comprovado de ganhadores. Verifique nossa página de ganhadores.'
  }
]

export default function FAQPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos')
  const [openItems, setOpenItems] = useState<number[]>([])

  const categories = ['Todos', ...Array.from(new Set(faqData.map(item => item.category)))]
  
  const filteredFAQ = selectedCategory === 'Todos' 
    ? faqData 
    : faqData.filter(item => item.category === selectedCategory)

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    )
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container-wrapper max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Perguntas Frequentes</h1>
          <p className="text-lg text-muted-foreground">
            Encontre respostas para as dúvidas mais comuns
          </p>
        </div>

        {/* Filtros de Categoria */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedCategory === category
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary hover:bg-secondary/80 text-foreground'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Lista de FAQs */}
        <div className="space-y-4">
          {filteredFAQ.map((item, index) => {
            const isOpen = openItems.includes(index)
            
            return (
              <div key={index} className="raffle-card">
                <button
                  onClick={() => toggleItem(index)}
                  className="w-full text-left"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded">
                          {item.category}
                        </span>
                      </div>
                      <h3 className="font-semibold text-foreground">
                        {item.question}
                      </h3>
                    </div>
                    <div className="flex-shrink-0 mt-1">
                      <svg 
                        className={`w-5 h-5 text-muted-foreground transition-transform ${
                          isOpen ? 'rotate-180' : ''
                        }`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M19 9l-7 7-7-7" 
                        />
                      </svg>
                    </div>
                  </div>
                </button>
                
                {isOpen && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-muted-foreground">
                      {item.answer}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* CTA para Suporte */}
        <div className="mt-12 text-center raffle-card bg-primary/10 border-primary/30">
          <h2 className="text-xl font-semibold mb-3">Não encontrou sua resposta?</h2>
          <p className="text-muted-foreground mb-6">
            Nossa equipe está pronta para ajudar você
          </p>
          <a
            href="/support"
            className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
          >
            Falar com Suporte
          </a>
        </div>
      </div>
    </div>
  )
}