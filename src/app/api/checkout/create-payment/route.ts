import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { paySamba } from '@/lib/services/paysamba'
import { z } from 'zod'

const createPaymentSchema = z.object({
  raffleId: z.string().uuid(),
  numbers: z.array(z.number()).min(1),
  customer: z.object({
    name: z.string().min(1),
    cpf: z.string().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos'),
    email: z.string().email(),
    phone: z.string().regex(/^\d{10,11}$/, 'Telefone deve ter 10 ou 11 dígitos')
  })
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Create payment request:', body)
    
    // Validar dados de entrada
    const validationResult = createPaymentSchema.safeParse(body)
    if (!validationResult.success) {
      console.error('Validation failed:', validationResult.error.errors)
      return NextResponse.json(
        { error: 'Dados inválidos', details: validationResult.error.errors },
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
    console.log('Checking numbers availability:', { raffleId, numbers })
    const { data: raffleNumbers, error: numbersError } = await supabase
      .from('raffle_numbers')
      .select('*')
      .eq('raffle_id', raffleId)
      .in('number', numbers)

    if (numbersError) {
      console.error('Error checking numbers:', numbersError)
      return NextResponse.json(
        { error: 'Erro ao verificar disponibilidade dos números' },
        { status: 500 }
      )
    }

    console.log('Found raffle numbers:', raffleNumbers?.length)
    
    // Se não encontrou registros na tabela raffle_numbers, criar
    if (!raffleNumbers || raffleNumbers.length === 0) {
      console.log('No numbers found in raffle_numbers table, creating...')
      
      // Criar registros para os números selecionados
      const numbersToInsert = numbers.map(num => ({
        raffle_id: raffleId,
        number: num,
        status: 'available'
      }))
      
      const { error: insertError } = await supabase
        .from('raffle_numbers')
        .insert(numbersToInsert)
      
      if (insertError) {
        console.error('Error creating numbers:', insertError)
        return NextResponse.json(
          { error: 'Erro ao criar números' },
          { status: 500 }
        )
      }
      
      // Buscar novamente após criar
      const { data: newRaffleNumbers } = await supabase
        .from('raffle_numbers')
        .select('*')
        .eq('raffle_id', raffleId)
        .in('number', numbers)
      
      raffleNumbers.push(...(newRaffleNumbers || []))
    }

    // Verificar se todos os números estão disponíveis
    const unavailableNumbers = raffleNumbers.filter(n => n.status !== 'available')
    if (unavailableNumbers.length > 0) {
      console.log('Unavailable numbers found:', unavailableNumbers)
      return NextResponse.json(
        { 
          error: 'Alguns números não estão disponíveis',
          unavailable: unavailableNumbers.map(n => n.number)
        },
        { status: 400 }
      )
    }

    // 3. Criar ou buscar usuário
    let userId: string
    
    console.log('Looking for user with CPF:', customer.cpf)
    const { data: existingUser, error: userLookupError } = await supabase
      .from('users')
      .select('id')
      .eq('cpf', customer.cpf)
      .single()

    if (userLookupError && userLookupError.code !== 'PGRST116') {
      console.error('Error looking up user:', userLookupError)
    }

    if (existingUser) {
      console.log('Found existing user:', existingUser.id)
      userId = existingUser.id
    } else {
      console.log('Creating new user...')
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
        console.error('Failed to create user:', userError)
        return NextResponse.json(
          { error: 'Erro ao criar usuário', details: userError?.message },
          { status: 500 }
        )
      }
      
      console.log('Created new user:', newUser.id)
      userId = newUser.id
    }

    // 4. Calcular valor total
    const totalAmount = numbers.length * raffle.number_price
    console.log('Total amount:', totalAmount)

    // 5. Criar transação no banco
    console.log('Creating transaction...')
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
      console.error('Failed to create transaction:', transactionError)
      return NextResponse.json(
        { error: 'Erro ao criar transação', details: transactionError?.message },
        { status: 500 }
      )
    }
    
    console.log('Transaction created:', transaction.id)

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
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}