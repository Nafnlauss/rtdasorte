'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import RaffleMetrics from '@/components/admin/RaffleMetrics'
import ProgressControl from '@/components/admin/ProgressControl'
import { formatCurrency, formatNumber } from '@/lib/utils/format'

export default function RaffleMetricsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(true)
  const [raffle, setRaffle] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)
  
  const [progressData, setProgressData] = useState({
    showProgressBar: true,
    progressOverride: false,
    manualProgress: 0
  })

  useEffect(() => {
    loadRaffle()
  }, [id])

  const loadRaffle = async () => {
    try {
      const { data, error } = await supabase
        .from('raffles')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      if (data) {
        setRaffle(data)
        setProgressData({
          showProgressBar: data.show_progress_bar ?? true,
          progressOverride: data.progress_override ?? false,
          manualProgress: data.manual_progress ?? 0
        })
      }
    } catch (error) {
      console.error('Erro ao carregar rifa:', error)
      alert('Erro ao carregar dados da rifa')
      router.push('/admin/raffles')
    } finally {
      setIsLoading(false)
    }
  }

  const handleProgressSave = async () => {
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('raffles')
        .update({
          show_progress_bar: progressData.showProgressBar,
          progress_override: progressData.progressOverride,
          manual_progress: progressData.manualProgress,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error

      alert('Configurações de progresso salvas com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar configurações:', error)
      alert('Erro ao salvar configurações')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando métricas...</p>
        </div>
      </div>
    )
  }

  if (!raffle) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Rifa não encontrada</p>
      </div>
    )
  }

  const soldNumbers = raffle.total_numbers - (raffle.available_numbers || raffle.total_numbers)

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/admin/raffles" className="hover:text-foreground">
            Rifas
          </Link>
          <span>/</span>
          <Link href={`/admin/raffles/${params.id}/edit`} className="hover:text-foreground">
            {raffle.title}
          </Link>
          <span>/</span>
          <span>Métricas</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Métricas e Análises
            </h1>
            <p className="text-muted-foreground">
              {raffle.title} - Dashboard completo de performance
            </p>
          </div>
          
          <div className="flex gap-3">
            <Link
              href={`/admin/raffles/${params.id}/edit`}
              className="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
            >
              ✏️ Editar Rifa
            </Link>
            <Link
              href={`/admin/raffles/${params.id}/draw`}
              className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors"
            >
              🎲 Realizar Sorteio
            </Link>
          </div>
        </div>
      </div>

      {/* Cards de Status */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="raffle-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className={`text-lg font-bold ${
                raffle.status === 'active' ? 'text-green-500' :
                raffle.status === 'finished' ? 'text-blue-500' :
                'text-yellow-500'
              }`}>
                {raffle.status === 'active' ? '● Ativa' :
                 raffle.status === 'finished' ? '● Finalizada' :
                 '● Pausada'}
              </p>
            </div>
            <span className="text-3xl">
              {raffle.status === 'active' ? '🟢' :
               raffle.status === 'finished' ? '🏁' : '⏸️'}
            </span>
          </div>
        </div>

        <div className="raffle-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Vendidos</p>
              <p className="text-lg font-bold">{soldNumbers.toLocaleString('pt-BR')}</p>
              <p className="text-xs text-muted-foreground">
                de {raffle.total_numbers.toLocaleString('pt-BR')}
              </p>
            </div>
            <span className="text-3xl">🎫</span>
          </div>
        </div>

        <div className="raffle-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Receita</p>
              <p className="text-lg font-bold text-green-500">
                {formatCurrency(soldNumbers * (raffle.number_price || 0))}
              </p>
              <p className="text-xs text-muted-foreground">
                Total arrecadado
              </p>
            </div>
            <span className="text-3xl">💰</span>
          </div>
        </div>

        <div className="raffle-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Progresso</p>
              <p className="text-lg font-bold text-primary">
                {((soldNumbers / raffle.total_numbers) * 100).toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground">
                Completo
              </p>
            </div>
            <span className="text-3xl">📊</span>
          </div>
        </div>
      </div>

      {/* Controle de Progresso */}
      <div className="mb-8">
        <ProgressControl
          totalNumbers={raffle.total_numbers}
          soldNumbers={soldNumbers}
          showProgressBar={progressData.showProgressBar}
          progressOverride={progressData.progressOverride}
          manualProgress={progressData.manualProgress}
          onChange={setProgressData}
        />
        
        <div className="flex justify-end mt-4">
          <button
            onClick={handleProgressSave}
            disabled={isSaving}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Salvando...' : '💾 Salvar Configurações de Progresso'}
          </button>
        </div>
      </div>

      {/* Dashboard de Métricas */}
      <RaffleMetrics
        raffleId={params.id}
        totalNumbers={raffle.total_numbers}
        soldNumbers={soldNumbers}
        pricePerNumber={raffle.number_price || 0}
      />

      {/* Ações Rápidas */}
      <div className="mt-8 p-6 raffle-card bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30">
        <h3 className="text-lg font-bold mb-4">⚡ Ações Rápidas</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button className="p-3 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors text-sm font-semibold">
            📧 Enviar Newsletter
          </button>
          <button className="p-3 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors text-sm font-semibold">
            📱 Notificar WhatsApp
          </button>
          <button className="p-3 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors text-sm font-semibold">
            📊 Exportar Relatório
          </button>
          <button className="p-3 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors text-sm font-semibold">
            🎁 Criar Promoção
          </button>
        </div>
      </div>
    </div>
  )
}