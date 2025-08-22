import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import LastNumbersAlert from '@/components/raffle/LastNumbersAlert'

async function getRaffles() {
  const supabase = await createClient()
  
  const { data: raffles } = await supabase
    .from('raffles')
    .select('*')
    .in('status', ['active', 'paused'])
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })

  return raffles || []
}

export default async function RafflesPage() {
  const raffles = await getRaffles()

  return (
    <div className="min-h-screen bg-background py-6 sm:py-8 md:py-12">
      <div className="container-wrapper">
        <div className="text-center mb-6 sm:mb-8 md:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-4">Rifas Disponíveis</h1>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground px-4">
            Escolha sua rifa e concorra a prêmios incríveis
          </p>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-4 mb-6 sm:mb-8 justify-center px-2">
          <button className="px-3 sm:px-4 py-1.5 sm:py-2 bg-primary text-primary-foreground rounded-lg text-sm sm:text-base">
            Todas
          </button>
          <button className="px-3 sm:px-4 py-1.5 sm:py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 transition-colors text-sm sm:text-base">
            Mais Vendidas
          </button>
          <button className="px-3 sm:px-4 py-1.5 sm:py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 transition-colors text-sm sm:text-base">
            Encerrando
          </button>
          <button className="px-3 sm:px-4 py-1.5 sm:py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 transition-colors text-sm sm:text-base">
            Menor Preço
          </button>
        </div>

        {raffles.length === 0 ? (
          <div className="text-center py-8 sm:py-12 raffle-card mx-2 sm:mx-0">
            <p className="text-base sm:text-lg text-muted-foreground">
              Nenhuma rifa disponível no momento
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 px-2 sm:px-0">
            {raffles.map((raffle) => {
              const soldNumbers = raffle.total_numbers - raffle.available_numbers
              const realProgress = raffle.total_numbers > 0 
                ? Math.round((soldNumbers / raffle.total_numbers) * 100)
                : 0
              
              // Usar progresso manual se configurado
              const progressPercentage = raffle.progress_mode === 'manual' 
                ? (raffle.manual_progress || 0)
                : realProgress
              
              return (
                <Link 
                  key={raffle.id} 
                  href={`/raffles/${raffle.id}`}
                  className="raffle-card card-hover block p-4 sm:p-5 md:p-6"
                >
                  {/* Alerta de últimos números */}
                  {progressPercentage >= 80 && (
                    <LastNumbersAlert 
                      progressPercentage={progressPercentage}
                      availableNumbers={raffle.available_numbers || 0}
                      variant="card"
                    />
                  )}
                  
                  {raffle.image_url && (
                    <div className="h-40 sm:h-44 md:h-48 mb-3 sm:mb-4 rounded-lg overflow-hidden bg-secondary">
                      <img
                        src={raffle.image_url}
                        alt={raffle.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="space-y-2 sm:space-y-3">
                    <div>
                      <h3 className="font-bold text-base sm:text-lg line-clamp-1">{raffle.title}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mt-1">
                        {raffle.description}
                      </p>
                    </div>
                    
                    <div className="space-y-1.5 sm:space-y-2">
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="text-muted-foreground">Valor:</span>
                        <span className="font-bold text-primary">
                          R$ {(raffle.number_price || raffle.ticket_price || 0).toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="text-muted-foreground">Disponíveis:</span>
                        <span className="font-semibold">
                          {(raffle.available_numbers || 0).toLocaleString('pt-BR')} de {(raffle.total_numbers || 0).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      
                      {raffle.draw_date && (
                        <div className="flex items-center justify-between text-xs sm:text-sm">
                          <span className="text-muted-foreground">Sorteio:</span>
                          <span className="font-semibold">
                            {new Date(raffle.draw_date).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="space-y-1.5 sm:space-y-2">
                      <div className="w-full bg-secondary rounded-full h-1.5 sm:h-2 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-300"
                          style={{ 
                            width: `${progressPercentage}%` 
                          }}
                        />
                      </div>
                      <p className="text-[10px] sm:text-xs text-center text-muted-foreground">
                        {progressPercentage}% vendido
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-border">
                      <span className={`text-[10px] sm:text-xs font-semibold ${
                        raffle.status === 'active' ? 'text-green-500' : 'text-yellow-500'
                      }`}>
                        {raffle.status === 'active' ? '● Ativa' : '● Pausada'}
                      </span>
                      <span className="text-xs sm:text-sm font-semibold text-primary">
                        Ver Detalhes →
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}