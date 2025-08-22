/**
 * Serviço para gerenciamento de números de rifas
 * Implementa seleção aleatória de números disponíveis
 */

import { createClient } from '@/lib/supabase/client'

export interface RaffleNumber {
  id?: string
  raffle_id: string
  number: number
  user_id?: string
  status: 'available' | 'reserved' | 'paid'
  reserved_at?: string
  paid_at?: string
  transaction_id?: string
}

export class RaffleNumberService {
  private supabase = createClient()
  
  /**
   * Seleciona números aleatórios disponíveis para uma rifa
   */
  async selectRandomNumbers(
    raffleId: string, 
    quantity: number,
    userId?: string
  ): Promise<number[]> {
    try {
      // Primeiro, buscar todos os números já vendidos ou reservados
      const { data: occupiedNumbers } = await this.supabase
        .from('raffle_numbers')
        .select('number')
        .eq('raffle_id', raffleId)
        .in('status', ['reserved', 'paid'])
      
      const occupiedSet = new Set(occupiedNumbers?.map(n => n.number) || [])
      
      // Buscar informações da rifa
      const { data: raffle } = await this.supabase
        .from('raffles')
        .select('total_numbers')
        .eq('id', raffleId)
        .single()
      
      if (!raffle) {
        throw new Error('Rifa não encontrada')
      }
      
      // Criar pool de números disponíveis
      const availableNumbers: number[] = []
      for (let i = 0; i < raffle.total_numbers; i++) {
        if (!occupiedSet.has(i)) {
          availableNumbers.push(i)
        }
      }
      
      // Verificar se há números suficientes disponíveis
      if (availableNumbers.length < quantity) {
        throw new Error(`Apenas ${availableNumbers.length} números disponíveis`)
      }
      
      // Selecionar números aleatórios
      const selectedNumbers: number[] = []
      const availableCopy = [...availableNumbers]
      
      for (let i = 0; i < quantity; i++) {
        const randomIndex = Math.floor(Math.random() * availableCopy.length)
        selectedNumbers.push(availableCopy[randomIndex])
        availableCopy.splice(randomIndex, 1) // Remove o número selecionado
      }
      
      // Ordenar os números selecionados para melhor visualização
      selectedNumbers.sort((a, b) => a - b)
      
      return selectedNumbers
    } catch (error) {
      console.error('Erro ao selecionar números aleatórios:', error)
      throw error
    }
  }
  
  /**
   * Reserva números para um usuário
   */
  async reserveNumbers(
    raffleId: string,
    numbers: number[],
    userId: string,
    reservationTime: number = 600000 // 10 minutos em ms
  ): Promise<boolean> {
    try {
      // Verificar disponibilidade antes de reservar
      const { data: existingNumbers } = await this.supabase
        .from('raffle_numbers')
        .select('number')
        .eq('raffle_id', raffleId)
        .in('number', numbers)
        .in('status', ['reserved', 'paid'])
      
      if (existingNumbers && existingNumbers.length > 0) {
        throw new Error('Alguns números já foram reservados por outro usuário')
      }
      
      // Criar registros de reserva
      const reservations = numbers.map(number => ({
        raffle_id: raffleId,
        number,
        user_id: userId,
        status: 'reserved' as const,
        reserved_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + reservationTime).toISOString()
      }))
      
      const { error } = await this.supabase
        .from('raffle_numbers')
        .insert(reservations)
      
      if (error) throw error
      
      return true
    } catch (error) {
      console.error('Erro ao reservar números:', error)
      throw error
    }
  }
  
  /**
   * Confirma o pagamento de números reservados
   */
  async confirmPayment(
    raffleId: string,
    numbers: number[],
    userId: string,
    transactionId: string
  ): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('raffle_numbers')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          transaction_id: transactionId
        })
        .eq('raffle_id', raffleId)
        .eq('user_id', userId)
        .in('number', numbers)
        .eq('status', 'reserved')
      
      if (error) throw error
      
      // Atualizar contador de números disponíveis na rifa
      const { data: raffle } = await this.supabase
        .from('raffles')
        .select('available_numbers')
        .eq('id', raffleId)
        .single()
      
      if (raffle) {
        await this.supabase
          .from('raffles')
          .update({
            available_numbers: raffle.available_numbers - numbers.length
          })
          .eq('id', raffleId)
      }
      
      return true
    } catch (error) {
      console.error('Erro ao confirmar pagamento:', error)
      throw error
    }
  }
  
  /**
   * Libera números reservados expirados
   */
  async releaseExpiredReservations(): Promise<number> {
    try {
      const now = new Date().toISOString()
      
      // Buscar reservas expiradas
      const { data: expiredReservations } = await this.supabase
        .from('raffle_numbers')
        .select('id, raffle_id')
        .eq('status', 'reserved')
        .lt('expires_at', now)
      
      if (!expiredReservations || expiredReservations.length === 0) {
        return 0
      }
      
      // Deletar reservas expiradas
      const { error } = await this.supabase
        .from('raffle_numbers')
        .delete()
        .in('id', expiredReservations.map(r => r.id))
      
      if (error) throw error
      
      // Atualizar contadores de números disponíveis
      const raffleGroups = expiredReservations.reduce((acc, res) => {
        acc[res.raffle_id] = (acc[res.raffle_id] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      for (const [raffleId, count] of Object.entries(raffleGroups)) {
        const { data: raffle } = await this.supabase
          .from('raffles')
          .select('available_numbers')
          .eq('id', raffleId)
          .single()
        
        if (raffle) {
          await this.supabase
            .from('raffles')
            .update({
              available_numbers: raffle.available_numbers + count
            })
            .eq('id', raffleId)
        }
      }
      
      return expiredReservations.length
    } catch (error) {
      console.error('Erro ao liberar reservas expiradas:', error)
      return 0
    }
  }
  
  /**
   * Busca números de um usuário em uma rifa
   */
  async getUserNumbers(
    raffleId: string,
    userId: string
  ): Promise<RaffleNumber[]> {
    try {
      const { data, error } = await this.supabase
        .from('raffle_numbers')
        .select('*')
        .eq('raffle_id', raffleId)
        .eq('user_id', userId)
        .order('number', { ascending: true })
      
      if (error) throw error
      
      return data || []
    } catch (error) {
      console.error('Erro ao buscar números do usuário:', error)
      return []
    }
  }
  
  /**
   * Formata número para exibição (com zeros à esquerda)
   */
  formatNumber(number: number, totalNumbers: number): string {
    const digits = totalNumbers.toString().length
    return number.toString().padStart(Math.max(digits, 4), '0')
  }
  
  /**
   * Gera relatório de vendas de uma rifa
   */
  async getSalesReport(raffleId: string) {
    try {
      const { data: numbers } = await this.supabase
        .from('raffle_numbers')
        .select('status')
        .eq('raffle_id', raffleId)
      
      const report = {
        total: numbers?.length || 0,
        paid: numbers?.filter(n => n.status === 'paid').length || 0,
        reserved: numbers?.filter(n => n.status === 'reserved').length || 0,
        available: 0
      }
      
      // Buscar total de números da rifa
      const { data: raffle } = await this.supabase
        .from('raffles')
        .select('total_numbers')
        .eq('id', raffleId)
        .single()
      
      if (raffle) {
        report.available = raffle.total_numbers - report.paid - report.reserved
      }
      
      return report
    } catch (error) {
      console.error('Erro ao gerar relatório de vendas:', error)
      throw error
    }
  }
}

// Exportar instância única
export const raffleNumberService = new RaffleNumberService()