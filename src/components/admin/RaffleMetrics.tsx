'use client'

import { useState, useEffect } from 'react'
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { format, subDays, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/utils/format'
import { createClient } from '@/lib/supabase/client'

interface SalesData {
  date: string
  sales: number
  revenue: number
  tickets: number
}

interface HourlyData {
  hour: string
  sales: number
}

interface TicketDistribution {
  range: string
  count: number
  percentage: number
}

interface TopBuyer {
  name: string
  tickets: number
  spent: number
}

interface RaffleMetricsProps {
  raffleId: string
  totalNumbers: number
  soldNumbers: number
  pricePerNumber: number
}

export default function RaffleMetrics({ 
  raffleId, 
  totalNumbers, 
  soldNumbers,
  pricePerNumber 
}: RaffleMetricsProps) {
  const [period, setPeriod] = useState<'7d' | '30d' | 'all'>('7d')
  const [salesData, setSalesData] = useState<SalesData[]>([])
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([])
  const [ticketDistribution, setTicketDistribution] = useState<TicketDistribution[]>([])
  const [topBuyers, setTopBuyers] = useState<TopBuyer[]>([])
  const [stats, setStats] = useState({
    totalTransactions: 0,
    uniqueBuyers: 0,
    averageTicket: 0,
    conversionRate: 0
  })
  
  const supabase = createClient()

  // Cores do gráfico
  const COLORS = ['#10b981', '#059669', '#047857', '#065f46', '#064e3b']

  useEffect(() => {
    loadMetrics()
  }, [period, raffleId])

  const loadMetrics = async () => {
    try {
      // Calcular período
      const days = period === '7d' ? 7 : period === '30d' ? 30 : 365
      const startDate = subDays(new Date(), days).toISOString()
      
      // Buscar transações completadas
      const { data: transactions, error: transError } = await supabase
        .from('transactions')
        .select('*')
        .eq('raffle_id', raffleId)
        .eq('status', 'completed')
        .gte('created_at', startDate)
        .order('created_at', { ascending: true })
      
      if (transError) {
        console.error('Error loading transactions:', transError)
        return
      }

      // Processar dados diários
      const dailyData: { [key: string]: SalesData } = {}
      const hourlyCount: { [key: number]: number } = {}
      const buyerStats: { [key: string]: { name: string, tickets: number, spent: number } } = {}
      
      transactions?.forEach(transaction => {
        const date = format(new Date(transaction.created_at), 'dd/MM', { locale: ptBR })
        const hour = new Date(transaction.created_at).getHours()
        const quantity = transaction.quantity || 0
        const amount = transaction.amount || 0
        
        // Dados diários
        if (!dailyData[date]) {
          dailyData[date] = {
            date,
            sales: 0,
            revenue: 0,
            tickets: 0
          }
        }
        dailyData[date].sales += 1
        dailyData[date].revenue += amount
        dailyData[date].tickets += quantity
        
        // Dados por hora
        hourlyCount[hour] = (hourlyCount[hour] || 0) + quantity
        
        // Top compradores
        const userId = transaction.user_id
        if (userId) {
          if (!buyerStats[userId]) {
            buyerStats[userId] = {
              name: `Comprador ${userId.substring(0, 8)}`, // Será substituído pelo nome real
              tickets: 0,
              spent: 0
            }
          }
          buyerStats[userId].tickets += quantity
          buyerStats[userId].spent += amount
        }
      })
      
      // Buscar nomes reais dos compradores
      const userIds = Object.keys(buyerStats)
      if (userIds.length > 0) {
        const { data: users } = await supabase
          .from('users')
          .select('id, name')
          .in('id', userIds)
        
        users?.forEach(user => {
          if (buyerStats[user.id]) {
            buyerStats[user.id].name = user.name || `Comprador ${user.id.substring(0, 8)}`
          }
        })
      }
      
      // Preparar dados de vendas
      const salesArray = Object.values(dailyData).sort((a, b) => {
        const [dayA, monthA] = a.date.split('/')
        const [dayB, monthB] = b.date.split('/')
        return new Date(`${monthA}/${dayA}`).getTime() - new Date(`${monthB}/${dayB}`).getTime()
      })
      setSalesData(salesArray)
      
      // Preparar dados por hora
      const hourlyArray: HourlyData[] = []
      for (let i = 0; i < 24; i++) {
        hourlyArray.push({
          hour: `${i}h`,
          sales: hourlyCount[i] || 0
        })
      }
      setHourlyData(hourlyArray)
      
      // Top 5 compradores
      const sortedBuyers = Object.values(buyerStats)
        .sort((a, b) => b.spent - a.spent)
        .slice(0, 5)
      setTopBuyers(sortedBuyers)
      
      // Calcular distribuição de tickets
      const distribution: { [key: string]: number } = {
        '1-10': 0,
        '11-50': 0,
        '51-100': 0,
        '101-500': 0,
        '500+': 0
      }
      
      Object.values(buyerStats).forEach(buyer => {
        if (buyer.tickets <= 10) distribution['1-10']++
        else if (buyer.tickets <= 50) distribution['11-50']++
        else if (buyer.tickets <= 100) distribution['51-100']++
        else if (buyer.tickets <= 500) distribution['101-500']++
        else distribution['500+']++
      })
      
      const totalBuyers = Object.values(buyerStats).length
      const distributionArray: TicketDistribution[] = Object.entries(distribution).map(([range, count]) => ({
        range,
        count,
        percentage: totalBuyers > 0 ? Math.round((count / totalBuyers) * 100) : 0
      }))
      setTicketDistribution(distributionArray)
      
      // Estatísticas gerais
      const totalRevenue = transactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0
      const totalTickets = transactions?.reduce((sum, t) => sum + (t.quantity || 0), 0) || 0
      
      setStats({
        totalTransactions: transactions?.length || 0,
        uniqueBuyers: Object.keys(buyerStats).length,
        averageTicket: transactions?.length ? totalRevenue / transactions.length : 0,
        conversionRate: 0 // Precisaria de dados de visualização para calcular
      })
      
    } catch (error) {
      console.error('Error loading metrics:', error)
    }
  }

  // Cálculos de métricas
  const revenue = soldNumbers * pricePerNumber
  const progressPercentage = (soldNumbers / totalNumbers) * 100
  const remainingNumbers = totalNumbers - soldNumbers
  const projectedRevenue = totalNumbers * pricePerNumber

  // Dados para o gráfico de radar - usar dados reais quando disponíveis
  const radarData = [
    { metric: 'Vendas', value: Math.min(progressPercentage, 100) },
    { metric: 'Conversão', value: 0 },
    { metric: 'Engajamento', value: 0 },
    { metric: 'Satisfação', value: 0 },
    { metric: 'Recompra', value: 0 },
    { metric: 'Indicação', value: 0 }
  ]

  return (
    <div className="space-y-6">
      {/* Filtro de Período */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">📈 Métricas Detalhadas</h2>
        <div className="flex gap-2">
          {(['7d', '30d', 'all'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                period === p 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-secondary hover:bg-secondary/80'
              }`}
            >
              {p === '7d' ? '7 dias' : p === '30d' ? '30 dias' : 'Tudo'}
            </button>
          ))}
        </div>
      </div>

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="raffle-card bg-gradient-to-br from-green-500/10 to-green-600/10">
          <p className="text-sm text-muted-foreground mb-1">Receita Total</p>
          <p className="text-2xl font-bold text-green-500">
            {formatCurrency(revenue)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.totalTransactions} transações
          </p>
        </div>

        <div className="raffle-card bg-gradient-to-br from-blue-500/10 to-blue-600/10">
          <p className="text-sm text-muted-foreground mb-1">Ticket Médio</p>
          <p className="text-2xl font-bold text-blue-500">
            {formatCurrency(stats.averageTicket)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Por transação
          </p>
        </div>

        <div className="raffle-card bg-gradient-to-br from-purple-500/10 to-purple-600/10">
          <p className="text-sm text-muted-foreground mb-1">Compradores Únicos</p>
          <p className="text-2xl font-bold text-purple-500">
            {stats.uniqueBuyers}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            No período
          </p>
        </div>

        <div className="raffle-card bg-gradient-to-br from-orange-500/10 to-orange-600/10">
          <p className="text-sm text-muted-foreground mb-1">Maior Compra</p>
          <p className="text-2xl font-bold text-orange-500">
            {formatCurrency(topBuyers[0]?.spent || 0)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {topBuyers[0]?.tickets || 0} números
          </p>
        </div>
      </div>

      {/* Gráficos Principais */}
      {salesData.length > 0 && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Gráfico de Vendas */}
          <div className="raffle-card">
            <h3 className="font-bold mb-4">Vendas ao Longo do Tempo</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none' }}
                  labelStyle={{ color: '#9ca3af' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="tickets" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  fill="url(#colorSales)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfico de Receita */}
          <div className="raffle-card">
            <h3 className="font-bold mb-4">Receita Diária</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none' }}
                  labelStyle={{ color: '#9ca3af' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#059669" 
                  strokeWidth={3}
                  dot={{ fill: '#10b981', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Distribuição e Horários */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Distribuição de Tickets */}
        {ticketDistribution.some(d => d.count > 0) && (
          <div className="raffle-card">
            <h3 className="font-bold mb-4">Distribuição de Compras</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={ticketDistribution.filter(d => d.count > 0)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ range, percentage }) => percentage > 0 ? `${range} (${percentage}%)` : ''}
                  outerRadius={70}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {ticketDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Vendas por Hora */}
        {hourlyData.some(h => h.sales > 0) && (
          <div className="raffle-card lg:col-span-2">
            <h3 className="font-bold mb-4">Vendas por Hora do Dia</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="hour" stroke="#9ca3af" fontSize={10} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none' }}
                  labelStyle={{ color: '#9ca3af' }}
                />
                <Bar dataKey="sales" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Top Compradores */}
      {topBuyers.length > 0 && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="raffle-card">
            <h3 className="font-bold mb-4">🏆 Top Compradores</h3>
            <div className="space-y-3">
              {topBuyers.map((buyer, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                    index === 1 ? 'bg-gray-400/20 text-gray-400' :
                    index === 2 ? 'bg-orange-600/20 text-orange-600' :
                    'bg-secondary text-muted-foreground'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{buyer.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatNumber(buyer.tickets)} números
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-primary">
                      {formatCurrency(buyer.spent)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Estatísticas do Período */}
          <div className="raffle-card">
            <h3 className="font-bold mb-4">📊 Resumo do Período</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total de Vendas</span>
                <span className="font-bold">{stats.totalTransactions}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Compradores Únicos</span>
                <span className="font-bold">{stats.uniqueBuyers}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Números Vendidos</span>
                <span className="font-bold">{soldNumbers.toLocaleString('pt-BR')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Números Restantes</span>
                <span className="font-bold">{remainingNumbers.toLocaleString('pt-BR')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Progresso</span>
                <span className="font-bold text-primary">{progressPercentage.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mensagem quando não há dados */}
      {salesData.length === 0 && (
        <div className="raffle-card text-center py-8">
          <p className="text-muted-foreground">
            Ainda não há dados de vendas para este período.
          </p>
        </div>
      )}
    </div>
  )
}