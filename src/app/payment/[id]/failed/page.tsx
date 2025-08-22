'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { XCircle, RefreshCw, Home, MessageCircle } from 'lucide-react'

interface PaymentFailedData {
  transaction: {
    id: string
    amount: number
    numbers: number[]
    status: string
  }
  raffle: {
    id: string
    title: string
    image_url: string
  }
}

export default function PaymentFailedPage() {
  const params = useParams()
  const router = useRouter()
  const [data, setData] = useState<PaymentFailedData | null>(null)
  const [loading, setLoading] = useState(true)

  const transactionId = params.id as string
  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      try {
        const { data: transaction, error } = await supabase
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

        if (error || !transaction) {
          console.error('Transaction not found')
          router.push('/')
          return
        }

        setData({
          transaction: {
            id: transaction.id,
            amount: transaction.amount,
            numbers: transaction.numbers,
            status: transaction.status
          },
          raffle: transaction.raffle
        })

      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [transactionId, router])

  const handleRetry = () => {
    // Redirecionar para a página da rifa para tentar novamente
    if (data?.raffle.id) {
      router.push(`/rifas/${data.raffle.id}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!data) {
    return null
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container max-w-2xl mx-auto px-4">
        <div className="raffle-card p-8">
          {/* Ícone de erro */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center">
              <XCircle className="w-12 h-12 text-red-500" />
            </div>
          </div>

          {/* Título */}
          <h1 className="text-3xl font-bold text-center mb-2">
            Pagamento não realizado
          </h1>
          <p className="text-center text-muted-foreground mb-8">
            Não conseguimos processar seu pagamento
          </p>

          {/* Detalhes da rifa */}
          <div className="bg-secondary rounded-lg p-6 mb-6">
            <div className="flex items-center gap-4 mb-4">
              {data.raffle.image_url && (
                <img
                  src={data.raffle.image_url}
                  alt={data.raffle.title}
                  className="w-20 h-20 rounded-lg object-cover"
                />
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{data.raffle.title}</h3>
                <p className="text-muted-foreground">
                  Números tentados: {data.transaction.numbers.join(', ')}
                </p>
              </div>
            </div>

            {/* Status */}
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm">
                {data.transaction.status === 'expired' ? (
                  <>
                    <strong>Tempo expirado:</strong> O prazo para pagamento do PIX expirou.
                    Os números foram liberados para outros participantes.
                  </>
                ) : (
                  <>
                    <strong>Falha no pagamento:</strong> Não foi possível processar o pagamento.
                    Verifique seus dados e tente novamente.
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Possíveis motivos */}
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
            <h4 className="font-medium mb-2">Possíveis motivos:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Saldo insuficiente na conta</li>
              <li>• Limite diário de PIX excedido</li>
              <li>• Pagamento cancelado pelo usuário</li>
              <li>• Tempo de pagamento expirado (30 minutos)</li>
              <li>• Problema técnico temporário</li>
            </ul>
          </div>

          {/* Botões de ação */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => router.push('/')}
              className="flex-1 px-6 py-3 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              Voltar ao início
            </button>
            <button
              onClick={handleRetry}
              className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Tentar novamente
            </button>
          </div>

          {/* Suporte */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Precisa de ajuda?
            </p>
            <button
              onClick={() => window.open('https://wa.me/5511999999999', '_blank')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Falar com suporte
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}