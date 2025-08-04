"use client"

import { VoiceTester } from "@/components/voice-tester"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function VoiceTestPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mr-3">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Voice Quality Tester</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        <VoiceTester />
      </main>
    </div>
  )
}
