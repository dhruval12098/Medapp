"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MessageCircle } from "lucide-react"
import { useNotification } from "@/components/notification-provider"
import { useLanguage } from "@/components/language-provider"
import { getUserProfile } from "@/lib/supabase-storage"

export default function SMSTest() {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isSending, setIsSending] = useState(false)
  const { showNotification } = useNotification()
  const { t } = useLanguage()

  const handleSendTestSMS = async () => {
    setIsSending(true)
    try {
      const response = await fetch('/api/send-instant-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: phoneNumber,
          message: "This is a test SMS from MedTracker."
        })
      })
      
      if (response.ok) {
        showNotification(t("testSMSSent"), "success")
      } else {
        showNotification(t("testSMSError"), "error")
      }
    } catch (error) {
      showNotification(t("testSMSError"), "error")
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="modern-card p-6 animate-slide-up">
      <div className="flex items-center mb-4">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mr-3">
          <MessageCircle className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{t("testSMS")}</h3>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700">{t("phoneNumber")}</Label>
          <Input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder={t("enterPhoneNumber")}
            className="modern-input"
          />
        </div>
        <Button
          onClick={handleSendTestSMS}
          disabled={isSending}
          className="w-full modern-button-secondary"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          {isSending ? t("sending") : t("sendTestSMS")}
        </Button>
      </div>
    </div>
  )
}