'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SupportPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simular envio do formulário
    try {
      // Aqui você implementaria a lógica real de envio
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setSubmitStatus('success')
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      })
      
      // Redirecionar após 3 segundos
      setTimeout(() => {
        router.push('/')
      }, 3000)
    } catch (error) {
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container-wrapper max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-8">Suporte</h1>
        
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Formulário de Contato */}
          <div className="raffle-card">
            <h2 className="text-xl font-semibold mb-6">Entre em Contato</h2>
            
            {submitStatus === 'success' ? (
              <div className="bg-green-500/10 border border-green-500 rounded-lg p-4 text-green-500">
                <p className="font-semibold mb-2">Mensagem enviada com sucesso!</p>
                <p className="text-sm">Retornaremos em breve através do email ou telefone informado.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium mb-2">
                    Telefone (WhatsApp)
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                    className="w-full px-4 py-2 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium mb-2">
                    Assunto *
                  </label>
                  <select
                    id="subject"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none transition-colors"
                  >
                    <option value="">Selecione um assunto</option>
                    <option value="payment">Problemas com Pagamento</option>
                    <option value="account">Problemas com Conta</option>
                    <option value="raffle">Dúvidas sobre Rifas</option>
                    <option value="prize">Entrega de Prêmio</option>
                    <option value="technical">Problema Técnico</option>
                    <option value="other">Outro</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium mb-2">
                    Mensagem *
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={6}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none transition-colors resize-none"
                  />
                </div>

                {submitStatus === 'error' && (
                  <div className="bg-red-500/10 border border-red-500 rounded-lg p-3 text-red-500 text-sm">
                    Erro ao enviar mensagem. Por favor, tente novamente.
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Enviando...' : 'Enviar Mensagem'}
                </button>
              </form>
            )}
          </div>

          {/* Informações de Contato */}
          <div className="space-y-6">
            <div className="raffle-card">
              <h2 className="text-xl font-semibold mb-4">Canais de Atendimento</h2>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">📧</span>
                  </div>
                  <div>
                    <p className="font-semibold">Email</p>
                    <p className="text-sm text-muted-foreground">suporte@rifasonline.com.br</p>
                    <p className="text-xs text-muted-foreground mt-1">Respondemos em até 24 horas</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">💬</span>
                  </div>
                  <div>
                    <p className="font-semibold">WhatsApp</p>
                    <p className="text-sm text-muted-foreground">(11) 99999-9999</p>
                    <p className="text-xs text-muted-foreground mt-1">Segunda a Sexta: 9h às 18h</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">📱</span>
                  </div>
                  <div>
                    <p className="font-semibold">Telefone</p>
                    <p className="text-sm text-muted-foreground">0800 123 4567</p>
                    <p className="text-xs text-muted-foreground mt-1">Segunda a Sexta: 9h às 18h</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="raffle-card">
              <h2 className="text-xl font-semibold mb-4">Perguntas Frequentes</h2>
              
              <div className="space-y-3">
                <div className="pb-3 border-b border-border">
                  <p className="font-semibold text-sm mb-1">Como faço para comprar títulos?</p>
                  <p className="text-xs text-muted-foreground">
                    Escolha uma rifa, selecione seus números e pague via PIX.
                  </p>
                </div>
                
                <div className="pb-3 border-b border-border">
                  <p className="font-semibold text-sm mb-1">Quanto tempo tenho para pagar?</p>
                  <p className="text-xs text-muted-foreground">
                    Você tem 10 minutos para realizar o pagamento via PIX.
                  </p>
                </div>
                
                <div className="pb-3 border-b border-border">
                  <p className="font-semibold text-sm mb-1">Como sei se ganhei?</p>
                  <p className="text-xs text-muted-foreground">
                    Entramos em contato por telefone e email com todos os ganhadores.
                  </p>
                </div>
                
                <div>
                  <p className="font-semibold text-sm mb-1">O site é seguro?</p>
                  <p className="text-xs text-muted-foreground">
                    Sim! Usamos criptografia e seguimos a LGPD para proteger seus dados.
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border">
                <a 
                  href="/faq" 
                  className="text-sm text-primary hover:text-primary/80 transition-colors font-semibold"
                >
                  Ver todas as perguntas →
                </a>
              </div>
            </div>

            <div className="raffle-card bg-primary/10 border-primary/30">
              <h3 className="font-semibold mb-2">Horário de Atendimento</h3>
              <p className="text-sm text-muted-foreground">
                Segunda a Sexta: 9h às 18h<br />
                Sábado: 9h às 13h<br />
                Domingo e Feriados: Fechado
              </p>
              <p className="text-xs text-muted-foreground mt-3">
                * Respondemos emails em até 24 horas úteis
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}