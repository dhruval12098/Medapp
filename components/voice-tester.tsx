"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Volume2, RefreshCw } from "lucide-react"

export function VoiceTester() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    // Check if speech synthesis is supported
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      setIsSupported(true)
      loadVoices()
    } else {
      setIsSupported(false)
      setIsLoading(false)
    }
  }, [])

  const loadVoices = () => {
    if (!isSupported) return

    setIsLoading(true)

    const getVoices = () => {
      try {
        const availableVoices = window.speechSynthesis.getVoices()
        setVoices(availableVoices)
        setIsLoading(false)
        console.log("All available voices:", availableVoices)
      } catch (error) {
        console.error("Error loading voices:", error)
        setIsLoading(false)
      }
    }

    // Try multiple ways to get voices
    getVoices()

    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = getVoices
    }

    // Fallback
    setTimeout(getVoices, 1000)
  }

  const testVoice = (voice: SpeechSynthesisVoice, text: string) => {
    if (!isSupported) return

    try {
      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.voice = voice
      utterance.rate = 0.8
      utterance.pitch = 1
      utterance.volume = 1

      window.speechSynthesis.speak(utterance)
    } catch (error) {
      console.error("Error testing voice:", error)
    }
  }

  const getLanguageVoices = (langCode: string) => {
    return voices.filter(
      (voice) =>
        voice.lang.toLowerCase().includes(langCode.toLowerCase()) ||
        voice.name.toLowerCase().includes(langCode.toLowerCase()),
    )
  }

  const testTexts = {
    en: "Hello, this is a test in English",
    hi: "नमस्ते, यह हिंदी में एक परीक्षण है",
    mr: "नमस्कार, हे मराठीत एक चाचणी आहे",
    gu: "નમસ્તે, આ ગુજરાતીમાં એક પરીક્ષા છે",
  }

  if (!isSupported) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6 text-center">
          <p className="text-red-600">Speech synthesis is not supported in this browser.</p>
          <p className="text-sm text-gray-600 mt-2">Please try Chrome or Safari for voice features.</p>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6 text-center">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
          <p>Loading available voices...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Volume2 className="w-5 h-5 mr-2" />
            Voice Quality Tester
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Total voices found:</strong> {voices.length}
            </p>
            <p className="text-sm text-blue-700 mt-1">
              Test different voices to find the best quality for each language.
            </p>
          </div>

          <Button onClick={loadVoices} variant="outline" className="mb-4 bg-transparent">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Voices
          </Button>
        </CardContent>
      </Card>

      {/* English Voices */}
      <Card>
        <CardHeader>
          <CardTitle>🇺🇸 English Voices ({getLanguageVoices("en").length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {getLanguageVoices("en")
              .slice(0, 5)
              .map((voice, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{voice.name}</p>
                    <p className="text-sm text-gray-600">{voice.lang}</p>
                  </div>
                  <Button onClick={() => testVoice(voice, testTexts.en)} size="sm" variant="outline">
                    <Volume2 className="w-4 h-4 mr-1" />
                    Test
                  </Button>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Hindi Voices */}
      <Card>
        <CardHeader>
          <CardTitle>🇮🇳 Hindi Voices ({getLanguageVoices("hi").length})</CardTitle>
        </CardHeader>
        <CardContent>
          {getLanguageVoices("hi").length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No Hindi voices found on your system</p>
              <p className="text-sm mt-2">Try testing on Android device for better Hindi support</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {getLanguageVoices("hi").map((voice, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{voice.name}</p>
                    <p className="text-sm text-gray-600">{voice.lang}</p>
                  </div>
                  <Button onClick={() => testVoice(voice, testTexts.hi)} size="sm" variant="outline">
                    <Volume2 className="w-4 h-4 mr-1" />
                    Test
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Show a simple list of all voices for debugging */}
      <Card>
        <CardHeader>
          <CardTitle>🌍 All Available Voices ({voices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {voices.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No voices available</p>
          ) : (
            <div className="max-h-60 overflow-y-auto">
              <div className="grid gap-2">
                {voices.map((voice, index) => (
                  <div key={index} className="flex items-center justify-between p-2 text-sm border-b">
                    <div>
                      <span className="font-medium">{voice.name}</span>
                      <span className="text-gray-500 ml-2">({voice.lang})</span>
                    </div>
                    <Button onClick={() => testVoice(voice, "Hello test")} size="sm" variant="ghost">
                      <Volume2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
