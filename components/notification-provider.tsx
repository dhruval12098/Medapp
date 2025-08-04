"use client"

import type React from "react"

import { createContext, useContext, useState } from "react"

interface NotificationContextType {
  showNotification: (message: string, type: "success" | "error") => void
}

const NotificationContext = createContext<NotificationContextType>({
  showNotification: () => {},
})

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notification, setNotification] = useState<{
    message: string
    type: "success" | "error"
  } | null>(null)

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      {notification && (
        <div className="fixed top-4 right-4 z-50 max-w-sm">
          <div
            className={`p-4 rounded-lg shadow-lg ${
              notification.type === "success" ? "notification-success" : "notification-error"
            } fade-in`}
          >
            <p className="font-medium">{notification.message}</p>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  )
}

export const useNotification = () => useContext(NotificationContext)
