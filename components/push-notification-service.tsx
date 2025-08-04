"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useNotification } from './notification-provider'

interface PushNotificationContextType {
  isSubscribed: boolean
  isPushSupported: boolean
  subscribeToPushNotifications: () => Promise<boolean>
  unsubscribeFromPushNotifications: () => Promise<boolean>
  sendTestPushNotification: () => Promise<boolean>
}

const PushNotificationContext = createContext<PushNotificationContextType | null>(null)

interface PushNotificationProviderProps {
  children: ReactNode
  vapidPublicKey?: string
}

// This is a placeholder VAPID key - in production, you should use your own key
// Generate using: https://web-push-codelab.glitch.me/
const DEFAULT_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U'

export function PushNotificationProvider({ 
  children, 
  vapidPublicKey = DEFAULT_PUBLIC_KEY 
}: PushNotificationProviderProps) {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isPushSupported, setIsPushSupported] = useState(false)
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const { showNotification } = useNotification()

  useEffect(() => {
    // Check if service workers and push messaging are supported
    const checkPushSupport = async () => {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        try {
          const registration = await navigator.serviceWorker.ready
          setSwRegistration(registration)
          setIsPushSupported(true)
          
          // Check if already subscribed
          const subscription = await registration.pushManager.getSubscription()
          setIsSubscribed(!!subscription)
        } catch (error) {
          console.error('Error during service worker registration:', error)
          setIsPushSupported(false)
        }
      } else {
        console.log('Push messaging is not supported')
        setIsPushSupported(false)
      }
    }

    checkPushSupport()
  }, [])

  const subscribeToPushNotifications = async (): Promise<boolean> => {
    if (!swRegistration) return false

    try {
      const applicationServerKey = urlB64ToUint8Array(vapidPublicKey)
      
      // Cast the applicationServerKey to any to bypass TypeScript's type checking
      // This is necessary because TypeScript's definitions for PushSubscriptionOptions might be outdated
      const subscriptionOptions: PushSubscriptionOptionsInit = {
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as any
      }
      
      const subscription = await swRegistration.pushManager.subscribe(subscriptionOptions)

      console.log('User is subscribed:', subscription)
      
      // Here you would typically send the subscription to your server
      // await sendSubscriptionToServer(subscription)
      
      setIsSubscribed(true)
      showNotification('Push notifications enabled!', 'success')
      return true
    } catch (error) {
      console.error('Failed to subscribe the user:', error)
      showNotification('Failed to enable push notifications', 'error')
      return false
    }
  }

  const unsubscribeFromPushNotifications = async (): Promise<boolean> => {
    if (!swRegistration) return false

    try {
      const subscription = await swRegistration.pushManager.getSubscription()
      
      if (subscription) {
        await subscription.unsubscribe()
        
        // Here you would typically remove the subscription from your server
        // await removeSubscriptionFromServer(subscription)
        
        setIsSubscribed(false)
        showNotification('Push notifications disabled', 'success')
        return true
      }
      
      return false
    } catch (error) {
      console.error('Error unsubscribing', error)
      showNotification('Failed to disable push notifications', 'error')
      return false
    }
  }

  const sendTestPushNotification = async (): Promise<boolean> => {
    if (!isSubscribed || !swRegistration) return false

    try {
      // This is just a local test - in a real app, you'd send this to your server
      // which would then send the push notification
      await swRegistration.showNotification('Test Notification', {
        body: 'This is a test push notification',
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        // @ts-ignore - vibrate is supported in modern browsers but TypeScript definitions may be outdated
        vibrate: [200, 100, 200],
        tag: 'test-notification',
        // @ts-ignore - actions is supported in modern browsers but TypeScript definitions may be outdated
        actions: [
          { action: 'taken', title: 'I took it' },
          { action: 'snooze', title: 'Remind me later' }
        ]
      })
      
      return true
    } catch (error) {
      console.error('Error sending test notification:', error)
      return false
    }
  }

  // Helper function to convert base64 to Uint8Array
  // (required for the applicationServerKey)
  // Convert base64 web push public key to Uint8Array
  function urlB64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    
    return outputArray
  }

  const value: PushNotificationContextType = {
    isSubscribed,
    isPushSupported,
    subscribeToPushNotifications,
    unsubscribeFromPushNotifications,
    sendTestPushNotification
  }

  return (
    <PushNotificationContext.Provider value={value}>
      {children}
    </PushNotificationContext.Provider>
  )
}

export const usePushNotification = () => {
  const context = useContext(PushNotificationContext)
  if (!context) {
    throw new Error('usePushNotification must be used within a PushNotificationProvider')
  }
  return context
}