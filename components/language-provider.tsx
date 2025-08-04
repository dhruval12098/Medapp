"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { languages, getTranslation } from "@/lib/languages"

interface LanguageContextType {
  currentLanguage: string
  setLanguage: (language: string) => void
  t: (key: string, params?: Record<string, string>) => string
  availableLanguages: typeof languages
}

const LanguageContext = createContext<LanguageContextType>({
  currentLanguage: "en",
  setLanguage: () => {},
  t: (key: string) => key,
  availableLanguages: languages,
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState("en")

  useEffect(() => {
    // Load saved language or detect from browser
    const savedLanguage = localStorage.getItem("medtracker-language")
    if (savedLanguage && languages[savedLanguage as keyof typeof languages]) {
      setCurrentLanguage(savedLanguage)
    } else {
      // Auto-detect Indian languages from browser
      const browserLang = navigator.language.toLowerCase()
      if (browserLang.includes("hi")) setCurrentLanguage("hi")
      else if (browserLang.includes("mr")) setCurrentLanguage("mr")
      else if (browserLang.includes("gu")) setCurrentLanguage("gu")
    }
  }, [])

  const setLanguage = (language: string) => {
    setCurrentLanguage(language)
    localStorage.setItem("medtracker-language", language)
  }

  const t = (key: string, params?: Record<string, string>) => {
    return getTranslation(currentLanguage, key, params)
  }

  return (
    <LanguageContext.Provider value={{ currentLanguage, setLanguage, t, availableLanguages: languages }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)
