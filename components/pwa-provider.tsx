"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface PWAContextType {
  isInstallable: boolean
  isInstalled: boolean
  installApp: () => Promise<void>
  deferredPrompt: any
}

const PWAContext = createContext<PWAContextType | null>(null)

interface PWAProviderProps {
  children: ReactNode
}

export function PWAProvider({ children }: PWAProviderProps) {
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    // Check if app is already installed
    const checkIfInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
      const isInWebAppiOS = (window.navigator as any).standalone === true
      
      setIsInstalled(isStandalone || isInWebAppiOS)
    }

    // Handle beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: any) => {
      // Don't prevent default to allow the banner to show
      // Just store the event for later use
      setDeferredPrompt(e)
      setIsInstallable(true)
    }

    // Handle app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsInstallable(false)
      setDeferredPrompt(null)
    }

    if (typeof window !== 'undefined') {
      checkIfInstalled()
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.addEventListener('appinstalled', handleAppInstalled)

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
        window.removeEventListener('appinstalled', handleAppInstalled)
      }
    }
  }, [])

  const installApp = async () => {
    if (deferredPrompt) {
      try {
        // Show the installation prompt
        // This must be called from a user gesture handler (like a button click)
        deferredPrompt.prompt()
        
        // Wait for the user's choice
        const { outcome } = await deferredPrompt.userChoice
        console.log('Installation prompt outcome:', outcome)
        
        if (outcome === 'accepted') {
          console.log('PWA was installed successfully')
          setIsInstalled(true)
          setIsInstallable(false)
        }
        
        // Clear the saved prompt as it can only be used once
        setDeferredPrompt(null)
      } catch (error) {
        console.error('Error during PWA installation:', error)
      }
    } else {
      console.log('No installation prompt available')
    }
  }

  const value: PWAContextType = {
    isInstallable,
    isInstalled,
    installApp,
    deferredPrompt
  }

  return (
    <PWAContext.Provider value={value}>
      {children}
    </PWAContext.Provider>
  )
}

export function usePWA() {
  const context = useContext(PWAContext)
  if (!context) {
    throw new Error('usePWA must be used within a PWAProvider')
  }
  return context
}