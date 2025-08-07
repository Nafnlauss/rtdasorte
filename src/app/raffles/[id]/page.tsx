import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

async function getRaffle(id: string) {
  const supabase = await createClient()
  
  const { data: raffle } = await supabase
    .from('raffles')
    .select('*')
    .eq('id', id)
    .single()

  if (!raffle) {
    notFound()
  }

  return raffle
}

export default async function RafflePage({ params }: { params: { id: string } }) {
  const raffle = await getRaffle(params.id)

  // Criar grid de números disponíveis (simplificado)
  const numbers = Array.from({ length: raffle.total_numbers }, (_, i) => i + 1)

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container-wrapper">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Informações da Rifa */}
          <div className="space-y-6">
            {raffle.image_url && (
              <div className="h-96 rounded-lg overflow-hidden bg-secondary">
                <img
                  src={raffle.image_url}
                  alt={raffle.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className="raffle-card">
              <h1 className="text-2xl md:text-3xl font-bold mb-4">{raffle.title}</h1>
              <p className="text-muted-foreground mb-6">{raffle.description}</p>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <span className="text-muted-foreground">Valor por número:</span>
                  <span className="text-xl font-bold text-primary">
                    R$ {raffle.ticket_price.toFixed(2).replace('.', ',')}
                  </span>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <span className="text-muted-foreground">Prêmio:</span>
                  <span className="font-semibold">{raffle.prize_description}</span>
                </div>
                
                {raffle.draw_date && (
                  <div className="flex items-center justify-between py-3 border-b border-border">
                    <span className="text-muted-foreground">Data do sorteio:</span>
                    <span className="font-semibold">
                      {new Date(raffle.draw_date).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <span className="text-muted-foreground">Números disponíveis:</span>
                  <span className="font-semibold">
                    {raffle.available_numbers} de {raffle.total_numbers}
                  </span>
                </div>
                
                <div className="flex items-center justify-between py-3">
                  <span className="text-muted-foreground">Status:</span>
                  <span className={`font-semibold ${
                    raffle.status === 'active' ? 'text-green-500' : 
                    raffle.status === 'finished' ? 'text-blue-500' : 
                    'text-yellow-500'
                  }`}>
                    {raffle.status === 'active' ? '● Ativa' :
                     raffle.status === 'finished' ? '● Finalizada' :
                     '● Pausada'}
                  </span>
                </div>
              </div>
            </div>

            {/* Como Funciona */}
            <div className="raffle-card">
              <h2 className="text-xl font-bold mb-4">Como Funciona</h2>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold">1</span>
                  </div>
                  <div>
                    <p className="font-semibold">Escolha seus números</p>
                    <p className="text-sm text-muted-foreground">
                      Selecione quantos números desejar
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold">2</span>
                  </div>
                  <div>
                    <p className="font-semibold">Pague via PIX</p>
                    <p className="text-sm text-muted-foreground">
                      Pagamento instantâneo e seguro
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold">3</span>
                  </div>
                  <div>
                    <p className="font-semibold">Aguarde o sorteio</p>
                    <p className="text-sm text-muted-foreground">
                      Baseado na Loteria Federal
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Seleção de Números */}
          <div className="space-y-6">
            <div className="raffle-card sticky top-24">
              <h2 className="text-xl font-bold mb-4">Escolha seus números</h2>
              
              {/* Legenda */}
              <div className="flex gap-4 mb-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-secondary rounded" />
                  <span className="text-muted-foreground">Disponível</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-primary rounded" />
                  <span className="text-muted-foreground">Selecionado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500/20 rounded" />
                  <span className="text-muted-foreground">Vendido</span>
                </div>
              </div>
              
              {/* Grid de Números (versão simplificada) */}
              <div className="grid grid-cols-10 gap-1 mb-6 max-h-96 overflow-y-auto">
                {numbers.map((number) => {
                  const isAvailable = Math.random() > 0.3 // Simulação
                  return (
                    <button
                      key={number}
                      disabled={!isAvailable || raffle.status !== 'active'}
                      className={`
                        aspect-square flex items-center justify-center text-xs font-semibold rounded transition-colors
                        ${isAvailable 
                          ? 'bg-secondary hover:bg-primary hover:text-primary-foreground cursor-pointer' 
                          : 'bg-red-500/20 cursor-not-allowed text-muted-foreground'
                        }
                        ${raffle.status !== 'active' ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                    >
                      {String(number).padStart(4, '0')}
                    </button>
                  )
                })}
              </div>
              
              {/* Carrinho */}
              <div className="space-y-4">
                <div className="p-4 bg-secondary rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Números selecionados:</span>
                    <span className="font-semibold">0</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total:</span>
                    <span className="text-xl font-bold text-primary">R$ 0,00</span>
                  </div>
                </div>
                
                <button 
                  disabled={raffle.status !== 'active'}
                  className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {raffle.status === 'active' ? 'Finalizar Compra' : 'Rifa Indisponível'}
                </button>
                
                <p className="text-xs text-center text-muted-foreground">
                  Pagamento seguro via PIX
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}