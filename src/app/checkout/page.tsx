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
  const [pixCode, setPixCode] = useState('')
  const [showPix, setShowPix] = useState(false)

  useEffect(() => {
    if (items.length === 0) {
      router.push('/raffles')
    }
  }, [items, router])

  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/checkout')
    }
  }, [user, router])

  const handlePayment = async () => {
    if (!user) {
      router.push('/login?redirect=/checkout')
      return
    }

    setIsProcessing(true)

    try {
      // Aqui você implementaria a integração real com o gateway de pagamento PIX
      // Por enquanto, vamos simular
      
      // Gerar código PIX simulado
      const code = `00020126330014BR.GOV.BCB.PIX0111${Date.now()}520400005303986540${getTotalPrice().toFixed(2)}5802BR5925RIFAS ONLINE6009SAO PAULO62070503***63041D3D`
      
      setPixCode(code)
      setShowPix(true)

      // Salvar pedido no banco (implementar depois)
      
    } catch (error) {
      console.error('Erro ao processar pagamento:', error)
      alert('Erro ao processar pagamento. Tente novamente.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixCode)
    alert('Código PIX copiado!')
  }

  const totalPrice = getTotalPrice()

  if (showPix) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="container-wrapper max-w-2xl">
          <div className="raffle-card">
            <div className="text-center mb-6">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-3xl">📱</span>
              </div>
              <h1 className="text-2xl font-bold mb-2">Pagamento via PIX</h1>
              <p className="text-muted-foreground">
                Escaneie o QR Code ou copie o código para pagar
              </p>
            </div>

            {/* QR Code Placeholder */}
            <div className="bg-white p-8 rounded-lg mb-6">
              <div className="w-64 h-64 mx-auto bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500">QR Code PIX</span>
              </div>
            </div>

            {/* Código PIX */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Código PIX</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={pixCode}
                    readOnly
                    className="flex-1 px-4 py-2 rounded-lg bg-secondary border border-border text-sm"
                  />
                  <button
                    onClick={handleCopyPix}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Copiar
                  </button>
                </div>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500 rounded-lg p-4">
                <p className="text-yellow-500 text-sm">
                  ⏱️ Você tem 10 minutos para realizar o pagamento
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <span className="text-lg">Total a pagar:</span>
                <span className="text-2xl font-bold text-primary">
                  R$ {totalPrice.toFixed(2).replace('.', ',')}
                </span>
              </div>

              <button
                onClick={() => {
                  clearCart()
                  router.push('/my-tickets')
                }}
                className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                Já fiz o pagamento
              </button>

              <button
                onClick={() => {
                  setShowPix(false)
                }}
                className="w-full py-3 text-foreground hover:bg-secondary rounded-lg transition-colors"
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

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