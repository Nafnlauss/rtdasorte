'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/useAuthStore'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils/format'

export default function MyRafflesPage() {
  const user = useAuthStore((state) => state.user)
  const router = useRouter()
  const supabase = createClient()
  
  const [raffles, setRaffles] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    
    loadMyRaffles()
  }, [user, router])

  const loadMyRaffles = async () => {
    if (!user) return
    
    try {
      // Buscar transações do usuário
      const { data: transactions } = await supabase
        .from('transactions')
        .select(`
          *,
          raffles (
            id,
            title,
            description,
            image_url,
            number_price,
            draw_date,
            status
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })

      // Agrupar por rifa
      const raffleMap = new Map()
      
      transactions?.forEach(transaction => {
        if (transaction.raffles) {
          const raffleId = transaction.raffles.id
          if (!raffleMap.has(raffleId)) {
            raffleMap.set(raffleId, {
              ...transaction.raffles,
              totalNumbers: 0,
              totalSpent: 0,
              lastPurchase: transaction.created_at
            })
          }
          
          const raffle = raffleMap.get(raffleId)
          raffle.totalNumbers += transaction.quantity || 0
          raffle.totalSpent += transaction.amount || 0
        }
      })

      setRaffles(Array.from(raffleMap.values()))
    } catch (error) {
      console.error('Erro ao carregar rifas:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Minhas Rifas</h1>
          <p className="text-muted-foreground">Acompanhe todas as rifas que você está participando</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-12 h-12 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-muted-foreground">Carregando suas rifas...</p>
            </div>
          </div>
        ) : raffles.length === 0 ? (
          <div className="raffle-card text-center py-12">
            <span className="text-5xl mb-4 block">🎫</span>
            <h2 className="text-xl font-bold mb-2">Você ainda não está participando de nenhuma rifa</h2>
            <p className="text-muted-foreground mb-6">
              Explore as rifas disponíveis e comece a concorrer a prêmios incríveis!
            </p>
            <Link 
              href="/raffles"
              className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Explorar Rifas
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {raffles.map((raffle) => (
              <div key={raffle.id} className="raffle-card">
                {raffle.image_url && (
                  <div className="h-48 rounded-lg overflow-hidden bg-secondary mb-4">
                    <img
                      src={raffle.image_url}
                      alt={raffle.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <h3 className="text-xl font-bold mb-2">{raffle.title}</h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {raffle.description}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Seus números:</span>
                    <span className="font-bold">{raffle.totalNumbers}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total investido:</span>
                    <span className="font-bold text-primary">
                      {formatCurrency(raffle.totalSpent)}
                    </span>
                  </div>
                  {raffle.draw_date && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Sorteio:</span>
                      <span className="font-semibold">
                        {new Date(raffle.draw_date).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                    raffle.status === 'active' ? 'bg-green-500/20 text-green-500' :
                    raffle.status === 'finished' ? 'bg-blue-500/20 text-blue-500' :
                    'bg-yellow-500/20 text-yellow-500'
                  }`}>
                    <span className="w-2 h-2 rounded-full bg-current" />
                    {raffle.status === 'active' ? 'Ativa' :
                     raffle.status === 'finished' ? 'Finalizada' : 'Pausada'}
                  </span>
                  
                  <Link 
                    href={`/raffles/${raffle.id}`}
                    className="text-primary hover:underline text-sm font-semibold"
                  >
                    Ver Detalhes →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}