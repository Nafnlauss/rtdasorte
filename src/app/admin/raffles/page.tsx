import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

async function getRaffles() {
  const supabase = await createClient()
  
  const { data: raffles } = await supabase
    .from('raffles')
    .select('*')
    .order('created_at', { ascending: false })

  return raffles || []
}

export default async function AdminRafflesPage() {
  const raffles = await getRaffles()

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gerenciar Rifas</h1>
          <p className="text-muted-foreground">Administre todas as rifas do sistema</p>
        </div>
        
        <Link
          href="/admin/raffles/new"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
        >
          <span className="text-xl">➕</span>
          Nova Rifa
        </Link>
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

      {/* Tabela de Rifas */}
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
                  const soldNumbers = raffle.total_numbers - raffle.available_numbers
                  const revenue = soldNumbers * raffle.ticket_price
                  const progress = (soldNumbers / raffle.total_numbers) * 100

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
                          R$ {raffle.ticket_price.toFixed(2).replace('.', ',')}
                        </p>
                      </td>
                      <td className="p-4">
                        <p className="font-semibold">{raffle.total_numbers}</p>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-semibold">{soldNumbers}</p>
                          <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden mt-1">
                            <div 
                              className="h-full bg-primary transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {progress.toFixed(1)}%
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-semibold text-primary">
                          R$ {revenue.toFixed(2).replace('.', ',')}
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
                          <Link
                            href={`/admin/raffles/${raffle.id}/edit`}
                            className="p-2 hover:bg-secondary rounded-lg transition-colors"
                            title="Editar"
                          >
                            ✏️
                          </Link>
                          <button
                            className="p-2 hover:bg-secondary rounded-lg transition-colors"
                            title="Visualizar"
                          >
                            👁️
                          </button>
                          <button
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
    </div>
  )
}