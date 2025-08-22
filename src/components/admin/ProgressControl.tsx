'use client'

import { useState, useEffect } from 'react'

interface ProgressControlProps {
  totalNumbers: number
  soldNumbers: number
  showProgressBar: boolean
  progressOverride: boolean
  manualProgress: number
  onChange: (data: {
    showProgressBar: boolean
    progressOverride: boolean
    manualProgress: number
  }) => void
}

export default function ProgressControl({
  totalNumbers,
  soldNumbers,
  showProgressBar,
  progressOverride,
  manualProgress,
  onChange
}: ProgressControlProps) {
  const [localData, setLocalData] = useState({
    showProgressBar,
    progressOverride,
    manualProgress
  })

  const realProgress = totalNumbers > 0 ? (soldNumbers / totalNumbers) * 100 : 0
  const displayProgress = localData.progressOverride ? localData.manualProgress : realProgress

  useEffect(() => {
    onChange(localData)
  }, [localData])

  return (
    <div className="raffle-card bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <span className="text-2xl">📊</span>
        Controle da Barra de Progresso
      </h3>

      {/* Exibir/Ocultar Barra */}
      <div className="space-y-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={localData.showProgressBar}
            onChange={(e) => setLocalData({ ...localData, showProgressBar: e.target.checked })}
            className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
          />
          <div>
            <span className="font-semibold">Exibir barra de progresso</span>
            <p className="text-xs text-muted-foreground">
              Mostra a barra de progresso na página pública da rifa
            </p>
          </div>
        </label>

        {localData.showProgressBar && (
          <>
            {/* Controle Manual */}
            <div className="pt-4 border-t border-border">
              <label className="flex items-center gap-3 cursor-pointer mb-4">
                <input
                  type="checkbox"
                  checked={localData.progressOverride}
                  onChange={(e) => setLocalData({ ...localData, progressOverride: e.target.checked })}
                  className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                />
                <div>
                  <span className="font-semibold">Controle manual do progresso</span>
                  <p className="text-xs text-muted-foreground">
                    Permite definir manualmente o valor da barra ao invés de usar o progresso real
                  </p>
                </div>
              </label>

              {/* Estatísticas Reais */}
              <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-background rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Progresso Real</p>
                  <p className="text-lg font-bold">{realProgress.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">
                    {soldNumbers.toLocaleString('pt-BR')} de {totalNumbers.toLocaleString('pt-BR')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Números Disponíveis</p>
                  <p className="text-lg font-bold">
                    {(totalNumbers - soldNumbers).toLocaleString('pt-BR')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(100 - realProgress).toFixed(1)}% restante
                  </p>
                </div>
              </div>

              {/* Slider de Controle Manual */}
              {localData.progressOverride && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">
                      Valor Manual da Barra
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={localData.manualProgress}
                        onChange={(e) => setLocalData({ 
                          ...localData, 
                          manualProgress: Math.max(0, Math.min(100, parseInt(e.target.value) || 0))
                        })}
                        className="w-20 px-2 py-1 rounded-lg bg-secondary border border-border text-center focus:border-primary focus:outline-none"
                      />
                      <span className="text-sm font-semibold">%</span>
                    </div>
                  </div>
                  
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={localData.manualProgress}
                    onChange={(e) => setLocalData({ 
                      ...localData, 
                      manualProgress: parseInt(e.target.value)
                    })}
                    className="w-full accent-primary"
                  />

                  {/* Botões Rápidos */}
                  <div className="flex gap-2">
                    <span className="text-xs text-muted-foreground">Rápido:</span>
                    {[25, 50, 75, 90, 95, 100].map(value => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setLocalData({ ...localData, manualProgress: value })}
                        className="px-2 py-1 text-xs rounded bg-secondary hover:bg-secondary/80 transition-colors"
                      >
                        {value}%
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Preview da Barra */}
            <div className="mt-6 p-4 bg-background rounded-lg">
              <p className="text-sm font-semibold mb-3">Preview da Barra:</p>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {localData.progressOverride ? '⚠️ Valor Manual' : '✅ Valor Real'}
                  </span>
                  <span className="font-bold">{displayProgress.toFixed(1)}%</span>
                </div>
                
                <div className="w-full bg-secondary rounded-full h-4 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                    style={{ width: `${displayProgress}%` }}
                  />
                </div>
                
                {localData.progressOverride && realProgress !== localData.manualProgress && (
                  <p className="text-xs text-yellow-500 mt-2">
                    ⚠️ Diferença do real: {Math.abs(realProgress - localData.manualProgress).toFixed(1)}%
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}