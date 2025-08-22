'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Raffle {
  id: string
  title: string
  image_url: string | null
  status: string
  display_order: number
}

export default function RaffleReorder() {
  const [raffles, setRaffles] = useState<Raffle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [draggedItem, setDraggedItem] = useState<number | null>(null)
  const [dragOverItem, setDragOverItem] = useState<number | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadRaffles()
  }, [])

  const loadRaffles = async () => {
    try {
      const { data, error } = await supabase
        .from('raffles')
        .select('id, title, image_url, status, display_order')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false })

      if (error) throw error
      
      setRaffles(data || [])
    } catch (error) {
      console.error('Erro ao carregar rifas:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDragStart = (index: number) => {
    setDraggedItem(index)
  }

  const handleDragEnter = (index: number) => {
    if (draggedItem === null) return
    setDragOverItem(index)
  }

  const handleDragEnd = () => {
    if (draggedItem === null || dragOverItem === null) {
      setDraggedItem(null)
      setDragOverItem(null)
      return
    }

    if (draggedItem === dragOverItem) {
      setDraggedItem(null)
      setDragOverItem(null)
      return
    }

    // Reordenar o array
    const draggedRaffle = raffles[draggedItem]
    const newRaffles = [...raffles]
    
    // Remover item da posição original
    newRaffles.splice(draggedItem, 1)
    
    // Inserir na nova posição
    newRaffles.splice(dragOverItem, 0, draggedRaffle)
    
    // Atualizar display_order
    const updatedRaffles = newRaffles.map((raffle, index) => ({
      ...raffle,
      display_order: index + 1
    }))
    
    setRaffles(updatedRaffles)
    setDraggedItem(null)
    setDragOverItem(null)
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    
    const newRaffles = [...raffles]
    const temp = newRaffles[index]
    newRaffles[index] = newRaffles[index - 1]
    newRaffles[index - 1] = temp
    
    // Atualizar display_order
    const updatedRaffles = newRaffles.map((raffle, idx) => ({
      ...raffle,
      display_order: idx + 1
    }))
    
    setRaffles(updatedRaffles)
  }

  const handleMoveDown = (index: number) => {
    if (index === raffles.length - 1) return
    
    const newRaffles = [...raffles]
    const temp = newRaffles[index]
    newRaffles[index] = newRaffles[index + 1]
    newRaffles[index + 1] = temp
    
    // Atualizar display_order
    const updatedRaffles = newRaffles.map((raffle, idx) => ({
      ...raffle,
      display_order: idx + 1
    }))
    
    setRaffles(updatedRaffles)
  }

  const saveOrder = async () => {
    setIsSaving(true)
    try {
      // Atualizar cada rifa com sua nova ordem
      const updates = raffles.map((raffle) => 
        supabase
          .from('raffles')
          .update({ display_order: raffle.display_order })
          .eq('id', raffle.id)
      )
      
      await Promise.all(updates)
      
      alert('Ordem salva com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar ordem:', error)
      alert('Erro ao salvar ordem. Tente novamente.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Carregando rifas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Reordenar Rifas</h2>
          <p className="text-muted-foreground">Arraste as rifas ou use os botões para alterar a ordem de exibição</p>
        </div>
        <button
          onClick={saveOrder}
          disabled={isSaving}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
        >
          {isSaving ? 'Salvando...' : 'Salvar Ordem'}
        </button>
      </div>

      <div className="space-y-2">
        {raffles.map((raffle, index) => (
          <div
            key={raffle.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragEnter={() => handleDragEnter(index)}
            onDragEnd={handleDragEnd}
            className={`
              flex items-center gap-4 p-4 bg-card rounded-lg border-2 cursor-move
              transition-all duration-200
              ${draggedItem === index ? 'opacity-50' : ''}
              ${dragOverItem === index ? 'border-primary' : 'border-border'}
              hover:border-primary/50
            `}
          >
            {/* Handle de arraste */}
            <div className="text-muted-foreground">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M7 2a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0zM7 18a2 2 0 11-4 0 2 2 0 014 0zM17 2a2 2 0 11-4 0 2 2 0 014 0zM17 10a2 2 0 11-4 0 2 2 0 014 0zM17 18a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
            </div>

            {/* Número da ordem */}
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center font-bold">
              {index + 1}
            </div>

            {/* Imagem da rifa */}
            {raffle.image_url && (
              <img
                src={raffle.image_url}
                alt={raffle.title}
                className="w-16 h-16 object-cover rounded-lg"
              />
            )}

            {/* Informações da rifa */}
            <div className="flex-1">
              <h3 className="font-semibold">{raffle.title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`
                  px-2 py-1 rounded text-xs font-medium
                  ${raffle.status === 'active' 
                    ? 'bg-green-500/10 text-green-500' 
                    : raffle.status === 'paused'
                    ? 'bg-yellow-500/10 text-yellow-500'
                    : 'bg-gray-500/10 text-gray-500'
                  }
                `}>
                  {raffle.status === 'active' ? 'Ativa' : 
                   raffle.status === 'paused' ? 'Pausada' : 'Finalizada'}
                </span>
              </div>
            </div>

            {/* Botões de mover */}
            <div className="flex gap-2">
              <button
                onClick={() => handleMoveUp(index)}
                disabled={index === 0}
                className="p-2 hover:bg-secondary rounded-lg transition-colors disabled:opacity-30"
                title="Mover para cima"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 3l-7 7h4v7h6v-7h4l-7-7z"/>
                </svg>
              </button>
              <button
                onClick={() => handleMoveDown(index)}
                disabled={index === raffles.length - 1}
                className="p-2 hover:bg-secondary rounded-lg transition-colors disabled:opacity-30"
                title="Mover para baixo"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 17l7-7h-4V3H7v7H3l7 7z"/>
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {raffles.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          Nenhuma rifa encontrada
        </div>
      )}
    </div>
  )
}