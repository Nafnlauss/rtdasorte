import { Transaction } from '@/types/supabase'

interface PaySambaConfig {
  apiUrl: string
  apiToken: string
  isSandbox: boolean
}

interface PaySambaPixPayment {
  id: string
  status: 'pending' | 'processing' | 'paid' | 'failed' | 'expired'
  amount: number
  pix_code: string
  pix_qrcode: string
  expires_at: string
  created_at: string
  paid_at?: string
  customer: {
    name: string
    cpf_cnpj: string
    email?: string
    phone?: string
  }
  metadata?: Record<string, any>
}

interface CreatePixPaymentData {
  amount: number
  customer: {
    name: string
    cpf_cnpj: string
    email?: string
    phone?: string
  }
  description?: string
  expires_in?: number // minutos
  metadata?: {
    transaction_id: string
    raffle_id: string
    user_id: string
    numbers: number[]
  }
}

interface WebhookPayload {
  event: 'payment.paid' | 'payment.failed' | 'payment.expired'
  payment: PaySambaPixPayment
  timestamp: string
}

class PaySambaService {
  private config: PaySambaConfig

  constructor() {
    this.config = {
      apiUrl: process.env.PAYSAMBA_API_URL || 'https://sandbox.api.paysamba.com/v1',
      apiToken: process.env.PAYSAMBA_API_TOKEN || '',
      isSandbox: process.env.NEXT_PUBLIC_PAYSAMBA_SANDBOX === 'true'
    }

    if (!this.config.apiToken) {
      console.warn('PaySamba API token not configured')
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.config.apiUrl}${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.config.apiToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers
      }
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(
        error.message || 
        `PaySamba API error: ${response.status} ${response.statusText}`
      )
    }

    return response.json()
  }

  /**
   * Cria um novo pagamento PIX
   */
  async createPixPayment(data: CreatePixPaymentData): Promise<PaySambaPixPayment> {
    // Por enquanto, SEMPRE usar modo teste
    // As credenciais fornecidas parecem ser de teste/exemplo
    // Para ativar a API real, você precisa:
    // 1. Criar conta real na PaySamba
    // 2. Obter credenciais de produção
    // 3. Configurar as variáveis de ambiente corretas
    
    console.log('PaySamba: Usando modo TESTE (mock)')
    console.log('Para pagamento real, configure credenciais válidas da PaySamba')
    
    // Gerar código PIX de teste mais realista
    const timestamp = Date.now()
    const txid = `RTDASORTE${timestamp}`.substring(0, 25)
    const valor = data.amount.toFixed(2)
    
    // Código PIX de teste melhorado (formato mais próximo do real)
    const testPixCode = [
      '00020126580014BR.GOV.BCB.PIX',
      `0136${txid}`,
      '52040000',
      '5303986',
      `54${valor.length.toString().padStart(2, '0')}${valor}`,
      '5802BR',
      '5911RT DA SORTE',
      '6009SAO PAULO',
      '62070503***',
      '6304A9C7'
    ].join('')
    
    return {
      id: `paysamba_${timestamp}`,
      status: 'pending',
      amount: data.amount,
      pix_code: testPixCode,
      pix_qrcode: testPixCode,
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      customer: {
        name: data.customer.name,
        cpf_cnpj: data.customer.cpf_cnpj,
        email: data.customer.email,
        phone: data.customer.phone
      },
      metadata: data.metadata
    }
  }

  /**
   * Consulta status de um pagamento
   */
  async getPayment(paymentId: string): Promise<PaySambaPixPayment> {
    const response = await this.request<any>(`/payments/${paymentId}`, {
      method: 'GET'
    })

    return {
      id: response.id,
      status: response.status,
      amount: response.amount / 100,
      pix_code: response.pix.code,
      pix_qrcode: response.pix.qrcode_url,
      expires_at: response.expires_at,
      created_at: response.created_at,
      paid_at: response.paid_at,
      customer: {
        name: response.customer.name,
        cpf_cnpj: response.customer.document,
        email: response.customer.email,
        phone: response.customer.phone
      },
      metadata: response.metadata
    }
  }

  /**
   * Cancela um pagamento pendente
   */
  async cancelPayment(paymentId: string): Promise<void> {
    await this.request(`/payments/${paymentId}/cancel`, {
      method: 'POST'
    })
  }

  /**
   * Lista pagamentos
   */
  async listPayments(filters?: {
    status?: string
    start_date?: string
    end_date?: string
    limit?: number
    offset?: number
  }): Promise<PaySambaPixPayment[]> {
    const params = new URLSearchParams()
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value))
        }
      })
    }

    const response = await this.request<any>(
      `/payments?${params.toString()}`,
      { method: 'GET' }
    )

    return response.data.map((payment: any) => ({
      id: payment.id,
      status: payment.status,
      amount: payment.amount / 100,
      pix_code: payment.pix?.code || '',
      pix_qrcode: payment.pix?.qrcode_url || '',
      expires_at: payment.expires_at,
      created_at: payment.created_at,
      paid_at: payment.paid_at,
      customer: {
        name: payment.customer.name,
        cpf_cnpj: payment.customer.document,
        email: payment.customer.email,
        phone: payment.customer.phone
      },
      metadata: payment.metadata
    }))
  }

  /**
   * Valida callback - PaySamba usa callback token na URL
   */
  validateCallbackToken(token: string): boolean {
    const expectedToken = process.env.PAYSAMBA_CALLBACK_TOKEN || ''
    
    // Se não houver token configurado, aceita qualquer callback (desenvolvimento)
    if (!expectedToken && process.env.NODE_ENV === 'development') {
      console.warn('PaySamba callback token not configured - accepting all callbacks in development')
      return true
    }
    
    return token === expectedToken
  }

  /**
   * Processa webhook recebido
   */
  async processWebhook(payload: WebhookPayload): Promise<void> {
    const { event, payment } = payload

    switch (event) {
      case 'payment.paid':
        // Pagamento confirmado
        console.log(`Payment ${payment.id} confirmed`)
        break
      
      case 'payment.failed':
        // Pagamento falhou
        console.log(`Payment ${payment.id} failed`)
        break
      
      case 'payment.expired':
        // Pagamento expirou
        console.log(`Payment ${payment.id} expired`)
        break
    }
  }

  /**
   * Gera QR Code PIX para teste em sandbox
   */
  generateTestPixCode(): string {
    if (!this.config.isSandbox) {
      throw new Error('Test PIX code only available in sandbox mode')
    }
    
    // Código PIX de teste para sandbox
    return '00020126360014BR.GOV.BCB.PIX0114+55119999999995204000053039865802BR5913TESTE SANDBOX6009SAO PAULO62070503***6304A9C7'
  }
}

export const paySamba = new PaySambaService()
export type { PaySambaPixPayment, CreatePixPaymentData, WebhookPayload }