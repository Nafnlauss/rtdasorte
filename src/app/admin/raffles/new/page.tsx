'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function NewRafflePage() {
  const router = useRouter()
  const supabase = createClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    prize_description: '',
    ticket_price: '',
    total_numbers: '',
    winning_numbers: '',
    draw_date: '',
    status: 'active',
    image_url: ''
  })

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
        // Aqui você implementaria o upload real para o Supabase Storage
        setFormData({ ...formData, image_url: reader.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Criar a rifa
      const { data, error } = await supabase
        .from('raffles')
        .insert([{
          title: formData.title,
          description: formData.description,
          prize_description: formData.prize_description,
          ticket_price: parseFloat(formData.ticket_price),
          total_numbers: parseInt(formData.total_numbers),
          available_numbers: parseInt(formData.total_numbers), // Inicialmente todos disponíveis
          winning_numbers: formData.winning_numbers ? formData.winning_numbers.split(',').map(n => parseInt(n.trim())) : null,
          draw_date: formData.draw_date || null,
          status: formData.status,
          image_url: formData.image_url
        }])
        .select()

      if (error) throw error

      // Redirecionar para a listagem
      router.push('/admin/raffles')
    } catch (error) {
      console.error('Erro ao criar rifa:', error)
      alert('Erro ao criar rifa. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Criar Nova Rifa</h1>
        <p className="text-muted-foreground">Preencha as informações para criar uma nova rifa</p>
      </div>

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
                    placeholder="Ex: iPhone 15 Pro Max"
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
                    placeholder="Descreva os detalhes da rifa..."
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
                    placeholder="Ex: iPhone 15 Pro Max 256GB Titânio Natural"
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
                    placeholder="10.00"
                  />
                </div>

                <div>
                  <label htmlFor="total_numbers" className="block text-sm font-medium mb-2">
                    Quantidade de Cotas/Números *
                  </label>
                  <input
                    type="number"
                    id="total_numbers"
                    required
                    min="1"
                    value={formData.total_numbers}
                    onChange={(e) => setFormData({ ...formData, total_numbers: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none transition-colors"
                    placeholder="1000"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Total de números disponíveis para venda
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
                    Separe múltiplos números com vírgula. Deixe em branco para sorteio pela Loteria Federal.
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
                      <p className="text-xs text-muted-foreground mt-2">
                        PNG, JPG até 5MB
                      </p>
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
                  <p className="text-xs text-muted-foreground mt-1">
                    Deixe em branco se não houver data definida
                  </p>
                </div>
              </div>
            </div>

            {/* Resumo */}
            <div className="raffle-card bg-primary/10 border-primary/30">
              <h3 className="font-bold mb-3">Resumo da Rifa</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total de números:</span>
                  <span className="font-semibold">{formData.total_numbers || '0'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor por número:</span>
                  <span className="font-semibold">
                    R$ {formData.ticket_price ? parseFloat(formData.ticket_price).toFixed(2).replace('.', ',') : '0,00'}
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
            {isSubmitting ? 'Criando...' : 'Criar Rifa'}
          </button>
        </div>
      </form>
    </div>
  )
}