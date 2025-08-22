import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import RandomNumberSelector from '@/components/raffle/RandomNumberSelector'
import LastNumbersAlert from '@/components/raffle/LastNumbersAlert'

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
  
  // Calcular progresso
  const soldNumbers = raffle.total_numbers - (raffle.available_numbers || raffle.total_numbers)
  const realProgress = raffle.total_numbers > 0 ? (soldNumbers / raffle.total_numbers) * 100 : 0
  
  // Usar progresso manual se configurado
  const progress = raffle.progress_mode === 'manual' 
    ? (raffle.manual_progress || 0)
    : realProgress

  return (
    <div className="min-h-screen bg-background py-4 sm:py-6 md:py-8 lg:py-12">
      <div className="container-wrapper">
        {/* Alerta de últimos números - Banner Principal */}
        {progress >= 80 && (
          <LastNumbersAlert 
            progressPercentage={progress}
            availableNumbers={raffle.available_numbers || 0}
            variant="banner"
          />
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {/* Informações da Rifa */}
          <div className="space-y-4 sm:space-y-6">
            {raffle.image_url && (
              <div className="h-48 sm:h-64 md:h-80 lg:h-96 rounded-lg overflow-hidden bg-secondary">
                <img
                  src={raffle.image_url}
                  alt={raffle.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className="raffle-card p-4 sm:p-5 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2 sm:mb-3 md:mb-4">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">{raffle.title}</h1>
                {progress >= 80 && (
                  <LastNumbersAlert 
                    progressPercentage={progress}
                    availableNumbers={raffle.available_numbers || 0}
                    variant="inline"
                  />
                )}
              </div>
              <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">{raffle.description}</p>
              
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center justify-between py-2 sm:py-3 border-b border-border">
                  <span className="text-xs sm:text-sm md:text-base text-muted-foreground">Valor por número:</span>
                  <span className="text-base sm:text-lg md:text-xl font-bold text-primary">
                    R$ {(raffle.number_price || 0).toFixed(2).replace('.', ',')}
                  </span>
                </div>
                
                <div className="flex items-center justify-between py-2 sm:py-3 border-b border-border">
                  <span className="text-xs sm:text-sm md:text-base text-muted-foreground">Prêmio:</span>
                  <span className="text-xs sm:text-sm md:text-base font-semibold text-right max-w-[60%]">
                    {raffle.prize_description || raffle.title}
                  </span>
                </div>
                
                {raffle.draw_date && (
                  <div className="flex items-center justify-between py-2 sm:py-3 border-b border-border">
                    <span className="text-xs sm:text-sm md:text-base text-muted-foreground">Data do sorteio:</span>
                    <span className="text-xs sm:text-sm md:text-base font-semibold">
                      {new Date(raffle.draw_date).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )}
                
                <div className="py-2 sm:py-3 border-b border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs sm:text-sm md:text-base text-muted-foreground">Números vendidos:</span>
                    <span className="text-xs sm:text-sm md:text-base font-semibold">
                      {soldNumbers.toLocaleString('pt-BR')} de {raffle.total_numbers.toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2 sm:h-3">
                    <div 
                      className="gradient-primary h-full rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] sm:text-xs md:text-sm mt-1 sm:mt-2">
                    <span className="text-muted-foreground">{progress.toFixed(1)}% vendido</span>
                    <span className="text-primary font-semibold">
                      {(raffle.available_numbers || 0).toLocaleString('pt-BR')} disponíveis
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between py-2 sm:py-3">
                  <span className="text-xs sm:text-sm md:text-base text-muted-foreground">Status:</span>
                  <span className={`text-xs sm:text-sm md:text-base font-semibold ${
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

            {/* Como Funciona - Mobile/Tablet */}
            <div className="raffle-card p-4 sm:p-5 md:p-6 lg:hidden">
              <h2 className="text-base sm:text-lg md:text-xl font-bold mb-3 sm:mb-4">Como Funciona</h2>
              <div className="space-y-2 sm:space-y-3">
                <div className="flex gap-2 sm:gap-3">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] sm:text-xs md:text-sm font-bold">1</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm md:text-base font-semibold">Escolha a quantidade</p>
                    <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">
                      Selecione quantos números deseja comprar
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2 sm:gap-3">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] sm:text-xs md:text-sm font-bold">2</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm md:text-base font-semibold">Números aleatórios</p>
                    <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">
                      O sistema seleciona números aleatórios para você
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2 sm:gap-3">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] sm:text-xs md:text-sm font-bold">3</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm md:text-base font-semibold">Pague via PIX</p>
                    <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">
                      Pagamento instantâneo e seguro
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2 sm:gap-3">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] sm:text-xs md:text-sm font-bold">4</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm md:text-base font-semibold">Aguarde o sorteio</p>
                    <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">
                      Boa sorte! O sorteio será na data informada
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna Direita - Seletor de Números */}
          <div className="space-y-4 sm:space-y-6">
            {/* Seletor de Números */}
            <RandomNumberSelector 
              raffleId={raffle.id}
              raffleTitle={raffle.title}
              numberPrice={raffle.number_price || 0}
              totalNumbers={raffle.total_numbers}
              availableNumbers={raffle.available_numbers || 0}
              minPurchase={raffle.min_numbers || 1}
              purchaseConfig={raffle.purchase_config}
              status={raffle.status}
            />

            {/* Como Funciona - Desktop */}
            <div className="raffle-card p-4 sm:p-5 md:p-6 hidden lg:block">
              <h2 className="text-lg md:text-xl font-bold mb-4">Como Funciona</h2>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold">1</span>
                  </div>
                  <div>
                    <p className="font-semibold">Escolha a quantidade</p>
                    <p className="text-sm text-muted-foreground">
                      Selecione quantos números deseja comprar
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold">2</span>
                  </div>
                  <div>
                    <p className="font-semibold">Números aleatórios</p>
                    <p className="text-sm text-muted-foreground">
                      O sistema seleciona números aleatórios para você
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold">3</span>
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
                    <span className="text-sm font-bold">4</span>
                  </div>
                  <div>
                    <p className="font-semibold">Aguarde o sorteio</p>
                    <p className="text-sm text-muted-foreground">
                      Boa sorte! O sorteio será na data informada
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}