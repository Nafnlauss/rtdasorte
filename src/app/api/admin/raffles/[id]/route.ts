import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const raffleId = params.id
    
    // Usar cliente admin para bypass RLS
    const supabase = createAdminClient()
    
    // Deletar em ordem correta devido às foreign keys
    
    // 1. Deletar transações
    const { error: transactionsError } = await supabase
      .from('transactions')
      .delete()
      .eq('raffle_id', raffleId)
    
    if (transactionsError) {
      console.error('Error deleting transactions:', transactionsError)
    }
    
    // 2. Deletar winners
    const { error: winnersError } = await supabase
      .from('winners')
      .delete()
      .eq('raffle_id', raffleId)
    
    if (winnersError) {
      console.error('Error deleting winners:', winnersError)
    }
    
    // 3. Deletar raffle_numbers
    const { error: numbersError } = await supabase
      .from('raffle_numbers')
      .delete()
      .eq('raffle_id', raffleId)
    
    if (numbersError) {
      console.error('Error deleting raffle numbers:', numbersError)
      // Continuar mesmo com erro, pois pode não ter números
    }
    
    // 4. Finalmente deletar a rifa
    const { error: raffleError } = await supabase
      .from('raffles')
      .delete()
      .eq('id', raffleId)
    
    if (raffleError) {
      console.error('Error deleting raffle:', raffleError)
      return NextResponse.json(
        { error: `Erro ao deletar rifa: ${raffleError.message}` },
        { status: 400 }
      )
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error: any) {
    console.error('Error in DELETE /api/admin/raffles/[id]:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao deletar rifa' },
      { status: 500 }
    )
  }
}