'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, Home, FileText } from 'lucide-react'
import Confetti from 'react-confetti'

interface PaymentSuccessData {
  transaction: {
    id: string
    amount: number
    numbers: number[]
    paid_at: string
  }
  raffle: {
    id: string
    title: string
    image_url: string
  }
  user: {
    name: string
    phone: string
  }
}

export default function PaymentSuccessPage() {
  const params = useParams()
  const router = useRouter()
  const [data, setData] = useState<PaymentSuccessData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showConfetti, setShowConfetti] = useState(true)

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
            ),
            user:users!user_id (
              name,
              phone
            )
          `)
          .eq('id', transactionId)
          .single()

        if (error || !transaction) {
          console.error('Transaction not found')
          router.push('/')
          return
        }

        // Verificar se realmente está pago
        if (transaction.status !== 'completed') {
          router.push(`/payment/${transactionId}`)
          return
        }

        setData({
          transaction: {
            id: transaction.id,
            amount: transaction.amount,
            numbers: transaction.numbers,
            paid_at: transaction.paid_at
          },
          raffle: transaction.raffle,
          user: transaction.user
        })

      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()

    // Parar confetti após 10 segundos
    const timer = setTimeout(() => setShowConfetti(false), 10000)
    return () => clearTimeout(timer)
  }, [transactionId, router])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={200}
          gravity={0.1}
        />
      )}

      <div className="container max-w-2xl mx-auto px-4">
        <div className="raffle-card p-8">
          {/* Ícone de sucesso */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
          </div>

          {/* Título */}
          <h1 className="text-3xl font-bold text-center mb-2">
            Pagamento Confirmado! 🎉
          </h1>
          <p className="text-center text-muted-foreground mb-8">
            Seus números foram reservados com sucesso
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
                  ID da transação: {data.transaction.id.slice(0, 8)}
                </p>
              </div>
            </div>

            {/* Números sorteados */}
            <div className="mb-4">
              <p className="text-sm font-medium mb-2">Seus números:</p>
              <div className="flex flex-wrap gap-2">
                {data.transaction.numbers.map((number) => (
                  <span
                    key={number}
                    className="px-3 py-1 bg-primary text-primary-foreground rounded-lg font-bold"
                  >
                    {number.toString().padStart(4, '0')}
                  </span>
                ))}
              </div>
            </div>

            {/* Informações do pagamento */}
            <div className="space-y-2 pt-4 border-t border-border">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valor pago:</span>
                <span className="font-semibold">
                  {formatCurrency(data.transaction.amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Data/Hora:</span>
                <span className="text-sm">
                  {formatDate(data.transaction.paid_at)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cliente:</span>
                <span className="text-sm">
                  {data.user.name}
                </span>
              </div>
            </div>
          </div>

          {/* Próximos passos */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              💡 Próximos passos:
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Você receberá um SMS/WhatsApp confirmando a compra</li>
              <li>• Acompanhe o sorteio pela plataforma</li>
              <li>• Boa sorte! 🍀</li>
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
              onClick={() => window.print()}
              className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Imprimir comprovante
            </button>
          </div>

          {/* Compartilhar */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Compartilhe com seus amigos:
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => {
                  const text = `Acabei de participar da rifa "${data.raffle.title}"! 🎉\nNúmeros: ${data.transaction.numbers.join(', ')}`
                  const url = `https://wa.me/?text=${encodeURIComponent(text)}`
                  window.open(url, '_blank')
                }}
                className="p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}