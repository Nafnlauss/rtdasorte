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

  // Cores do gráfico
  const COLORS = ['#10b981', '#059669', '#047857', '#065f46', '#064e3b']

  // Dados simulados (substituir por dados reais do banco)
  useEffect(() => {
    // Simular dados de vendas diárias
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 60
    const data: SalesData[] = []
    
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i)
      const dailySales = Math.floor(Math.random() * 100) + 20
      data.push({
        date: format(date, 'dd/MM', { locale: ptBR }),
        sales: dailySales,
        revenue: dailySales * pricePerNumber,
        tickets: dailySales
      })
    }
    setSalesData(data)

    // Simular dados por hora
    const hours: HourlyData[] = []
    for (let i = 0; i < 24; i++) {
      hours.push({
        hour: `${i}h`,
        sales: Math.floor(Math.random() * 50) + 5
      })
    }
    setHourlyData(hours)

    // Simular distribuição de tickets
    setTicketDistribution([
      { range: '1-10', count: 450, percentage: 45 },
      { range: '11-50', count: 300, percentage: 30 },
      { range: '51-100', count: 150, percentage: 15 },
      { range: '101-500', count: 80, percentage: 8 },
      { range: '500+', count: 20, percentage: 2 }
    ])

    // Simular top compradores
    setTopBuyers([
      { name: 'João Silva', tickets: 500, spent: 500 * pricePerNumber },
      { name: 'Maria Santos', tickets: 350, spent: 350 * pricePerNumber },
      { name: 'Pedro Oliveira', tickets: 250, spent: 250 * pricePerNumber },
      { name: 'Ana Costa', tickets: 200, spent: 200 * pricePerNumber },
      { name: 'Carlos Lima', tickets: 150, spent: 150 * pricePerNumber }
    ])
  }, [period, pricePerNumber])

  // Cálculos de métricas
  const revenue = soldNumbers * pricePerNumber
  const averageTicket = soldNumbers > 0 ? revenue / soldNumbers : 0
  const progressPercentage = (soldNumbers / totalNumbers) * 100
  const remainingNumbers = totalNumbers - soldNumbers
  const projectedRevenue = totalNumbers * pricePerNumber
  const conversionRate = 65.3 // Simulado
  const growthRate = 12.5 // Simulado

  // Dados para o gráfico de radar
  const radarData = [
    { metric: 'Vendas', value: progressPercentage },
    { metric: 'Conversão', value: conversionRate },
    { metric: 'Engajamento', value: 78 },
    { metric: 'Satisfação', value: 92 },
    { metric: 'Recompra', value: 45 },
    { metric: 'Indicação', value: 67 }
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
          <p className="text-xs text-green-400 mt-1">
            ↑ {growthRate}% vs período anterior
          </p>
        </div>

        <div className="raffle-card bg-gradient-to-br from-blue-500/10 to-blue-600/10">
          <p className="text-sm text-muted-foreground mb-1">Ticket Médio</p>
          <p className="text-2xl font-bold text-blue-500">
            {formatCurrency(averageTicket)}
          </p>
          <p className="text-xs text-blue-400 mt-1">
            Por transação
          </p>
        </div>

        <div className="raffle-card bg-gradient-to-br from-purple-500/10 to-purple-600/10">
          <p className="text-sm text-muted-foreground mb-1">Taxa de Conversão</p>
          <p className="text-2xl font-bold text-purple-500">
            {conversionRate}%
          </p>
          <p className="text-xs text-purple-400 mt-1">
            Visitantes → Compradores
          </p>
        </div>

        <div className="raffle-card bg-gradient-to-br from-orange-500/10 to-orange-600/10">
          <p className="text-sm text-muted-foreground mb-1">Maior Ticket</p>
          <p className="text-2xl font-bold text-orange-500">
            {formatCurrency(topBuyers[0]?.spent || 0)}
          </p>
          <p className="text-xs text-orange-400 mt-1">
            {topBuyers[0]?.tickets || 0} números
          </p>
        </div>
      </div>

      {/* Gráficos Principais */}
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
                dataKey="sales" 
                stroke="#10b981" 
                strokeWidth={2}
                fill="url(#colorSales)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Receita */}
        <div className="raffle-card">
          <h3 className="font-bold mb-4">Receita Acumulada</h3>
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

      {/* Distribuição e Horários */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Distribuição de Tickets */}
        <div className="raffle-card">
          <h3 className="font-bold mb-4">Distribuição de Compras</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={ticketDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ range, percentage }) => `${range} (${percentage}%)`}
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

        {/* Vendas por Hora */}
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
      </div>

      {/* Performance e Top Compradores */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Radar de Performance */}
        <div className="raffle-card">
          <h3 className="font-bold mb-4">Indicadores de Performance</h3>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#374151" />
              <PolarAngleAxis dataKey="metric" stroke="#9ca3af" fontSize={12} />
              <Radar 
                name="Performance" 
                dataKey="value" 
                stroke="#10b981" 
                fill="#10b981" 
                fillOpacity={0.3}
                strokeWidth={2}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: 'none' }}
                formatter={(value: number) => `${value}%`}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Compradores */}
        <div className="raffle-card">
          <h3 className="font-bold mb-4">🏆 Top 5 Compradores</h3>
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
      </div>

      {/* Estatísticas Adicionais */}
      <div className="raffle-card bg-gradient-to-br from-secondary to-background">
        <h3 className="font-bold mb-4">📊 Estatísticas Detalhadas</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Tempo Médio de Compra</p>
            <p className="text-lg font-bold">3min 45s</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Taxa de Abandono</p>
            <p className="text-lg font-bold text-red-500">12.3%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Recorrência</p>
            <p className="text-lg font-bold text-green-500">34.7%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">NPS Score</p>
            <p className="text-lg font-bold text-blue-500">8.9/10</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground">Vendas Hoje</p>
            <p className="text-lg font-bold">
              {Math.floor(Math.random() * 100) + 50}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Vendas Semana</p>
            <p className="text-lg font-bold">
              {Math.floor(Math.random() * 500) + 200}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Vendas Mês</p>
            <p className="text-lg font-bold">
              {Math.floor(Math.random() * 2000) + 1000}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Projeção Término</p>
            <p className="text-lg font-bold">~15 dias</p>
          </div>
        </div>
      </div>
    </div>
  )
}