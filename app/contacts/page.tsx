"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Users, Phone, Mail, Plus, Trash2, Heart } from "lucide-react"
import Link from "next/link"
import { useVoice } from "@/components/voice-provider"
import { useNotification } from "@/components/notification-provider"
import { getContacts, addContact, deleteContact } from "@/lib/storage"
import type { Contact } from "@/lib/types"

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    relationship: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { speak } = useVoice()
  const { showNotification } = useNotification()

  useEffect(() => {
    loadContacts()
  }, [])

  const loadContacts = async () => {
    try {
      const data = await getContacts()
      setContacts(data)
    } catch (error) {
      showNotification("Error loading contacts", "error")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.phone) {
      showNotification("Please enter at least a name and phone number", "error")
      return
    }

    if (contacts.length >= 2) {
      showNotification("You can only add up to 2 family contacts", "error")
      return
    }

    setIsSubmitting(true)

    try {
      const contact: Omit<Contact, "id" | "createdAt"> = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        relationship: formData.relationship,
        primary: contacts.length === 0,
      }

      await addContact(contact)
      speak(`${formData.name} has been added to your family contacts`)
      showNotification(`${formData.name} added successfully`, "success")
      setFormData({ name: "", phone: "", email: "", relationship: "" })
      setShowAddForm(false)
      loadContacts()
    } catch (error) {
      showNotification("Error adding contact", "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Remove ${name} from your family contacts?`)) {
      try {
        await deleteContact(id)
        speak(`${name} has been removed from your contacts`)
        showNotification(`${name} removed successfully`, "success")
        loadContacts()
      } catch (error) {
        showNotification("Error removing contact", "error")
      }
    }
  }

  const handleCall = (phone: string, name: string) => {
    speak(`Calling ${name}`)
    window.location.href = `tel:${phone}`
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
          <h1 className="page-header">Family Contacts</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Add Contact Button */}
        {!showAddForm && contacts.length < 2 && (
          <Card className="card">
            <CardContent className="text-center py-8">
              <Button onClick={() => setShowAddForm(true)} className="btn-primary">
                <Plus className="w-4 h-4 mr-2" />
                Add Family Contact
              </Button>
              <p className="text-sm text-gray-600 mt-3">
                Add up to 2 family members who will be notified if you miss medicines
              </p>
            </CardContent>
          </Card>
        )}

        {/* Add Contact Form */}
        {showAddForm && (
          <Card className="card fade-in">
            <CardHeader>
              <CardTitle>Add Family Contact</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                    Name *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Sarah Johnson"
                    className="input-field"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                    Phone Number *
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="e.g., (555) 123-4567"
                    className="input-field"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email (Optional)
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="e.g., sarah@email.com"
                    className="input-field"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="relationship" className="text-sm font-medium text-gray-700">
                    Relationship (Optional)
                  </Label>
                  <Input
                    id="relationship"
                    value={formData.relationship}
                    onChange={(e) => setFormData((prev) => ({ ...prev, relationship: e.target.value }))}
                    placeholder="e.g., Daughter, Son, Spouse"
                    className="input-field"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button type="submit" disabled={isSubmitting} className="flex-1 btn-primary">
                    {isSubmitting ? "Adding..." : "Add Contact"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 btn-secondary"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Contacts List */}
        {contacts.length === 0 && !showAddForm ? (
          <Card className="card">
            <CardContent className="text-center py-16">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No family contacts added yet</h3>
              <p className="text-gray-600 mb-6">Add family members who will be notified if you miss your medicines</p>
              <Button onClick={() => setShowAddForm(true)} className="btn-primary">
                <Plus className="w-4 h-4 mr-2" />
                Add First Contact
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {contacts.map((contact, index) => (
              <Card key={contact.id} className="card fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Heart className="w-5 h-5 text-red-500 mr-3" />
                      <div>
                        <CardTitle className="text-lg font-semibold text-gray-900">{contact.name}</CardTitle>
                        {contact.primary && (
                          <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full mt-1">
                            Primary Contact
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={() => handleDelete(contact.id, contact.name)}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="flex items-center text-gray-600">
                      <Phone className="w-4 h-4 mr-2" />
                      <span>{contact.phone}</span>
                    </div>
                    {contact.email && (
                      <div className="flex items-center text-gray-600">
                        <Mail className="w-4 h-4 mr-2" />
                        <span>{contact.email}</span>
                      </div>
                    )}
                    {contact.relationship && (
                      <div className="text-gray-600">
                        <span className="font-medium">Relationship:</span> {contact.relationship}
                      </div>
                    )}
                    <Button onClick={() => handleCall(contact.phone, contact.name)} className="w-full btn-primary mt-4">
                      <Phone className="w-4 h-4 mr-2" />
                      Call {contact.name}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
