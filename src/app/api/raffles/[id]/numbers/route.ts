import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { raffleNumberService } from '@/lib/services/raffle-numbers'

/**
 * GET - Busca números disponíveis ou do usuário
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const action = searchParams.get('action')
    
    if (action === 'report') {
      // Relatório de vendas
      const report = await raffleNumberService.getSalesReport(params.id)
      return NextResponse.json(report)
    }
    
    if (userId) {
      // Buscar números do usuário
      const numbers = await raffleNumberService.getUserNumbers(params.id, userId)
      return NextResponse.json(numbers)
    }
    
    // Buscar informações gerais da rifa
    const supabase = await createClient()
    const { data: raffle } = await supabase
      .from('raffles')
      .select('total_numbers, available_numbers')
      .eq('id', params.id)
      .single()
    
    return NextResponse.json({
      totalNumbers: raffle?.total_numbers || 0,
      availableNumbers: raffle?.available_numbers || 0
    })
  } catch (error) {
    console.error('Erro ao buscar números:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar números' },
      { status: 500 }
    )
  }
}

/**
 * POST - Seleciona números aleatórios
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { quantity, userId } = body
    
    if (!quantity || quantity < 1) {
      return NextResponse.json(
        { error: 'Quantidade inválida' },
        { status: 400 }
      )
    }
    
    // Selecionar números aleatórios
    const numbers = await raffleNumberService.selectRandomNumbers(
      params.id,
      quantity,
      userId
    )
    
    // Se tiver userId, reservar os números
    if (userId) {
      await raffleNumberService.reserveNumbers(params.id, numbers, userId)
    }
    
    return NextResponse.json({
      success: true,
      numbers,
      message: `${quantity} número(s) selecionado(s) aleatoriamente`
    })
  } catch (error: any) {
    console.error('Erro ao selecionar números:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao selecionar números' },
      { status: 500 }
    )
  }
}

/**
 * PUT - Confirma pagamento de números reservados
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { numbers, userId, transactionId } = body
    
    if (!numbers || !userId || !transactionId) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      )
    }
    
    const success = await raffleNumberService.confirmPayment(
      params.id,
      numbers,
      userId,
      transactionId
    )
    
    return NextResponse.json({
      success,
      message: 'Pagamento confirmado com sucesso'
    })
  } catch (error: any) {
    console.error('Erro ao confirmar pagamento:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao confirmar pagamento' },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Libera reservas expiradas
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const released = await raffleNumberService.releaseExpiredReservations()
    
    return NextResponse.json({
      success: true,
      released,
      message: `${released} reserva(s) expirada(s) liberada(s)`
    })
  } catch (error) {
    console.error('Erro ao liberar reservas:', error)
    return NextResponse.json(
      { error: 'Erro ao liberar reservas' },
      { status: 500 }
    )
  }
}