import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatNumber } from '@/lib/utils/format'

async function getDashboardStats() {
  const supabase = await createClient()
  
  // Buscar estatísticas gerais
  const [
    { count: totalUsers },
    { count: totalRaffles },
    { data: transactions },
    { data: recentSales }
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('raffles').select('*', { count: 'exact', head: true }),
    supabase.from('transactions').select('amount').eq('status', 'paid'),
    supabase.from('raffle_numbers')
      .select('*, raffles(title, number_price)')
      .eq('status', 'paid')
      .order('created_at', { ascending: false })
      .limit(10)
  ])

  // Calcular total de vendas
  const totalRevenue = transactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0
  const totalTicketsSold = recentSales?.length || 0

  // Buscar rifas ativas
  const { data: activeRaffles } = await supabase
    .from('raffles')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(5)

  return {
    totalUsers: totalUsers || 0,
    totalRaffles: totalRaffles || 0,
    totalRevenue,
    totalTicketsSold,
    recentSales: recentSales || [],
    activeRaffles: activeRaffles || []
  }
}

export default async function AdminDashboard() {
  const stats = await getDashboardStats()

  return (
    <div>
      <div className="mb-4 sm:mb-6 md:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Dashboard Administrativo</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Visão geral do sistema de rifas</p>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
        <div className="raffle-card">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
            <span className="text-xs text-green-500 font-semibold">+12.5%</span>
          </div>
          <p className="text-sm text-muted-foreground mb-1">Receita Total</p>
          <p className="text-xl sm:text-2xl font-bold">
            {formatCurrency(stats.totalRevenue)}
          </p>
        </div>

        <div className="raffle-card">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
              <span className="text-2xl">🎟️</span>
            </div>
            <span className="text-xs text-green-500 font-semibold">+8.2%</span>
          </div>
          <p className="text-sm text-muted-foreground mb-1">Números Vendidos</p>
          <p className="text-xl sm:text-2xl font-bold">{formatNumber(stats.totalTicketsSold)}</p>
        </div>

        <div className="raffle-card">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
            <span className="text-xs text-green-500 font-semibold">+15.3%</span>
          </div>
          <p className="text-sm text-muted-foreground mb-1">Total de Usuários</p>
          <p className="text-xl sm:text-2xl font-bold">{formatNumber(stats.totalUsers || 0)}</p>
        </div>

        <div className="raffle-card">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
              <span className="text-2xl">🎲</span>
            </div>
            <span className="text-xs text-blue-500 font-semibold">Ativas</span>
          </div>
          <p className="text-sm text-muted-foreground mb-1">Total de Rifas</p>
          <p className="text-xl sm:text-2xl font-bold">{formatNumber(stats.totalRaffles || 0)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Rifas Ativas */}
        <div className="raffle-card">
          <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Rifas Ativas</h2>
          
          {stats.activeRaffles.length === 0 ? (
            <p className="text-muted-foreground">Nenhuma rifa ativa no momento</p>
          ) : (
            <div className="space-y-3">
              {stats.activeRaffles.map((raffle) => (
                <div key={raffle.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                  <div>
                    <p className="font-semibold">{raffle.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {(raffle.available_numbers || 0).toLocaleString('pt-BR')}/{(raffle.total_numbers || 0).toLocaleString('pt-BR')} disponíveis
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary">
                      R$ {(raffle.number_price || 0).toFixed(2).replace('.', ',')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {raffle.total_numbers ? Math.round(((raffle.total_numbers - (raffle.available_numbers || 0)) / raffle.total_numbers) * 100) : 0}% vendido
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Vendas Recentes */}
        <div className="raffle-card">
          <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Vendas Recentes</h2>
          
          {stats.recentSales.length === 0 ? (
            <p className="text-muted-foreground">Nenhuma venda recente</p>
          ) : (
            <div className="space-y-3">
              {stats.recentSales.slice(0, 5).map((sale) => (
                <div key={sale.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                  <div>
                    <p className="font-semibold text-sm">{sale.raffles?.title || 'Rifa sem título'}</p>
                    <p className="text-xs text-muted-foreground">
                      Número: {String(sale.number || 0).padStart(4, '0')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary">
                      R$ {(sale.raffles?.number_price || 0).toFixed(2).replace('.', ',')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {sale.created_at ? new Date(sale.created_at).toLocaleString('pt-BR') : '-'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Gráfico de Vendas (placeholder) */}
      <div className="raffle-card mt-6">
        <h2 className="text-xl font-bold mb-4">Vendas dos Últimos 7 Dias</h2>
        <div className="h-64 bg-secondary rounded-lg flex items-center justify-center">
          <p className="text-muted-foreground">Gráfico de vendas (implementar com biblioteca de charts)</p>
        </div>
      </div>
    </div>
  )
}