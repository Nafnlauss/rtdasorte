'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/utils/format'

export default function AdminRafflesPage() {
  const [raffles, setRaffles] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadRaffles()
  }, [])

  const loadRaffles = async () => {
    try {
      const { data, error } = await supabase
        .from('raffles')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setRaffles(data || [])
    } catch (error) {
      console.error('Error loading raffles:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const deleteRaffle = async (raffleId: string, raffleTitle: string) => {
    if (!confirm(`Tem certeza que deseja excluir a rifa "${raffleTitle}"?\n\nEsta ação não pode ser desfeita.`)) {
      return
    }

    try {
      // Primeiro deletar os números da rifa
      const { error: numbersError } = await supabase
        .from('raffle_numbers')
        .delete()
        .eq('raffle_id', raffleId)
      
      if (numbersError) {
        console.error('Error deleting raffle numbers:', numbersError)
        alert('Erro ao deletar números da rifa. Por favor, tente novamente.')
        return
      }

      // Depois deletar a rifa
      const { error: raffleError } = await supabase
        .from('raffles')
        .delete()
        .eq('id', raffleId)
      
      if (raffleError) {
        console.error('Error deleting raffle:', raffleError)
        alert('Erro ao deletar rifa. Por favor, tente novamente.')
        return
      }

      // Recarregar a lista
      alert('Rifa excluída com sucesso!')
      loadRaffles()
    } catch (error) {
      console.error('Error deleting raffle:', error)
      alert('Erro ao deletar rifa. Por favor, tente novamente.')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gerenciar Rifas</h1>
          <p className="text-muted-foreground">Administre todas as rifas do sistema</p>
        </div>
        
        <div className="flex gap-3">
          <Link
            href="/admin/raffles/reorder"
            className="inline-flex items-center gap-2 px-6 py-3 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 transition-colors font-semibold"
          >
            <span className="text-xl">↕️</span>
            Reordenar
          </Link>
          <Link
            href="/admin/raffles/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
          >
            <span className="text-xl">➕</span>
            Nova Rifa
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-6">
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm">
          Todas
        </button>
        <button className="px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 transition-colors text-sm">
          Ativas
        </button>
        <button className="px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 transition-colors text-sm">
          Pausadas
        </button>
        <button className="px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 transition-colors text-sm">
          Finalizadas
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="raffle-card">
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="w-12 h-12 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-muted-foreground">Carregando rifas...</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabela de Rifas */}
      {!isLoading && (
      <div className="raffle-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary">
              <tr>
                <th className="text-left p-4 font-semibold">Rifa</th>
                <th className="text-left p-4 font-semibold">Status</th>
                <th className="text-left p-4 font-semibold">Preço</th>
                <th className="text-left p-4 font-semibold">Números</th>
                <th className="text-left p-4 font-semibold">Vendidos</th>
                <th className="text-left p-4 font-semibold">Receita</th>
                <th className="text-left p-4 font-semibold">Sorteio</th>
                <th className="text-left p-4 font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {raffles.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center p-8 text-muted-foreground">
                    Nenhuma rifa cadastrada
                  </td>
                </tr>
              ) : (
                raffles.map((raffle) => {
                  const totalNumbers = raffle.total_numbers || 0
                  const availableNumbers = raffle.available_numbers || 0
                  const ticketPrice = raffle.number_price || 0
                  const soldNumbers = totalNumbers - availableNumbers
                  const revenue = soldNumbers * ticketPrice
                  const progress = totalNumbers > 0 ? (soldNumbers / totalNumbers) * 100 : 0

                  return (
                    <tr key={raffle.id} className="border-t border-border">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {raffle.image_url && (
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-secondary">
                              <img
                                src={raffle.image_url}
                                alt={raffle.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold">{raffle.title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {raffle.description}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                          raffle.status === 'active' ? 'bg-green-500/20 text-green-500' :
                          raffle.status === 'finished' ? 'bg-blue-500/20 text-blue-500' :
                          'bg-yellow-500/20 text-yellow-500'
                        }`}>
                          <span className="w-2 h-2 rounded-full bg-current" />
                          {raffle.status === 'active' ? 'Adquira já!' :
                           raffle.status === 'finished' ? 'Concluído' :
                           'Pausada'}
                        </span>
                      </td>
                      <td className="p-4">
                        <p className="font-semibold">
                          {formatCurrency(ticketPrice)}
                        </p>
                      </td>
                      <td className="p-4">
                        <p className="font-semibold">{totalNumbers.toLocaleString('pt-BR')}</p>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-semibold">{soldNumbers.toLocaleString('pt-BR')}</p>
                          <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden mt-1">
                            <div 
                              className="h-full bg-primary transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatPercentage(progress)}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-semibold text-primary">
                          {formatCurrency(revenue)}
                        </p>
                      </td>
                      <td className="p-4">
                        {raffle.draw_date ? (
                          <p className="text-sm">
                            {new Date(raffle.draw_date).toLocaleDateString('pt-BR')}
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground">-</p>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {raffle.status === 'active' && (
                            <Link
                              href={`/admin/raffles/${raffle.id}/draw`}
                              className="p-2 hover:bg-secondary rounded-lg transition-colors"
                              title="Realizar Sorteio"
                            >
                              🎲
                            </Link>
                          )}
                          <Link
                            href={`/admin/raffles/${raffle.id}/metrics`}
                            className="p-2 hover:bg-secondary rounded-lg transition-colors"
                            title="Métricas"
                          >
                            📊
                          </Link>
                          <Link
                            href={`/admin/raffles/${raffle.id}/edit`}
                            className="p-2 hover:bg-secondary rounded-lg transition-colors"
                            title="Editar"
                          >
                            ✏️
                          </Link>
                          <button
                            onClick={() => deleteRaffle(raffle.id, raffle.title)}
                            className="p-2 hover:bg-secondary rounded-lg transition-colors"
                            title="Excluir"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </div>
  )
}