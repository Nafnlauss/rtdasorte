'use client'

import { useAuthStore } from '@/stores/useAuthStore'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user)
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Meu Painel</h1>
          <p className="text-muted-foreground">Olá, {user.name}! Bem-vindo ao seu painel.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card Minhas Rifas */}
          <Link href="/my-raffles" className="raffle-card hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <span className="text-4xl">🎫</span>
              <span className="text-sm text-muted-foreground">Ver todas →</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Minhas Rifas</h3>
            <p className="text-muted-foreground">Veja todas as rifas que você está participando</p>
          </Link>

          {/* Card Transações */}
          <Link href="/transactions" className="raffle-card hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <span className="text-4xl">💳</span>
              <span className="text-sm text-muted-foreground">Ver todas →</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Transações</h3>
            <p className="text-muted-foreground">Histórico de pagamentos e compras</p>
          </Link>

          {/* Card Perfil */}
          <Link href="/profile" className="raffle-card hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <span className="text-4xl">👤</span>
              <span className="text-sm text-muted-foreground">Editar →</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Meu Perfil</h3>
            <p className="text-muted-foreground">Gerencie suas informações pessoais</p>
          </Link>

          {/* Card Rifas Ativas */}
          <Link href="/raffles" className="raffle-card hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <span className="text-4xl">🎲</span>
              <span className="text-sm text-muted-foreground">Explorar →</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Rifas Ativas</h3>
            <p className="text-muted-foreground">Explore todas as rifas disponíveis</p>
          </Link>

          {/* Card Ganhadores */}
          <Link href="/winners" className="raffle-card hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <span className="text-4xl">🏆</span>
              <span className="text-sm text-muted-foreground">Ver todos →</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Ganhadores</h3>
            <p className="text-muted-foreground">Veja os últimos ganhadores</p>
          </Link>

          {/* Card Suporte */}
          <Link href="/support" className="raffle-card hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <span className="text-4xl">💬</span>
              <span className="text-sm text-muted-foreground">Contatar →</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Suporte</h3>
            <p className="text-muted-foreground">Precisa de ajuda? Fale conosco</p>
          </Link>
        </div>

        {/* Estatísticas Rápidas */}
        <div className="mt-8 p-6 raffle-card bg-gradient-to-r from-primary/10 to-accent/10">
          <h2 className="text-xl font-bold mb-4">📊 Resumo Rápido</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Rifas Ativas</p>
              <p className="text-2xl font-bold">0</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Números Comprados</p>
              <p className="text-2xl font-bold">0</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Gasto</p>
              <p className="text-2xl font-bold">R$ 0,00</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Prêmios Ganhos</p>
              <p className="text-2xl font-bold">0</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}