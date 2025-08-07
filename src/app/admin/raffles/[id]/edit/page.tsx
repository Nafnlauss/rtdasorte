'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function EditRafflePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    prize_description: '',
    ticket_price: '',
    total_numbers: '',
    available_numbers: '',
    winning_numbers: '',
    draw_date: '',
    status: 'active',
    image_url: ''
  })

  useEffect(() => {
    loadRaffle()
  }, [params.id])

  const loadRaffle = async () => {
    try {
      const { data: raffle, error } = await supabase
        .from('raffles')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error

      if (raffle) {
        setFormData({
          title: raffle.title,
          description: raffle.description,
          prize_description: raffle.prize_description,
          ticket_price: raffle.ticket_price.toString(),
          total_numbers: raffle.total_numbers.toString(),
          available_numbers: raffle.available_numbers.toString(),
          winning_numbers: raffle.winning_numbers ? raffle.winning_numbers.join(', ') : '',
          draw_date: raffle.draw_date ? new Date(raffle.draw_date).toISOString().slice(0, 16) : '',
          status: raffle.status,
          image_url: raffle.image_url || ''
        })
        
        if (raffle.image_url) {
          setImagePreview(raffle.image_url)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar rifa:', error)
      alert('Erro ao carregar dados da rifa')
      router.push('/admin/raffles')
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
        setFormData({ ...formData, image_url: reader.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const { error } = await supabase
        .from('raffles')
        .update({
          title: formData.title,
          description: formData.description,
          prize_description: formData.prize_description,
          ticket_price: parseFloat(formData.ticket_price),
          total_numbers: parseInt(formData.total_numbers),
          available_numbers: parseInt(formData.available_numbers),
          winning_numbers: formData.winning_numbers ? formData.winning_numbers.split(',').map(n => parseInt(n.trim())) : null,
          draw_date: formData.draw_date || null,
          status: formData.status,
          image_url: formData.image_url
        })
        .eq('id', params.id)

      if (error) throw error

      router.push('/admin/raffles')
    } catch (error) {
      console.error('Erro ao atualizar rifa:', error)
      alert('Erro ao atualizar rifa. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  const soldNumbers = parseInt(formData.total_numbers) - parseInt(formData.available_numbers)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Editar Rifa</h1>
        <p className="text-muted-foreground">Atualize as informações da rifa</p>
      </div>

      {/* Alerta sobre números vendidos */}
      {soldNumbers > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500 rounded-lg p-4 mb-6 max-w-4xl">
          <p className="text-yellow-500 font-semibold mb-1">⚠️ Atenção</p>
          <p className="text-sm text-yellow-500">
            Esta rifa já possui {soldNumbers} números vendidos. 
            Alterar a quantidade total de números pode afetar os participantes.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-4xl">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Coluna Esquerda */}
          <div className="space-y-6">
            {/* Informações Básicas */}
            <div className="raffle-card">
              <h2 className="text-xl font-bold mb-4">Informações Básicas</h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium mb-2">
                    Nome da Rifa *
                  </label>
                  <input
                    type="text"
                    id="title"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium mb-2">
                    Descrição *
                  </label>
                  <textarea
                    id="description"
                    required
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none transition-colors resize-none"
                  />
                </div>

                <div>
                  <label htmlFor="prize_description" className="block text-sm font-medium mb-2">
                    Descrição do Prêmio *
                  </label>
                  <input
                    type="text"
                    id="prize_description"
                    required
                    value={formData.prize_description}
                    onChange={(e) => setFormData({ ...formData, prize_description: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Configurações de Valores */}
            <div className="raffle-card">
              <h2 className="text-xl font-bold mb-4">Valores e Quantidades</h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="ticket_price" className="block text-sm font-medium mb-2">
                    Valor por Número (R$) *
                  </label>
                  <input
                    type="number"
                    id="ticket_price"
                    required
                    step="0.01"
                    min="0.01"
                    value={formData.ticket_price}
                    onChange={(e) => setFormData({ ...formData, ticket_price: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="total_numbers" className="block text-sm font-medium mb-2">
                    Quantidade Total de Números *
                  </label>
                  <input
                    type="number"
                    id="total_numbers"
                    required
                    min={soldNumbers.toString()}
                    value={formData.total_numbers}
                    onChange={(e) => setFormData({ ...formData, total_numbers: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none transition-colors"
                  />
                  {soldNumbers > 0 && (
                    <p className="text-xs text-yellow-500 mt-1">
                      Mínimo: {soldNumbers} (números já vendidos)
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="available_numbers" className="block text-sm font-medium mb-2">
                    Números Disponíveis
                  </label>
                  <input
                    type="number"
                    id="available_numbers"
                    required
                    min="0"
                    max={formData.total_numbers}
                    value={formData.available_numbers}
                    onChange={(e) => setFormData({ ...formData, available_numbers: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none transition-colors"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Números vendidos: {soldNumbers}
                  </p>
                </div>

                <div>
                  <label htmlFor="winning_numbers" className="block text-sm font-medium mb-2">
                    Números Premiados (Opcional)
                  </label>
                  <input
                    type="text"
                    id="winning_numbers"
                    value={formData.winning_numbers}
                    onChange={(e) => setFormData({ ...formData, winning_numbers: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none transition-colors"
                    placeholder="Ex: 1, 500, 999"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Separe múltiplos números com vírgula
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna Direita */}
          <div className="space-y-6">
            {/* Upload de Imagem */}
            <div className="raffle-card">
              <h2 className="text-xl font-bold mb-4">Imagem da Rifa</h2>
              
              <div className="space-y-4">
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  {imagePreview ? (
                    <div className="space-y-4">
                      <div className="h-48 rounded-lg overflow-hidden bg-secondary">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview(null)
                          setFormData({ ...formData, image_url: '' })
                        }}
                        className="text-sm text-red-500 hover:text-red-400"
                      >
                        Remover imagem
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-2xl">📷</span>
                      </div>
                      <label htmlFor="image" className="cursor-pointer">
                        <span className="text-primary hover:text-primary/80 font-semibold">
                          Clique para enviar
                        </span>
                        <span className="text-muted-foreground"> ou arraste uma imagem</span>
                      </label>
                      <input
                        type="file"
                        id="image"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Status e Data */}
            <div className="raffle-card">
              <h2 className="text-xl font-bold mb-4">Status e Agendamento</h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="status" className="block text-sm font-medium mb-2">
                    Status da Rifa *
                  </label>
                  <select
                    id="status"
                    required
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none transition-colors"
                  >
                    <option value="active">Adquira já! (Ativa)</option>
                    <option value="paused">Pausada</option>
                    <option value="finished">Concluído (Finalizada)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="draw_date" className="block text-sm font-medium mb-2">
                    Data do Sorteio
                  </label>
                  <input
                    type="datetime-local"
                    id="draw_date"
                    value={formData.draw_date}
                    onChange={(e) => setFormData({ ...formData, draw_date: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Estatísticas */}
            <div className="raffle-card bg-primary/10 border-primary/30">
              <h3 className="font-bold mb-3">Estatísticas</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Números vendidos:</span>
                  <span className="font-semibold">{soldNumbers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Receita atual:</span>
                  <span className="font-semibold">
                    R$ {(soldNumbers * parseFloat(formData.ticket_price || '0')).toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Receita potencial:</span>
                  <span className="font-semibold text-primary">
                    R$ {formData.total_numbers && formData.ticket_price 
                      ? (parseInt(formData.total_numbers) * parseFloat(formData.ticket_price)).toFixed(2).replace('.', ',')
                      : '0,00'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Progresso:</span>
                  <span className="font-semibold">
                    {((soldNumbers / parseInt(formData.total_numbers || '1')) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center justify-end gap-4 mt-8">
          <button
            type="button"
            onClick={() => router.push('/admin/raffles')}
            className="px-6 py-3 text-foreground hover:bg-secondary rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </div>
  )
}