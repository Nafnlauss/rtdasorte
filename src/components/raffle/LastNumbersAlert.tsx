'use client'

import { useEffect, useState } from 'react'

interface LastNumbersAlertProps {
  progressPercentage: number
  availableNumbers: number
  variant?: 'banner' | 'card' | 'inline'
}

export default function LastNumbersAlert({ 
  progressPercentage, 
  availableNumbers,
  variant = 'banner' 
}: LastNumbersAlertProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isPulsing, setIsPulsing] = useState(true)

  useEffect(() => {
    // Mostrar quando progresso >= 80%
    if (progressPercentage >= 80) {
      setIsVisible(true)
      // Pulsar por 3 segundos quando aparecer
      const timer = setTimeout(() => setIsPulsing(false), 3000)
      return () => clearTimeout(timer)
    } else {
      setIsVisible(false)
    }
  }, [progressPercentage])

  if (!isVisible) return null

  // Determinar nível de urgência
  const isUltraUrgent = progressPercentage >= 95
  const isSuperUrgent = progressPercentage >= 90
  const isUrgent = progressPercentage >= 85

  // Classes base para cada variante
  const baseClasses = {
    banner: `
      relative overflow-hidden rounded-lg p-4 mb-4
      ${isUltraUrgent ? 'bg-gradient-to-r from-red-600 to-red-500' : 
        isSuperUrgent ? 'bg-gradient-to-r from-orange-600 to-red-500' :
        isUrgent ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
        'bg-gradient-to-r from-yellow-500 to-orange-500'}
      ${isPulsing ? 'animate-pulse' : ''}
      shadow-lg border-2
      ${isUltraUrgent ? 'border-red-400' : 
        isSuperUrgent ? 'border-orange-400' :
        isUrgent ? 'border-orange-400' :
        'border-yellow-400'}
    `,
    card: `
      relative overflow-hidden rounded-lg p-3 
      ${isUltraUrgent ? 'bg-red-500' : 
        isSuperUrgent ? 'bg-orange-500' :
        isUrgent ? 'bg-orange-500' :
        'bg-yellow-500'}
      ${isPulsing ? 'animate-pulse' : ''}
    `,
    inline: `
      inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold
      ${isUltraUrgent ? 'bg-red-500' : 
        isSuperUrgent ? 'bg-orange-500' :
        isUrgent ? 'bg-orange-500' :
        'bg-yellow-500'}
      text-white shadow-md
      ${isPulsing ? 'animate-pulse' : ''}
    `
  }

  if (variant === 'inline') {
    return (
      <div className={baseClasses.inline}>
        <span className="animate-bounce">🔥</span>
        <span>
          {isUltraUrgent ? 'ÚLTIMAS UNIDADES!' : 
           isSuperUrgent ? 'QUASE ESGOTADO!' :
           'ÚLTIMOS NÚMEROS!'}
        </span>
      </div>
    )
  }

  if (variant === 'card') {
    return (
      <div className={baseClasses.card}>
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <span className="text-xl animate-bounce">⚡</span>
            <span className="font-bold text-sm">
              RESTAM {availableNumbers} NÚMEROS!
            </span>
          </div>
          <span className="text-xs opacity-90">
            {progressPercentage.toFixed(0)}% vendido
          </span>
        </div>
      </div>
    )
  }

  // Variant banner (default)
  return (
    <div className={baseClasses.banner}>
      {/* Efeito de brilho animado */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer" />
      </div>

      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Ícone animado */}
            <div className="flex-shrink-0">
              {isUltraUrgent ? (
                <span className="text-4xl animate-bounce">🚨</span>
              ) : isSuperUrgent ? (
                <span className="text-4xl animate-bounce">🔥</span>
              ) : isUrgent ? (
                <span className="text-4xl animate-bounce">⚡</span>
              ) : (
                <span className="text-4xl animate-bounce">⏰</span>
              )}
            </div>

            {/* Mensagem principal */}
            <div className="text-white">
              <div className="font-black text-lg sm:text-xl md:text-2xl uppercase tracking-wide">
                {isUltraUrgent ? (
                  <>🎯 ÚLTIMAS UNIDADES DISPONÍVEIS! 🎯</>
                ) : isSuperUrgent ? (
                  <>🔥 QUASE ESGOTADO! 🔥</>
                ) : isUrgent ? (
                  <>⚡ CORRENDO PARA O FINAL! ⚡</>
                ) : (
                  <>⏰ ÚLTIMOS NÚMEROS! ⏰</>
                )}
              </div>
              <div className="text-sm sm:text-base mt-1 font-semibold">
                Restam apenas {availableNumbers.toLocaleString('pt-BR')} números disponíveis!
              </div>
            </div>
          </div>

          {/* Badge de porcentagem */}
          <div className="flex items-center gap-2">
            <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 border-2 border-white/40">
              <span className="text-white font-black text-lg">
                {progressPercentage.toFixed(0)}%
              </span>
              <span className="text-white/90 text-xs ml-1">VENDIDO</span>
            </div>
            {isUltraUrgent && (
              <span className="animate-spin text-2xl">⚠️</span>
            )}
          </div>
        </div>

        {/* Mensagem de urgência adicional */}
        {isUltraUrgent && (
          <div className="mt-3 pt-3 border-t border-white/30">
            <p className="text-white text-center font-bold animate-pulse">
              ⚠️ ATENÇÃO: Estoque extremamente limitado! Garanta já o seu número! ⚠️
            </p>
          </div>
        )}
      </div>

      {/* Partículas animadas de fundo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/40 rounded-full animate-float"
            style={{
              left: `${20 + i * 15}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${3 + i}s`
            }}
          />
        ))}
      </div>
    </div>
  )
}