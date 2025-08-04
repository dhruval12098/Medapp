"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Search, Plus, Clock, Trash2, MoreVertical, Pill } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { useVoice } from "@/components/enhanced-voice-provider"
import { useNotification } from "@/components/notification-provider"
import { getMedicines, deleteMedicine, toggleMedicineActive } from "@/lib/storage"
import type { Medicine } from "@/lib/types"

export default function MedicinesPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [filteredMedicines, setFilteredMedicines] = useState<Medicine[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const { speak } = useVoice()
  const { showNotification } = useNotification()

  useEffect(() => {
    loadMedicines()
  }, [])

  useEffect(() => {
    const filtered = medicines.filter((medicine) => medicine.name.toLowerCase().includes(searchQuery.toLowerCase()))
    setFilteredMedicines(filtered)
  }, [medicines, searchQuery])

  const loadMedicines = async () => {
    try {
      const data = await getMedicines()
      setMedicines(data)
    } catch (error) {
      showNotification("Error loading medicines", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      try {
        await deleteMedicine(id)
        speak(`${name} has been removed from your medicine list`)
        showNotification(`${name} deleted successfully`, "success")
        loadMedicines()
      } catch (error) {
        showNotification("Error deleting medicine", "error")
      }
    }
  }

  const handleToggleActive = async (id: string, name: string, currentActive: boolean) => {
    try {
      await toggleMedicineActive(id, !currentActive)
      const action = currentActive ? "paused" : "activated"
      speak(`${name} has been ${action}`)
      showNotification(`${name} ${action}`, "success")
      loadMedicines()
    } catch (error) {
      showNotification("Error updating medicine", "error")
    }
  }

  const formatTimes = (times: string[]) => {
    return times
      .map((time) => {
        const [hours, minutes] = time.split(":")
        const hour = Number.parseInt(hours)
        const ampm = hour >= 12 ? "PM" : "AM"
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
        return `${displayHour}:${minutes} ${ampm}`
      })
      .join(", ")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your medicines...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="floating-header sticky top-0 z-50">
        <div className="max-w-md mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/">
              <Button variant="ghost" size="sm" className="mr-3 w-10 h-10 rounded-full bg-white/80">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mr-3">
                <Pill className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">My Medicines</h1>
            </div>
          </div>
          <Link href="/add-medicine">
            <Button className="modern-button modern-button-primary px-4 py-2">
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-md mx-auto px-6 py-6 space-y-6">
        {/* Search */}
        <div className="modern-card p-4 animate-fade-scale">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search medicines..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="modern-input pl-12"
            />
          </div>
        </div>

        {/* Medicines List */}
        {filteredMedicines.length === 0 ? (
          <div className="modern-card p-8 text-center animate-slide-up">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery ? "No medicines found" : "No medicines added yet"}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery ? "Try adjusting your search terms" : "Add your first medicine to get started with tracking"}
            </p>
            {!searchQuery && (
              <Link href="/add-medicine">
                <Button className="modern-button modern-button-primary">Add Your First Medicine</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMedicines.map((medicine, index) => (
              <div
                key={medicine.id}
                className={`modern-card p-6 modern-card-hover animate-slide-up ${!medicine.active ? "opacity-60" : ""}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center mr-3">
                        <Pill className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{medicine.name}</h3>
                        <p className="text-sm text-gray-600">{medicine.dosage}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        medicine.active ? "status-badge-taken" : "status-badge-pending"
                      }`}
                    >
                      {medicine.active ? "Active" : "Paused"}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-8 h-8 rounded-full">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="bg-white/95 backdrop-blur-sm border-0 shadow-lg rounded-2xl"
                      >
                        <DropdownMenuItem
                          onClick={() => handleToggleActive(medicine.id, medicine.name, medicine.active)}
                          className="rounded-xl"
                        >
                          {medicine.active ? "Pause" : "Activate"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(medicine.id, medicine.name)}
                          className="text-red-600 rounded-xl"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-1">Schedule</p>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="w-4 h-4 mr-1" />
                        {formatTimes(medicine.times)}
                      </div>
                      <p className="text-sm text-gray-600 capitalize">{medicine.frequency}</p>
                    </div>
                  </div>
                  {medicine.instructions && (
                    <div className="p-3 bg-blue-50 rounded-2xl">
                      <p className="text-sm font-semibold text-blue-800 mb-1">Instructions</p>
                      <p className="text-sm text-blue-700">{medicine.instructions}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
