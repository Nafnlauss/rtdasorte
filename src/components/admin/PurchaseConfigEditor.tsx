'use client'

import { useState } from 'react'

export interface QuickButton {
  quantity: number
  label: string
  popular: boolean
}

export interface PurchaseConfig {
  min_purchase: number
  quick_buttons: QuickButton[]
}

interface PurchaseConfigEditorProps {
  config: PurchaseConfig
  onChange: (config: PurchaseConfig) => void
}

export default function PurchaseConfigEditor({ config, onChange }: PurchaseConfigEditorProps) {
  const [localConfig, setLocalConfig] = useState<PurchaseConfig>(config)

  const updateButton = (index: number, field: keyof QuickButton, value: any) => {
    const newButtons = [...localConfig.quick_buttons]
    newButtons[index] = { ...newButtons[index], [field]: value }
    
    // Se marcar um como popular, desmarcar os outros
    if (field === 'popular' && value === true) {
      newButtons.forEach((btn, i) => {
        if (i !== index) btn.popular = false
      })
    }
    
    const newConfig = { ...localConfig, quick_buttons: newButtons }
    setLocalConfig(newConfig)
    onChange(newConfig)
  }

  const updateMinPurchase = (value: number) => {
    const newConfig = { ...localConfig, min_purchase: value }
    setLocalConfig(newConfig)
    onChange(newConfig)
  }

  return (
    <div className="space-y-6">
      {/* Quantidade Mínima */}
      <div className="raffle-card bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span className="text-2xl">⚙️</span>
          Configuração de Compra Mínima
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Quantidade Mínima por Cliente
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                value={localConfig.min_purchase}
                onChange={(e) => updateMinPurchase(parseInt(e.target.value) || 1)}
                className="w-32 px-4 py-2 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none transition-colors"
              />
              <span className="text-sm text-muted-foreground">
                números mínimos que o cliente deve comprar
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              💡 O cliente não poderá comprar menos que esta quantidade
            </p>
          </div>
        </div>
      </div>

      {/* Botões de Quantidade Rápida */}
      <div className="raffle-card">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span className="text-2xl">🎯</span>
          Botões de Seleção Rápida
        </h3>
        
        <p className="text-sm text-muted-foreground mb-6">
          Configure os 6 botões de quantidade que aparecerão para seleção rápida do cliente
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          {localConfig.quick_buttons.map((button, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border-2 transition-all ${
                button.popular 
                  ? 'bg-primary/10 border-primary shadow-lg shadow-primary/20' 
                  : 'bg-secondary border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold">Botão {index + 1}</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={button.popular}
                    onChange={(e) => updateButton(index, 'popular', e.target.checked)}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-sm">
                    {button.popular ? '⭐ Mais Popular' : 'Destacar'}
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Quantidade</label>
                  <input
                    type="number"
                    min="1"
                    value={button.quantity}
                    onChange={(e) => updateButton(index, 'quantity', parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:border-primary focus:outline-none transition-colors text-sm"
                    placeholder="Ex: 100"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium mb-1">Rótulo</label>
                  <input
                    type="text"
                    value={button.label}
                    onChange={(e) => updateButton(index, 'label', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:border-primary focus:outline-none transition-colors text-sm"
                    placeholder="Ex: +100"
                  />
                </div>
              </div>

              {/* Preview do botão */}
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                <div
                  className={`py-2 px-4 rounded-lg text-center font-semibold text-sm ${
                    button.popular
                      ? 'bg-gradient-to-r from-primary to-accent text-white'
                      : 'bg-secondary'
                  }`}
                >
                  {button.label}
                  {button.popular && (
                    <span className="ml-2 text-xs bg-white/20 px-2 py-0.5 rounded-full">
                      Mais Popular
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-secondary rounded-lg">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold">💡 Dica:</span> Configure valores progressivos para incentivar compras maiores. 
            Marque um botão como "Mais Popular" para destacá-lo visualmente.
          </p>
        </div>
      </div>

      {/* Preview da Interface do Cliente */}
      <div className="raffle-card bg-gradient-to-br from-secondary to-background">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span className="text-2xl">👁️</span>
          Preview da Interface do Cliente
        </h3>
        
        <div className="bg-background rounded-lg p-4 border border-border">
          <p className="text-sm text-muted-foreground mb-3">Botões de seleção rápida:</p>
          
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {localConfig.quick_buttons.map((button, index) => (
              <button
                key={index}
                type="button"
                className={`py-2 px-3 rounded-lg font-semibold text-sm transition-all ${
                  button.popular
                    ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg'
                    : 'bg-secondary hover:bg-secondary/80'
                }`}
              >
                {button.label}
              </button>
            ))}
          </div>
          
          <div className="mt-4 flex items-center gap-3">
            <button type="button" className="w-10 h-10 rounded-lg bg-secondary">-</button>
            <div className="px-4 py-2 rounded-lg bg-secondary border border-border text-center font-bold min-w-[100px]">
              {localConfig.min_purchase}
            </div>
            <button type="button" className="w-10 h-10 rounded-lg bg-secondary">+</button>
            <span className="text-sm text-muted-foreground">
              (mínimo: {localConfig.min_purchase} números)
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}