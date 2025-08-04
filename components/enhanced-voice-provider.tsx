"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { useLanguage } from "@/components/language-provider"

interface VoiceContextType {
  speak: (text: string, language?: string) => void
  isSupported: boolean
  isSpeaking: boolean
  availableVoices: SpeechSynthesisVoice[]
  debugInfo: string
}

const VoiceContext = createContext<VoiceContextType>({
  speak: () => {},
  isSupported: false,
  isSpeaking: false,
  availableVoices: [],
  debugInfo: "",
})

export function EnhancedVoiceProvider({ children }: { children: React.ReactNode }) {
  const [isSupported, setIsSupported] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [synthesis, setSynthesis] = useState<SpeechSynthesis | null>(null)
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])
  const [debugInfo, setDebugInfo] = useState("")
  const [speechQueue, setSpeechQueue] = useState<string[]>([])
  const { currentLanguage, availableLanguages } = useLanguage()

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      setIsSupported(true)
      setSynthesis(window.speechSynthesis)
      setDebugInfo("Speech synthesis supported")

      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices()
        setAvailableVoices(voices)
        const voiceInfo = voices.map((v) => `${v.name} (${v.lang})`).join(", ")
        setDebugInfo(`Found ${voices.length} voices: ${voiceInfo.substring(0, 100)}...`)
        console.log("Available voices:", voices)
      }

      loadVoices()
      window.speechSynthesis.onvoiceschanged = loadVoices
      setTimeout(loadVoices, 1000)
    } else {
      setDebugInfo("Speech synthesis not supported in this browser")
    }
  }, [])

  const speak = useCallback(
    (text: string, language?: string) => {
      if (!isSupported || !synthesis) {
        console.log("Speech not supported")
        setDebugInfo("Speech not supported")
        return
      }

      setSpeechQueue((prev) => [...prev, text + (language ? `|${language}` : "")])
    },
    [isSupported, synthesis]
  )

  useEffect(() => {
    if (!isSpeaking && speechQueue.length > 0 && synthesis) {
      const [text, language] = speechQueue[0].split("|")
      console.log(`Speaking: "${text}" in language: ${language || currentLanguage}`)

      synthesis.cancel() // Clear any ongoing speech

      const utterance = new SpeechSynthesisUtterance(text)
      const targetLanguage = language || currentLanguage
      const languageConfig = availableLanguages[targetLanguage as keyof typeof availableLanguages]

      if (languageConfig && availableVoices.length > 0) {
        const preferredVoice = availableVoices.find(
          (voice) =>
            voice.lang.toLowerCase().startsWith(languageConfig.voice.toLowerCase()) ||
            voice.lang.toLowerCase().startsWith(targetLanguage.toLowerCase()) ||
            voice.name.toLowerCase().includes(targetLanguage.toLowerCase())
        )

        if (preferredVoice) {
          utterance.voice = preferredVoice
          console.log(`Using voice: ${preferredVoice.name} (${preferredVoice.lang})`)
          setDebugInfo(`Using voice: ${preferredVoice.name}`)
        } else {
          console.log(`No specific voice found for ${targetLanguage}, using default`)
          setDebugInfo(`No specific voice for ${targetLanguage}, using default`)
        }

        utterance.lang = languageConfig.voice
      } else {
        utterance.lang = "en-US"
        console.log("Fallback to English")
        setDebugInfo("Fallback to English")
      }

      utterance.rate = targetLanguage === "en" ? 0.9 : 0.7
      utterance.pitch = 1
      utterance.volume = 1

      utterance.onstart = () => {
        setIsSpeaking(true)
        console.log("Speech started")
      }

      utterance.onend = () => {
        setIsSpeaking(false)
        console.log("Speech ended")
        setSpeechQueue((prev) => prev.slice(1))
      }

      utterance.onerror = (event) => {
        setIsSpeaking(false)
        console.error("Speech error:", event)
        setDebugInfo(`Speech error: ${event.error}`)
        setSpeechQueue((prev) => prev.slice(1))
      }

      try {
        synthesis.speak(utterance)
        setDebugInfo(`Speaking: "${text.substring(0, 30)}..."`)
      } catch (error) {
        console.error("Error speaking:", error)
        setDebugInfo(`Error: ${error}`)
        setSpeechQueue((prev) => prev.slice(1))
      }
    }
  }, [speechQueue, isSpeaking, synthesis, currentLanguage, availableVoices, availableLanguages])

  return (
    <VoiceContext.Provider value={{ speak, isSupported, isSpeaking, availableVoices, debugInfo }}>
      {children}
    </VoiceContext.Provider>
  )
}

export const useVoice = () => useContext(VoiceContext)