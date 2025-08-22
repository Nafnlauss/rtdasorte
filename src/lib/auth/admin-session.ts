// Gerenciamento de sessão admin temporária
// Até que o email seja confirmado no Supabase

import { createClient } from '@/lib/supabase/client'

// ID fixo temporário para admin
// Em produção, isso deve vir do Supabase após confirmação do email
const TEMP_ADMIN_USER_ID = 'admin-temp-' + Buffer.from('slimc215@gmail.com').toString('base64')

export async function createAdminSession(email: string) {
  // Salvar no localStorage que é admin
  localStorage.setItem('isAdmin', 'true')
  localStorage.setItem('adminEmail', email)
  localStorage.setItem('adminUserId', TEMP_ADMIN_USER_ID)
  
  // Criar uma sessão temporária simulada
  const tempSession = {
    user_id: TEMP_ADMIN_USER_ID,
    email: email,
    role: 'admin',
    created_at: new Date().toISOString()
  }
  
  localStorage.setItem('adminTempSession', JSON.stringify(tempSession))
  
  return tempSession
}

export function getAdminSession() {
  const sessionStr = localStorage.getItem('adminTempSession')
  if (!sessionStr) return null
  
  try {
    return JSON.parse(sessionStr)
  } catch {
    return null
  }
}

export function getAdminUserId() {
  // Primeiro tenta pegar da sessão temporária
  const tempSession = getAdminSession()
  if (tempSession?.user_id) {
    return tempSession.user_id
  }
  
  // Fallback para localStorage
  return localStorage.getItem('adminUserId') || TEMP_ADMIN_USER_ID
}

export function clearAdminSession() {
  localStorage.removeItem('isAdmin')
  localStorage.removeItem('adminEmail')
  localStorage.removeItem('adminUserId')
  localStorage.removeItem('adminTempSession')
}