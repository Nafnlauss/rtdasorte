export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string | null
          phone: string
          name: string
          cpf: string | null
          birth_date: string | null
          avatar_url: string | null
          is_admin: boolean
          status: 'active' | 'suspended' | 'banned'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email?: string | null
          phone: string
          name: string
          cpf?: string | null
          birth_date?: string | null
          avatar_url?: string | null
          is_admin?: boolean
          status?: 'active' | 'suspended' | 'banned'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          phone?: string
          name?: string
          cpf?: string | null
          birth_date?: string | null
          avatar_url?: string | null
          is_admin?: boolean
          status?: 'active' | 'suspended' | 'banned'
          created_at?: string
          updated_at?: string
        }
      }
      raffles: {
        Row: {
          id: string
          title: string
          description: string
          prize_description: string
          image_url: string
          min_numbers: number
          max_numbers: number
          number_price: number
          total_numbers: number
          status: 'draft' | 'active' | 'paused' | 'finished' | 'cancelled'
          draw_date: string | null
          draw_type: 'manual' | 'lottery' | 'auto'
          winner_percentage: number | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          prize_description: string
          image_url: string
          min_numbers?: number
          max_numbers?: number
          number_price: number
          total_numbers: number
          status?: 'draft' | 'active' | 'paused' | 'finished' | 'cancelled'
          draw_date?: string | null
          draw_type?: 'manual' | 'lottery' | 'auto'
          winner_percentage?: number | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          prize_description?: string
          image_url?: string
          min_numbers?: number
          max_numbers?: number
          number_price?: number
          total_numbers?: number
          status?: 'draft' | 'active' | 'paused' | 'finished' | 'cancelled'
          draw_date?: string | null
          draw_type?: 'manual' | 'lottery' | 'auto'
          winner_percentage?: number | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      raffle_numbers: {
        Row: {
          id: string
          raffle_id: string
          number: number
          status: 'available' | 'reserved' | 'paid'
          user_id: string | null
          reserved_at: string | null
          paid_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          raffle_id: string
          number: number
          status?: 'available' | 'reserved' | 'paid'
          user_id?: string | null
          reserved_at?: string | null
          paid_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          raffle_id?: string
          number?: number
          status?: 'available' | 'reserved' | 'paid'
          user_id?: string | null
          reserved_at?: string | null
          paid_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          raffle_id: string
          amount: number
          status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'
          payment_method: 'pix' | 'credit_card' | 'debit_card' | 'boleto'
          payment_id: string | null
          numbers: number[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          raffle_id: string
          amount: number
          status?: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'
          payment_method: 'pix' | 'credit_card' | 'debit_card' | 'boleto'
          payment_id?: string | null
          numbers: number[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          raffle_id?: string
          amount?: number
          status?: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'
          payment_method?: 'pix' | 'credit_card' | 'debit_card' | 'boleto'
          payment_id?: string | null
          numbers?: number[]
          created_at?: string
          updated_at?: string
        }
      }
      winners: {
        Row: {
          id: string
          raffle_id: string
          user_id: string
          winning_number: number
          prize_description: string
          draw_date: string
          status: 'pending' | 'contacted' | 'delivered'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          raffle_id: string
          user_id: string
          winning_number: number
          prize_description: string
          draw_date: string
          status?: 'pending' | 'contacted' | 'delivered'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          raffle_id?: string
          user_id?: string
          winning_number?: number
          prize_description?: string
          draw_date?: string
          status?: 'pending' | 'contacted' | 'delivered'
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}