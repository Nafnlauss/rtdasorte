'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { loteriaFederal } from '@/lib/services/loteria-federal'

interface RaffleDrawPageProps {
  params: Promise<{
    id: string
  }>
}

export default function RaffleDrawPage({ params }: RaffleDrawPageProps) {
  const { id } = use(params)
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [raffleData, setRaffleData] = useState<any>(null)
  const [drawMethod, setDrawMethod] = useState<'federal' | 'manual'>('federal')
  const [manualNumber, setManualNumber] = useState('')
  const [loteriaResult, setLoteriaResult] = useState<any>(null)
  const [winningNumber, setWinningNumber] = useState<number | null>(null)
  const [drawConfig, setDrawConfig] = useState({
    prizePosition: 1, // Qual prêmio usar (1-5)
    useLastDigits: 4, // Quantos dígitos usar
    concurso: 0, // 0 = mais recente
  })
  
  useEffect(() => {
    loadRaffleData()
    checkLoteriaFederal()
  }, [id])
  
  const loadRaffleData = async () => {
    // Aqui você carregaria os dados da rifa do banco
    // Por enquanto, vamos simular
    setRaffleData({
      id: id,
      title: 'iPhone 15 Pro Max',
      total_numbers: 10000,
      sold_numbers: 8543,
      number_price: 5.00,
      status: 'active'
    })
  }
  
  const checkLoteriaFederal = async () => {
    setIsLoading(true)
    try {
      const result = await loteriaFederal.getLatestResult()
      if (result) {
        setLoteriaResult(result)
        setDrawConfig(prev => ({ ...prev, concurso: result.concurso }))
      }
    } catch (error) {
      console.error('Erro ao buscar resultado da Loteria Federal:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  const searchConcurso = async () => {
    if (!drawConfig.concurso) return
    
    setIsLoading(true)
    try {
      const result = await loteriaFederal.getResultByConcurso(drawConfig.concurso)
      if (result) {
        setLoteriaResult(result)
      } else {
        alert('Concurso não encontrado')
      }
    } catch (error) {
      alert('Erro ao buscar concurso')
    } finally {
      setIsLoading(false)
    }
  }
  
  const calculateWinner = () => {
    try {
      if (drawMethod === 'federal') {
        if (!loteriaResult) {
          alert('Por favor, busque o resultado da Loteria Federal primeiro')
          return
        }
        
        if (!raffleData || !raffleData.total_numbers) {
          alert('Dados da rifa não carregados')
          return
        }
        
        const winner = loteriaFederal.determineWinningNumber(
          loteriaResult,
          raffleData.total_numbers,
          {
            type: 'federal',
            prizePosition: drawConfig.prizePosition,
            useLastDigits: drawConfig.useLastDigits
          }
        )
        setWinningNumber(winner)
        alert(`Número vencedor calculado: ${String(winner).padStart(4, '0')}`)
      } else if (drawMethod === 'manual') {
        if (!manualNumber) {
          alert('Digite o número vencedor')
          return
        }
        const winner = parseInt(manualNumber)
        if (isNaN(winner) || winner < 0 || winner >= raffleData.total_numbers) {
          alert(`Número inválido. Digite um número entre 0 e ${raffleData.total_numbers - 1}`)
          return
        }
        setWinningNumber(winner)
        alert(`Número vencedor definido: ${String(winner).padStart(4, '0')}`)
      }
    } catch (error: any) {
      console.error('Erro ao calcular vencedor:', error)
      alert(`Erro ao calcular vencedor: ${error.message || 'Erro desconhecido'}`)
    }
  }
  
  const confirmDraw = async () => {
    if (winningNumber === null) {
      alert('Calcule o número vencedor primeiro')
      return
    }
    
    const confirm = window.confirm(
      `Confirma o sorteio?\n\nNúmero vencedor: ${String(winningNumber).padStart(4, '0')}\n\nEsta ação não pode ser desfeita.`
    )
    
    if (confirm) {
      setIsLoading(true)
      try {
        // Aqui você salvaria o resultado no banco
        // await saveDrawResult(id, winningNumber, loteriaResult)
        
        alert('Sorteio realizado com sucesso!')
        router.push('/admin/winners')
      } catch (error) {
        alert('Erro ao salvar sorteio')
      } finally {
        setIsLoading(false)
      }
    }
  }
  
  const nextDrawDate = loteriaFederal.getNextDrawDate()
  const isDrawDay = loteriaFederal.isDrawDay()
  
  return (
    <div>
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="mb-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Voltar
        </button>
        
        <h1 className="text-3xl font-bold mb-2">Realizar Sorteio</h1>
        <p className="text-muted-foreground">
          Configure e realize o sorteio da rifa baseado na Loteria Federal
        </p>
      </div>
      
      {/* Informações da Rifa */}
      <div className="raffle-card mb-6">
        <h2 className="text-xl font-bold mb-4">Informações da Rifa</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Título</p>
            <p className="font-semibold">{raffleData?.title}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total de Números</p>
            <p className="font-semibold">{raffleData?.total_numbers}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Números Vendidos</p>
            <p className="font-semibold">{raffleData?.sold_numbers}</p>
          </div>
        </div>
      </div>
      
      {/* Método de Sorteio */}
      <div className="raffle-card mb-6">
        <h2 className="text-xl font-bold mb-4">Método de Sorteio</h2>
        
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setDrawMethod('federal')}
            className={`flex-1 p-4 rounded-lg border-2 transition-all ${
              drawMethod === 'federal'
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <div className="text-center">
              <span className="text-2xl mb-2 block">🎰</span>
              <p className="font-semibold">Loteria Federal</p>
              <p className="text-sm text-muted-foreground">
                Baseado no resultado oficial
              </p>
            </div>
          </button>
          
          <button
            onClick={() => setDrawMethod('manual')}
            className={`flex-1 p-4 rounded-lg border-2 transition-all ${
              drawMethod === 'manual'
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <div className="text-center">
              <span className="text-2xl mb-2 block">✏️</span>
              <p className="font-semibold">Sorteio Manual</p>
              <p className="text-sm text-muted-foreground">
                Inserir número manualmente
              </p>
            </div>
          </button>
        </div>
        
        {drawMethod === 'federal' && (
          <div className="space-y-4">
            {/* Status da Loteria Federal */}
            <div className="p-4 bg-secondary rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold">Status da Loteria Federal</p>
                {isDrawDay && (
                  <span className="px-2 py-1 bg-green-500/20 text-green-500 rounded-full text-xs font-semibold">
                    Dia de Sorteio
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Próximo sorteio: {nextDrawDate.toLocaleString('pt-BR')}
              </p>
            </div>
            
            {/* Buscar Concurso */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Número do Concurso (deixe 0 para o mais recente)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={drawConfig.concurso}
                  onChange={(e) => setDrawConfig({ ...drawConfig, concurso: parseInt(e.target.value) || 0 })}
                  className="flex-1 px-4 py-2 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none transition-colors"
                  placeholder="Ex: 5834"
                />
                <button
                  onClick={searchConcurso}
                  disabled={isLoading}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Buscando...' : 'Buscar'}
                </button>
              </div>
            </div>
            
            {/* Resultado da Loteria */}
            {loteriaResult && (
              <div className="p-4 bg-card border border-border rounded-lg">
                <h3 className="font-semibold mb-3">
                  Concurso {loteriaResult.concurso} - {loteriaResult.data}
                </h3>
                <div className="space-y-2">
                  {loteriaResult.premios?.map((premio: any) => (
                    <div
                      key={premio.premio}
                      className={`flex items-center justify-between p-2 rounded ${
                        drawConfig.prizePosition === premio.premio
                          ? 'bg-primary/20 border border-primary'
                          : 'bg-secondary'
                      }`}
                    >
                      <span className="text-sm font-medium">
                        {premio.premio}º Prêmio
                      </span>
                      <span className="font-mono font-bold text-lg">
                        {premio.numero}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Configurações do Sorteio */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Usar qual prêmio?
                </label>
                <select
                  value={drawConfig.prizePosition}
                  onChange={(e) => setDrawConfig({ ...drawConfig, prizePosition: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none transition-colors"
                >
                  <option value={1}>1º Prêmio</option>
                  <option value={2}>2º Prêmio</option>
                  <option value={3}>3º Prêmio</option>
                  <option value={4}>4º Prêmio</option>
                  <option value={5}>5º Prêmio</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Quantos dígitos finais usar?
                </label>
                <select
                  value={drawConfig.useLastDigits}
                  onChange={(e) => setDrawConfig({ ...drawConfig, useLastDigits: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none transition-colors"
                >
                  <option value={1}>1 dígito (0-9)</option>
                  <option value={2}>2 dígitos (00-99)</option>
                  <option value={3}>3 dígitos (000-999)</option>
                  <option value={4}>4 dígitos (0000-9999)</option>
                  <option value={5}>5 dígitos (todos)</option>
                </select>
              </div>
            </div>
          </div>
        )}
        
        {drawMethod === 'manual' && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Número Vencedor
            </label>
            <input
              type="number"
              value={manualNumber}
              onChange={(e) => setManualNumber(e.target.value)}
              min="0"
              max={raffleData?.total_numbers - 1}
              className="w-full px-4 py-2 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none transition-colors"
              placeholder={`Digite um número entre 0 e ${raffleData?.total_numbers - 1}`}
            />
          </div>
        )}
      </div>
      
      {/* Resultado do Sorteio */}
      <div className="raffle-card mb-6">
        <h2 className="text-xl font-bold mb-4">Resultado</h2>
        
        {winningNumber !== null ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">Número Vencedor</p>
            <p className="text-6xl font-bold text-primary mb-4">
              {String(winningNumber).padStart(4, '0')}
            </p>
            {drawMethod === 'federal' && loteriaResult && (
              <p className="text-sm text-muted-foreground">
                Baseado no {drawConfig.prizePosition}º prêmio do concurso {loteriaResult.concurso}
                <br />
                Número da Loteria: {loteriaResult.premios[drawConfig.prizePosition - 1]?.numero}
                <br />
                Usando os últimos {drawConfig.useLastDigits} dígito(s)
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>Clique em "Calcular Vencedor" para determinar o número sorteado</p>
          </div>
        )}
        
        <div className="flex gap-3 justify-center">
          <button
            onClick={calculateWinner}
            disabled={
              (drawMethod === 'federal' && !loteriaResult) ||
              (drawMethod === 'manual' && !manualNumber)
            }
            className="px-6 py-3 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 transition-colors disabled:opacity-50 font-semibold"
          >
            Calcular Vencedor
          </button>
          
          {winningNumber !== null && (
            <button
              onClick={confirmDraw}
              disabled={isLoading}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 font-semibold"
            >
              {isLoading ? 'Salvando...' : 'Confirmar Sorteio'}
            </button>
          )}
        </div>
      </div>
      
      {/* Avisos */}
      <div className="p-4 bg-yellow-500/10 border border-yellow-500 rounded-lg">
        <p className="text-yellow-500 font-semibold mb-2">⚠️ Importante</p>
        <ul className="text-sm space-y-1">
          <li>• O sorteio é irreversível após confirmação</li>
          <li>• O ganhador será notificado automaticamente</li>
          <li>• Certifique-se de que o concurso da Loteria Federal já foi realizado</li>
          <li>• Guarde o comprovante do sorteio para auditoria</li>
        </ul>
      </div>
    </div>
  )
}