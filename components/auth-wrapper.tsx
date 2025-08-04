"use client"

import type React from "react"

import { useState } from "react"
import { LoginScreen } from "@/components/login-screen"
import { SignupScreen } from "@/components/signup-screen"
import { useAuth } from "@/components/auth-provider"
import { LoadingSpinner } from "@/components/loading-spinner"

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const [showSignup, setShowSignup] = useState(false)
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-gray-600 font-medium">Loading MedTracker...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return showSignup ? (
      <SignupScreen onSwitchToLogin={() => setShowSignup(false)} />
    ) : (
      <LoginScreen onSwitchToSignup={() => setShowSignup(true)} />
    )
  }

  return <>{children}</>
}
