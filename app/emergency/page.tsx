"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Phone, AlertTriangle, Heart } from "lucide-react"
import Link from "next/link"
import { useVoice } from "@/components/voice-provider"
import { useNotification } from "@/components/notification-provider"
import { getContacts } from "@/lib/storage"
import type { Contact } from "@/lib/types"

export default function EmergencyPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [calling, setCalling] = useState<string | null>(null)
  const { speak } = useVoice()
  const { showNotification } = useNotification()

  useEffect(() => {
    loadContacts()
    speak("Emergency page opened. Choose who to call for help.")
  }, [])

  const loadContacts = async () => {
    try {
      const data = await getContacts()
      setContacts(data)
    } catch (error) {
      console.error("Error loading contacts:", error)
    }
  }

  const handleEmergencyCall = (phone: string, name: string) => {
    setCalling(name)
    speak(`Calling ${name} for emergency help`)
    showNotification(`Calling ${name}...`, "success")

    setTimeout(() => {
      window.location.href = `tel:${phone}`
      setCalling(null)
    }, 1000)
  }

  const handle911Call = () => {
    setCalling("911")
    speak("Calling 911 emergency services")
    showNotification("Calling 911...", "success")

    setTimeout(() => {
      window.location.href = "tel:911"
      setCalling(null)
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mr-3">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="page-header text-red-800">Emergency Help</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Emergency Warning */}
        <Card className="card border-red-300 bg-red-50 fade-in">
          <CardContent className="text-center py-8">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-600" />
            <h2 className="text-xl font-bold text-red-800 mb-2">Need Help Right Away?</h2>
            <p className="text-red-700">Choose who to call for immediate assistance</p>
          </CardContent>
        </Card>

        {/* 911 Emergency */}
        <Card className="card border-red-400 bg-red-100 fade-in">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center justify-center">
              <Phone className="w-5 h-5 mr-2" />
              Medical Emergency
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-red-700 mb-4">
              For life-threatening emergencies, chest pain, difficulty breathing, or severe injury
            </p>
            <Button
              onClick={handle911Call}
              disabled={calling === "911"}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 text-lg"
            >
              {calling === "911" ? (
                "CALLING 911..."
              ) : (
                <>
                  <Phone className="w-5 h-5 mr-2" />
                  CALL 911 EMERGENCY
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Family Contacts */}
        {contacts.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-800 text-center">Call Family for Help</h2>
            {contacts.map((contact, index) => (
              <Card
                key={contact.id}
                className="card border-orange-200 bg-orange-50 fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardHeader>
                  <CardTitle className="text-orange-800 flex items-center">
                    <Heart className="w-5 h-5 mr-2 text-red-500" />
                    {contact.name}
                    {contact.primary && (
                      <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                        PRIMARY
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-center">
                    <p className="text-orange-700 font-medium">{contact.phone}</p>
                    {contact.relationship && <p className="text-sm text-orange-600">{contact.relationship}</p>}
                  </div>
                  <Button
                    onClick={() => handleEmergencyCall(contact.phone, contact.name)}
                    disabled={calling === contact.name}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-3"
                  >
                    {calling === contact.name ? (
                      `CALLING ${contact.name.toUpperCase()}...`
                    ) : (
                      <>
                        <Phone className="w-4 h-4 mr-2" />
                        CALL {contact.name.toUpperCase()}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="card border-gray-200 bg-gray-50 fade-in">
            <CardContent className="text-center py-12">
              <Heart className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <h3 className="font-medium text-gray-900 mb-2">No family contacts added</h3>
              <p className="text-sm text-gray-600 mb-4">Add family contacts so they can help you in emergencies</p>
              <Link href="/contacts">
                <Button className="btn-primary">Add Family Contacts</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="card border-blue-200 bg-blue-50 fade-in">
          <CardHeader>
            <CardTitle className="text-blue-800">When to Use Emergency Help</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-blue-700 mb-2">Call 911 if you have:</h4>
              <ul className="text-sm text-blue-600 space-y-1 ml-4">
                <li>• Chest pain or heart problems</li>
                <li>• Trouble breathing</li>
                <li>• Severe injury or bleeding</li>
                <li>• Loss of consciousness</li>
                <li>• Severe allergic reaction</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-700 mb-2">Call family if you:</h4>
              <ul className="text-sm text-blue-600 space-y-1 ml-4">
                <li>• Feel confused about medicines</li>
                <li>• Need help getting to doctor</li>
                <li>• Feel unwell but not emergency</li>
                <li>• Need someone to check on you</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
