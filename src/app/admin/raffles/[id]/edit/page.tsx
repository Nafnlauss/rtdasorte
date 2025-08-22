'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'
import { useAuthMonitor } from '@/hooks/useAuthMonitor'
import PurchaseConfigEditor, { PurchaseConfig } from '@/components/admin/PurchaseConfigEditor'
import ProgressControl from '@/components/admin/ProgressControl'

export default function EditRafflePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const id = resolvedParams.id
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [traceId] = useState(() => `edit-raffle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    prize_description: '',
    ticket_price: '',
    total_numbers: '',
    available_numbers: '',
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

  // Usar o hook de monitoramento de autenticação
  const { checkAuth } = useAuthMonitor({
    traceId,
    route: `/admin/raffles/${id}/edit`,
    checkInterval: 15000 // Check every 15 seconds
  })

  useEffect(() => {
    // Log inicial ao montar o componente
    logger.info('edit raffle page mount', {
      trace_id: traceId,
      route: `/admin/raffles/${id}/edit`,
      operation: 'page_mount',
      raffle_id: id
    })
    
    // Capturar estado inicial de autenticação
    const authState = logger.captureAuthState()
    logger.debug('initial auth state captured', {
      trace_id: traceId,
      auth: authState
    })
    
    loadRaffle()
  }, [id])

  const loadRaffle = async () => {
    const startTime = Date.now()
    logger.info('load raffle start', {
      trace_id: traceId,
      operation: 'load_raffle',
      raffle_id: id
    })
    
    try {
      // Verificar sessão antes de carregar
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      logger.authLog('check_session_before_load', {
        hasSession: !!session,
        sessionId: session?.access_token?.substring(0, 10),
        tokenExp: session?.expires_at,
        error: sessionError,
        metadata: {
          trace_id: traceId,
          operation: 'load_raffle'
        }
      })
      
      const { data: raffle, error } = await supabase
        .from('raffles')
        .select('*')
        .eq('id', id)
        .single()
      
      const duration = Date.now() - startTime
      logger.info('database query complete', {
        trace_id: traceId,
        operation: 'load_raffle',
        db: {
          table: 'raffles',
          duration_ms: duration
        },
        has_data: !!raffle,
        has_error: !!error
      })

      if (error) {
        logger.error('load raffle query failed', error, {
          trace_id: traceId,
          operation: 'load_raffle',
          raffle_id: id,
          db: {
            table: 'raffles',
            duration_ms: Date.now() - startTime
          }
        })
        throw error
      }

      if (raffle) {
        logger.info('raffle data loaded successfully', {
          trace_id: traceId,
          operation: 'load_raffle',
          raffle_id: id,
          raffle_status: raffle.status,
          has_purchase_config: !!raffle.purchase_config,
          has_image: !!raffle.image_url
        })
        setFormData({
          title: raffle.title || '',
          description: raffle.description || '',
          prize_description: raffle.prize_description || '',
          ticket_price: (raffle.number_price || raffle.ticket_price || 0).toString(),
          total_numbers: (raffle.total_numbers || 0).toString(),
          available_numbers: (raffle.available_numbers || raffle.total_numbers || 0).toString(),
          draw_date: raffle.draw_date ? new Date(raffle.draw_date).toISOString().slice(0, 16) : '',
          status: raffle.status || 'active',
          image_url: raffle.image_url || ''
        })
        
        if (raffle.purchase_config) {
          setPurchaseConfig(raffle.purchase_config)
        }
        
        if (raffle.image_url) {
          setImagePreview(raffle.image_url)
        }
        
        // Carregar configurações de progresso
        setProgressConfig({
          showProgressBar: raffle.show_progress_bar !== false, // default true
          progressOverride: raffle.progress_override === true, // default false
          manualProgress: raffle.manual_progress || 0
        })
      } else {
        logger.warn('raffle not found', {
          trace_id: traceId,
          operation: 'load_raffle',
          raffle_id: id
        })
        alert('Rifa não encontrada')
        router.push('/admin/raffles')
      }
    } catch (error: any) {
      logger.error('load raffle failed', error, {
        trace_id: traceId,
        operation: 'load_raffle',
        raffle_id: id,
        duration_ms: Date.now() - startTime
      })
      console.error('Erro ao carregar rifa:', error)
      alert(`Erro ao carregar dados da rifa: ${error.message || 'Erro desconhecido'}`)
      router.push('/admin/raffles')
    } finally {
      setIsLoading(false)
      logger.info('load raffle complete', {
        trace_id: traceId,
        operation: 'load_raffle',
        duration_ms: Date.now() - startTime
      })
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Verificar tamanho do arquivo (máximo 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('Imagem muito grande! Máximo permitido: 2MB')
        return
      }
      
      const reader = new FileReader()
      reader.onloadend = () => {
        const img = new Image()
        img.onload = () => {
          // Redimensionar imagem se necessário
          const maxWidth = 800
          const maxHeight = 800
          let width = img.width
          let height = img.height
          
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height)
            width = width * ratio
            height = height * ratio
          }
          
          // Criar canvas para redimensionar
          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height)
            
            // Converter para base64 com qualidade reduzida
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7)
            
            // Verificar tamanho da string base64 (máximo ~500KB)
            if (compressedBase64.length > 700000) {
              // Se ainda for muito grande, comprimir mais
              const moreCompressed = canvas.toDataURL('image/jpeg', 0.5)
              setImagePreview(moreCompressed)
              setFormData({ ...formData, image_url: moreCompressed })
            } else {
              setImagePreview(compressedBase64)
              setFormData({ ...formData, image_url: compressedBase64 })
            }
          }
        }
        img.src = reader.result as string
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Log imediato para debug
    console.log('=== SUBMIT CLICKED ===')
    console.log('Form event triggered')
    
    setIsSubmitting(true)
    
    // Variável de controle para gerenciar o estado do salvamento
    let saveSuccessful = false
    
    const submitStartTime = Date.now()
    const submitTraceId = `submit-${traceId}-${Date.now()}`
    
    logger.info('submit raffle update start', {
      trace_id: submitTraceId,
      parent_trace_id: traceId,
      operation: 'update_raffle',
      raffle_id: id,
      route: `/admin/raffles/${id}/edit`
    })
    
    // Capturar estado de autenticação antes de submeter
    const preSubmitAuthState = logger.captureAuthState()
    logger.info('pre-submit auth state', {
      trace_id: submitTraceId,
      auth: preSubmitAuthState
    })

    try {
      // Verificar sessão detalhadamente
      logger.info('checking session before submit', {
        trace_id: submitTraceId,
        operation: 'pre_submit_auth_check'
      })
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      logger.authLog('session_check_before_submit', {
        hasSession: !!session,
        sessionId: session?.access_token?.substring(0, 10),
        tokenExp: session?.expires_at,
        refreshTokenExp: session?.refresh_token ? Date.now() + 3600000 : undefined,
        provider: session?.user?.app_metadata?.provider,
        userId: session?.user?.id,
        error: sessionError,
        metadata: {
          trace_id: submitTraceId,
          expires_in_seconds: session?.expires_at ? (session.expires_at - Date.now() / 1000) : null
        }
      })
      
      // Verificar autenticação - primeiro tenta Supabase, depois localStorage
      logger.info('checking authentication', {
        trace_id: submitTraceId,
        operation: 'auth_check'
      })
      
      let isAuthenticated = false
      let authMethod = 'none'
      
      // Tentar autenticação via Supabase
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      logger.authLog('user_check_before_submit', {
        hasUser: !!user,
        userId: user?.id,
        error: authError,
        metadata: {
          trace_id: submitTraceId,
          user_email_domain: user?.email?.split('@')[1],
          user_role: user?.role,
          user_created_at: user?.created_at
        }
      })
      
      if (user) {
        isAuthenticated = true
        authMethod = 'supabase'
      } else {
        // Fallback para localStorage (admin auth)
        const isAdmin = localStorage.getItem('isAdmin')
        const adminEmail = localStorage.getItem('adminEmail')
        
        logger.info('checking localStorage auth', {
          trace_id: submitTraceId,
          has_admin_flag: !!isAdmin,
          has_admin_email: !!adminEmail
        })
        
        if (isAdmin === 'true' && adminEmail) {
          isAuthenticated = true
          authMethod = 'localStorage'
        }
      }
      
      if (!isAuthenticated) {
        logger.error('authentication failed on submit', new Error('No authentication found'), {
          trace_id: submitTraceId,
          operation: 'update_raffle',
          auth: {
            has_session: !!session,
            has_user: !!user,
            has_localStorage: localStorage.getItem('isAdmin') === 'true',
            session_error: sessionError?.message,
            auth_error: authError?.message
          }
        })
        
        // Capturar estado após falha de autenticação
        const postFailureAuthState = logger.captureAuthState()
        logger.warn('post-auth-failure state', {
          trace_id: submitTraceId,
          auth: postFailureAuthState,
          auth_diff: {
            cookies_before: preSubmitAuthState.cookie_count,
            cookies_after: postFailureAuthState.cookie_count,
            storage_before: preSubmitAuthState.storage_count,
            storage_after: postFailureAuthState.storage_count
          }
        })
        
        alert('Erro: Você precisa estar autenticado para fazer alterações')
        router.push('/admin/login')
        return
      }
      
      logger.info('authentication verified successfully', {
        trace_id: submitTraceId,
        auth_method: authMethod,
        user_id_hash: user?.id || 'admin-localStorage'
      })
      
      const updateData = {
        title: formData.title,
        description: formData.description,
        prize_description: formData.prize_description,
        number_price: parseFloat(formData.ticket_price),
        total_numbers: parseInt(formData.total_numbers),
        available_numbers: parseInt(formData.available_numbers),
        draw_date: formData.draw_date || null,
        status: formData.status,
        image_url: formData.image_url || '',
        purchase_config: purchaseConfig,
        min_numbers: purchaseConfig.min_purchase,
        show_progress_bar: progressConfig.showProgressBar,
        progress_override: progressConfig.progressOverride,
        manual_progress: progressConfig.progressOverride ? progressConfig.manualProgress : 0,
        updated_at: new Date().toISOString()
      }
      
      logger.info('preparing update query', {
        trace_id: submitTraceId,
        operation: 'update_raffle',
        raffle_id: id,
        update_fields: Object.keys(updateData),
        has_image: !!updateData.image_url,
        status: updateData.status
      })
      
      const queryStartTime = Date.now()
      
      const { data, error } = await supabase
        .from('raffles')
        .update(updateData)
        .eq('id', id)
        .select()
      
      const queryDuration = Date.now() - queryStartTime
      
      logger.info('update query complete', {
        trace_id: submitTraceId,
        operation: 'update_raffle',
        db: {
          table: 'raffles',
          duration_ms: queryDuration
        },
        success: !error,
        has_data: !!data,
        rows_affected: data?.length || 0
      })

      if (error) {
        logger.error('update query failed', error, {
          trace_id: submitTraceId,
          operation: 'update_raffle',
          raffle_id: id,
          db: {
            table: 'raffles',
            duration_ms: queryDuration
          },
          error_code: error.code,
          error_hint: error.hint
        })
        
        // Verificar estado da sessão após erro
        const { data: { session: postErrorSession } } = await supabase.auth.getSession()
        logger.authLog('session_check_after_error', {
          hasSession: !!postErrorSession,
          sessionId: postErrorSession?.access_token?.substring(0, 10),
          metadata: {
            trace_id: submitTraceId,
            error_type: 'update_failed',
            error_message: error.message
          }
        })
        
        throw error
      }
      
      logger.info('raffle updated successfully', {
        trace_id: submitTraceId,
        operation: 'update_raffle',
        raffle_id: id,
        duration_ms: Date.now() - submitStartTime
      })
      
      // Verificar estado da sessão após sucesso
      const { data: { session: postSuccessSession } } = await supabase.auth.getSession()
      logger.authLog('session_check_after_success', {
        hasSession: !!postSuccessSession,
        sessionId: postSuccessSession?.access_token?.substring(0, 10),
        metadata: {
          trace_id: submitTraceId,
          operation: 'update_success'
        }
      })

      // Mostrar mensagem de sucesso sem bloquear
      logger.info('navigation starting', {
        trace_id: submitTraceId,
        target: '/admin/raffles'
      })

      // Marcar como sucesso
      saveSuccessful = true
      
      // Mostrar mensagem de sucesso temporariamente
      setShowSuccessMessage(true)

      // Aguardar um momento antes de navegar para garantir que tudo seja processado
      await new Promise(resolve => setTimeout(resolve, 500))

      // Navegar para a lista
      await router.push('/admin/raffles')
      
      // Resetar o estado após navegação bem-sucedida
      setIsSubmitting(false)
    } catch (error: any) {
      const totalDuration = Date.now() - submitStartTime
      
      logger.error('submit raffle update failed', error, {
        trace_id: submitTraceId,
        operation: 'update_raffle',
        raffle_id: id,
        duration_ms: totalDuration
      })
      
      // Capturar estado final após erro
      const postErrorAuthState = logger.captureAuthState()
      logger.warn('post-error auth state', {
        trace_id: submitTraceId,
        auth: postErrorAuthState,
        auth_diff: {
          cookies_before: preSubmitAuthState.cookie_count,
          cookies_after: postErrorAuthState.cookie_count,
          storage_before: preSubmitAuthState.storage_count,
          storage_after: postErrorAuthState.storage_count
        }
      })
      
      console.error('Erro ao atualizar rifa:', error)
      alert(`Erro ao atualizar rifa: ${error.message || 'Erro desconhecido'}`)
    } finally {
      // Só reseta se não foi sucesso (no sucesso reseta após navegação)
      if (!saveSuccessful) {
        setIsSubmitting(false)
      }
      
      const totalDuration = Date.now() - submitStartTime
      logger.info('submit raffle update complete', {
        trace_id: submitTraceId,
        operation: 'update_raffle',
        duration_ms: totalDuration,
        was_successful: saveSuccessful
      })
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
      {/* Mensagem de sucesso flutuante */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="text-xl">✅</span>
            <span className="font-semibold">Rifa atualizada com sucesso!</span>
          </div>
        </div>
      )}
      
      <div className="mb-4 sm:mb-6 md:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Editar Rifa</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Atualize as informações da rifa</p>
      </div>

      {/* Alerta sobre números vendidos */}
      {soldNumbers > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
          <p className="text-yellow-500 font-semibold mb-1 text-sm sm:text-base">⚠️ Atenção</p>
          <p className="text-xs sm:text-sm text-yellow-500">
            Esta rifa já possui {soldNumbers} números vendidos. 
            Alterar a quantidade total de números pode afetar os participantes.
          </p>
        </div>
      )}

      <form 
        onSubmit={(e) => {
          console.log('=== FORM ONSUBMIT TRIGGERED ===')
          handleSubmit(e)
        }}
        className="w-full"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Coluna Esquerda */}
          <div className="space-y-6">
            {/* Informações Básicas */}
            <div className="raffle-card">
              <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Informações Básicas</h2>
              
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
              <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Valores e Quantidades</h2>
              
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
              </div>
            </div>
          </div>

          {/* Coluna Direita */}
          <div className="space-y-6">
            {/* Upload de Imagem */}
            <div className="raffle-card">
              <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Imagem da Rifa</h2>
              
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
              <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Status e Agendamento</h2>
              
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
                  <span className="font-semibold">{soldNumbers.toLocaleString('pt-BR')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Receita atual:</span>
                  <span className="font-semibold">
                    R$ {(soldNumbers * parseFloat(formData.ticket_price || '0')).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
        
        {/* Configurações de Compra */}
        <div className="col-span-1 lg:col-span-2">
          <PurchaseConfigEditor 
            config={purchaseConfig}
            onChange={setPurchaseConfig}
          />
        </div>

        {/* Controle de Progresso */}
        <div className="col-span-1 lg:col-span-2 mt-6">
          <ProgressControl 
            totalNumbers={parseInt(formData.total_numbers) || 0}
            soldNumbers={soldNumbers}
            showProgressBar={progressConfig.showProgressBar}
            progressOverride={progressConfig.progressOverride}
            manualProgress={progressConfig.manualProgress}
            onChange={(data) => setProgressConfig(data)}
          />
        </div>

        {/* Botões de Ação */}
        <div className="col-span-1 lg:col-span-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4 mt-6 sm:mt-8">
          <button
            type="button"
            onClick={() => router.push('/admin/raffles')}
            className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 text-foreground hover:bg-secondary rounded-lg transition-colors text-sm sm:text-base"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            onClick={(e) => {
              console.log('=== BUTTON CLICKED DIRECTLY ===')
              console.log('isSubmitting:', isSubmitting)
              // Não chamar preventDefault aqui para permitir submit do form
            }}
            className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </div>
  )
}