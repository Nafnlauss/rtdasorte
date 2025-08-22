import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatNumber } from '@/lib/utils/format'

async function getWinners() {
  const supabase = await createClient()
  
  const { data: winners, count } = await supabase
    .from('winners')
    .select(`
      *,
      users(name, email, phone),
      raffles(title, number_price),
      raffle_numbers(number)
    `, { count: 'exact' })
    .order('draw_date', { ascending: false })
    .limit(50)

  // Estatísticas
  const { data: stats } = await supabase
    .from('winners')
    .select('prize_amount, delivered')
  
  const totalPrizes = stats?.reduce((sum, w) => sum + (w.prize_amount || 0), 0) || 0
  const deliveredCount = stats?.filter(w => w.delivered).length || 0
  const pendingCount = stats?.filter(w => !w.delivered).length || 0

  return { 
    winners: winners || [], 
    total: count || 0,
    totalPrizes,
    deliveredCount,
    pendingCount
  }
}

export default async function AdminWinnersPage() {
  const { winners, total, totalPrizes, deliveredCount, pendingCount } = await getWinners()

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Ganhadores</h1>
          <p className="text-muted-foreground">Gerencie os ganhadores e entrega de prêmios</p>
        </div>
        
        <button className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold">
          <span className="text-xl">🎲</span>
          Realizar Sorteio
        </button>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="raffle-card">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <span className="text-xl">🏆</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-1">Total de Ganhadores</p>
          <p className="text-2xl font-bold">{formatNumber(total)}</p>
        </div>
        
        <div className="raffle-card">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <span className="text-xl">💰</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-1">Total em Prêmios</p>
          <p className="text-2xl font-bold text-green-500">
            {formatCurrency(totalPrizes)}
          </p>
        </div>
        
        <div className="raffle-card">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <span className="text-xl">✅</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-1">Prêmios Entregues</p>
          <p className="text-2xl font-bold text-blue-500">{formatNumber(deliveredCount)}</p>
        </div>
        
        <div className="raffle-card">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <span className="text-xl">⏳</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-1">Aguardando Entrega</p>
          <p className="text-2xl font-bold text-yellow-500">{formatNumber(pendingCount)}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-6">
        <select className="px-4 py-2 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none transition-colors">
          <option value="">Todos os Status</option>
          <option value="delivered">Entregue</option>
          <option value="pending">Pendente</option>
        </select>
        
        <select className="px-4 py-2 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none transition-colors">
          <option value="">Todas as Rifas</option>
        </select>
        
        <input
          type="date"
          className="px-4 py-2 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none transition-colors"
          placeholder="Data do sorteio"
        />
        
        <button className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold">
          Filtrar
        </button>
      </div>

      {/* Tabela de ganhadores */}
      <div className="raffle-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary">
              <tr>
                <th className="text-left p-4 font-semibold">Ganhador</th>
                <th className="text-left p-4 font-semibold">Rifa</th>
                <th className="text-left p-4 font-semibold">Número</th>
                <th className="text-left p-4 font-semibold">Prêmio</th>
                <th className="text-left p-4 font-semibold">Data do Sorteio</th>
                <th className="text-left p-4 font-semibold">Status</th>
                <th className="text-left p-4 font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {winners.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-8 text-muted-foreground">
                    Nenhum ganhador registrado
                  </td>
                </tr>
              ) : (
                winners.map((winner) => (
                  <tr key={winner.id} className="border-t border-border hover:bg-secondary/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                          <span className="text-lg">🏆</span>
                        </div>
                        <div>
                          <p className="font-semibold">
                            {winner.users?.name || 'Usuário desconhecido'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {winner.users?.email}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {winner.users?.phone}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-sm">
                        {winner.raffles?.title || '-'}
                      </p>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-primary/20 text-primary font-mono font-bold">
                        {String(winner.raffle_numbers?.number || winner.winning_number || 0).padStart(4, '0')}
                      </span>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-semibold text-green-500">
                          {formatCurrency(winner.prize_amount || 0)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {winner.prize_description || 'Prêmio em dinheiro'}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm">
                        {winner.draw_date ? new Date(winner.draw_date).toLocaleDateString('pt-BR') : '-'}
                      </p>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                        winner.delivered ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'
                      }`}>
                        <span className="w-2 h-2 rounded-full bg-current" />
                        {winner.delivered ? 'Entregue' : 'Pendente'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {!winner.delivered && (
                          <button
                            className="p-2 hover:bg-secondary rounded-lg transition-colors"
                            title="Marcar como entregue"
                          >
                            ✅
                          </button>
                        )}
                        <button
                          className="p-2 hover:bg-secondary rounded-lg transition-colors"
                          title="Enviar mensagem"
                        >
                          💬
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {total > 50 && (
          <div className="p-4 border-t border-border flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Mostrando {Math.min(50, total)} de {total} ganhadores
            </p>
            <div className="flex gap-2">
              <button className="px-3 py-1 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
                Anterior
              </button>
              <button className="px-3 py-1 rounded-lg bg-primary text-primary-foreground">
                1
              </button>
              <button className="px-3 py-1 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
                2
              </button>
              <button className="px-3 py-1 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
                Próximo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}