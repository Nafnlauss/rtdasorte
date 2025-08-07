import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

async function getMyTickets(userId: string) {
  const supabase = await createClient()
  
  const { data: tickets } = await supabase
    .from('raffle_numbers')
    .select(`
      *,
      raffles:raffle_id (
        id,
        title,
        description,
        image_url,
        status,
        draw_date,
        prize_description
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'paid')
    .order('created_at', { ascending: false })

  return tickets || []
}

export default async function MyTicketsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  const tickets = await getMyTickets(user.id)
  
  // Agrupar tickets por rifa
  const ticketsByRaffle = tickets.reduce((acc: any, ticket: any) => {
    const raffleId = ticket.raffles.id
    if (!acc[raffleId]) {
      acc[raffleId] = {
        raffle: ticket.raffles,
        numbers: []
      }
    }
    acc[raffleId].numbers.push(ticket.number)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container-wrapper">
        <h1 className="text-3xl md:text-4xl font-bold mb-8">Meus Títulos</h1>
        
        {Object.keys(ticketsByRaffle).length === 0 ? (
          <div className="text-center py-12 raffle-card">
            <p className="text-lg text-muted-foreground mb-4">
              Você ainda não comprou nenhum título
            </p>
            <Link
              href="/raffles"
              className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
            >
              Ver Rifas Disponíveis
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {Object.values(ticketsByRaffle).map((item: any) => (
              <div key={item.raffle.id} className="raffle-card">
                <div className="flex flex-col md:flex-row gap-6">
                  {item.raffle.image_url && (
                    <div className="w-full md:w-48 h-32 rounded-lg overflow-hidden bg-secondary">
                      <img
                        src={item.raffle.image_url}
                        alt={item.raffle.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <h2 className="text-xl font-bold mb-2">{item.raffle.title}</h2>
                    <p className="text-muted-foreground mb-4">{item.raffle.description}</p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Status:</span>
                        <span className={`text-sm font-semibold ${
                          item.raffle.status === 'active' ? 'text-green-500' :
                          item.raffle.status === 'finished' ? 'text-blue-500' :
                          'text-yellow-500'
                        }`}>
                          {item.raffle.status === 'active' ? 'Ativa' :
                           item.raffle.status === 'finished' ? 'Finalizada' :
                           'Pausada'}
                        </span>
                      </div>
                      
                      {item.raffle.draw_date && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Sorteio:</span>
                          <span className="text-sm font-semibold">
                            {new Date(item.raffle.draw_date).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Seus números:</p>
                      <div className="flex flex-wrap gap-2">
                        {item.numbers.sort((a: number, b: number) => a - b).map((number: number) => (
                          <span
                            key={number}
                            className="inline-flex items-center justify-center w-12 h-12 bg-primary text-primary-foreground rounded-lg font-bold"
                          >
                            {String(number).padStart(4, '0')}
                          </span>
                        ))}
                      </div>
                    </div>
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