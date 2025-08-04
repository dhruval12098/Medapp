"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, BarChart3, TrendingUp, Calendar } from "lucide-react"
import Link from "next/link"
import { getScheduleHistory, getMedicines } from "@/lib/storage"
import type { ScheduleItem, Medicine } from "@/lib/types"

export default function ReportsPage() {
  const [history, setHistory] = useState<ScheduleItem[]>([])
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month" | "quarter">("month")

  useEffect(() => {
    loadData()
  }, [selectedPeriod])

  const loadData = async () => {
    try {
      const [historyData, medicinesData] = await Promise.all([
        getScheduleHistory(selectedPeriod === "quarter" ? "month" : selectedPeriod),
        getMedicines(),
      ])
      setHistory(historyData)
      setMedicines(medicinesData)
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getAdherenceStats = () => {
    const total = history.length
    const taken = history.filter((item) => item.status === "taken").length
    const missed = history.filter((item) => item.status === "missed").length
    const adherenceRate = total > 0 ? Math.round((taken / total) * 100) : 0

    return { total, taken, missed, adherenceRate }
  }

  const getMedicineStats = () => {
    const medicineStats = medicines.map((medicine) => {
      const medicineHistory = history.filter((item) => item.medicineId === medicine.id)
      const taken = medicineHistory.filter((item) => item.status === "taken").length
      const total = medicineHistory.length
      const adherenceRate = total > 0 ? Math.round((taken / total) * 100) : 0

      return {
        name: medicine.name,
        taken,
        total,
        adherenceRate,
      }
    })

    return medicineStats.sort((a, b) => b.adherenceRate - a.adherenceRate)
  }

  const exportReport = () => {
    const stats = getAdherenceStats()
    const medicineStats = getMedicineStats()

    const reportData = {
      period: selectedPeriod,
      generatedAt: new Date().toISOString(),
      overallStats: stats,
      medicineBreakdown: medicineStats,
      detailedHistory: history.map((item) => ({
        medicine: item.medicineName,
        dosage: item.dosage,
        scheduledTime: item.scheduledTime,
        status: item.status,
        takenTime: item.takenTime,
      })),
    }

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `medication-report-${selectedPeriod}-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const stats = getAdherenceStats()
  const medicineStats = getMedicineStats()

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your reports...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/">
              <Button variant="ghost" size="sm" className="mr-3">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="page-header">Medication Reports</h1>
          </div>
          <Button onClick={exportReport} className="btn-secondary">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
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
              <Button
                variant={selectedPeriod === "quarter" ? "default" : "outline"}
                onClick={() => setSelectedPeriod("quarter")}
                className={selectedPeriod === "quarter" ? "btn-primary" : "btn-secondary"}
              >
                Past Quarter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Overall Statistics */}
        <Card className="card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Overall Adherence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{stats.adherenceRate}%</div>
                <div className="text-sm text-gray-600">Adherence Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{stats.taken}</div>
                <div className="text-sm text-gray-600">Medicines Taken</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">{stats.missed}</div>
                <div className="text-sm text-gray-600">Medicines Missed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-sm text-gray-600">Total Scheduled</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Medicine Breakdown */}
        <Card className="card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Medicine Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {medicineStats.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-600">No medicine data available for this period</p>
              </div>
            ) : (
              <div className="space-y-4">
                {medicineStats.map((medicine) => (
                  <div key={medicine.name} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{medicine.name}</h4>
                      <span className="text-sm font-medium text-gray-600">{medicine.adherenceRate}% adherence</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${medicine.adherenceRate}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>{medicine.taken} taken</span>
                      <span>{medicine.total - medicine.taken} missed</span>
                      <span>{medicine.total} total</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Insights */}
        <Card className="card">
          <CardHeader>
            <CardTitle>Insights & Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.adherenceRate >= 90 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-medium">Excellent adherence!</p>
                <p className="text-sm text-green-700">You're doing great with your medication routine.</p>
              </div>
            )}

            {stats.adherenceRate >= 70 && stats.adherenceRate < 90 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 font-medium">Good adherence with room for improvement</p>
                <p className="text-sm text-yellow-700">Consider setting more reminders or adjusting your schedule.</p>
              </div>
            )}

            {stats.adherenceRate < 70 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 font-medium">Adherence needs attention</p>
                <p className="text-sm text-red-700">Consider talking to your doctor about your medication routine.</p>
              </div>
            )}

            {medicineStats.length > 0 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 font-medium">Best performing medicine:</p>
                <p className="text-sm text-blue-700">
                  {medicineStats[0].name} with {medicineStats[0].adherenceRate}% adherence
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
