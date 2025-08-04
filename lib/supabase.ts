import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database
export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          name: string
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          phone?: string | null
        }
        Update: {
          name?: string
          phone?: string | null
        }
      }
      medicines: {
        Row: {
          id: string
          user_id: string
          name: string
          dosage: string
          frequency: "daily" | "weekly"
          times: string[]
          instructions: string | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          name: string
          dosage: string
          frequency: "daily" | "weekly"
          times: string[]
          instructions?: string | null
          active?: boolean
        }
        Update: {
          name?: string
          dosage?: string
          frequency?: "daily" | "weekly"
          times?: string[]
          instructions?: string | null
          active?: boolean
        }
      }
      schedule: {
        Row: {
          id: string
          user_id: string
          medicine_id: string
          medicine_name: string
          dosage: string
          scheduled_time: string
          status: "pending" | "taken" | "missed"
          taken_time: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          medicine_id: string
          medicine_name: string
          dosage: string
          scheduled_time: string
          status?: "pending" | "taken" | "missed"
          taken_time?: string | null
        }
        Update: {
          status?: "pending" | "taken" | "missed"
          taken_time?: string | null
        }
      }
      contacts: {
        Row: {
          id: string
          user_id: string
          name: string
          phone: string
          email: string | null
          relationship: string | null
          is_primary: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          name: string
          phone: string
          email?: string | null
          relationship?: string | null
          is_primary?: boolean
        }
        Update: {
          name?: string
          phone?: string
          email?: string | null
          relationship?: string | null
          is_primary?: boolean
        }
      }
    }
  }
}
