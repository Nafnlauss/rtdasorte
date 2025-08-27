'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/stores/useCartStore'
import { QRCodeSVG } from 'qrcode.react'
import { Copy, CheckCircle, Clock, AlertCircle } from 'lucide-react'

interface PaymentData {
  transaction: {
    id: string
    amount: number
    numbers: number[]
    status: string
    pix_code: string | null
    pix_qrcode: string | null
  }
  raffle: {
    id: string
    title: string
    image_url: string
  }
  expires_at: string
}

export default function PaymentPage() {
  const params = useParams()
  const router = useRouter()
  const clearCart = useCartStore((state) => state.clearCart)
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [checkingStatus, setCheckingStatus] = useState(false)

  const transactionId = params.id as string
  const supabase = createClient()

  // Buscar dados do pagamento
  useEffect(() => {
    async function loadPaymentData() {
      try {
        const { data: transaction, error: transactionError } = await supabase
          .from('transactions')
          .select(`
            *,
            raffle:raffles!raffle_id (
              id,
              title,
              image_url
            )
          `)
          .eq('id', transactionId)
          .single()

        if (transactionError || !transaction) {
          console.error('Transaction not found')
          router.push('/')
          return
        }

        // Se já está pago, redirecionar para página de sucesso
        if (transaction.status === 'completed') {
          clearCart() // Limpar carrinho se já estiver pago
          router.push(`/payment/${transactionId}/success`)
          return
        }

        // Se falhou ou foi cancelado
        if (transaction.status === 'failed' || transaction.status === 'cancelled') {
          router.push(`/payment/${transactionId}/failed`)
          return
        }

        // Calcular tempo restante (30 minutos a partir da criação)
        const createdAt = new Date(transaction.created_at).getTime()
        const expiresAt = createdAt + (30 * 60 * 1000) // 30 minutos
        
        // Tentar buscar PIX do localStorage se não estiver no banco
        let pixCode = transaction.pix_code
        let pixQrcode = transaction.pix_qrcode
        
        if (!pixCode || !pixQrcode) {
          const storedPix = localStorage.getItem(`pix_${transactionId}`)
          if (storedPix) {
            try {
              const pixData = JSON.parse(storedPix)
              pixCode = pixData.pix_code
              pixQrcode = pixData.pix_qrcode
              console.log('PIX loaded from localStorage')
            } catch (e) {
              console.error('Error parsing stored PIX:', e)
            }
          }
        }
        
        setPaymentData({
          transaction: {
            id: transaction.id,
            amount: transaction.amount,
            numbers: transaction.numbers,
            status: transaction.status,
            pix_code: pixCode,
            pix_qrcode: pixQrcode
          },
          raffle: transaction.raffle,
          expires_at: new Date(expiresAt).toISOString()
        })

      } catch (error) {
        console.error('Error loading payment:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPaymentData()
  }, [transactionId, router])

  // Timer para expiração
  useEffect(() => {
    if (!paymentData) return

    const timer = setInterval(() => {
      const now = Date.now()
      const expires = new Date(paymentData.expires_at).getTime()
      const remaining = Math.max(0, expires - now)
      
      setTimeLeft(remaining)

      if (remaining === 0) {
        clearInterval(timer)
        router.push(`/payment/${transactionId}/expired`)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [paymentData, transactionId, router])

  // Verificar status do pagamento periodicamente
  useEffect(() => {
    if (!paymentData || paymentData.transaction.status !== 'pending') return

    const checkInterval = setInterval(async () => {
      setCheckingStatus(true)
      
      const { data: transaction } = await supabase
        .from('transactions')
        .select('status')
        .eq('id', transactionId)
        .single()

      setCheckingStatus(false)

      if (transaction?.status === 'completed') {
        clearInterval(checkInterval)
        clearCart() // Limpar carrinho apenas após confirmação do pagamento
        router.push(`/payment/${transactionId}/success`)
      }
    }, 5000) // Verificar a cada 5 segundos

    return () => clearInterval(checkInterval)
  }, [paymentData, transactionId, router])

  const copyPixCode = async () => {
    if (!paymentData?.transaction.pix_code) return
    
    try {
      await navigator.clipboard.writeText(paymentData.transaction.pix_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!paymentData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Pagamento não encontrado</h2>
          <p className="text-muted-foreground">Este pagamento não existe ou expirou.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container max-w-4xl mx-auto px-4">
        {/* Header com timer */}
        <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-500" />
              <span className="text-sm font-medium">Tempo restante para pagamento:</span>
            </div>
            <span className="text-2xl font-bold text-yellow-500">
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Coluna da esquerda - QR Code */}
          <div className="raffle-card p-6">
            <h2 className="text-xl font-bold mb-4 text-center">
              Escaneie o QR Code
            </h2>
            
            {paymentData.transaction.pix_code ? (
              <div className="bg-white p-4 rounded-lg mb-4">
                <QRCodeSVG
                  value={paymentData.transaction.pix_code}
                  size={280}
                  className="w-full h-auto max-w-[280px] mx-auto"
                />
              </div>
            ) : (
              <div className="bg-secondary h-[280px] rounded-lg flex items-center justify-center mb-4">
                <p className="text-muted-foreground">Gerando QR Code...</p>
              </div>
            )}

            <p className="text-sm text-muted-foreground text-center mb-4">
              Abra o app do seu banco e escaneie o código para pagar
            </p>

            {/* Copiar código PIX */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Ou copie o código PIX:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={paymentData.transaction.pix_code ? 
                    (paymentData.transaction.pix_code.length > 50 ? 
                      paymentData.transaction.pix_code.substring(0, 50) + '...' : 
                      paymentData.transaction.pix_code) : 
                    'Gerando código...'}
                  readOnly
                  className="flex-1 px-3 py-2 bg-secondary rounded-lg text-sm font-mono text-xs"
                />
                <button
                  onClick={copyPixCode}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                  disabled={!paymentData.transaction.pix_code}
                >
                  {copied ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copiar
                    </>
                  )}
                </button>
              </div>
              {paymentData.transaction.pix_code && (
                <p className="text-xs text-muted-foreground">
                  Clique em "Copiar" para copiar o código completo
                </p>
              )}
            </div>
          </div>

          {/* Coluna da direita - Detalhes */}
          <div className="raffle-card p-6">
            <h2 className="text-xl font-bold mb-4">Detalhes do Pedido</h2>

            {/* Rifa */}
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
              {paymentData.raffle.image_url && (
                <img
                  src={paymentData.raffle.image_url}
                  alt={paymentData.raffle.title}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              )}
              <div>
                <h3 className="font-semibold">{paymentData.raffle.title}</h3>
                <p className="text-sm text-muted-foreground">
                  Números: {paymentData.transaction.numbers.join(', ')}
                </p>
              </div>
            </div>

            {/* Resumo do pagamento */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quantidade:</span>
                <span className="font-medium">
                  {paymentData.transaction.numbers.length} número(s)
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Total a pagar:</span>
                <span className="text-primary">
                  {formatCurrency(paymentData.transaction.amount)}
                </span>
              </div>
            </div>

            {/* Status */}
            <div className="p-4 bg-secondary rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {checkingStatus ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                ) : (
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                )}
                <span className="font-medium">Aguardando pagamento...</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Após o pagamento, a confirmação é automática em alguns segundos.
              </p>
            </div>

            {/* Instruções */}
            <div className="mt-6 space-y-2">
              <h4 className="font-medium text-sm">Como pagar com PIX:</h4>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Abra o app do seu banco</li>
                <li>Escolha pagar com PIX</li>
                <li>Escaneie o QR Code ou copie o código</li>
                <li>Confirme o pagamento</li>
                <li>Aguarde a confirmação automática</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="mt-8 flex justify-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
          >
            Voltar ao início
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Verificar pagamento
          </button>
        </div>
      </div>
    </div>
  )
}