import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function setupAdminUser() {
  console.log('Setting up admin user...')
  
  try {
    // Create admin user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'slimc215@gmail.com',
      password: '62845_Madhouse',
      email_confirm: true,
    })
    
    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('Admin user already exists')
        
        // Update password if user exists
        const { data: users } = await supabase.auth.admin.listUsers()
        const adminUser = users?.users?.find(u => u.email === 'slimc215@gmail.com')
        
        if (adminUser) {
          const { error: updateError } = await supabase.auth.admin.updateUserById(
            adminUser.id,
            { password: '62845_Madhouse' }
          )
          
          if (updateError) {
            console.error('Error updating admin password:', updateError)
          } else {
            console.log('Admin password updated successfully')
          }
        }
      } else {
        throw authError
      }
    } else {
      console.log('Admin user created successfully')
      
      // Create user profile
      if (authData?.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: 'slimc215@gmail.com',
            name: 'Administrador',
            phone: '+5511999999999',
            is_admin: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        
        if (profileError) {
          console.error('Error creating admin profile:', profileError)
        } else {
          console.log('Admin profile created successfully')
        }
      }
    }
    
    console.log('Admin setup completed!')
    console.log('Email: slimc215@gmail.com')
    console.log('Password: 62845_Madhouse')
    
  } catch (error) {
    console.error('Error setting up admin:', error)
  }
}

setupAdminUser()