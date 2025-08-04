import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { PWAProvider } from "@/components/pwa-provider"
import { LanguageProvider } from "@/components/language-provider"
import { EnhancedVoiceProvider } from "@/components/enhanced-voice-provider"
import { NotificationProvider } from "@/components/notification-provider"
import { PushNotificationProvider } from "@/components/push-notification-service"
import { MedicationReminder } from "@/components/medication-reminder"
import { OfflineIndicator } from "@/components/offline-indicator"
import { LoadingScreen } from "@/components/loading-screen"
import { AuthProvider } from "@/components/auth-provider"
import { AuthWrapper } from "@/components/auth-wrapper"
import Script from "next/script"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "MedTracker - Simple Medication Management",
  description: "Clean, simple medication reminder app",
  manifest: "/manifest.json",
  generator: 'v0.dev',
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MedTracker",
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'MedTracker',
    'application-name': 'MedTracker',
    'msapplication-TileColor': '#2563eb',
    'msapplication-tap-highlight': 'no',
  }
}

export const viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* PWA Meta Tags */}
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icon-512x512.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="MedTracker" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="MedTracker" />
        <meta name="msapplication-TileColor" content="#2563eb" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        {/* Service Worker Registration */}
        <Script id="sw-register" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js', { scope: '/' }).then(function(registration) {
                  console.log('SW registered: ', registration);
                  
                  // Check for updates to the service worker
                  registration.addEventListener('updatefound', function() {
                    console.log('Service worker update found!');
                  });
                  
                }).catch(function(registrationError) {
                  console.log('SW registration failed: ', registrationError);
                });
              });
              
              // Log when beforeinstallprompt is fired or prevented
              window.addEventListener('beforeinstallprompt', function(e) {
                console.log('beforeinstallprompt event fired and not prevented');
              });
            }
          `}
        </Script>
      </head>
      <body className={inter.className}>
        <LoadingScreen />
        <PWAProvider>
          <LanguageProvider>
            <EnhancedVoiceProvider>
              <NotificationProvider>
                <PushNotificationProvider>
                  <AuthProvider>
                    <AuthWrapper>
                      {children}
                      <MedicationReminder />
                      <OfflineIndicator />
                    </AuthWrapper>
                  </AuthProvider>
                </PushNotificationProvider>
              </NotificationProvider>
            </EnhancedVoiceProvider>
          </LanguageProvider>
        </PWAProvider>
      </body>
    </html>
  )
}