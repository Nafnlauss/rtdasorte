'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/stores/useCartStore'

interface QuickButton {
  quantity: number
  label: string
  popular?: boolean
}

interface PurchaseConfig {
  min_purchase: number
  quick_buttons: QuickButton[]
}

interface RandomNumberSelectorProps {
  raffleId: string
  raffleTitle: string
  numberPrice: number
  totalNumbers: number
  availableNumbers: number
  minPurchase?: number
  purchaseConfig?: PurchaseConfig
  status: string
}

export default function RandomNumberSelector({
  raffleId,
  raffleTitle,
  numberPrice,
  totalNumbers,
  availableNumbers,
  minPurchase = 1,
  purchaseConfig,
  status
}: RandomNumberSelectorProps) {
  const router = useRouter()
  const [quantity, setQuantity] = useState(purchaseConfig?.min_purchase || minPurchase)
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([])
  
  // Estados para aceleração dos botões +/-
  const [isPressingMinus, setIsPressingMinus] = useState(false)
  const [isPressingPlus, setIsPressingPlus] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const speedRef = useRef<number>(200) // Velocidade inicial
  
  const quickButtons = purchaseConfig?.quick_buttons || [
    { quantity: 100, label: '+100', popular: false },
    { quantity: 250, label: '+250', popular: true },
    { quantity: 500, label: '+500', popular: false },
    { quantity: 750, label: '+750', popular: false },
    { quantity: 1000, label: '+1000', popular: false },
    { quantity: 1500, label: '+1500', popular: false }
  ]
  
  const totalPrice = quantity * numberPrice

  // Função para atualizar quantidade
  const updateQuantity = (newValue: number) => {
    const min = purchaseConfig?.min_purchase || minPurchase
    const max = Math.min(availableNumbers, 10000) // Máximo de 10000 ou números disponíveis
    const finalValue = Math.max(min, Math.min(max, newValue))
    setQuantity(finalValue)
  }

  // Funções para aceleração ao segurar pressionado
  const startAcceleration = (direction: 'minus' | 'plus') => {
    if (direction === 'minus') {
      setIsPressingMinus(true)
      updateQuantity(quantity - 1)
    } else {
      setIsPressingPlus(true)
      updateQuantity(quantity + 1)
    }
    
    speedRef.current = 200
    let accelerationCount = 0
    
    intervalRef.current = setInterval(() => {
      if (direction === 'minus') {
        setQuantity(prev => {
          const min = purchaseConfig?.min_purchase || minPurchase
          return Math.max(min, prev - 1)
        })
      } else {
        setQuantity(prev => {
          const max = Math.min(availableNumbers, 10000)
          return Math.min(max, prev + 1)
        })
      }
      
      // Acelerar após alguns intervalos
      accelerationCount++
      if (accelerationCount > 5 && speedRef.current > 50) {
        clearInterval(intervalRef.current!)
        speedRef.current = Math.max(50, speedRef.current - 50)
        
        intervalRef.current = setInterval(() => {
          if (direction === 'minus') {
            setQuantity(prev => {
              const min = purchaseConfig?.min_purchase || minPurchase
              return Math.max(min, prev - (accelerationCount > 10 ? 10 : 1))
            })
          } else {
            setQuantity(prev => {
              const max = Math.min(availableNumbers, 10000)
              return Math.min(max, prev + (accelerationCount > 10 ? 10 : 1))
            })
          }
        }, speedRef.current)
      }
    }, speedRef.current)
  }
  
  const stopAcceleration = () => {
    setIsPressingMinus(false)
    setIsPressingPlus(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    speedRef.current = 200
  }
  
  // Limpar intervalo ao desmontar componente
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const handleSelectNumbers = async () => {
    if (quantity <= 0 || quantity > availableNumbers) return
    
    setIsSelecting(true)
    
    try {
      // Simular seleção aleatória
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Gerar números aleatórios únicos
      const numbers: number[] = []
      const usedNumbers = new Set()
      
      while (numbers.length < quantity) {
        const num = Math.floor(Math.random() * totalNumbers) + 1
        if (!usedNumbers.has(num)) {
          usedNumbers.add(num)
          numbers.push(num)
        }
      }
      
      setSelectedNumbers(numbers.sort((a, b) => a - b))
    } catch (error) {
      console.error('Erro ao selecionar números:', error)
    } finally {
      setIsSelecting(false)
    }
  }
  
  const addToCart = useCartStore((state) => state.addItem)
  
  const handleCheckout = () => {
    if (selectedNumbers.length === 0) return
    
    // Adicionar ao carrinho
    addToCart({
      raffleId,
      raffleTitle,
      numbers: selectedNumbers,
      pricePerNumber: numberPrice,
      totalPrice: selectedNumbers.length * numberPrice
    })
    
    // Redirecionar para checkout
    router.push('/checkout')
  }
  
  const formatNumber = (num: number) => {
    return num.toString().padStart(totalNumbers.toString().length, '0')
  }
  
  if (status !== 'active') {
    return (
      <div className="raffle-card">
        <div className="text-center py-8">
          <span className="text-4xl mb-4 block">🔒</span>
          <h3 className="text-xl font-bold mb-2">Rifa {status === 'finished' ? 'Finalizada' : 'Pausada'}</h3>
          <p className="text-muted-foreground">
            {status === 'finished' 
              ? 'Esta rifa já foi finalizada.'
              : 'Esta rifa está temporariamente pausada.'}
          </p>
        </div>
      </div>
    )
  }
  
  if (availableNumbers === 0) {
    return (
      <div className="raffle-card">
        <div className="text-center py-8">
          <span className="text-4xl mb-4 block">😔</span>
          <h3 className="text-xl font-bold mb-2">Esgotado!</h3>
          <p className="text-muted-foreground">
            Todos os números desta rifa já foram vendidos.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="raffle-card space-y-6">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <span className="text-2xl">🎯</span>
        Escolha sua Quantidade
      </h2>
      
      {/* Botões de Seleção Rápida */}
      <div>
        <p className="text-sm text-muted-foreground mb-3">Adicione mais números:</p>
        <div className="grid grid-cols-3 gap-2">
          {quickButtons.map((button, index) => (
            <button
              key={index}
              onClick={() => updateQuantity(quantity + button.quantity)}
              disabled={quantity + button.quantity > availableNumbers}
              className={`
                py-2.5 px-3 rounded-lg font-bold text-sm transition-all
                ${button.popular 
                  ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg hover:shadow-xl transform hover:scale-105' 
                  : 'bg-secondary hover:bg-secondary/80'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              {button.label}
              {button.popular && <span className="ml-1">🔥</span>}
            </button>
          ))}
        </div>
      </div>
      
      {/* Controle Manual */}
      <div>
        <p className="text-sm text-muted-foreground mb-3">Ajuste fino:</p>
        <div className="flex items-center gap-3">
          <button
            onMouseDown={() => startAcceleration('minus')}
            onMouseUp={stopAcceleration}
            onMouseLeave={stopAcceleration}
            onTouchStart={() => startAcceleration('minus')}
            onTouchEnd={stopAcceleration}
            disabled={quantity <= (purchaseConfig?.min_purchase || minPurchase)}
            className={`
              w-12 h-12 rounded-lg font-bold text-xl transition-all
              ${isPressingMinus 
                ? 'bg-primary text-primary-foreground scale-95' 
                : 'bg-secondary hover:bg-secondary/80'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            -
          </button>
          
          <div className="flex-1 max-w-[150px]">
            <input
              type="number"
              value={quantity}
              onChange={(e) => updateQuantity(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2.5 rounded-lg bg-secondary border-2 border-border text-center font-bold text-lg focus:border-primary focus:outline-none transition-colors"
            />
          </div>
          
          <button
            onMouseDown={() => startAcceleration('plus')}
            onMouseUp={stopAcceleration}
            onMouseLeave={stopAcceleration}
            onTouchStart={() => startAcceleration('plus')}
            onTouchEnd={stopAcceleration}
            disabled={quantity >= availableNumbers}
            className={`
              w-12 h-12 rounded-lg font-bold text-xl transition-all
              ${isPressingPlus 
                ? 'bg-primary text-primary-foreground scale-95' 
                : 'bg-secondary hover:bg-secondary/80'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            +
          </button>
        </div>
        
        <div className="mt-2 text-xs text-muted-foreground text-center">
          Mínimo: {purchaseConfig?.min_purchase || minPurchase} | 
          Disponíveis: {availableNumbers.toLocaleString('pt-BR')}
        </div>
        
        {(isPressingMinus || isPressingPlus) && (
          <p className="text-xs text-primary text-center mt-1 animate-pulse">
            Segure para acelerar!
          </p>
        )}
      </div>
      
      {/* Resumo do Valor */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-4 border border-primary/30">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-muted-foreground">Quantidade:</span>
          <span className="font-bold">{quantity} números</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-muted-foreground">Valor unitário:</span>
          <span className="font-bold">R$ {numberPrice.toFixed(2).replace('.', ',')}</span>
        </div>
        <div className="border-t border-border pt-2 mt-2">
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold">Total:</span>
            <span className="text-2xl font-bold text-primary">
              R$ {totalPrice.toFixed(2).replace('.', ',')}
            </span>
          </div>
        </div>
      </div>
      
      {/* Botão de Seleção */}
      <button
        onClick={handleSelectNumbers}
        disabled={isSelecting || quantity <= 0}
        className="w-full py-4 bg-gradient-to-r from-primary to-accent text-white rounded-lg font-bold text-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
      >
        {isSelecting ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Selecionando seus números...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            🎲 Gerar Números Aleatórios
          </span>
        )}
      </button>
      
      {/* Números Selecionados */}
      {selectedNumbers.length > 0 && (
        <div className="bg-primary/10 rounded-lg p-4 border border-primary/30">
          <h3 className="font-bold mb-3 text-center flex items-center justify-center gap-2">
            <span className="text-xl">🎉</span>
            Seus Números da Sorte
          </h3>
          
          <div className="max-h-[200px] overflow-y-auto mb-4 p-2 bg-background rounded-lg">
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
              {selectedNumbers.map((num, index) => (
                <div
                  key={index}
                  className="bg-primary text-primary-foreground rounded-lg aspect-square flex items-center justify-center font-mono font-bold text-xs sm:text-sm animate-bounce"
                  style={{ animationDelay: `${index * 50}ms`, animationDuration: '0.5s' }}
                >
                  {formatNumber(num)}
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleSelectNumbers}
              className="flex-1 py-2.5 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors font-semibold"
            >
              🔄 Novos Números
            </button>
            <button
              onClick={handleCheckout}
              className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
            >
              ✅ Finalizar Compra
            </button>
          </div>
        </div>
      )}
    </div>
  )
}