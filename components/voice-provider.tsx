"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"

interface VoiceContextType {
  speak: (text: string) => void
  isSupported: boolean
  isSpeaking: boolean
}

const VoiceContext = createContext<VoiceContextType>({
  speak: () => {},
  isSupported: false,
  isSpeaking: false,
})

export function VoiceProvider({ children }: { children: React.ReactNode }) {
  const [isSupported, setIsSupported] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [synthesis, setSynthesis] = useState<SpeechSynthesis | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      setIsSupported(true)
      setSynthesis(window.speechSynthesis)
    }
  }, [])

  const speak = (text: string) => {
    if (!synthesis || !isSupported) return

    // Cancel any ongoing speech
    synthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.9
    utterance.pitch = 1
    utterance.volume = 0.8

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    synthesis.speak(utterance)
  }

  return <VoiceContext.Provider value={{ speak, isSupported, isSpeaking }}>{children}</VoiceContext.Provider>
}

export const useVoice = () => useContext(VoiceContext)
