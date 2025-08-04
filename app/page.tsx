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
  const [canInstall, setCanInstall] = useState(true)
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
    const handleBeforeInstallPrompt = (e: any) => {
      console.log('beforeinstallprompt event fired')
      setDeferredPrompt(e)
      setCanInstall(true)
    }

    // Check if app can be installed
    const checkInstallability = () => {
      if (typeof window === "undefined") return
      
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
      const isInWebAppiOS = (window.navigator as any).standalone === true
      
      console.log('Installability check:', {
        isStandalone,
        isIOS,
        isInWebAppiOS,
        userAgent: navigator.userAgent
      })
      
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
    
    // Check if the device is mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    
    if (isMobile && deferredPrompt) {
      try {
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
        showNotification("Failed to install the app", "error")
      }
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
      {/* Header - Improved for small screens */}
      <header className="sticky top-0 z-50 border-b border-white/20 bg-white/90 backdrop-blur-md shadow-sm">
        <div className="w-full max-w-sm mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left Side - User Info - Responsive */}
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-600 truncate">{getGreeting()}</p>
                <p className="font-semibold text-sm text-gray-900 truncate">{user?.user_metadata?.name || "User"}</p>
              </div>
            </div>

            {/* Right Side - Action Buttons - Compact */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              {/* Install App Button */}
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-all duration-200 shadow-md"
                onClick={handleInstallClick}
                title="Install App"
              >
                <Download className="w-4 h-4" />
              </Button>

              {/* Logout Button */}
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center justify-center w-9 h-9 rounded-lg bg-red-50 hover:bg-red-100 transition-all duration-200 shadow-sm border border-red-200"
                onClick={handleLogout}
                title="Logout"
              >
                <LogOut className="w-4 h-4 text-red-600" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Improved container */}
      <main className="w-full max-w-sm mx-auto px-4 py-4 space-y-4 pb-20">
        {/* Notification Setup */}
        {showNotificationSetup && (
          <div className="animate-slide-up">
            <NotificationSetup />
          </div>
        )}

        {/* App Install Reminder Card - Fixed contrast */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-xl shadow-lg animate-fade-scale border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm flex-shrink-0">
                <Download className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-white text-base truncate">Install MedTracker</p>
                <p className="text-xs text-white/90 truncate">Get offline access & notifications</p>
              </div>
            </div>
            <Button
              onClick={handleInstallClick}
              size="sm"
              className="bg-white hover:bg-gray-100 text-blue-600 font-semibold border-0 rounded-lg px-3 py-1.5 text-xs flex-shrink-0 shadow-sm"
            >
              Install
            </Button>
          </div>
        </div>

        {/* Next Medicine Card */}
        {nextMedicine && (
          <div className="medicine-time-card text-white animate-fade-scale rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center mb-2">
                  <Clock className="w-4 h-4 mr-2 opacity-90 flex-shrink-0" />
                  <span className="text-xs font-medium opacity-90">Next Medicine</span>
                </div>
                <h3 className="text-lg font-bold mb-1 truncate">{nextMedicine.medicineName}</h3>
                <p className="opacity-90 mb-1 text-sm truncate">{nextMedicine.dosage}</p>
                <p className="text-xs opacity-75">
                  {formatTime(nextMedicine.scheduledTime)} • {getTimeUntilNext(nextMedicine.scheduledTime)}
                </p>
              </div>
              <Button
                onClick={() => handleTakeMedicine(nextMedicine.id, nextMedicine.medicineName)}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 rounded-xl px-4 py-2 text-sm flex-shrink-0"
              >
                Take Now
              </Button>
            </div>
          </div>
        )}

        {/* Progress Card */}
        <div className="modern-card p-4 animate-slide-up rounded-xl bg-white/80 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-gray-900">Today's Progress</h3>
            <span className="text-xl font-bold text-purple-600">{Math.round(adherenceRate)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
            <div 
              className="bg-gradient-to-r from-purple-500 to-blue-600 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${adherenceRate}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-600">
            {todaySchedule.filter((item) => item.status === "taken").length} of {todaySchedule.length} medicines taken
          </p>
        </div>

        {/* Quick Actions - Improved for mobile */}
        <div className="grid grid-cols-2 gap-3 animate-slide-up">
          <Link href="/add-medicine" className="block">
            <div className="quick-action-card bg-gradient-to-br from-blue-500 to-purple-600 text-white text-center p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
              <Plus className="w-6 h-6 mx-auto mb-2" />
              <p className="font-semibold text-sm">Add Medicine</p>
            </div>
          </Link>
          <Link href="/medicines" className="block">
            <div className="quick-action-card bg-gradient-to-br from-green-400 to-blue-500 text-white text-center p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
              <Calendar className="w-6 h-6 mx-auto mb-2" />
              <p className="font-semibold text-sm">My Medicines</p>
            </div>
          </Link>
        </div>

        {/* Today's Medications */}
        <div className="modern-card p-4 animate-slide-up rounded-xl bg-white/80 backdrop-blur-sm">
          <h3 className="text-base font-semibold text-gray-900 mb-3">Today's Schedule</h3>
          {todaySchedule.length === 0 ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-gray-600 mb-3 text-sm">No medications scheduled for today</p>
              <Link href="/add-medicine">
                <Button className="modern-button modern-button-primary bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-4 py-2 text-sm">
                  Add Your First Medicine
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {todaySchedule.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-gray-50/80 rounded-xl hover:bg-gray-100/80 transition-all duration-300 shadow-sm"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className="flex-shrink-0">
                      {item.status === "taken" ? (
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                      ) : item.status === "missed" ? (
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                          <AlertCircle className="w-4 h-4 text-red-600" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                          <Clock className="w-4 h-4 text-orange-600" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-gray-900 text-sm truncate">{item.medicineName}</h4>
                      <p className="text-xs text-gray-600 truncate">
                        {item.dosage} • {formatTime(item.scheduledTime)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    {item.status === "taken" && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                        Taken
                      </span>
                    )}
                    {item.status === "missed" && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                        Missed
                      </span>
                    )}
                    {item.status === "pending" && (
                      <>
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                          Pending
                        </span>
                        <Button
                          onClick={() => handleTakeMedicine(item.id, item.medicineName)}
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-3 py-1.5 text-xs"
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
      </main>

      {/* Fixed Bottom Navigation - Improved for small screens */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-gray-200/50 shadow-lg">
        <div className="w-full max-w-sm mx-auto px-2 py-2">
          <div className="grid grid-cols-4 gap-1">
            <Link href="/contacts" className="block">
              <div className="flex flex-col items-center justify-center py-2 px-1 rounded-lg hover:bg-gray-100/80 transition-all duration-200 min-h-[60px]">
                <Heart className="w-5 h-5 text-red-500 mb-1 flex-shrink-0" />
                <p className="text-xs font-medium text-gray-700 text-center leading-tight">Family</p>
              </div>
            </Link>
            <Link href="/history" className="block">
              <div className="flex flex-col items-center justify-center py-2 px-1 rounded-lg hover:bg-gray-100/80 transition-all duration-200 min-h-[60px]">
                <Calendar className="w-5 h-5 text-purple-500 mb-1 flex-shrink-0" />
                <p className="text-xs font-medium text-gray-700 text-center leading-tight">History</p>
              </div>
            </Link>
            <Link href="/reports" className="block">
              <div className="flex flex-col items-center justify-center py-2 px-1 rounded-lg hover:bg-gray-100/80 transition-all duration-200 min-h-[60px]">
                <CheckCircle className="w-5 h-5 text-green-500 mb-1 flex-shrink-0" />
                <p className="text-xs font-medium text-gray-700 text-center leading-tight">Reports</p>
              </div>
            </Link>
            <Link href="/settings" className="block">
              <div className="flex flex-col items-center justify-center py-2 px-1 rounded-lg hover:bg-gray-100/80 transition-all duration-200 min-h-[60px]">
                <Settings className="w-5 h-5 text-gray-500 mb-1 flex-shrink-0" />
                <p className="text-xs font-medium text-gray-700 text-center leading-tight">Settings</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}