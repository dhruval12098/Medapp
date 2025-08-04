"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<{ success: boolean; needsConfirmation?: boolean }>
  signup: (userData: SignupData) => Promise<{ success: boolean; needsConfirmation?: boolean }>
  logout: () => void
  resendConfirmation: (email: string) => Promise<boolean>
  isLoading: boolean
}

interface SignupData {
  name: string
  email: string
  password: string
  phone?: string
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => ({ success: false }),
  signup: async () => ({ success: false }),
  logout: () => {},
  resendConfirmation: async () => false,
  isLoading: true,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const login = async (email: string, password: string): Promise<{ success: boolean; needsConfirmation?: boolean }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("Login error:", error.message)
        
        // Check if it's an email confirmation error
        if (error.message === "Email not confirmed") {
          return { success: false, needsConfirmation: true }
        }
        
        return { success: false }
      }

      return { success: !!data.user }
    } catch (error) {
      console.error("Login error:", error)
      return { success: false }
    }
  }

  const signup = async (userData: SignupData): Promise<{ success: boolean; needsConfirmation?: boolean }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
            phone: userData.phone || "",
          },
        },
      })

      if (error) {
        console.error("Signup error:", error.message)
        return { success: false }
      }

      // If user is created but not confirmed, return needsConfirmation
      if (data.user && !data.user.email_confirmed_at) {
        return { success: true, needsConfirmation: true }
      }

      return { success: !!data.user }
    } catch (error) {
      console.error("Signup error:", error)
      return { success: false }
    }
  }

  const resendConfirmation = async (email: string): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      })

      if (error) {
        console.error("Resend confirmation error:", error.message)
        return false
      }

      return true
    } catch (error) {
      console.error("Resend confirmation error:", error)
      return false
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        login, 
        signup, 
        logout, 
        resendConfirmation,
        isLoading 
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)