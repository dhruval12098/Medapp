"use client"

import { useEffect, useState } from "react"
import { useVoice } from "@/components/enhanced-voice-provider"
import { useLanguage } from "@/components/language-provider"
import { useNotification } from "@/components/notification-provider"
import { getTodaySchedule, markMedicineAsTaken, markMedicineAsMissed } from "@/lib/supabase-storage"
import { resetMissedReminder, incrementMissedReminder } from "@/lib/reminder-tracker"
import { supabase } from "@/lib/supabase"
import type { ScheduleItem } from "@/lib/types"

export function MedicationReminder() {
  const [currentReminder, setCurrentReminder] = useState<ScheduleItem | null>(null)
  const { speak, isSpeaking } = useVoice()
  const { t } = useLanguage()
  const { showNotification } = useNotification()
  const [reminderCount, setReminderCount] = useState(0)
  const [lastSpoken, setLastSpoken] = useState<string | null>(null)

  useEffect(() => {
    const checkForReminders = async () => {
      try {
        const schedule = await getTodaySchedule()
        const now = new Date()

        schedule.forEach((item) => {
          if (item.status !== "pending") return

          const scheduledTime = new Date(item.scheduledTime)
          const oneMinuteBefore = new Date(scheduledTime.getTime() - 1 * 60000)
          const fiveMinutesWindow = new Date(scheduledTime.getTime() + 5 * 60000)

          const reminderKey = `${item.id}-${reminderCount}`

          if (now >= oneMinuteBefore && now < scheduledTime && (!currentReminder || currentReminder.id !== item.id)) {
            setCurrentReminder(item)
            const text = t("takeMedicine", { medicine: item.medicineName, dosage: item.dosage })
            if (lastSpoken !== text && !isSpeaking) {
              speak(text)
              setLastSpoken(text)
            }
            if ("Notification" in window && Notification.permission === "granted") {
              // Play alarm sound
              const audio = new Audio("/alarm-sound.mp3")
              audio.play().catch(err => console.error("Error playing alarm sound:", err))
              
              new Notification(t("reminderTitle"), {
                body: t("reminderBody", { medicine: item.medicineName, dosage: item.dosage }),
                icon: "/icon-192x192.png",
                badge: "/icon-192x192.png",
                tag: item.id,
                requireInteraction: true,
                silent: false
              })
            }
            showNotification(t("takeMedicine", { medicine: item.medicineName, dosage: item.dosage }), "success")
          }

          if (now >= scheduledTime && now <= fiveMinutesWindow && (!currentReminder || currentReminder.id === item.id) && reminderCount < 3) {
            if (!currentReminder) {
              setCurrentReminder(item)
              setReminderCount(0)
              
              // Play alarm sound for the main reminder
              const audio = new Audio("/alarm-sound.mp3")
              audio.play().catch(err => console.error("Error playing alarm sound:", err))
            }
            const text = t("takeMedicine", { medicine: item.medicineName, dosage: item.dosage })
            if (lastSpoken !== `${text}-${reminderCount}` && !isSpeaking) {
              speak(text)
              setLastSpoken(`${text}-${reminderCount}`)
            }
            setReminderCount((prev) => prev + 1)
          }
        })
      } catch (error) {
        console.error("Error checking reminders:", error)
      }
    }

    checkForReminders()
    const interval = setInterval(checkForReminders, 60000)

    return () => clearInterval(interval)
  }, [currentReminder, speak, showNotification, t, reminderCount, lastSpoken, isSpeaking])

  const handleTakeMedicine = async () => {
    if (!currentReminder) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      await markMedicineAsTaken(currentReminder.id)
      await resetMissedReminder(currentReminder.id, user.id)
      
      const audio = new Audio("/success-sound.mp3")
      audio.onerror = () => {
        console.log("Sound file not found, using beep fallback")
        const beep = new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAIAgA...")
        beep.play().catch(() => console.log("Beep failed"))
      }
      audio.play().catch(() => {
        const beep = new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAIAgA...")
        beep.play().catch(() => console.log("Beep failed"))
      })

      const text = t("medicineTaken", { medicine: currentReminder.medicineName })
      if (!isSpeaking) {
        speak(text)
        setLastSpoken(text)
      }
      showNotification(text, "success")
      setCurrentReminder(null)
      setReminderCount(0)
    } catch (error) {
      console.error("Error in handleTakeMedicine:", error)
      showNotification(t("settingsError"), "error")
    }
  }

  const handleSnooze = async () => {
    if (!currentReminder) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      await markMedicineAsMissed(currentReminder.id)
      await incrementMissedReminder(currentReminder.id, currentReminder.medicineId, user.id)
      
      const text = t("snoozeMessage")
      if (!isSpeaking) {
        speak(text)
        setLastSpoken(text)
      }
      showNotification(text, "success")
      setCurrentReminder(null)
      setReminderCount(0)

      setTimeout(() => {
        setCurrentReminder({ ...currentReminder, status: "pending" })
        
        // Play alarm sound when reminder returns after snooze
        const audio = new Audio("/alarm-sound.mp3")
        audio.play().catch(err => console.error("Error playing alarm sound:", err))
        
        const retryText = t("takeMedicine", { medicine: currentReminder.medicineName, dosage: currentReminder.dosage })
        if (!isSpeaking) {
          speak(retryText)
          setLastSpoken(retryText)
        }
        showNotification(retryText, "success")
      }, 30 * 1000)
    } catch (error) {
      console.error("Error in handleSnooze:", error)
      showNotification(t("settingsError"), "error")
    }
  }

  const handleDismiss = async () => {
    if (!currentReminder) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      await markMedicineAsMissed(currentReminder.id)
      await incrementMissedReminder(currentReminder.id, currentReminder.medicineId, user.id)
      
      try {
        const response = await fetch('/api/send-instant-sms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            medicineName: currentReminder.medicineName,
            dosage: currentReminder.dosage,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to send instant SMS: ${response.statusText}`);
        }
      } catch (error) {
        console.error('Error sending instant SMS:', error)
      }
      
      const text = t("medicineDismissed", { medicine: currentReminder.medicineName })
      if (!isSpeaking) {
        speak(text)
        setLastSpoken(text)
      }
      showNotification(text, "success")
      setCurrentReminder(null)
      setReminderCount(0)
    } catch (error) {
      console.error("Error in handleDismiss:", error)
      showNotification(t("settingsError"), "error")
    }
  }

  if (!currentReminder) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto">
      <div className="card border-blue-200 bg-blue-50 p-4">
        <div className="text-center mb-4">
          <h3 className="font-bold text-blue-900 mb-1">{t("medicineTime")}</h3>
          <p className="text-blue-800 font-medium">{currentReminder.medicineName}</p>
          <p className="text-sm text-blue-700">{currentReminder.dosage}</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleTakeMedicine}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            {t("wellDone")}
          </button>
          <button
            onClick={handleSnooze}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            Snooze 30sec
          </button>
          <button
            onClick={handleDismiss}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  )
}