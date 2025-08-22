import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { paySamba, type WebhookPayload } from '@/lib/services/paysamba'

export async function POST(request: NextRequest) {
  try {
    // PaySamba envia callback simples sem autenticação
    // Recomendação deles: validar consultando a transação pela API
    const payload = await request.json()
    
    console.log('PaySamba callback received:', payload)
    
    // Estrutura do payload conforme documentação:
    // {
    //   "id": "cm9bxoogh01iz5m291tmoavss",
    //   "amount": 10.90,
    //   "status": "COMPLETED",
    //   "type": "DEPOSIT",
    //   "receiverName": "Loja Exemplo LTDA",
    //   "receiverDocument": "12345678000199",
    //   "payerName": "João Silva",
    //   "payerDocument": "00000000000"
    // }
    
    const { id: paymentId, status, type, amount } = payload
    
    // Validar consultando a transação na API (recomendado pela PaySamba)
    try {
      const verifiedPayment = await paySamba.getPayment(paymentId)
      
      // Verificar se os dados batem
      if (verifiedPayment.status !== status || verifiedPayment.amount !== amount) {
        console.error('Payment data mismatch - possible fraud attempt')
        return NextResponse.json(
          { error: 'Invalid payment data' },
          { status: 400 }
        )
      }
    } catch (error) {
      console.error('Failed to verify payment:', error)
      // Continuar mesmo se a verificação falhar (pode ser problema temporário)
    }

    console.log(`Payment ${paymentId} status: ${status}`)

    const supabase = await createClient()
    
    // Buscar transação pelo payment_id
    const { data: transaction } = await supabase
      .from('transactions')
      .select('*')
      .eq('payment_id', paymentId)
      .single()
    
    if (!transaction) {
      console.error('Transaction not found for payment:', paymentId)
      return NextResponse.json({ success: true }) // Retorna sucesso para não reenviar
    }

    // Processar baseado no status (PaySamba usa status, não events)
    switch (status) {
      case 'COMPLETED':
        // Pagamento confirmado
        await handlePaymentCompleted(supabase, paymentId, transaction)
        break

      case 'CANCELED':
      case 'REFUNDED':
        // Pagamento cancelado ou reembolsado
        await handlePaymentFailed(supabase, paymentId, transaction)
        break

      case 'EXPIRED':
        // Pagamento expirou
        await handlePaymentExpired(supabase, paymentId, transaction)
        break

      case 'PENDING':
        // Ainda aguardando - não fazer nada
        console.log(`Payment ${paymentId} still pending`)
        break

      default:
        console.log(`Unknown status: ${status}`)
    }

    // Retornar sucesso para o PaySamba
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handlePaymentCompleted(supabase: any, paymentId: string, transaction: any) {
  // Verificar se já foi processado
  if (transaction.status === 'completed') {
    console.log('Transaction already completed')
    return
  }

  // 1. Atualizar status da transação
  const { error: transactionError } = await supabase
    .from('transactions')
    .update({
      status: 'completed',
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', transaction.id)

  if (transactionError) {
    console.error('Failed to update transaction:', transactionError)
    throw transactionError
  }

  // 2. Atualizar status dos números para 'paid'
  if (transaction.numbers && transaction.numbers.length > 0) {
    const { error: numbersError } = await supabase
      .from('raffle_numbers')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString()
      })
      .eq('raffle_id', transaction.raffle_id)
      .in('number', transaction.numbers)
      .eq('user_id', transaction.user_id)

    if (numbersError) {
      console.error('Failed to update numbers:', numbersError)
    }
  }

  // 3. Criar notificação para o usuário
  await supabase
    .from('notifications')
    .insert({
      user_id: transaction.user_id,
      type: 'payment_confirmed',
      title: 'Pagamento Confirmado! ✅',
      message: `Seu pagamento foi confirmado. Números ${transaction.numbers.join(', ')} garantidos!`,
      data: {
        transaction_id: transaction.id,
        raffle_id: transaction.raffle_id,
        numbers: transaction.numbers,
        amount: transaction.amount
      }
    })

  console.log(`Payment ${paymentId} successfully processed`)
}

async function handlePaymentFailed(supabase: any, paymentId: string, transaction: any) {
  // Verificar se já foi processado
  if (transaction.status === 'failed' || transaction.status === 'cancelled') {
    console.log('Transaction already failed/cancelled')
    return
  }

  // 1. Atualizar status da transação
  const { error: transactionError } = await supabase
    .from('transactions')
    .update({
      status: 'failed',
      updated_at: new Date().toISOString()
    })
    .eq('id', transaction.id)

  if (transactionError) {
    console.error('Failed to update transaction:', transactionError)
  }

  // 2. Liberar números reservados
  if (transaction.numbers && transaction.numbers.length > 0) {
    const { error: numbersError } = await supabase
      .from('raffle_numbers')
      .update({
        status: 'available',
        user_id: null,
        reserved_at: null,
        expires_at: null,
        transaction_id: null
      })
      .eq('raffle_id', transaction.raffle_id)
      .in('number', transaction.numbers)
      .eq('status', 'reserved')

    if (numbersError) {
      console.error('Failed to release numbers:', numbersError)
    }
  }

  // 3. Criar notificação para o usuário
  await supabase
    .from('notifications')
    .insert({
      user_id: transaction.user_id,
      type: 'payment_failed',
      title: 'Pagamento não processado ❌',
      message: 'Houve um problema com seu pagamento. Por favor, tente novamente.',
      data: {
        transaction_id: transaction.id,
        raffle_id: transaction.raffle_id,
        numbers: transaction.numbers
      }
    })

  console.log(`Payment ${paymentId} failed - numbers released`)
}

async function handlePaymentExpired(supabase: any, paymentId: string, transaction: any) {
  // Verificar se já foi processado
  if (transaction.status === 'failed' || transaction.status === 'expired') {
    console.log('Transaction already expired/failed')
    return
  }

  // 1. Atualizar status da transação
  const { error: transactionError } = await supabase
    .from('transactions')
    .update({
      status: 'failed',
      updated_at: new Date().toISOString()
    })
    .eq('id', transaction.id)

  if (transactionError) {
    console.error('Failed to update transaction:', transactionError)
  }

  // 2. Liberar números reservados
  if (transaction.numbers && transaction.numbers.length > 0) {
    const { error: numbersError } = await supabase
      .from('raffle_numbers')
      .update({
        status: 'available',
        user_id: null,
        reserved_at: null,
        expires_at: null,
        transaction_id: null
      })
      .eq('raffle_id', transaction.raffle_id)
      .in('number', transaction.numbers)
      .eq('status', 'reserved')

    if (numbersError) {
      console.error('Failed to release numbers:', numbersError)
    }
  }

  // 3. Criar notificação para o usuário
  await supabase
    .from('notifications')
    .insert({
      user_id: transaction.user_id,
      type: 'payment_expired',
      title: 'Pagamento Expirado ⏰',
      message: 'O tempo para pagamento expirou. Seus números foram liberados.',
      data: {
        transaction_id: transaction.id,
        raffle_id: transaction.raffle_id,
        numbers: transaction.numbers
      }
    })

  console.log(`Payment ${paymentId} expired - numbers released`)
}

// Webhook de teste para desenvolvimento
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 404 }
    )
  }

  return NextResponse.json({
    status: 'ok',
    message: 'PaySamba webhook endpoint',
    test_endpoint: '/api/webhooks/paysamba/test'
  })
}