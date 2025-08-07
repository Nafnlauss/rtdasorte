'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { useCartStore } from '@/stores/useCartStore'
import { useRouter } from 'next/navigation'

export default function CartSidebar() {
  const router = useRouter()
  const sidebarRef = useRef<HTMLDivElement>(null)
  const { 
    items, 
    isOpen, 
    removeItem, 
    clearExpired,
    getTotalPrice,
    setIsOpen 
  } = useCartStore()

  // Limpar itens expirados ao montar o componente
  useEffect(() => {
    clearExpired()
    const interval = setInterval(clearExpired, 60000) // Verificar a cada minuto
    return () => clearInterval(interval)
  }, [clearExpired])

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        const cartButton = document.getElementById('cart-button')
        if (cartButton && !cartButton.contains(event.target as Node)) {
          setIsOpen(false)
        }
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, setIsOpen])

  const formatTimeRemaining = (expiresAt?: Date) => {
    if (!expiresAt) return ''
    
    const now = new Date()
    const expires = new Date(expiresAt)
    const diff = expires.getTime() - now.getTime()
    
    if (diff <= 0) return 'Expirado'
    
    const minutes = Math.floor(diff / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handleCheckout = () => {
    setIsOpen(false)
    router.push('/checkout')
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`fixed top-0 right-0 h-full w-96 bg-card border-l border-border z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-xl font-bold">Carrinho</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto p-4">
            {items.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                  <span className="text-3xl">🛒</span>
                </div>
                <p className="text-muted-foreground mb-4">Seu carrinho está vazio</p>
                <Link
                  href="/raffles"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Ver Rifas
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.raffleId} className="raffle-card">
                    <div className="flex gap-3">
                      {item.raffleImage && (
                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                          <img
                            src={item.raffleImage}
                            alt={item.raffleTitle}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-sm">{item.raffleTitle}</h3>
                            <p className="text-xs text-muted-foreground mt-1">
                              {item.numbers.length} número(s)
                            </p>
                          </div>
                          <button
                            onClick={() => removeItem(item.raffleId)}
                            className="p-1 hover:bg-secondary rounded transition-colors"
                          >
                            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                        
                        {/* Números selecionados */}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.numbers.slice(0, 5).map((num) => (
                            <span
                              key={num}
                              className="inline-flex items-center justify-center w-10 h-6 bg-primary/20 text-primary text-xs font-semibold rounded"
                            >
                              {String(num).padStart(4, '0')}
                            </span>
                          ))}
                          {item.numbers.length > 5 && (
                            <span className="inline-flex items-center px-2 h-6 text-xs text-muted-foreground">
                              +{item.numbers.length - 5} mais
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between mt-3">
                          <p className="text-sm font-semibold">
                            R$ {item.totalPrice.toFixed(2).replace('.', ',')}
                          </p>
                          {item.expiresAt && (
                            <p className="text-xs text-yellow-500">
                              ⏱️ {formatTimeRemaining(item.expiresAt)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t border-border p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">Total:</span>
                <span className="text-xl font-bold text-primary">
                  R$ {getTotalPrice().toFixed(2).replace('.', ',')}
                </span>
              </div>
              
              <button
                onClick={handleCheckout}
                className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                Finalizar Compra
              </button>
              
              <p className="text-xs text-center text-muted-foreground">
                Pagamento seguro via PIX
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}