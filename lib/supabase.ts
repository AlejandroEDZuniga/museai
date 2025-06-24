import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      scans: {
        Row: {
          id: string
          user_id: string
          image_url: string
          title: string
          description: string
          audio_url: string | null
          location: string | null
          language: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          image_url: string
          title: string
          description: string
          audio_url?: string | null
          location?: string | null
          language: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          image_url?: string
          title?: string
          description?: string
          audio_url?: string | null
          location?: string | null
          language?: string
          created_at?: string
          updated_at?: string
        }
      }
      chat_messages: {
        Row: {
          id: string
          scan_id: string
          user_id: string
          message: string
          response: string
          audio_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          scan_id: string
          user_id: string
          message: string
          response: string
          audio_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          scan_id?: string
          user_id?: string
          message?: string
          response?: string
          audio_url?: string | null
          created_at?: string
        }
      }
    }
  }
}