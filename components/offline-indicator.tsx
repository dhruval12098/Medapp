"use client"

import { useEffect, useState } from "react"
import { WifiOff, Wifi } from "lucide-react"

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const [showIndicator, setShowIndicator] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setShowIndicator(true)
      setTimeout(() => setShowIndicator(false), 3000)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowIndicator(true)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  if (!showIndicator) return null

  return (
    <div className="fixed top-4 left-4 z-50">
      <div
        className={`flex items-center px-3 py-2 rounded-lg shadow-lg text-white text-sm font-medium ${
          isOnline ? "bg-green-600" : "bg-red-600"
        } fade-in`}
      >
        {isOnline ? (
          <>
            <Wifi className="w-4 h-4 mr-2" />
            Back online
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4 mr-2" />
            Offline mode
          </>
        )}
      </div>
    </div>
  )
}
