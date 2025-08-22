/**
 * Serviço de integração com a Loteria Federal
 * 
 * APIs disponíveis para consulta:
 * - Lotodicas API: https://api.lotodicas.com.br
 * - Caixa Econômica (scraping necessário)
 * 
 * O sorteio da Loteria Federal acontece:
 * - Quartas e sábados às 19h
 * - 5 prêmios sorteados por concurso
 */

interface LoteriaFederalResult {
  concurso: number
  data: string
  premios: {
    premio: number
    numero: string
    valor?: number
  }[]
}

interface RaffleDrawMethod {
  type: 'federal' | 'custom'
  concurso?: number
  useLastDigits?: number // Quantos dígitos finais usar (1-4)
  prizePosition?: number // Qual prêmio usar (1-5)
}

export class LoteriaFederalService {
  private baseUrl = 'https://servicebus2.caixa.gov.br/portaldeloterias/api/federal'
  
  /**
   * Busca o resultado mais recente da Loteria Federal
   */
  async getLatestResult(): Promise<LoteriaFederalResult | null> {
    try {
      // Tentativa 1: API não oficial mas funcional
      const response = await fetch(this.baseUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      })
      
      if (!response.ok) {
        // Fallback: usar API alternativa
        return await this.getResultFromAlternativeAPI()
      }
      
      const data = await response.json()
      
      return {
        concurso: data.numero,
        data: data.dataApuracao,
        premios: data.listaDezenas?.map((dezena: any, index: number) => ({
          premio: index + 1,
          numero: dezena.dezena,
          valor: dezena.valorPremio
        })) || []
      }
    } catch (error) {
      console.error('Erro ao buscar resultado da Loteria Federal:', error)
      return await this.getResultFromAlternativeAPI()
    }
  }
  
  /**
   * Busca resultado de um concurso específico
   */
  async getResultByConcurso(concurso: number): Promise<LoteriaFederalResult | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${concurso}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      })
      
      if (!response.ok) {
        return null
      }
      
      const data = await response.json()
      
      return {
        concurso: data.numero,
        data: data.dataApuracao,
        premios: data.listaDezenas?.map((dezena: any, index: number) => ({
          premio: index + 1,
          numero: dezena.dezena,
          valor: dezena.valorPremio
        })) || []
      }
    } catch (error) {
      console.error('Erro ao buscar concurso específico:', error)
      return null
    }
  }
  
  /**
   * API alternativa usando scraping ou serviços terceiros
   */
  private async getResultFromAlternativeAPI(): Promise<LoteriaFederalResult | null> {
    try {
      // Opção 1: API Lotodicas (não oficial mas confiável)
      const response = await fetch('https://loteriascaixa-api.herokuapp.com/api/federal/latest')
      
      if (!response.ok) {
        throw new Error('API alternativa também falhou')
      }
      
      const data = await response.json()
      
      return {
        concurso: data.concurso,
        data: data.data,
        premios: data.premios || []
      }
    } catch (error) {
      console.error('Erro na API alternativa:', error)
      
      // Última opção: retornar dados mockados para desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        return this.getMockResult()
      }
      
      return null
    }
  }
  
  /**
   * Dados mockados para desenvolvimento
   */
  private getMockResult(): LoteriaFederalResult {
    const hoje = new Date()
    return {
      concurso: 5800 + Math.floor(Math.random() * 100),
      data: hoje.toISOString().split('T')[0],
      premios: [
        { premio: 1, numero: String(Math.floor(Math.random() * 100000)).padStart(5, '0'), valor: 500000 },
        { premio: 2, numero: String(Math.floor(Math.random() * 100000)).padStart(5, '0'), valor: 27000 },
        { premio: 3, numero: String(Math.floor(Math.random() * 100000)).padStart(5, '0'), valor: 24000 },
        { premio: 4, numero: String(Math.floor(Math.random() * 100000)).padStart(5, '0'), valor: 19000 },
        { premio: 5, numero: String(Math.floor(Math.random() * 100000)).padStart(5, '0'), valor: 18000 },
      ]
    }
  }
  
  /**
   * Determina o número vencedor baseado no resultado da Loteria Federal
   */
  determineWinningNumber(
    loteriaResult: LoteriaFederalResult,
    totalNumbers: number,
    method: RaffleDrawMethod = { type: 'federal', useLastDigits: 4, prizePosition: 1 }
  ): number {
    if (!loteriaResult?.premios || loteriaResult.premios.length === 0) {
      throw new Error('Resultado da loteria inválido')
    }
    
    // Pega o prêmio especificado (padrão: 1º prêmio)
    const prizeIndex = (method.prizePosition || 1) - 1
    const prize = loteriaResult.premios[prizeIndex] || loteriaResult.premios[0]
    
    // Valida se o prêmio tem número
    if (!prize || !prize.numero) {
      throw new Error('Prêmio da loteria não possui número válido')
    }
    
    // Pega os últimos dígitos conforme configurado
    const digits = method.useLastDigits || 4
    const prizeNumber = prize.numero.slice(-digits)
    
    // Converte para número
    let winningNumber = parseInt(prizeNumber, 10)
    
    // Ajusta para o range da rifa (0 a totalNumbers-1)
    if (winningNumber >= totalNumbers) {
      // Se o número for maior que o total, usa módulo
      winningNumber = winningNumber % totalNumbers
    }
    
    return winningNumber
  }
  
  /**
   * Verifica se há sorteio da Loteria Federal hoje
   */
  isDrawDay(): boolean {
    const hoje = new Date()
    const diaSemana = hoje.getDay()
    
    // Quarta (3) ou Sábado (6)
    return diaSemana === 3 || diaSemana === 6
  }
  
  /**
   * Próxima data de sorteio
   */
  getNextDrawDate(): Date {
    const hoje = new Date()
    const diaSemana = hoje.getDay()
    
    let diasParaProximo = 0
    
    if (diaSemana < 3) {
      // Antes de quarta
      diasParaProximo = 3 - diaSemana
    } else if (diaSemana === 3) {
      // Quarta-feira
      const hora = hoje.getHours()
      if (hora < 19) {
        diasParaProximo = 0 // Hoje mesmo
      } else {
        diasParaProximo = 3 // Próximo sábado
      }
    } else if (diaSemana < 6) {
      // Entre quarta e sábado
      diasParaProximo = 6 - diaSemana
    } else if (diaSemana === 6) {
      // Sábado
      const hora = hoje.getHours()
      if (hora < 19) {
        diasParaProximo = 0 // Hoje mesmo
      } else {
        diasParaProximo = 4 // Próxima quarta
      }
    } else {
      // Domingo
      diasParaProximo = 3
    }
    
    const proximaData = new Date(hoje)
    proximaData.setDate(hoje.getDate() + diasParaProximo)
    proximaData.setHours(19, 0, 0, 0)
    
    return proximaData
  }
  
  /**
   * Formata o resultado para exibição
   */
  formatResult(result: LoteriaFederalResult): string {
    const premios = result.premios
      .map(p => `${p.premio}º Prêmio: ${p.numero}`)
      .join('\n')
    
    return `Concurso ${result.concurso} - ${result.data}\n${premios}`
  }
}

// Exporta instância única
export const loteriaFederal = new LoteriaFederalService()