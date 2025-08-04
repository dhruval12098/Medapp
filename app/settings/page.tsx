"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Volume2, Bell, Smartphone, Globe, SettingsIcon, MessageCircle, Users } from "lucide-react"
import Link from "next/link"
import { useVoice } from "@/components/enhanced-voice-provider"
import { useLanguage } from "@/components/language-provider"
import { useNotification } from "@/components/notification-provider"
import { usePushNotification } from "@/components/push-notification-service"
import { getUserProfile, updateUserProfile } from "@/lib/supabase-storage"

interface SettingsData {
  voiceEnabled: boolean
  voiceVolume: number
  notificationsEnabled: boolean
  reminderInterval: number
  language: string
  smsNotificationsEnabled: boolean
  missedReminderThreshold: number
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData>({
    voiceEnabled: true,
    voiceVolume: 80,
    notificationsEnabled: true,
    reminderInterval: 15,
    language: "en",
    smsNotificationsEnabled: false,
    missedReminderThreshold: 3
  })
  const [isSaving, setIsSaving] = useState(false)
  const { speak, isSupported } = useVoice()
  const { currentLanguage, setLanguage, t, availableLanguages } = useLanguage()
  const { showNotification } = useNotification()
  const { isSubscribed, isPushSupported, subscribeToPushNotifications, unsubscribeFromPushNotifications, sendTestPushNotification } = usePushNotification()

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const saved = localStorage.getItem("medtracker-settings")
      const profile = await getUserProfile()
      const parsedSettings = saved ? JSON.parse(saved) : {}
      setSettings({
        ...parsedSettings,
        language: currentLanguage,
        smsNotificationsEnabled: profile.smsNotificationsEnabled || false,
        missedReminderThreshold: profile.missedReminderThreshold || 3
      })
    } catch (error) {
      console.error("Error loading settings:", error)
    }
  }

  const saveSettings = async (newSettings: SettingsData) => {
    setIsSaving(true)
    try {
      localStorage.setItem("medtracker-settings", JSON.stringify(newSettings))
      await updateUserProfile({
        smsNotificationsEnabled: newSettings.smsNotificationsEnabled,
        missedReminderThreshold: newSettings.missedReminderThreshold
      })
      setSettings(newSettings)
      showNotification(t("settingsSaved"), "success")
    } catch (error) {
      showNotification(t("settingsError"), "error")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSettingChange = (key: keyof SettingsData, value: any) => {
    const newSettings = { ...settings, [key]: value }

    if (key === "language") {
      setLanguage(value)
    }

    saveSettings(newSettings)
  }

  const testVoice = () => {
    speak(t("voiceTest"))
  }

  const testNotification = () => {
    if ("Notification" in window && "serviceWorker" in navigator) {
      if (Notification.permission === "granted") {
        // Use service worker to show notification (works in PWA)
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification(t("reminderTitle"), {
            body: t("testNotification"),
            icon: "/icon-192x192.png",
            badge: "/icon-72x72.png",
            // @ts-ignore - Actions property is supported in modern browsers but not in TypeScript types
            actions: [

              { action: "taken", title: "Taken" },
              { action: "snooze", title: "Snooze" }
            ]
          })
          showNotification(t("testNotificationSent"), "success")
        })
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            navigator.serviceWorker.ready.then((registration) => {
              registration.showNotification(t("reminderTitle"), {
                body: t("notificationsEnabled"),
                icon: "/icon-192x192.png",
                badge: "/icon-72x72.png",
                // @ts-ignore - Actions property is supported in modern browsers but not in TypeScript types
                actions: [
                  { action: "taken", title: "Taken" },
                  { action: "snooze", title: "Snooze" }
                ]
              })
              showNotification(t("notificationsEnabled"), "success")
            })
          }
        })
      } else {
        showNotification(t("notificationsBlocked"), "error")
      }
    } else {
      // Fallback for environments without service worker support
      showNotification("Notifications not supported", "error")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="floating-header sticky top-0 z-50">
        <div className="max-w-md mx-auto px-6 py-4 flex items-center">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mr-3 w-10 h-10 rounded-full bg-white/80">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-br from-gray-500 to-gray-700 rounded-full flex items-center justify-center mr-3">
              <SettingsIcon className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">{t("settings")}</h1>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-6 py-6 space-y-6">
        {/* Language Settings */}
        <div className="modern-card p-6 animate-fade-scale">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{t("languageSettings")}</h3>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">{t("selectLanguage")}</Label>
              <Select value={currentLanguage} onValueChange={(value) => handleSettingChange("language", value)}>
                <SelectTrigger className="modern-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white/95 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
                  {Object.entries(availableLanguages).map(([code, lang]) => (
                    <SelectItem key={code} value={code} className="rounded-xl">
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Voice Settings */}
        <div className="modern-card p-6 animate-slide-up">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mr-3">
              <Volume2 className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{t("voiceSettings")}</h3>
          </div>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-semibold text-gray-700">{t("enableVoice")}</Label>
                <p className="text-xs text-gray-600">{t("voiceDescription")}</p>
              </div>
              <Switch
                checked={settings.voiceEnabled && isSupported}
                onCheckedChange={(checked) => handleSettingChange("voiceEnabled", checked)}
                disabled={!isSupported}
              />
            </div>

            {settings.voiceEnabled && isSupported && (
              <>
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-gray-700">{t("voiceVolume")}</Label>
                  <Slider
                    value={[settings.voiceVolume]}
                    onValueChange={([value]) => handleSettingChange("voiceVolume", value)}
                    max={100}
                    step={10}
                    className="w-full"
                  />
                  <p className="text-sm text-gray-600 text-center">{settings.voiceVolume}%</p>
                </div>

                <Button onClick={testVoice} className="w-full modern-button-secondary">
                  <Volume2 className="w-4 h-4 mr-2" />
                  {t("testVoice")}
                </Button>
              </>
            )}

            {!isSupported && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl">
                <p className="text-sm text-red-800">{t("voiceNotSupported")}</p>
              </div>
            )}
          </div>
        </div>

        {/* Notification Settings */}
        <div className="modern-card p-6 animate-slide-up">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mr-3">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{t("notificationSettings")}</h3>
          </div>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-semibold text-gray-700">{t("enableNotifications")}</Label>
                <p className="text-xs text-gray-600">{t("notificationDescription")}</p>
              </div>
              <Switch
                checked={settings.notificationsEnabled}
                onCheckedChange={(checked) => handleSettingChange("notificationsEnabled", checked)}
              />
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-700">{t("reminderInterval")}</Label>
              <p className="text-xs text-gray-600">{t("reminderIntervalDescription")}</p>
              <Slider
                value={[settings.reminderInterval]}
                onValueChange={([value]) => handleSettingChange("reminderInterval", value)}
                min={5}
                max={60}
                step={5}
                className="w-full"
              />
              <p className="text-sm text-gray-600 text-center">
                {settings.reminderInterval} {t("minutes")}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-semibold text-gray-700">Enable Push Notifications</Label>
                <p className="text-xs text-gray-600">Receive notifications even when app is closed</p>
              </div>
              <Switch
                checked={isSubscribed}
                onCheckedChange={(checked) => {
                  if (checked) {
                    subscribeToPushNotifications()
                  } else {
                    unsubscribeFromPushNotifications()
                  }
                }}
                disabled={!isPushSupported}
              />
            </div>

            <div className="flex space-x-2">
              <Button onClick={testNotification} className="flex-1 modern-button-secondary">
                <Bell className="w-4 h-4 mr-2" />
                {t("testNotification")}
              </Button>
              
              {isPushSupported && (
                <Button 
                  onClick={sendTestPushNotification} 
                  className="flex-1 modern-button-secondary"
                  disabled={!isSubscribed}
                >
                  <Smartphone className="w-4 h-4 mr-2" />
                  Test Push
                </Button>
              )}
            </div>
            
            {!isPushSupported && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-2xl">
                <p className="text-sm text-yellow-800">Push notifications are not supported in this browser.</p>
              </div>
            )}
          </div>
        </div>

        {/* Family SMS Notification Settings */}
        <div className="modern-card p-6 animate-slide-up">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full flex items-center justify-center mr-3">
              <Users className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Family SMS Alerts</h3>
          </div>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-semibold text-gray-700">Enable Family SMS Alerts</Label>
                <p className="text-xs text-gray-600">Notify family when you miss medicines</p>
              </div>
              <Switch
                checked={settings.smsNotificationsEnabled}
                onCheckedChange={(checked) => handleSettingChange("smsNotificationsEnabled", checked)}
              />
            </div>

            {settings.smsNotificationsEnabled && (
              <>
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-gray-700">Alert Threshold</Label>
                  <p className="text-xs text-gray-600">Alert family after missing this many doses</p>
                  <div className="flex items-center space-x-4">
                    <Slider
                      value={[settings.missedReminderThreshold]}
                      onValueChange={([value]) => handleSettingChange("missedReminderThreshold", value)}
                      min={1}
                      max={10}
                      step={1}
                      className="flex-1"
                    />
                    <div className="w-12 text-center">
                      <span className="text-lg font-bold text-gray-900">
                        {settings.missedReminderThreshold}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 text-center">
                    Alert after {settings.missedReminderThreshold} missed dose{settings.missedReminderThreshold > 1 ? 's' : ''}
                  </p>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl">
                  <p className="text-sm text-blue-800">
                    <strong>How it works:</strong> If you miss {settings.missedReminderThreshold} or more doses of any medicine, 
                    your family contacts will receive an SMS alert within 5 minutes of the scheduled medicine time until you take your medicine.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* SMS Notification Settings */}
        <div className="modern-card p-6 animate-slide-up">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mr-3">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{t("smsNotificationSettings")}</h3>
          </div>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-semibold text-gray-700">{t("enableSMSNotifications")}</Label>
                <p className="text-xs text-gray-600">{t("smsNotificationDescription")}</p>
              </div>
              <Switch
                checked={settings.smsNotificationsEnabled}
                onCheckedChange={(checked) => handleSettingChange("smsNotificationsEnabled", checked)}
              />
            </div>
          </div>
        </div>

        {/* App Information */}
        <div className="modern-card p-6 animate-slide-up">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mr-3">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{t("appInformation")}</h3>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-2xl">
                <p className="text-sm font-semibold text-gray-900">{t("version")}</p>
                <p className="text-xs text-gray-600">1.0.0</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-2xl">
                <p className="text-sm font-semibold text-gray-900">{t("lastUpdated")}</p>
                <p className="text-xs text-gray-600">{t("today")}</p>
              </div>
            </div>
            <div className="p-4 bg-blue-50 rounded-2xl">
              <p className="text-sm text-blue-800">{t("appDescription")}</p>
            </div>
          </div>
        </div>

        {isSaving && (
          <div className="fixed bottom-6 right-6 bg-green-600 text-white px-4 py-2 rounded-2xl shadow-lg">
            <p className="text-sm font-medium">{t("savingSettings")}</p>
          </div>
        )}
      </main>
    </div>
  )
}