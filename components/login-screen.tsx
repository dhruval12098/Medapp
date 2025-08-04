"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Eye, EyeOff, Mail, Lock, Heart, Pill, AlertCircle, Send } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { useNotification } from "@/components/notification-provider"

interface LoginScreenProps {
  onSwitchToSignup: () => void
}

export function LoginScreen({ onSwitchToSignup }: LoginScreenProps) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const { login, resendConfirmation } = useAuth()
  const { showNotification } = useNotification()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.email || !formData.password) {
      showNotification("Please fill in all fields", "error")
      return
    }

    setIsLoading(true)

    try {
      const result = await login(formData.email, formData.password)
      
      if (result.success) {
        showNotification("Welcome back! 🎉", "success")
      } else if (result.needsConfirmation) {
        setShowConfirmation(true)
        showNotification("Please check your email and click the confirmation link", "success")
      } else {
        showNotification("Invalid email or password", "error")
      }
    } catch (error) {
      showNotification("Login failed. Please try again.", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendConfirmation = async () => {
    if (!formData.email) {
      showNotification("Please enter your email address first", "error")
      return
    }

    setIsResending(true)
    
    try {
      const success = await resendConfirmation(formData.email)
      if (success) {
        showNotification("Confirmation email sent! Please check your inbox.", "success")
      } else {
        showNotification("Failed to send confirmation email. Please try again.", "error")
      }
    } catch (error) {
      showNotification("Failed to send confirmation email.", "error")
    } finally {
      setIsResending(false)
    }
  }

  if (showConfirmation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="text-center space-y-6">
            <div className="relative mx-auto">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-purple-200/50">
                <Pill className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-red-400 to-pink-500 rounded-full flex items-center justify-center">
                <Heart className="w-3 h-3 text-white" />
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Check Your Email
              </h1>
              <p className="text-gray-600">We sent a confirmation link to your email</p>
            </div>
          </div>

          {/* Email Confirmation Card */}
          <Card className="modern-card animate-fade-scale">
            <CardContent className="p-8 text-center space-y-6">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8 text-yellow-600" />
              </div>
              
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">Email Confirmation Required</h3>
                <p className="text-gray-600 text-sm">
                  Please check your email ({formData.email}) and click the confirmation link to activate your account.
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleResendConfirmation}
                  disabled={isResending}
                  variant="outline"
                  className="w-full"
                >
                  {isResending ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-gray-400/30 border-t-gray-600 rounded-full animate-spin mr-2"></div>
                      Sending...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Send className="w-4 h-4 mr-2" />
                      Resend Confirmation Email
                    </div>
                  )}
                </Button>

                <Button
                  onClick={() => setShowConfirmation(false)}
                  variant="ghost"
                  className="w-full"
                >
                  Back to Login
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Help */}
          <div className="modern-card p-4 animate-slide-up">
            <div className="text-center space-y-2">
              <p className="text-sm font-semibold text-gray-700">Can't find the email?</p>
              <p className="text-xs text-gray-600">Check your spam folder or try resending the confirmation email.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo & Welcome */}
        <div className="text-center space-y-6">
          <div className="relative mx-auto">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-purple-200/50">
              <Pill className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-red-400 to-pink-500 rounded-full flex items-center justify-center">
              <Heart className="w-3 h-3 text-white" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Welcome Back
            </h1>
            <p className="text-gray-600">Sign in to manage your medications</p>
          </div>
        </div>

        {/* Login Form */}
        <Card className="modern-card animate-fade-scale">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="your@email.com"
                    className="modern-input pl-12"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter your password"
                    className="modern-input pl-12 pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full modern-button modern-button-primary py-4 text-lg font-semibold"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    Signing In...
                  </div>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Switch to Signup */}
        <div className="text-center">
          <p className="text-gray-600">
            Don't have an account?{" "}
            <button
              onClick={onSwitchToSignup}
              className="text-purple-600 font-semibold hover:text-purple-700 transition-colors"
            >
              Sign up here
            </button>
          </p>
        </div>

        {/* Demo Credentials */}
        <div className="modern-card p-4 animate-slide-up">
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-700 mb-2">Demo Account</p>
            <p className="text-xs text-gray-600">Email: demo@medtracker.com</p>
            <p className="text-xs text-gray-600">Password: demo123</p>
          </div>
        </div>
      </div>
    </div>
  )
}