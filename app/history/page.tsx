"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Calendar, CheckCircle, AlertCircle, Clock } from "lucide-react"
import Link from "next/link"
import { getScheduleHistory } from "@/lib/storage"
import type { ScheduleItem } from "@/lib/types"

export default function HistoryPage() {
  const [history, setHistory] = useState<ScheduleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month">("week")

  useEffect(() => {
    loadHistory()
  }, [selectedPeriod])

  const loadHistory = async () => {
    try {
      const data = await getScheduleHistory(selectedPeriod)
      setHistory(data)
    } catch (error) {
      console.error("Error loading history:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  }

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "taken":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "missed":
        return <AlertCircle className="w-4 h-4 text-red-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getAdherenceStats = () => {
    const total = history.length
    const taken = history.filter((item) => item.status === "taken").length
    const missed = history.filter((item) => item.status === "missed").length
    const adherenceRate = total > 0 ? Math.round((taken / total) * 100) : 0

    return { total, taken, missed, adherenceRate }
  }

  const stats = getAdherenceStats()

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your history...</p>
          </div>
        </div>
      </div>
    )
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
          <h1 className="page-header">Medication History</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Period Selector */}
        <Card className="card">
          <CardContent className="p-4">
            <div className="flex space-x-2">
              <Button
                variant={selectedPeriod === "week" ? "default" : "outline"}
                onClick={() => setSelectedPeriod("week")}
                className={selectedPeriod === "week" ? "btn-primary" : "btn-secondary"}
              >
                Past Week
              </Button>
              <Button
                variant={selectedPeriod === "month" ? "default" : "outline"}
                onClick={() => setSelectedPeriod("month")}
                className={selectedPeriod === "month" ? "btn-primary" : "btn-secondary"}
              >
                Past Month
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <Card className="card">
          <CardHeader>
            <CardTitle>Adherence Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{stats.adherenceRate}%</div>
                <div className="text-sm text-gray-600">Adherence Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.taken}</div>
                <div className="text-sm text-gray-600">Taken</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.missed}</div>
                <div className="text-sm text-gray-600">Missed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* History List */}
        <Card className="card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Medication Log
            </CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-600">No medication history found for this period</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">{getStatusIcon(item.status)}</div>
                      <div>
                        <h4 className="font-medium text-gray-900">{item.medicineName}</h4>
                        <p className="text-sm text-gray-600">
                          {item.dosage} • {formatDate(item.scheduledTime)} at {formatTime(item.scheduledTime)}
                        </p>
                        {item.takenTime && (
                          <p className="text-xs text-green-600">Taken at {formatTime(item.takenTime)}</p>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant={
                        item.status === "taken" ? "default" : item.status === "missed" ? "destructive" : "secondary"
                      }
                    >
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
