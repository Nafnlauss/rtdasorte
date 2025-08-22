// Simple admin authentication without Supabase
// This is a temporary solution until Supabase Service Role Key is configured

const ADMIN_CREDENTIALS = {
  email: 'slimc215@gmail.com',
  password: '62845_Madhouse'
}

export function validateAdminCredentials(email: string, password: string): boolean {
  return email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password
}

export function isAdminEmail(email: string): boolean {
  return email === ADMIN_CREDENTIALS.email
}