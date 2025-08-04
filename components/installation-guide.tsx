"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Smartphone, Download, Share, Plus, Home, X } from "lucide-react"

export function InstallationGuide() {
  const [showGuide, setShowGuide] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  const androidSteps = [
    {
      icon: <Share className="w-6 h-6" />,
      title: "Open Chrome Browser",
      description: "Make sure you're using Chrome browser on your Android device",
      image: "/placeholder.svg?height=200&width=300",
    },
    {
      icon: <Download className="w-6 h-6" />,
      title: "Look for Install Banner",
      description: "You'll see an 'Add to Home Screen' banner at the bottom",
      image: "/placeholder.svg?height=200&width=300",
    },
    {
      icon: <Plus className="w-6 h-6" />,
      title: "Tap 'Add to Home Screen'",
      description: "Tap the banner or the menu (⋮) → 'Add to Home Screen'",
      image: "/placeholder.svg?height=200&width=300",
    },
    {
      icon: <Home className="w-6 h-6" />,
      title: "Find App on Home Screen",
      description: "MedTracker will appear as an app icon on your home screen",
      image: "/placeholder.svg?height=200&width=300",
    },
  ]

  const iosSteps = [
    {
      icon: <Share className="w-6 h-6" />,
      title: "Open Safari Browser",
      description: "Make sure you're using Safari browser on your iPhone/iPad",
      image: "/placeholder.svg?height=200&width=300",
    },
    {
      icon: <Share className="w-6 h-6" />,
      title: "Tap Share Button",
      description: "Tap the share button (□↑) at the bottom of Safari",
      image: "/placeholder.svg?height=200&width=300",
    },
    {
      icon: <Plus className="w-6 h-6" />,
      title: "Add to Home Screen",
      description: "Scroll down and tap 'Add to Home Screen'",
      image: "/placeholder.svg?height=200&width=300",
    },
    {
      icon: <Home className="w-6 h-6" />,
      title: "Confirm Installation",
      description: "Tap 'Add' to install MedTracker on your home screen",
      image: "/placeholder.svg?height=200&width=300",
    },
  ]

  const [deviceType, setDeviceType] = useState<"android" | "ios">("android")
  const steps = deviceType === "android" ? androidSteps : iosSteps

  if (!showGuide) {
    return (
      <div className="fixed bottom-20 right-4 z-40">
        <Button
          onClick={() => setShowGuide(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg"
        >
          <Smartphone className="w-5 h-5" />
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center">
            <Smartphone className="w-5 h-5 mr-2" />
            Install MedTracker
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setShowGuide(false)}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Device Type Selector */}
          <div className="flex space-x-2 mb-4">
            <Button
              variant={deviceType === "android" ? "default" : "outline"}
              onClick={() => {
                setDeviceType("android")
                setCurrentStep(0)
              }}
              className="flex-1"
            >
              Android
            </Button>
            <Button
              variant={deviceType === "ios" ? "default" : "outline"}
              onClick={() => {
                setDeviceType("ios")
                setCurrentStep(0)
              }}
              className="flex-1"
            >
              iPhone/iPad
            </Button>
          </div>

          {/* Step Indicator */}
          <div className="flex justify-center space-x-2 mb-4">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${index === currentStep ? "bg-blue-600" : "bg-gray-300"}`}
              />
            ))}
          </div>

          {/* Current Step */}
          <div className="text-center space-y-4">
            <div className="flex justify-center text-blue-600">{steps[currentStep].icon}</div>
            <h3 className="font-semibold text-lg">{steps[currentStep].title}</h3>
            <p className="text-gray-600 text-sm">{steps[currentStep].description}</p>

            {/* Step Image */}
            <div className="bg-gray-100 rounded-lg p-4">
              <img
                src={steps[currentStep].image || "/placeholder.svg"}
                alt={steps[currentStep].title}
                className="w-full h-32 object-contain"
              />
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
            >
              Previous
            </Button>

            {currentStep < steps.length - 1 ? (
              <Button
                onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
                className="btn-primary"
              >
                Next
              </Button>
            ) : (
              <Button onClick={() => setShowGuide(false)} className="btn-primary">
                Done
              </Button>
            )}
          </div>

          {/* Benefits */}
          <div className="bg-blue-50 rounded-lg p-3 mt-4">
            <h4 className="font-medium text-blue-900 mb-2">Why install the app?</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Works offline without internet</li>
              <li>• Faster loading and better performance</li>
              <li>• Push notifications for medicine reminders</li>
              <li>• Easy access from your home screen</li>
              <li>• Looks and feels like a native app</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
