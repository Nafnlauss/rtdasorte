'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PurchaseConfigEditor, { PurchaseConfig } from '@/components/admin/PurchaseConfigEditor'
import ProgressControl from '@/components/admin/ProgressControl'
import { collectAuthDiagnostics, checkRLSPolicies } from '@/lib/auth-diagnostics'
import { localStorageAdapter } from '@/lib/supabase/local-storage-adapter'

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
  
  const [purchaseConfig, setPurchaseConfig] = useState<PurchaseConfig>({
    min_purchase: 1,
    quick_buttons: [
      { quantity: 100, label: '+100', popular: false },
      { quantity: 250, label: '+250', popular: true },
      { quantity: 500, label: '+500', popular: false },
      { quantity: 750, label: '+750', popular: false },
      { quantity: 1000, label: '+1000', popular: false },
      { quantity: 1500, label: '+1500', popular: false }
    ]
  })

  // Estados para controle de progresso
  const [progressConfig, setProgressConfig] = useState({
    showProgressBar: true,
    progressOverride: false,
    manualProgress: 0
  })

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

    console.log('=== INICIANDO CRIAÇÃO DE RIFA ===')
    console.log('Timestamp:', new Date().toISOString())
    
    // 1. Capturar estado completo de autenticação
    console.log('1. ESTADO DE AUTENTICAÇÃO:')
    console.log('localStorage:', {
      isAdmin: localStorage.getItem('isAdmin'),
      adminEmail: localStorage.getItem('adminEmail'),
      adminAuth: localStorage.getItem('adminAuth'),
      supabaseAuthToken: localStorage.getItem('sb-xlabgxtdbasbohvowfod-auth-token')
    })
    
    // 2. Verificar sessão Supabase
    const sessionResult = await supabase.auth.getSession()
    console.log('2. SESSÃO SUPABASE:')
    console.log('Session data:', {
      hasSession: !!sessionResult.data.session,
      accessToken: sessionResult.data.session?.access_token ? 'presente (omitido)' : 'ausente',
      refreshToken: sessionResult.data.session?.refresh_token ? 'presente (omitido)' : 'ausente',
      expiresAt: sessionResult.data.session?.expires_at,
      expiresIn: sessionResult.data.session?.expires_in,
      tokenType: sessionResult.data.session?.token_type,
      user: sessionResult.data.session?.user ? {
        id: sessionResult.data.session.user.id,
        email: sessionResult.data.session.user.email,
        role: sessionResult.data.session.user.role,
        aud: sessionResult.data.session.user.aud,
        created_at: sessionResult.data.session.user.created_at
      } : null
    })
    
    if (sessionResult.error) {
      console.error('Erro ao obter sessão:', sessionResult.error)
    }

    // 3. Verificar usuário atual
    const userResult = await supabase.auth.getUser()
    console.log('3. USUÁRIO ATUAL:')
    console.log('User data:', {
      hasUser: !!userResult.data.user,
      userId: userResult.data.user?.id,
      userEmail: userResult.data.user?.email,
      userRole: userResult.data.user?.role,
      userMetadata: userResult.data.user?.user_metadata,
      appMetadata: userResult.data.user?.app_metadata
    })
    
    if (userResult.error) {
      console.error('Erro ao obter usuário:', userResult.error)
    }

    // 4. Preparar dados para inserção
    let userId = userResult.data.user?.id
    console.log('4. PREPARAÇÃO DOS DADOS:')
    console.log('User ID para created_by:', userId)
    
    if (!userId) {
      console.warn('Nenhum usuário Supabase encontrado, created_by será null')
      // Usar null quando não há usuário autenticado (permitido pelo banco)
      userId = null
      console.log('created_by será null (campo opcional no banco)')
    }

    const insertData = {
      title: formData.title,
      description: formData.description,
      prize_description: formData.prize_description,
      number_price: parseFloat(formData.ticket_price),
      total_numbers: parseInt(formData.total_numbers),
      available_numbers: parseInt(formData.total_numbers),
      draw_date: formData.draw_date || null,
      status: formData.status,
      image_url: formData.image_url,
      purchase_config: purchaseConfig,
      min_numbers: purchaseConfig.min_purchase,
      max_numbers: 1000,
      show_progress_bar: progressConfig.showProgressBar,
      progress_override: progressConfig.progressOverride,
      manual_progress: progressConfig.progressOverride ? progressConfig.manualProgress : 0,
      created_by: userId
    }
    
    console.log('5. DADOS PARA INSERIR:')
    console.log('Insert data (sem imagem para log):', {
      ...insertData,
      image_url: insertData.image_url ? `[BASE64 STRING - ${insertData.image_url.length} caracteres]` : null
    })
    
    // Validar campos obrigatórios
    console.log('6. VALIDAÇÃO DE CAMPOS:')
    const requiredFields = ['title', 'description', 'prize_description', 'number_price', 'total_numbers', 'status']
    const missingFields = requiredFields.filter(field => !insertData[field as keyof typeof insertData])
    if (missingFields.length > 0) {
      console.error('Campos obrigatórios faltando:', missingFields)
    } else {
      console.log('Todos os campos obrigatórios presentes ✓')
    }

    try {
      // Coletar diagnósticos completos antes do INSERT
      console.log('7. COLETANDO DIAGNÓSTICOS PRÉ-INSERT...')
      const diagnostics = await collectAuthDiagnostics();
      
      // Verificar políticas RLS
      await checkRLSPolicies('raffles');
      
      console.log('8. EXECUTANDO INSERT NO SUPABASE...')
      
      // Se a imagem for muito grande, tentar sem ela primeiro
      let insertAttempt = insertData
      if (insertData.image_url && insertData.image_url.length > 500000) {
        console.warn(`Imagem muito grande (${insertData.image_url.length} caracteres). Tentando sem imagem primeiro...`)
        insertAttempt = { ...insertData, image_url: '' }
      }
      
      // Criar a rifa com timeout handling
      const { data, error } = await supabase
        .from('raffles')
        .insert([insertAttempt])
        .select()
        .then(result => result)
        .catch(err => {
          // Se for erro de timeout, tentar sem a imagem
          if ((err.message?.includes('timeout') || err.message?.includes('canceling statement')) && insertData.image_url) {
            console.warn('Timeout com imagem. Tentando criar sem imagem...')
            const insertWithoutImage = { ...insertData, image_url: '' }
            return supabase.from('raffles').insert([insertWithoutImage]).select()
          }
          return { data: null, error: err }
        })

      console.log('9. RESPOSTA DO SUPABASE:')
      
      if (error && !error.timeout) {
        console.error('ERRO DO SUPABASE:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          name: error.name
        })
        
        // Análise específica de erro RLS
        if (error.code === '42501') {
          console.error('=== ERRO RLS DETECTADO ===')
          console.error('Política RLS bloqueou a operação INSERT')
          console.error('Possíveis causas:')
          console.error('1. Usuário não autenticado')
          console.error('2. Campo created_by não corresponde ao usuário autenticado')
          console.error('3. Política RLS requer role específico')
          console.error('4. Token expirado ou inválido')
          
          // Tentar reautenticar
          console.log('Tentando verificar token de refresh...')
          const refreshResult = await supabase.auth.refreshSession()
          console.log('Resultado do refresh:', {
            hasNewSession: !!refreshResult.data.session,
            error: refreshResult.error
          })
        }
        
        throw error
      }
      
      if (data || error?.timeout) {
        console.log('INSERT processado com sucesso ou timeout aceitável')
        if (data) {
          console.log('ID da nova rifa:', data[0]?.id)
        }
        
        // Redirecionar para a listagem
        console.log('10. REDIRECIONANDO PARA /admin/raffles')
        router.push('/admin/raffles')
      } else {
        console.error('Falha no INSERT sem dados retornados')
        alert('Erro ao criar rifa. Verifique o console para detalhes.')
      }
    } catch (error) {
      console.error('=== ERRO NA CRIAÇÃO DA RIFA ===')
      console.error('Erro completo:', error)
      
      if (error instanceof Error) {
        console.error('Mensagem:', error.message)
        console.error('Stack:', error.stack)
        
        // Se for erro de conexão com Supabase, usar localStorage
        if (error.message?.includes('Failed to fetch') || error.message?.includes('ERR_NAME_NOT_RESOLVED')) {
          console.log('=== USANDO LOCALSTORAGE COMO FALLBACK ===')
          console.log('Supabase não está disponível. Salvando localmente...')
          
          try {
            const localResult = await localStorageAdapter.createRaffle(insertData)
            if (localResult.data) {
              console.log('Rifa criada com sucesso no localStorage!')
              alert('Rifa criada com sucesso! (Armazenamento local temporário)')
              router.push('/admin/raffles')
              return
            }
          } catch (localError) {
            console.error('Erro ao salvar no localStorage:', localError)
          }
        }
      }
      
      alert('Erro ao criar rifa. Verifique o console para detalhes.')
    } finally {
      console.log('=== FIM DO PROCESSO DE CRIAÇÃO ===')
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
                  <span className="font-semibold">{formData.total_numbers ? parseInt(formData.total_numbers).toLocaleString('pt-BR') : '0'}</span>
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
                      ? (parseInt(formData.total_numbers) * parseFloat(formData.ticket_price)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      : '0,00'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Configurações de Compra */}
        <div className="col-span-2">
          <PurchaseConfigEditor 
            config={purchaseConfig}
            onChange={setPurchaseConfig}
          />
        </div>

        {/* Controle de Progresso */}
        <div className="col-span-2 mt-6">
          <ProgressControl 
            totalNumbers={parseInt(formData.total_numbers) || 0}
            soldNumbers={0} 
            showProgressBar={progressConfig.showProgressBar}
            progressOverride={progressConfig.progressOverride}
            manualProgress={progressConfig.manualProgress}
            onChange={(data) => setProgressConfig(data)}
          />
        </div>

        {/* Botões de Ação */}
        <div className="col-span-2 flex items-center justify-end gap-4 mt-8">
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