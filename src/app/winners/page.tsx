import { createClient } from '@/lib/supabase/server'

async function getWinners() {
  const supabase = await createClient()
  
  const { data: winners } = await supabase
    .from('winners')
    .select(`
      *,
      users:user_id (
        name,
        phone
      ),
      raffles:raffle_id (
        title,
        prize_description,
        image_url
      )
    `)
    .order('draw_date', { ascending: false })
    .limit(50)

  return winners || []
}

export default async function WinnersPage() {
  const winners = await getWinners()

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container-wrapper">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Ganhadores</h1>
          <p className="text-lg text-muted-foreground">
            Confira os sortudos que já levaram prêmios incríveis
          </p>
        </div>

        {winners.length === 0 ? (
          <div className="text-center py-12 raffle-card">
            <p className="text-lg text-muted-foreground">
              Nenhum ganhador registrado ainda
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {winners.map((winner) => (
              <div key={winner.id} className="raffle-card card-hover">
                {winner.raffles?.image_url && (
                  <div className="h-48 mb-4 rounded-lg overflow-hidden bg-secondary">
                    <img
                      src={winner.raffles.image_url}
                      alt={winner.raffles.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <div className="space-y-3">
                  <div>
                    <h3 className="font-bold text-lg">{winner.raffles?.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {winner.prize_description}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-lg">🏆</span>
                    </div>
                    <div>
                      <p className="font-semibold">{winner.users?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Número: {String(winner.winning_number).padStart(4, '0')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="pt-3 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                      Sorteado em {new Date(winner.draw_date).toLocaleDateString('pt-BR')}
                    </p>
                    <p className="text-xs text-primary font-semibold mt-1">
                      {winner.status === 'delivered' ? '✅ Prêmio entregue' :
                       winner.status === 'contacted' ? '📞 Ganhador contactado' :
                       '⏳ Aguardando contato'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}