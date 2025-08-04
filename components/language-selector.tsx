"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Globe, Check, X, Volume2 } from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import { useVoice } from "@/components/enhanced-voice-provider"

export function LanguageSelector() {
  const [showSelector, setShowSelector] = useState(false)
  const { currentLanguage, setLanguage, availableLanguages } = useLanguage()
  const { speak, isSupported, availableVoices } = useVoice()

  const handleLanguageChange = (languageCode: string) => {
    console.log(`Changing language to: ${languageCode}`)
    setLanguage(languageCode)

    const welcomeMessages = {
      en: "Language changed to English",
      hi: "भाषा हिंदी में बदल दी गई",
      mr: "भाषा मराठीत बदलली",
      gu: "ભાષા ગુજરાતીમાં બદલાઈ",
    }

    const message = welcomeMessages[languageCode as keyof typeof welcomeMessages] || welcomeMessages.en
    setTimeout(() => {
      speak(message, languageCode)
    }, 100)

    setShowSelector(false)
  }

  const testVoice = (languageCode: string) => {
    const testMessages = {
      en: "This is a test in English",
      hi: "यह हिंदी में एक परीक्षण है",
      mr: "हे मराठीत एक चाचणी आहे",
      gu: "આ ગુજરાતીમાં એક પરીક્ષા છે",
    }

    const message = testMessages[languageCode as keyof typeof testMessages] || testMessages.en
    speak(message, languageCode)
  }

  if (!showSelector) {
    return (
      <Button
        onClick={() => setShowSelector(true)}
        variant="ghost"
        size="sm"
        className="w-10 h-10 rounded-full bg-white/80 hover:bg-white/90"
      >
        <Globe className="w-4 h-4" />
      </Button>
    )
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-[100]" onClick={() => setShowSelector(false)} />

      {/* Centered Modal */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
        <Card className="w-full max-w-sm modern-card animate-fade-scale pointer-events-auto">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold flex items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center mr-3">
                  <Globe className="w-4 h-4 text-white" />
                </div>
                Select Language
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSelector(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-3 mb-6">
              {Object.entries(availableLanguages).map(([code, language]) => (
                <div key={code} className="flex items-center space-x-3">
                  <button
                    onClick={() => handleLanguageChange(code)}
                    className={`flex-1 text-left p-4 rounded-2xl border-2 transition-all duration-300 ${
                      currentLanguage === code
                        ? "border-purple-300 bg-purple-50 text-purple-900"
                        : "border-gray-200 text-gray-900 hover:border-purple-200 hover:bg-purple-25"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{language.name}</span>
                      {currentLanguage === code && <Check className="w-4 h-4 text-purple-600" />}
                    </div>
                  </button>

                  <Button
                    onClick={() => testVoice(code)}
                    variant="ghost"
                    size="sm"
                    className="w-10 h-10 rounded-full hover:bg-purple-100"
                    title="Test voice"
                  >
                    <Volume2 className="w-4 h-4 text-purple-600" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="p-4 bg-blue-50 rounded-2xl">
              <p className="text-sm text-blue-800 mb-2">
                <strong>💡 Tip:</strong> Voice notifications will use your selected language.
              </p>
              <div className="text-xs text-blue-600 space-y-1">
                <p>• Voice Support: {isSupported ? "✅ Enabled" : "❌ Disabled"}</p>
                <p>• Available Voices: {availableVoices.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
