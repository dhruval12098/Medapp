"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Bell, Check, X, AlertCircle } from "lucide-react"

export function NotificationSetup() {
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setIsSupported(true)
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = async () => {
    if (!isSupported) return

    try {
      const result = await Notification.requestPermission()
      setPermission(result)

      if (result === "granted") {
        new Notification("MedTracker Notifications Enabled! 🎉", {
          body: "You'll now receive medicine reminders",
          icon: "/icon-192x192.png",
          badge: "/icon-192x192.png",
        })
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error)
    }
  }

  const testNotification = () => {
    if (permission === "granted") {
      new Notification("Test Medicine Reminder 💊", {
        body: "Time to take your Aspirin - 1 tablet",
        icon: "/icon-192x192.png",
        badge: "/icon-192x192.png",
        requireInteraction: true,
      })
    }
  }

  if (!isSupported) {
    return (
      <div className="modern-card p-4 border-red-200 bg-red-50">
        <div className="flex items-center text-red-800">
          <X className="w-5 h-5 mr-2" />
          <span className="text-sm">Push notifications not supported in this browser</span>
        </div>
      </div>
    )
  }

  return (
    <div className="modern-card p-6 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
            <Bell className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Push Notifications</h3>
            <p className="text-sm text-gray-600">
              {permission === "granted" && "✅ Enabled"}
              {permission === "denied" && "❌ Blocked"}
              {permission === "default" && "⏳ Not set"}
            </p>
          </div>
        </div>

        {permission === "granted" && <Check className="w-6 h-6 text-green-600" />}
        {permission === "denied" && <X className="w-6 h-6 text-red-600" />}
        {permission === "default" && <AlertCircle className="w-6 h-6 text-orange-600" />}
      </div>

      {permission === "default" && (
        <Button onClick={requestPermission} className="w-full modern-button modern-button-primary">
          <Bell className="w-4 h-4 mr-2" />
          Enable Push Notifications
        </Button>
      )}

      {permission === "granted" && (
        <Button onClick={testNotification} className="w-full modern-button gradient-bg-success">
          <Bell className="w-4 h-4 mr-2" />
          Test Notification
        </Button>
      )}

      {permission === "denied" && (
        <div className="p-3 bg-red-100 border border-red-200 rounded-2xl">
          <p className="text-sm text-red-800 font-medium">Notifications are blocked</p>
          <p className="text-xs text-red-700 mt-1">
            To enable: Go to browser settings → Site permissions → Notifications → Allow
          </p>
        </div>
      )}
    </div>
  )
}
