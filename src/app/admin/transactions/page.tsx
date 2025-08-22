import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatNumber } from '@/lib/utils/format'

async function getTransactions() {
  const supabase = await createClient()
  
  const { data: transactions, count } = await supabase
    .from('transactions')
    .select(`
      *,
      users(name, email),
      raffles(title)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(50)

  // Calcular totais
  const { data: totals } = await supabase
    .from('transactions')
    .select('amount, status')
  
  const totalRevenue = totals?.filter(t => t.status === 'paid')
    .reduce((sum, t) => sum + (t.amount || 0), 0) || 0
  
  const pendingAmount = totals?.filter(t => t.status === 'pending')
    .reduce((sum, t) => sum + (t.amount || 0), 0) || 0

  return { 
    transactions: transactions || [], 
    total: count || 0,
    totalRevenue,
    pendingAmount
  }
}

export default async function AdminTransactionsPage() {
  const { transactions, total, totalRevenue, pendingAmount } = await getTransactions()

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Transações</h1>
          <p className="text-muted-foreground">Acompanhe todos os pagamentos e transações financeiras</p>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="raffle-card">
          <p className="text-sm text-muted-foreground mb-1">Total de Transações</p>
          <p className="text-2xl font-bold">{formatNumber(total)}</p>
        </div>
        
        <div className="raffle-card">
          <p className="text-sm text-muted-foreground mb-1">Receita Total</p>
          <p className="text-2xl font-bold text-green-500">
            {formatCurrency(totalRevenue)}
          </p>
        </div>
        
        <div className="raffle-card">
          <p className="text-sm text-muted-foreground mb-1">Pendente</p>
          <p className="text-2xl font-bold text-yellow-500">
            {formatCurrency(pendingAmount)}
          </p>
        </div>
        
        <div className="raffle-card">
          <p className="text-sm text-muted-foreground mb-1">Taxa de Conversão</p>
          <p className="text-2xl font-bold text-blue-500">
            {total > 0 ? ((transactions.filter(t => t.status === 'paid').length / total) * 100).toFixed(1) : 0}%
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-6">
        <select className="px-4 py-2 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none transition-colors">
          <option value="">Todos os Status</option>
          <option value="paid">Pago</option>
          <option value="pending">Pendente</option>
          <option value="cancelled">Cancelado</option>
          <option value="refunded">Reembolsado</option>
        </select>
        
        <select className="px-4 py-2 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none transition-colors">
          <option value="">Todas as Rifas</option>
        </select>
        
        <input
          type="date"
          className="px-4 py-2 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none transition-colors"
          placeholder="Data inicial"
        />
        
        <input
          type="date"
          className="px-4 py-2 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none transition-colors"
          placeholder="Data final"
        />
        
        <button className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold">
          Filtrar
        </button>
        
        <button className="px-6 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 transition-colors font-semibold ml-auto">
          Exportar CSV
        </button>
      </div>

      {/* Tabela de transações */}
      <div className="raffle-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary">
              <tr>
                <th className="text-left p-4 font-semibold">ID</th>
                <th className="text-left p-4 font-semibold">Usuário</th>
                <th className="text-left p-4 font-semibold">Rifa</th>
                <th className="text-left p-4 font-semibold">Valor</th>
                <th className="text-left p-4 font-semibold">Método</th>
                <th className="text-left p-4 font-semibold">Status</th>
                <th className="text-left p-4 font-semibold">Data</th>
                <th className="text-left p-4 font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center p-8 text-muted-foreground">
                    Nenhuma transação encontrada
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr key={transaction.id} className="border-t border-border hover:bg-secondary/50 transition-colors">
                    <td className="p-4">
                      <p className="font-mono text-xs">
                        {transaction.id.slice(0, 8)}...
                      </p>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-semibold text-sm">
                          {transaction.users?.name || 'Usuário desconhecido'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {transaction.users?.email}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm">
                        {transaction.raffles?.title || '-'}
                      </p>
                    </td>
                    <td className="p-4">
                      <p className="font-semibold">
                        {formatCurrency(transaction.amount || 0)}
                      </p>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-500/20 text-purple-500 text-xs font-semibold">
                        PIX
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                        transaction.status === 'paid' ? 'bg-green-500/20 text-green-500' :
                        transaction.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                        transaction.status === 'cancelled' ? 'bg-red-500/20 text-red-500' :
                        'bg-blue-500/20 text-blue-500'
                      }`}>
                        <span className="w-2 h-2 rounded-full bg-current" />
                        {transaction.status === 'paid' ? 'Pago' :
                         transaction.status === 'pending' ? 'Pendente' :
                         transaction.status === 'cancelled' ? 'Cancelado' :
                         'Reembolsado'}
                      </span>
                    </td>
                    <td className="p-4">
                      <p className="text-sm">
                        {transaction.created_at ? new Date(transaction.created_at).toLocaleString('pt-BR') : '-'}
                      </p>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {transaction.status === 'pending' && (
                          <button
                            className="p-2 hover:bg-secondary rounded-lg transition-colors"
                            title="Confirmar pagamento"
                          >
                            ✅
                          </button>
                        )}
                        {transaction.status === 'paid' && (
                          <button
                            className="p-2 hover:bg-secondary rounded-lg transition-colors"
                            title="Reembolsar"
                          >
                            💰
                          </button>
                        )}
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
              Mostrando {Math.min(50, total)} de {total} transações
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