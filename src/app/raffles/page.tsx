import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

async function getRaffles() {
  const supabase = await createClient()
  
  const { data: raffles } = await supabase
    .from('raffles')
    .select('*')
    .in('status', ['active', 'paused'])
    .order('created_at', { ascending: false })

  return raffles || []
}

export default async function RafflesPage() {
  const raffles = await getRaffles()

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container-wrapper">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Rifas Disponíveis</h1>
          <p className="text-lg text-muted-foreground">
            Escolha sua rifa e concorra a prêmios incríveis
          </p>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-4 mb-8 justify-center">
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg">
            Todas
          </button>
          <button className="px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 transition-colors">
            Mais Vendidas
          </button>
          <button className="px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 transition-colors">
            Encerrando em Breve
          </button>
          <button className="px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 transition-colors">
            Menor Preço
          </button>
        </div>

        {raffles.length === 0 ? (
          <div className="text-center py-12 raffle-card">
            <p className="text-lg text-muted-foreground">
              Nenhuma rifa disponível no momento
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {raffles.map((raffle) => (
              <Link 
                key={raffle.id} 
                href={`/raffles/${raffle.id}`}
                className="raffle-card card-hover block"
              >
                {raffle.image_url && (
                  <div className="h-48 mb-4 rounded-lg overflow-hidden bg-secondary">
                    <img
                      src={raffle.image_url}
                      alt={raffle.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <div className="space-y-3">
                  <div>
                    <h3 className="font-bold text-lg">{raffle.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {raffle.description}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Valor:</span>
                      <span className="font-bold text-primary">
                        R$ {raffle.ticket_price.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Números:</span>
                      <span className="font-semibold">
                        {raffle.available_numbers}/{raffle.total_numbers}
                      </span>
                    </div>
                    
                    {raffle.draw_date && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Sorteio:</span>
                        <span className="font-semibold">
                          {new Date(raffle.draw_date).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-300"
                        style={{ 
                          width: `${((raffle.total_numbers - raffle.available_numbers) / raffle.total_numbers) * 100}%` 
                        }}
                      />
                    </div>
                    <p className="text-xs text-center text-muted-foreground">
                      {Math.round(((raffle.total_numbers - raffle.available_numbers) / raffle.total_numbers) * 100)}% vendido
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <span className={`text-xs font-semibold ${
                      raffle.status === 'active' ? 'text-green-500' : 'text-yellow-500'
                    }`}>
                      {raffle.status === 'active' ? '● Ativa' : '● Pausada'}
                    </span>
                    <span className="text-sm font-semibold text-primary">
                      Ver Detalhes →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}