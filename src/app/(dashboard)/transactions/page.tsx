'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/useAuthStore'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils/format'

export default function TransactionsPage() {
  const user = useAuthStore((state) => state.user)
  const router = useRouter()
  const supabase = createClient()
  
  const [transactions, setTransactions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending' | 'failed'>('all')

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    
    loadTransactions()
  }, [user, router, filter])

  const loadTransactions = async () => {
    if (!user) return
    
    try {
      let query = supabase
        .from('transactions')
        .select(`
          *,
          raffles (
            title
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data } = await query
      setTransactions(data || [])
    } catch (error) {
      console.error('Erro ao carregar transações:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-500">
            <span className="w-2 h-2 rounded-full bg-current" />
            Concluído
          </span>
        )
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-500">
            <span className="w-2 h-2 rounded-full bg-current" />
            Pendente
          </span>
        )
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-500">
            <span className="w-2 h-2 rounded-full bg-current" />
            Falhou
          </span>
        )
      default:
        return null
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Minhas Transações</h1>
          <p className="text-muted-foreground">Histórico de pagamentos e compras</p>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              filter === 'all' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-secondary hover:bg-secondary/80'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              filter === 'completed' 
                ? 'bg-green-500 text-white' 
                : 'bg-secondary hover:bg-secondary/80'
            }`}
          >
            Concluídas
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              filter === 'pending' 
                ? 'bg-yellow-500 text-white' 
                : 'bg-secondary hover:bg-secondary/80'
            }`}
          >
            Pendentes
          </button>
          <button
            onClick={() => setFilter('failed')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              filter === 'failed' 
                ? 'bg-red-500 text-white' 
                : 'bg-secondary hover:bg-secondary/80'
            }`}
          >
            Falhadas
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-12 h-12 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-muted-foreground">Carregando transações...</p>
            </div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="raffle-card text-center py-12">
            <span className="text-5xl mb-4 block">💳</span>
            <h2 className="text-xl font-bold mb-2">
              {filter === 'all' 
                ? 'Você ainda não realizou nenhuma transação'
                : `Nenhuma transação ${filter === 'completed' ? 'concluída' : filter === 'pending' ? 'pendente' : 'falhada'}`
              }
            </h2>
            <p className="text-muted-foreground">
              Suas transações aparecerão aqui após realizar compras
            </p>
          </div>
        ) : (
          <div className="raffle-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary">
                  <tr>
                    <th className="text-left p-4 font-semibold">Data</th>
                    <th className="text-left p-4 font-semibold">Rifa</th>
                    <th className="text-left p-4 font-semibold">Quantidade</th>
                    <th className="text-left p-4 font-semibold">Valor</th>
                    <th className="text-left p-4 font-semibold">Método</th>
                    <th className="text-left p-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="border-t border-border">
                      <td className="p-4">
                        <p className="text-sm">
                          {new Date(transaction.created_at).toLocaleDateString('pt-BR')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(transaction.created_at).toLocaleTimeString('pt-BR')}
                        </p>
                      </td>
                      <td className="p-4">
                        <p className="font-semibold">
                          {transaction.raffles?.title || 'Rifa não identificada'}
                        </p>
                      </td>
                      <td className="p-4">
                        <p className="font-semibold">
                          {transaction.quantity || 0} números
                        </p>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-primary">
                          {formatCurrency(transaction.amount || 0)}
                        </p>
                      </td>
                      <td className="p-4">
                        <span className="text-sm">
                          {transaction.payment_method === 'pix' ? '📱 PIX' : transaction.payment_method}
                        </span>
                      </td>
                      <td className="p-4">
                        {getStatusBadge(transaction.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}