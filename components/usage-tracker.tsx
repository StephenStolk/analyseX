"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface UsageData {
  hasSubscription: boolean
  canGenerate: boolean
  reportsUsed: number
  reportsLimit: number
  isUnlimited: boolean
  planName: string
}

interface UsageTrackerProps {
  userId: string
}

export function UsageTracker({ userId }: UsageTrackerProps) {
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsage()
  }, [userId])

  const fetchUsage = async () => {
    try {
      const response = await fetch(`/api/subscriptions/usage?userId=${userId}`)
      const data = await response.json()
      setUsage(data)
    } catch (error) {
      console.error("Failed to fetch usage:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>
  }

  if (!usage?.hasSubscription) {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="text-orange-800">No Active Subscription</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-orange-700 mb-4">You need an active subscription to upload datasets.</p>
          <Button asChild>
            <Link href="/pricing">Choose a Plan</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const progressPercentage = usage.isUnlimited ? 0 : (usage.reportsUsed / usage.reportsLimit) * 100

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage - {usage.planName} Plan</CardTitle>
      </CardHeader>
      <CardContent>
        {usage.isUnlimited ? (
          <div>
            <p className="text-green-600 font-medium">Unlimited Dataset Uploads</p>
            <p className="text-sm text-gray-600 mt-1">Datasets uploaded: {usage.reportsUsed}</p>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Datasets Uploaded</span>
              <span className="text-sm text-gray-600">
                {usage.reportsUsed} / {usage.reportsLimit}
              </span>
            </div>
            <Progress value={progressPercentage} className="mb-2" />
            {!usage.canGenerate && (
              <div className="mt-4">
                <p className="text-red-600 text-sm mb-2">You've reached your dataset upload limit.</p>
                <Button asChild size="sm">
                  <Link href="/pricing">Upgrade Plan</Link>
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
