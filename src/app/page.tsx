import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

async function getRaffles() {
  const supabase = await createClient()
  const { data: raffles } = await supabase
    .from('raffles')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(6)

  return raffles || []
}

export default async function HomePage() {
  const raffles = await getRaffles()

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20" />
        <div className="container-wrapper relative py-20">
          <div className="text-center max-w-3xl mx-auto">
            <div className="mb-8">
              <img 
                src="/logo-rt.png" 
                alt="RT da Sorte" 
                className="h-32 w-auto mx-auto object-contain drop-shadow-xl"
                style={{ maxHeight: '128px' }}
              />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              <span className="text-foreground">Prêmios Incríveis Todo Dia!</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Participe das melhores rifas online do Brasil. 
              Pagamento via PIX, sorteio pela Loteria Federal.
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/raffles"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-lg gradient-primary text-white hover:opacity-90 transition-opacity"
              >
                Ver Todas as Rifas
              </Link>
              <Link
                href="#como-funciona"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
              >
                Como Funciona
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Raffles Section */}
      <section className="py-16 bg-background">
        <div className="container-wrapper">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Rifas em Destaque</h2>
            <p className="text-lg text-muted-foreground">
              Escolha sua rifa e concorra a prêmios incríveis
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {raffles.map((raffle) => (
              <div key={raffle.id} className="raffle-card card-hover group">
                <div className="relative h-48 mb-4 rounded-lg overflow-hidden bg-secondary">
                  {raffle.image_url && (
                    <img
                      src={raffle.image_url}
                      alt={raffle.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  )}
                  <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold">
                    R$ {raffle.number_price}
                  </div>
                </div>

                <h3 className="text-xl font-bold mb-2">{raffle.title}</h3>
                <p className="text-muted-foreground mb-4 line-clamp-2">
                  {raffle.description}
                </p>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total de números</span>
                    <span className="font-semibold">{raffle.total_numbers.toLocaleString('pt-BR')}</span>
                  </div>

                  <div className="w-full bg-secondary rounded-full h-3">
                    <div 
                      className="gradient-primary h-3 rounded-full transition-all duration-500"
                      style={{ width: '30%' }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">30% vendido</span>
                    <span className="text-primary font-semibold">70% disponível</span>
                  </div>

                  <Link
                    href={`/raffles/${raffle.id}`}
                    className="w-full inline-flex items-center justify-center px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
                  >
                    Participar Agora
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {raffles.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                Nenhuma rifa disponível no momento
              </p>
            </div>
          )}

          <div className="text-center mt-12">
            <Link
              href="/raffles"
              className="inline-flex items-center justify-center px-6 py-3 border border-primary text-primary rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors font-semibold"
            >
              Ver Todas as Rifas →
            </Link>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="como-funciona" className="py-16 bg-card">
        <div className="container-wrapper">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Como Funciona</h2>
            <p className="text-lg text-muted-foreground">
              Simples, rápido e seguro
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-3xl">🎯</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">1. Escolha sua Rifa</h3>
              <p className="text-muted-foreground">
                Navegue pelas rifas disponíveis e escolha a que mais te interessa
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-3xl">💳</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">2. Faça o Pagamento</h3>
              <p className="text-muted-foreground">
                Selecione seus números e pague via PIX. Confirmação instantânea
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-3xl">🏆</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">3. Aguarde o Sorteio</h3>
              <p className="text-muted-foreground">
                Sorteio pela Loteria Federal. Ganhadores notificados automaticamente
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-background">
        <div className="container-wrapper">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Por que escolher nossa plataforma?
              </h2>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                    <span className="text-xl">✅</span>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">100% Seguro e Confiável</h3>
                    <p className="text-muted-foreground">
                      Sorteios pela Loteria Federal com total transparência
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                    <span className="text-xl">⚡</span>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Pagamento Instantâneo</h3>
                    <p className="text-muted-foreground">
                      PIX com confirmação automática em segundos
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                    <span className="text-xl">🎁</span>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Prêmios Instantâneos</h3>
                    <p className="text-muted-foreground">
                      Além do prêmio principal, concorra a prêmios instantâneos
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                    <span className="text-xl">📱</span>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Acesso Mobile</h3>
                    <p className="text-muted-foreground">
                      Participe de qualquer lugar pelo celular
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="raffle-card">
                <div className="text-center py-12">
                  <div className="text-5xl font-bold text-primary mb-2">100%</div>
                  <div className="text-xl font-semibold mb-2">Transparente</div>
                  <p className="text-muted-foreground">
                    Todos os sorteios são realizados pela Loteria Federal
                  </p>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-accent/20 rounded-full blur-3xl" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary/20 via-primary/10 to-accent/20">
        <div className="container-wrapper text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Pronto para começar?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Cadastre-se agora e participe das melhores rifas online do Brasil
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-lg gradient-primary text-white hover:opacity-90 transition-opacity"
            >
              Criar Conta Grátis
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-lg bg-card text-card-foreground hover:bg-card/80 transition-colors"
            >
              Já tenho conta
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}