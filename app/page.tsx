"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Settings, Plus, Clock, CheckCircle, AlertCircle, Bell, User, Calendar, Heart, Download, LogOut } from "lucide-react"
import Link from "next/link"
import { useVoice } from "@/components/enhanced-voice-provider"
import { useLanguage } from "@/components/language-provider"
import { useNotification } from "@/components/notification-provider"
import { NotificationSetup } from "@/components/notification-setup"
import { getTodaySchedule, markMedicineAsTaken } from "@/lib/storage"
import type { ScheduleItem } from "@/lib/types"
import { useAuth } from "@/components/auth-provider"

export default function DashboardPage() {
  const [todaySchedule, setTodaySchedule] = useState<ScheduleItem[]>([])
  const [nextMedicine, setNextMedicine] = useState<ScheduleItem | null>(null)
  const [adherenceRate, setAdherenceRate] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showNotificationSetup, setShowNotificationSetup] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isInitialized, setIsInitialized] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [canInstall, setCanInstall] = useState(true) // Always show install button
  const { speak } = useVoice()
  const { showNotification } = useNotification()
  const { t } = useLanguage()
  const { user, logout } = useAuth()

  useEffect(() => {
    // Initialize the app
    const initializeApp = async () => {
      try {
        await loadDashboardData()

        // Check notification permission
        if (typeof window !== "undefined" && "Notification" in window) {
          if (Notification.permission === "default") {
            setShowNotificationSetup(true)
          }
        }

        setIsInitialized(true)
      } catch (error) {
        console.error("Error initializing app:", error)
        setIsInitialized(true)
      }
    }

    initializeApp()

    // PWA install prompt logic
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('beforeinstallprompt event fired')
      e.preventDefault()
      setDeferredPrompt(e)
      setCanInstall(true)
    }

    // Check if app can be installed
    const checkInstallability = () => {
      if (typeof window === "undefined") return
      
      // Check if already installed
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
      const isInWebAppiOS = (window.navigator as any).standalone === true
      
      console.log('Installability check:', {
        isStandalone,
        isIOS,
        isInWebAppiOS,
        userAgent: navigator.userAgent
      })
      
      // Always show install button for better UX
      setCanInstall(true)
    }

    if (typeof window !== "undefined") {
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      setTimeout(checkInstallability, 1000)
    }

    // Set up intervals
    const dataInterval = setInterval(loadDashboardData, 60000)
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000)

    return () => {
      clearInterval(dataInterval)
      clearInterval(timeInterval)
      if (typeof window !== "undefined") {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      }
    }
  }, [])

  const handleInstallClick = async () => {
    console.log('Install button clicked', { deferredPrompt, canInstall })
    
    if (deferredPrompt) {
      try {
        // For Chrome/Edge/other browsers
        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        console.log('Install prompt outcome:', outcome)
        
        if (outcome === 'accepted') {
          showNotification("App installed successfully! 🎉", "success")
          setCanInstall(false)
        }
        setDeferredPrompt(null)
      } catch (error) {
        console.error('Error during install:', error)
        showFallbackInstallInstructions()
      }
    } else {
      showFallbackInstallInstructions()
    }
  }

  const showFallbackInstallInstructions = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isFirefox = navigator.userAgent.toLowerCase().includes('firefox')
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
    
    if (isIOS) {
      showNotification("iOS: Tap Share button (↗️) → Add to Home Screen", "success")
    } else if (isFirefox) {
      showNotification("Firefox: Menu (☰) → Install App", "success")
    } else if (isSafari) {
      showNotification("Safari: Share menu → Add to Home Screen", "success")
    } else {
      showNotification("Look for 'Install' option in browser menu", "success")
    }
  }

  const loadDashboardData = async () => {
    try {
      const schedule = await getTodaySchedule()
      setTodaySchedule(schedule)

      const now = new Date()
      const upcoming = schedule.find((item) => item.status === "pending" && new Date(item.scheduledTime) > now)
      setNextMedicine(upcoming || null)

      const totalMedicines = schedule.length
      const takenMedicines = schedule.filter((item) => item.status === "taken").length
      const rate = totalMedicines > 0 ? (takenMedicines / totalMedicines) * 100 : 0
      setAdherenceRate(rate)
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleTakeMedicine = async (scheduleId: string, medicineName: string) => {
    try {
      await markMedicineAsTaken(scheduleId)
      speak(t("medicineTaken", { medicine: medicineName }))
      showNotification(`✓ ${medicineName} marked as taken`, "success")
      loadDashboardData()
    } catch (error) {
      showNotification("Error marking medicine as taken", "error")
    }
  }

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  const getGreeting = () => {
    const hour = currentTime.getHours()
    if (hour < 12) return "Good Morning"
    if (hour < 17) return "Good Afternoon"
    return "Good Evening"
  }

  const getTimeUntilNext = (scheduledTime: string) => {
    const now = new Date()
    const scheduled = new Date(scheduledTime)
    const diff = scheduled.getTime() - now.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(minutes / 60)

    if (hours > 0) {
      return `in ${hours}h ${minutes % 60}m`
    } else if (minutes > 0) {
      return `in ${minutes}m`
    } else {
      return "now"
    }
  }

  const handleLogout = () => {
    showNotification("Logged out successfully", "success")
    logout()
  }

  // Show loading state only if not initialized
  if (!isInitialized || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto"></div>
          <div className="space-y-2">
            <p className="text-gray-700 font-semibold">Loading Dashboard...</p>
            <p className="text-sm text-gray-600">Getting your medications ready</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Updated Header - No Language Selector, Prominent Install Button */}
      <header className="sticky top-0 z-50 border-b border-white/20 bg-white/90 backdrop-blur-md shadow-sm">
        <div className="max-w-md mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left Side - User Info */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">{getGreeting()}</p>
                <p className="font-semibold text-gray-900">{user?.user_metadata?.name || "User"}</p>
              </div>
            </div>

            {/* Right Side - Action Buttons (Install + Logout only) */}
            <div className="flex items-center space-x-3">
              {/* Install App Button - Now Prominent */}
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center justify-center w-12 h-10 rounded-xl bg-blue-500 hover:bg-blue-600 text-white transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                onClick={handleInstallClick}
                title="Install App"
              >
                <Download className="w-5 h-5" />
              </Button>

              {/* Logout Button */}
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center justify-center w-10 h-10 rounded-full bg-red-50 hover:bg-red-100 transition-all duration-200 shadow-sm border border-red-200"
                onClick={handleLogout}
                title="Logout"
              >
                <LogOut className="w-4 h-4 text-red-600" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-6 py-6 space-y-6">
        {/* Notification Setup */}
        {showNotificationSetup && (
          <div className="animate-slide-up">
            <NotificationSetup />
          </div>
        )}

        {/* App Install Reminder Card - More Prominent */}
        <div className="modern-card p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 animate-fade-scale shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Download className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-white text-lg">Install MedTracker</p>
                <p className="text-sm text-white/90">Get offline access & notifications</p>
              </div>
            </div>
            <Button
              onClick={handleInstallClick}
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30 rounded-xl px-4 py-2 backdrop-blur-sm"
            >
              Install
            </Button>
          </div>
        </div>

        {/* Next Medicine Card */}
        {nextMedicine && (
          <div className="medicine-time-card text-white animate-fade-scale">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-3">
                  <Clock className="w-5 h-5 mr-2 opacity-90" />
                  <span className="text-sm font-medium opacity-90">Next Medicine</span>
                </div>
                <h3 className="text-xl font-bold mb-1">{nextMedicine.medicineName}</h3>
                <p className="opacity-90 mb-1">{nextMedicine.dosage}</p>
                <p className="text-sm opacity-75">
                  {formatTime(nextMedicine.scheduledTime)} • {getTimeUntilNext(nextMedicine.scheduledTime)}
                </p>
              </div>
              <Button
                onClick={() => handleTakeMedicine(nextMedicine.id, nextMedicine.medicineName)}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 rounded-2xl px-6 py-3"
              >
                Take Now
              </Button>
            </div>
          </div>
        )}

        {/* Progress Card */}
        <div className="modern-card p-6 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Today's Progress</h3>
            <span className="text-2xl font-bold text-purple-600">{Math.round(adherenceRate)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
            <div 
              className="bg-gradient-to-r from-purple-500 to-blue-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${adherenceRate}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600">
            {todaySchedule.filter((item) => item.status === "taken").length} of {todaySchedule.length} medicines taken
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 animate-slide-up">
          <Link href="/add-medicine">
            <div className="quick-action-card bg-gradient-to-br from-blue-500 to-purple-600 text-white text-center p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
              <Plus className="w-8 h-8 mx-auto mb-3" />
              <p className="font-semibold">Add Medicine</p>
            </div>
          </Link>
          <Link href="/medicines">
            <div className="quick-action-card bg-gradient-to-br from-green-400 to-blue-500 text-white text-center p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
              <Calendar className="w-8 h-8 mx-auto mb-3" />
              <p className="font-semibold">My Medicines</p>
            </div>
          </Link>
        </div>

        {/* Today's Medications */}
        <div className="modern-card p-6 animate-slide-up">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Schedule</h3>
          {todaySchedule.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 mb-4">No medications scheduled for today</p>
              <Link href="/add-medicine">
                <Button className="modern-button modern-button-primary bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-6 py-3">
                  Add Your First Medicine
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {todaySchedule.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 bg-gray-50/80 rounded-2xl hover:bg-gray-100/80 transition-all duration-300 shadow-sm"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {item.status === "taken" ? (
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                      ) : item.status === "missed" ? (
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                          <AlertCircle className="w-5 h-5 text-red-600" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                          <Clock className="w-5 h-5 text-orange-600" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{item.medicineName}</h4>
                      <p className="text-sm text-gray-600">
                        {item.dosage} • {formatTime(item.scheduledTime)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {item.status === "taken" && (
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                        Taken
                      </span>
                    )}
                    {item.status === "missed" && (
                      <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                        Missed
                      </span>
                    )}
                    {item.status === "pending" && (
                      <>
                        <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                          Pending
                        </span>
                        <Button
                          onClick={() => handleTakeMedicine(item.id, item.medicineName)}
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-4 py-2"
                        >
                          Take
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="grid grid-cols-4 gap-2 animate-slide-up">
          <Link href="/contacts">
            <div className="quick-action-card bg-white/80 text-center py-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
              <Heart className="w-6 h-6 mx-auto mb-2 text-red-500" />
              <p className="text-xs font-medium text-gray-700">Family</p>
            </div>
          </Link>
          <Link href="/history">
            <div className="quick-action-card bg-white/80 text-center py-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
              <Calendar className="w-6 h-6 mx-auto mb-2 text-purple-500" />
              <p className="text-xs font-medium text-gray-700">History</p>
            </div>
          </Link>
          <Link href="/reports">
            <div className="quick-action-card bg-white/80 text-center py-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
              <CheckCircle className="w-6 h-6 mx-auto mb-2 text-green-500" />
              <p className="text-xs font-medium text-gray-700">Reports</p>
            </div>
          </Link>
          <Link href="/settings">
            <div className="quick-action-card bg-white/80 text-center py-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
              <Settings className="w-6 h-6 mx-auto mb-2 text-gray-500" />
              <p className="text-xs font-medium text-gray-700">Settings</p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  )
}