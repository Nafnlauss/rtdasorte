export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      login_logs: {
        Row: {
          device_info: string | null
          id: string
          ip_address: unknown | null
          login_at: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          device_info?: string | null
          id?: string
          ip_address?: unknown | null
          login_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          device_info?: string | null
          id?: string
          ip_address?: unknown | null
          login_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          message: string | null
          read: boolean | null
          read_at: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message?: string | null
          read?: boolean | null
          read_at?: string | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message?: string | null
          read?: boolean | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
      }
      profiles: {
        Row: {
          avatar_url: string | null
          birth_date: string | null
          cpf: string | null
          created_at: string | null
          id: string
          is_admin: boolean | null
          name: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          birth_date?: string | null
          cpf?: string | null
          created_at?: string | null
          id: string
          is_admin?: boolean | null
          name: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string | null
          cpf?: string | null
          created_at?: string | null
          id?: string
          is_admin?: boolean | null
          name?: string
          phone?: string | null
          updated_at?: string | null
        }
      }
      raffle_numbers: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          number: number
          paid_at: string | null
          raffle_id: string
          reserved_at: string | null
          status: string | null
          transaction_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          number: number
          paid_at?: string | null
          raffle_id: string
          reserved_at?: string | null
          status?: string | null
          transaction_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          number?: number
          paid_at?: string | null
          raffle_id?: string
          reserved_at?: string | null
          status?: string | null
          transaction_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
      }
      raffles: {
        Row: {
          available_numbers: number | null
          created_at: string | null
          created_by: string
          description: string
          draw_date: string | null
          draw_type: string | null
          id: string
          image_url: string
          manual_progress: number | null
          max_numbers: number | null
          min_numbers: number | null
          number_price: number
          prize_description: string
          progress_override: boolean | null
          purchase_config: Json | null
          regulations: string | null
          show_progress_bar: boolean | null
          status: string | null
          title: string
          total_numbers: number
          updated_at: string | null
          winner_percentage: number | null
        }
        Insert: {
          available_numbers?: number | null
          created_at?: string | null
          created_by: string
          description: string
          draw_date?: string | null
          draw_type?: string | null
          id?: string
          image_url: string
          manual_progress?: number | null
          max_numbers?: number | null
          min_numbers?: number | null
          number_price: number
          prize_description: string
          progress_override?: boolean | null
          purchase_config?: Json | null
          regulations?: string | null
          show_progress_bar?: boolean | null
          status?: string | null
          title: string
          total_numbers: number
          updated_at?: string | null
          winner_percentage?: number | null
        }
        Update: {
          available_numbers?: number | null
          created_at?: string | null
          created_by?: string
          description?: string
          draw_date?: string | null
          draw_type?: string | null
          id?: string
          image_url?: string
          manual_progress?: number | null
          max_numbers?: number | null
          min_numbers?: number | null
          number_price?: number
          prize_description?: string
          progress_override?: boolean | null
          purchase_config?: Json | null
          regulations?: string | null
          show_progress_bar?: boolean | null
          status?: string | null
          title?: string
          total_numbers?: number
          updated_at?: string | null
          winner_percentage?: number | null
        }
      }
      transactions: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          numbers: number[]
          paid_at: string | null
          payment_id: string | null
          payment_method: string
          pix_code: string | null
          pix_qrcode: string | null
          quantity: number | null
          raffle_id: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          numbers: number[]
          paid_at?: string | null
          payment_id?: string | null
          payment_method: string
          pix_code?: string | null
          pix_qrcode?: string | null
          quantity?: number | null
          raffle_id: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          numbers?: number[]
          paid_at?: string | null
          payment_id?: string | null
          payment_method?: string
          pix_code?: string | null
          pix_qrcode?: string | null
          quantity?: number | null
          raffle_id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
      }
      users: {
        Row: {
          avatar_url: string | null
          birth_date: string | null
          cpf: string | null
          created_at: string | null
          email: string | null
          id: string
          is_admin: boolean | null
          name: string
          phone: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          birth_date?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_admin?: boolean | null
          name: string
          phone: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_admin?: boolean | null
          name?: string
          phone?: string
          status?: string | null
          updated_at?: string | null
        }
      }
      winners: {
        Row: {
          created_at: string | null
          delivered_at: string | null
          draw_date: string
          id: string
          lottery_contest_number: string | null
          position: number | null
          prize_delivered: boolean | null
          prize_description: string
          raffle_id: string
          status: string | null
          updated_at: string | null
          user_id: string
          winning_number: number
        }
        Insert: {
          created_at?: string | null
          delivered_at?: string | null
          draw_date: string
          id?: string
          lottery_contest_number?: string | null
          position?: number | null
          prize_delivered?: boolean | null
          prize_description: string
          raffle_id: string
          status?: string | null
          updated_at?: string | null
          user_id: string
          winning_number: number
        }
        Update: {
          created_at?: string | null
          delivered_at?: string | null
          draw_date?: string
          id?: string
          lottery_contest_number?: string | null
          position?: number | null
          prize_delivered?: boolean | null
          prize_description?: string
          raffle_id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
          winning_number?: number
        }
      }
    }
    Views: {
      raffle_summary: {
        Row: {
          available_count: number | null
          available_numbers: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          draw_date: string | null
          draw_type: string | null
          id: string | null
          image_url: string | null
          manual_progress: number | null
          max_numbers: number | null
          min_numbers: number | null
          number_price: number | null
          prize_description: string | null
          progress_override: boolean | null
          purchase_config: Json | null
          regulations: string | null
          reserved_count: number | null
          show_progress_bar: boolean | null
          sold_count: number | null
          status: string | null
          title: string | null
          total_numbers: number | null
          total_revenue: number | null
          unique_buyers: number | null
          updated_at: string | null
          winner_percentage: number | null
        }
      }
      user_stats: {
        Row: {
          avatar_url: string | null
          birth_date: string | null
          cpf: string | null
          created_at: string | null
          email: string | null
          id: string | null
          is_admin: boolean | null
          name: string | null
          phone: string | null
          prizes_won: number | null
          raffles_participated: number | null
          status: string | null
          total_numbers_bought: number | null
          total_spent: number | null
          updated_at: string | null
        }
      }
    }
    Functions: {
      clean_expired_reservations: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_raffle_stats: {
        Args: { p_raffle_id: string }
        Returns: {
          total_numbers: number
          sold_numbers: number
          reserved_numbers: number
          available_numbers: number
          total_revenue: number
          average_ticket: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
export type Views<T extends keyof Database['public']['Views']> = Database['public']['Views'][T]['Row']

// Tipos específicos para facilitar o uso
export type User = Tables<'users'>
export type Profile = Tables<'profiles'>
export type Raffle = Tables<'raffles'>
export type RaffleNumber = Tables<'raffle_numbers'>
export type Transaction = Tables<'transactions'>
export type Winner = Tables<'winners'>
export type Notification = Tables<'notifications'>
export type LoginLog = Tables<'login_logs'>

// Views
export type RaffleSummary = Views<'raffle_summary'>
export type UserStats = Views<'user_stats'>

// Tipos de inserção
export type UserInsert = TablesInsert<'users'>
export type ProfileInsert = TablesInsert<'profiles'>
export type RaffleInsert = TablesInsert<'raffles'>
export type RaffleNumberInsert = TablesInsert<'raffle_numbers'>
export type TransactionInsert = TablesInsert<'transactions'>
export type WinnerInsert = TablesInsert<'winners'>

// Tipos de atualização
export type UserUpdate = TablesUpdate<'users'>
export type ProfileUpdate = TablesUpdate<'profiles'>
export type RaffleUpdate = TablesUpdate<'raffles'>
export type RaffleNumberUpdate = TablesUpdate<'raffle_numbers'>
export type TransactionUpdate = TablesUpdate<'transactions'>
export type WinnerUpdate = TablesUpdate<'winners'>