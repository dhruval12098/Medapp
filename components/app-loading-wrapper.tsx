// components/app-loading-wrapper.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { LoadingScreen } from './loading-screen'

export function AppLoadingWrapper({ children }: { children: React.ReactNode }) {
  const [showInitialLoading, setShowInitialLoading] = useState(true)
  const [hasLoadedBefore, setHasLoadedBefore] = useState(false)

  useEffect(() => {
    // Check if app has been loaded in this browser session
    const loaded = sessionStorage.getItem('medtracker-app-loaded')
    
    if (loaded === 'true') {
      // Skip loading screen - already loaded in this session
      setShowInitialLoading(false)
      setHasLoadedBefore(true)
    } else {
      // First time loading in this session
      // Wait for loading screen to complete, then mark as loaded
      const timer = setTimeout(() => {
        sessionStorage.setItem('medtracker-app-loaded', 'true')
        setShowInitialLoading(false)
        setHasLoadedBefore(true)
      }, 3000) // 3 seconds to account for your loading screen animation

      return () => clearTimeout(timer)
    }
  }, [])

  // Show loading screen only on first load of the session
  if (showInitialLoading && !hasLoadedBefore) {
    return <LoadingScreen />
  }

  // Show normal app content
  return <>{children}</>
}