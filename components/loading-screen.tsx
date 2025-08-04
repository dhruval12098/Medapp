"use client"

import { useEffect, useState } from "react"
import { Pill, Heart } from "lucide-react"

export function LoadingScreen() {
  const [isLoading, setIsLoading] = useState(true)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(() => setIsLoading(false), 500)
          return 100
        }
        return prev + 10
      })
    }, 150)

    // Minimum loading time
    const minLoadTime = setTimeout(() => {
      if (progress >= 100) {
        setIsLoading(false)
      }
    }, 2000)

    return () => {
      clearInterval(interval)
      clearTimeout(minLoadTime)
    }
  }, [progress])

  if (!isLoading) return null

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 z-[200] flex items-center justify-center">
      <div className="text-center space-y-8">
        {/* Logo Animation */}
        <div className="relative">
          <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-purple-200/50 animate-pulse">
            <Pill className="w-12 h-12 text-white" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-red-400 to-pink-500 rounded-full flex items-center justify-center animate-bounce">
            <Heart className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* App Name */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            MedTracker
          </h1>
          <p className="text-gray-600 font-medium">Simple Medication Management</p>
        </div>

        {/* Progress Bar */}
        <div className="w-64 mx-auto space-y-3">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-blue-600 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-500">Loading your medications... {progress}%</p>
        </div>

        {/* Loading Messages */}
        <div className="space-y-2">
          {progress >= 20 && <p className="text-sm text-purple-600 animate-fade-in">🔐 Securing your data...</p>}
          {progress >= 40 && <p className="text-sm text-blue-600 animate-fade-in">💊 Loading medicines...</p>}
          {progress >= 60 && <p className="text-sm text-green-600 animate-fade-in">🔔 Setting up reminders...</p>}
          {progress >= 80 && <p className="text-sm text-orange-600 animate-fade-in">✨ Almost ready...</p>}
        </div>
      </div>
    </div>
  )
}
