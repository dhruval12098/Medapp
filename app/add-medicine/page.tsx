"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Plus, Trash2, Pill } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useVoice } from "@/components/enhanced-voice-provider"
import { useNotification } from "@/components/notification-provider"
import { addMedicine } from "@/lib/storage"
import type { Medicine } from "@/lib/types"

export default function AddMedicinePage() {
  const [formData, setFormData] = useState({
    name: "",
    dosage: "",
    unit: "tablet",
    frequency: "daily",
    times: ["09:00"],
    instructions: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const { speak } = useVoice()
  const { showNotification } = useNotification()

  const handleAddTime = () => {
    setFormData((prev) => ({
      ...prev,
      times: [...prev.times, ""],
    }))
  }

  const handleTimeChange = (index: number, value: string) => {
    const newTimes = [...formData.times]
    newTimes[index] = value
    setFormData((prev) => ({
      ...prev,
      times: newTimes,
    }))
  }

  const handleRemoveTime = (index: number) => {
    if (formData.times.length > 1) {
      const newTimes = formData.times.filter((_, i) => i !== index)
      setFormData((prev) => ({
        ...prev,
        times: newTimes,
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.dosage || formData.times.some((t) => !t)) {
      showNotification("Please fill in all required fields", "error")
      return
    }

    setIsSubmitting(true)

    try {
      const medicine: Omit<Medicine, "id" | "createdAt"> = {
        name: formData.name,
        dosage: `${formData.dosage} ${formData.unit}`,
        frequency: formData.frequency as "daily" | "weekly",
        times: formData.times.filter((t) => t),
        instructions: formData.instructions,
        active: true,
      }

      await addMedicine(medicine)
      speak(`${formData.name} has been added to your medicine list`)
      showNotification(`${formData.name} added successfully`, "success")
      router.push("/")
    } catch (error) {
      showNotification("Error adding medicine. Please try again.", "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Modern Header */}
      <header className="floating-header sticky top-0 z-50">
        <div className="max-w-md mx-auto px-6 py-4 flex items-center">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mr-3 w-10 h-10 rounded-full bg-white/80">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center mr-3">
              <Pill className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Add New Medicine</h1>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-6 py-6">
        <div className="modern-card p-6 animate-fade-scale">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Medicine Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
                Medicine Name *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Aspirin"
                className="modern-input"
                required
              />
            </div>

            {/* Dosage */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dosage" className="text-sm font-semibold text-gray-700">
                  Dosage *
                </Label>
                <Input
                  id="dosage"
                  type="number"
                  value={formData.dosage}
                  onChange={(e) => setFormData((prev) => ({ ...prev, dosage: e.target.value }))}
                  placeholder="1"
                  className="modern-input"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Unit</Label>
                <Select
                  value={formData.unit}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, unit: value }))}
                >
                  <SelectTrigger className="modern-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
                    <SelectItem value="tablet">tablet</SelectItem>
                    <SelectItem value="capsule">capsule</SelectItem>
                    <SelectItem value="ml">ml</SelectItem>
                    <SelectItem value="mg">mg</SelectItem>
                    <SelectItem value="drop">drop</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Frequency */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">How Often?</Label>
              <Select
                value={formData.frequency}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, frequency: value }))}
              >
                <SelectTrigger className="modern-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white/95 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
                  <SelectItem value="daily">Every Day</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Times */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-700">Times *</Label>
              {formData.times.map((time, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <Input
                    type="time"
                    value={time}
                    onChange={(e) => handleTimeChange(index, e.target.value)}
                    className="modern-input flex-1"
                    required
                  />
                  {formData.times.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveTime(index)}
                      className="w-10 h-10 rounded-full text-red-600 hover:bg-red-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={handleAddTime}
                className="w-full modern-button-secondary rounded-2xl bg-transparent"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Another Time
              </Button>
            </div>

            {/* Instructions */}
            <div className="space-y-2">
              <Label htmlFor="instructions" className="text-sm font-semibold text-gray-700">
                Instructions (Optional)
              </Label>
              <Input
                id="instructions"
                value={formData.instructions}
                onChange={(e) => setFormData((prev) => ({ ...prev, instructions: e.target.value }))}
                placeholder="e.g., Take with food"
                className="modern-input"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full modern-button modern-button-primary py-4 text-lg font-semibold"
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  Adding Medicine...
                </div>
              ) : (
                <>
                  <Plus className="w-5 h-5 mr-2" />
                  Save Medicine
                </>
              )}
            </Button>
          </form>
        </div>
      </main>
    </div>
  )
}
