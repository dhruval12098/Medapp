"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, User, Save } from "lucide-react"
import Link from "next/link"
import { useNotification } from "@/components/notification-provider"

interface UserProfile {
  name: string
  age: string
  conditions: string
  allergies: string
  emergencyContact: string
  doctorName: string
  doctorPhone: string
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile>({
    name: "",
    age: "",
    conditions: "",
    allergies: "",
    emergencyContact: "",
    doctorName: "",
    doctorPhone: "",
  })
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { showNotification } = useNotification()

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = () => {
    try {
      const saved = localStorage.getItem("medtracker-profile")
      if (saved) {
        setProfile(JSON.parse(saved))
      } else {
        setIsEditing(true) // Show edit form if no profile exists
      }
    } catch (error) {
      console.error("Error loading profile:", error)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      localStorage.setItem("medtracker-profile", JSON.stringify(profile))
      setIsEditing(false)
      showNotification("Profile saved successfully", "success")
    } catch (error) {
      showNotification("Error saving profile", "error")
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/">
              <Button variant="ghost" size="sm" className="mr-3">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="page-header">My Profile</h1>
          </div>
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)} className="btn-secondary">
              Edit
            </Button>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4">
        <Card className="card fade-in">
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="Your full name"
                      className="input-field"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      value={profile.age}
                      onChange={(e) => handleInputChange("age", e.target.value)}
                      placeholder="Your age"
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="conditions">Medical Conditions</Label>
                  <Input
                    id="conditions"
                    value={profile.conditions}
                    onChange={(e) => handleInputChange("conditions", e.target.value)}
                    placeholder="e.g., Diabetes, High Blood Pressure"
                    className="input-field"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="allergies">Allergies</Label>
                  <Input
                    id="allergies"
                    value={profile.allergies}
                    onChange={(e) => handleInputChange("allergies", e.target.value)}
                    placeholder="e.g., Penicillin, Peanuts"
                    className="input-field"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="doctorName">Doctor's Name</Label>
                  <Input
                    id="doctorName"
                    value={profile.doctorName}
                    onChange={(e) => handleInputChange("doctorName", e.target.value)}
                    placeholder="Your primary doctor"
                    className="input-field"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="doctorPhone">Doctor's Phone</Label>
                  <Input
                    id="doctorPhone"
                    type="tel"
                    value={profile.doctorPhone}
                    onChange={(e) => handleInputChange("doctorPhone", e.target.value)}
                    placeholder="Doctor's phone number"
                    className="input-field"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button onClick={handleSave} disabled={isSaving} className="flex-1 btn-primary">
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? "Saving..." : "Save Profile"}
                  </Button>
                  <Button onClick={() => setIsEditing(false)} variant="outline" className="flex-1 btn-secondary">
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                {profile.name ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="font-medium text-gray-900">Name</p>
                        <p className="text-gray-600">{profile.name}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Age</p>
                        <p className="text-gray-600">{profile.age || "Not specified"}</p>
                      </div>
                    </div>

                    {profile.conditions && (
                      <div>
                        <p className="font-medium text-gray-900">Medical Conditions</p>
                        <p className="text-gray-600">{profile.conditions}</p>
                      </div>
                    )}

                    {profile.allergies && (
                      <div>
                        <p className="font-medium text-gray-900">Allergies</p>
                        <p className="text-gray-600">{profile.allergies}</p>
                      </div>
                    )}

                    {profile.doctorName && (
                      <div>
                        <p className="font-medium text-gray-900">Primary Doctor</p>
                        <p className="text-gray-600">{profile.doctorName}</p>
                        {profile.doctorPhone && <p className="text-sm text-gray-500">{profile.doctorPhone}</p>}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <User className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-gray-600 mb-4">No profile information added yet</p>
                    <Button onClick={() => setIsEditing(true)} className="btn-primary">
                      Add Profile Information
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
