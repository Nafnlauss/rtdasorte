'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/stores/useCartStore'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/useAuthStore'

export default function CheckoutPage() {
  const router = useRouter()
  const supabase = createClient()
  const { user } = useAuthStore()
  const { items, getTotalPrice, clearCart } = useCartStore()
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (items.length === 0) {
      router.push('/raffles')
    }
  }, [items, router])

  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/checkout')
    } else {
      // Garantir que temos os dados mais recentes do usuário
      loadUserData()
    }
  }, [])
  
  const loadUserData = async () => {
    if (!user?.id) return
    
    const { data: updatedUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (updatedUser) {
      console.log('Updated user data:', updatedUser)
      useAuthStore.getState().setUser(updatedUser)
    }
  }

  const handlePayment = async () => {
    if (!user) {
      router.push('/login?redirect=/checkout')
      return
    }

    console.log('User data from store:', user)
    
    if (!user.cpf || !user.phone) {
      alert('Por favor, complete seu cadastro com CPF e telefone antes de continuar.')
      router.push('/profile')
      return
    }

    setIsProcessing(true)

    try {
      // Preparar dados para cada rifa
      for (const item of items) {
        // Limpar CPF e telefone
        const cleanCpf = user.cpf.replace(/\D/g, '')
        const cleanPhone = user.phone.replace(/\D/g, '')
        
        console.log('Sending payment request:', {
          raffleId: item.raffleId,
          numbers: item.numbers,
          customer: {
            name: user.name,
            cpf: cleanCpf,
            email: user.email,
            phone: cleanPhone
          }
        })
        
        const response = await fetch('/api/checkout/create-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            raffleId: item.raffleId,
            numbers: item.numbers,
            customer: {
              name: user.name,
              cpf: cleanCpf,
              email: user.email,
              phone: cleanPhone
            }
          })
        })

        const data = await response.json()
        
        if (!response.ok) {
          console.error('Payment error:', data)
          
          // Mensagens de erro mais específicas
          if (data.details) {
            if (Array.isArray(data.details)) {
              const fieldErrors = data.details.map((err: any) => 
                `${err.path?.join('.')}: ${err.message}`
              ).join('\n')
              throw new Error(`Erro de validação:\n${fieldErrors}`)
            } else {
              throw new Error(data.details)
            }
          }
          throw new Error(data.error || 'Erro ao criar pagamento')
        }
        
        console.log('Payment created:', data)
        
        // Salvar dados do PIX temporariamente no localStorage
        if (data.payment?.pix_code) {
          localStorage.setItem(`pix_${data.transaction.id}`, JSON.stringify({
            pix_code: data.payment.pix_code,
            pix_qrcode: data.payment.pix_qrcode,
            expires_at: data.payment.expires_at,
            amount: data.payment.amount
          }))
        }
        
        // Redirecionar para página de pagamento SEM limpar carrinho ainda
        // O carrinho será limpo após confirmação do pagamento
        router.push(data.redirect_url)
        return
      }
      
    } catch (error) {
      console.error('Erro ao processar pagamento:', error)
      alert(error instanceof Error ? error.message : 'Erro ao processar pagamento. Tente novamente.')
    } finally {
      setIsProcessing(false)
    }
  }

  const totalPrice = getTotalPrice()

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container-wrapper max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Finalizar Compra</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Itens do Carrinho */}
          <div className="lg:col-span-2 space-y-4">
            <div className="raffle-card">
              <h2 className="text-xl font-bold mb-4">Seus Números</h2>
              
              {items.map((item) => (
                <div key={item.raffleId} className="pb-4 mb-4 border-b border-border last:border-0">
                  <div className="flex gap-4">
                    {item.raffleImage && (
                      <div className="w-24 h-24 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                        <img
                          src={item.raffleImage}
                          alt={item.raffleTitle}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <h3 className="font-bold mb-2">{item.raffleTitle}</h3>
                      
                      <div className="flex flex-wrap gap-1 mb-3">
                        {item.numbers.map((num) => (
                          <span
                            key={num}
                            className="inline-flex items-center justify-center w-12 h-8 bg-primary/20 text-primary text-sm font-semibold rounded"
                          >
                            {String(num).padStart(4, '0')}
                          </span>
                        ))}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          {item.numbers.length} número(s) × R$ {item.pricePerNumber.toFixed(2).replace('.', ',')}
                        </p>
                        <p className="font-semibold">
                          R$ {item.totalPrice.toFixed(2).replace('.', ',')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Informações do Cliente */}
            {user && (
              <div className="raffle-card">
                <h2 className="text-xl font-bold mb-4">Seus Dados</h2>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Nome</p>
                    <p className="font-semibold">{user.name}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-semibold">{user.email}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Telefone</p>
                    <p className="font-semibold">{user.phone || 'Não informado'}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">CPF</p>
                    <p className="font-semibold">{user.cpf || 'Não informado'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Resumo do Pedido */}
          <div className="lg:col-span-1">
            <div className="raffle-card sticky top-24">
              <h2 className="text-xl font-bold mb-4">Resumo</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span>R$ {totalPrice.toFixed(2).replace('.', ',')}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taxa de serviço:</span>
                  <span>R$ 0,00</span>
                </div>
                
                <div className="pt-3 border-t border-border">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold">Total:</span>
                    <span className="text-xl font-bold text-primary">
                      R$ {totalPrice.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handlePayment}
                disabled={isProcessing || items.length === 0}
                className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processando...' : 'Pagar com PIX'}
              </button>

              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>🔒</span>
                  <span>Pagamento seguro via PIX</span>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>⏱️</span>
                  <span>Confirmação instantânea</span>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>📱</span>
                  <span>QR Code ou copia e cola</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}