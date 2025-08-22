import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { paySamba } from '@/lib/services/paysamba'
import { z } from 'zod'

const createPaymentSchema = z.object({
  raffleId: z.string().uuid(),
  numbers: z.array(z.number()).min(1),
  customer: z.object({
    name: z.string().min(3),
    cpf: z.string().regex(/^\d{11}$/),
    email: z.string().email().optional(),
    phone: z.string().regex(/^\d{10,11}$/)
  })
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar dados de entrada
    const validationResult = createPaymentSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { raffleId, numbers, customer } = validationResult.data
    const supabase = await createClient()

    // 1. Buscar informações da rifa
    const { data: raffle, error: raffleError } = await supabase
      .from('raffles')
      .select('*')
      .eq('id', raffleId)
      .single()

    if (raffleError || !raffle) {
      return NextResponse.json(
        { error: 'Raffle not found' },
        { status: 404 }
      )
    }

    // 2. Verificar disponibilidade dos números
    const { data: raffleNumbers, error: numbersError } = await supabase
      .from('raffle_numbers')
      .select('*')
      .eq('raffle_id', raffleId)
      .in('number', numbers)

    if (numbersError) {
      return NextResponse.json(
        { error: 'Failed to check number availability' },
        { status: 500 }
      )
    }

    // Verificar se todos os números estão disponíveis
    const unavailableNumbers = raffleNumbers.filter(n => n.status !== 'available')
    if (unavailableNumbers.length > 0) {
      return NextResponse.json(
        { 
          error: 'Some numbers are not available',
          unavailable: unavailableNumbers.map(n => n.number)
        },
        { status: 400 }
      )
    }

    // 3. Criar ou buscar usuário
    let userId: string
    
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('cpf', customer.cpf)
      .single()

    if (existingUser) {
      userId = existingUser.id
    } else {
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({
          name: customer.name,
          cpf: customer.cpf,
          email: customer.email,
          phone: customer.phone,
          status: 'active'
        })
        .select('id')
        .single()

      if (userError || !newUser) {
        return NextResponse.json(
          { error: 'Failed to create user' },
          { status: 500 }
        )
      }
      
      userId = newUser.id
    }

    // 4. Calcular valor total
    const totalAmount = numbers.length * raffle.number_price

    // 5. Criar transação no banco
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        raffle_id: raffleId,
        amount: totalAmount,
        quantity: numbers.length,
        numbers: numbers,
        status: 'pending',
        payment_method: 'pix'
      })
      .select()
      .single()

    if (transactionError || !transaction) {
      return NextResponse.json(
        { error: 'Failed to create transaction' },
        { status: 500 }
      )
    }

    // 6. Reservar números
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 30) // 30 minutos para pagar

    const { error: reserveError } = await supabase
      .from('raffle_numbers')
      .update({
        status: 'reserved',
        user_id: userId,
        reserved_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        transaction_id: transaction.id
      })
      .eq('raffle_id', raffleId)
      .in('number', numbers)

    if (reserveError) {
      // Reverter transação se falhar ao reservar números
      await supabase
        .from('transactions')
        .delete()
        .eq('id', transaction.id)
      
      return NextResponse.json(
        { error: 'Failed to reserve numbers' },
        { status: 500 }
      )
    }

    // 7. Criar pagamento no PaySamba
    try {
      const pixPayment = await paySamba.createPixPayment({
        amount: totalAmount,
        customer: {
          name: customer.name,
          cpf_cnpj: customer.cpf,
          email: customer.email,
          phone: customer.phone
        },
        description: `Rifa: ${raffle.title} - Números: ${numbers.join(', ')}`,
        expires_in: 30, // 30 minutos
        metadata: {
          transaction_id: transaction.id,
          raffle_id: raffleId,
          user_id: userId,
          numbers: numbers
        }
      })

      // 8. Atualizar transação com dados do PIX
      await supabase
        .from('transactions')
        .update({
          payment_id: pixPayment.id,
          pix_code: pixPayment.pix_code,
          pix_qrcode: pixPayment.pix_qrcode,
          updated_at: new Date().toISOString()
        })
        .eq('id', transaction.id)

      // 9. Retornar dados do pagamento
      return NextResponse.json({
        success: true,
        transaction: {
          id: transaction.id,
          amount: totalAmount,
          numbers: numbers,
          status: 'pending'
        },
        payment: {
          id: pixPayment.id,
          pix_code: pixPayment.pix_code,
          pix_qrcode: pixPayment.pix_qrcode,
          expires_at: pixPayment.expires_at,
          amount: totalAmount
        },
        redirect_url: `/payment/${transaction.id}`
      })

    } catch (paymentError: any) {
      console.error('PaySamba error:', paymentError)
      
      // Reverter reserva e transação em caso de erro
      await supabase
        .from('raffle_numbers')
        .update({
          status: 'available',
          user_id: null,
          reserved_at: null,
          expires_at: null,
          transaction_id: null
        })
        .eq('raffle_id', raffleId)
        .in('number', numbers)

      await supabase
        .from('transactions')
        .delete()
        .eq('id', transaction.id)

      return NextResponse.json(
        { error: 'Failed to create payment', details: paymentError.message },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}