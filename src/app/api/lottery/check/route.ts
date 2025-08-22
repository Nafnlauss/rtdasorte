import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { loteriaFederal } from '@/lib/services/loteria-federal'

/**
 * API Route para verificação automática de resultados da Loteria Federal
 * Pode ser chamada via CRON job ou manualmente
 */
export async function GET() {
  try {
    const supabase = await createClient()
    
    // Buscar rifas ativas com sorteio programado para hoje
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const amanha = new Date(hoje)
    amanha.setDate(amanha.getDate() + 1)
    
    const { data: raffles, error } = await supabase
      .from('raffles')
      .select('*')
      .eq('status', 'active')
      .gte('draw_date', hoje.toISOString())
      .lt('draw_date', amanha.toISOString())
    
    if (error) {
      throw error
    }
    
    if (!raffles || raffles.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhuma rifa programada para sorteio hoje'
      })
    }
    
    // Buscar resultado da Loteria Federal
    const loteriaResult = await loteriaFederal.getLatestResult()
    
    if (!loteriaResult) {
      return NextResponse.json({
        success: false,
        message: 'Não foi possível obter o resultado da Loteria Federal'
      })
    }
    
    // Verificar se o sorteio já aconteceu (após 19h)
    const agora = new Date()
    if (agora.getHours() < 19) {
      return NextResponse.json({
        success: true,
        message: 'Aguardando horário do sorteio (19h)'
      })
    }
    
    // Processar cada rifa
    const results = []
    for (const raffle of raffles) {
      try {
        // Determinar número vencedor
        const winningNumber = loteriaFederal.determineWinningNumber(
          loteriaResult,
          raffle.total_numbers,
          {
            type: 'federal',
            prizePosition: raffle.lottery_prize_position || 1,
            useLastDigits: raffle.lottery_use_digits || 4
          }
        )
        
        // Buscar o dono do número vencedor
        const { data: winningTicket } = await supabase
          .from('raffle_numbers')
          .select('*, users(*)')
          .eq('raffle_id', raffle.id)
          .eq('number', winningNumber)
          .eq('status', 'paid')
          .single()
        
        if (winningTicket) {
          // Registrar o ganhador
          const { error: winnerError } = await supabase
            .from('winners')
            .insert({
              raffle_id: raffle.id,
              user_id: winningTicket.user_id,
              ticket_id: winningTicket.id,
              winning_number: winningNumber,
              lottery_concurso: loteriaResult.concurso,
              lottery_result: JSON.stringify(loteriaResult),
              prize_amount: raffle.prize_value || 0,
              prize_description: raffle.title,
              draw_date: new Date().toISOString(),
              delivered: false
            })
          
          if (winnerError) {
            throw winnerError
          }
          
          // Atualizar status da rifa
          await supabase
            .from('raffles')
            .update({ 
              status: 'finished',
              winner_number: winningNumber,
              lottery_concurso: loteriaResult.concurso
            })
            .eq('id', raffle.id)
          
          results.push({
            raffleId: raffle.id,
            raffleTitle: raffle.title,
            winningNumber,
            winner: winningTicket.users?.name || 'Desconhecido',
            status: 'success'
          })
          
          // TODO: Enviar notificação para o ganhador
          // await sendWinnerNotification(winningTicket.users)
        } else {
          // Nenhum ganhador (número não foi vendido)
          results.push({
            raffleId: raffle.id,
            raffleTitle: raffle.title,
            winningNumber,
            winner: null,
            status: 'no_winner'
          })
        }
      } catch (raffleError) {
        console.error(`Erro ao processar rifa ${raffle.id}:`, raffleError)
        results.push({
          raffleId: raffle.id,
          raffleTitle: raffle.title,
          status: 'error',
          error: String(raffleError)
        })
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `${results.length} rifas processadas`,
      loteriaResult: {
        concurso: loteriaResult.concurso,
        data: loteriaResult.data,
        premios: loteriaResult.premios
      },
      results
    })
  } catch (error) {
    console.error('Erro na verificação automática:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Erro ao processar verificação automática',
        error: String(error)
      },
      { status: 500 }
    )
  }
}

/**
 * Endpoint para forçar verificação manual
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { raffleId, concurso } = body
    
    if (!raffleId) {
      return NextResponse.json(
        { success: false, message: 'ID da rifa é obrigatório' },
        { status: 400 }
      )
    }
    
    const supabase = await createClient()
    
    // Buscar dados da rifa
    const { data: raffle, error } = await supabase
      .from('raffles')
      .select('*')
      .eq('id', raffleId)
      .single()
    
    if (error || !raffle) {
      return NextResponse.json(
        { success: false, message: 'Rifa não encontrada' },
        { status: 404 }
      )
    }
    
    // Buscar resultado da Loteria Federal
    const loteriaResult = concurso
      ? await loteriaFederal.getResultByConcurso(concurso)
      : await loteriaFederal.getLatestResult()
    
    if (!loteriaResult) {
      return NextResponse.json(
        { success: false, message: 'Não foi possível obter o resultado da Loteria Federal' },
        { status: 500 }
      )
    }
    
    // Determinar número vencedor
    const winningNumber = loteriaFederal.determineWinningNumber(
      loteriaResult,
      raffle.total_numbers,
      {
        type: 'federal',
        prizePosition: raffle.lottery_prize_position || 1,
        useLastDigits: raffle.lottery_use_digits || 4
      }
    )
    
    return NextResponse.json({
      success: true,
      raffle: {
        id: raffle.id,
        title: raffle.title,
        totalNumbers: raffle.total_numbers
      },
      loteriaResult: {
        concurso: loteriaResult.concurso,
        data: loteriaResult.data,
        premios: loteriaResult.premios
      },
      winningNumber,
      formattedNumber: String(winningNumber).padStart(4, '0')
    })
  } catch (error) {
    console.error('Erro na verificação manual:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Erro ao processar verificação manual',
        error: String(error)
      },
      { status: 500 }
    )
  }
}