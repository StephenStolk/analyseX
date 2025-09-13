"use client"

import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface SubscriptionButtonProps {
  planId: string
  planName: string
  price: number
  userId: string
}

export function SubscriptionButton({ planId, planName, price, userId }: SubscriptionButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubscribe = async () => {
    setIsLoading(true)

    try {
      const response = await fetch("/api/subscriptions/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId,
          userId,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create subscription")
      }

      const data = await response.json()

      // For now, we'll simulate a successful subscription
      // In a real app, you'd integrate with Stripe or another payment processor
      router.push("/dashboard?subscribed=true")
    } catch (error) {
      console.error("Subscription error:", error)
      alert("Failed to create subscription. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleSubscribe}
      disabled={isLoading}
      className="w-full"
      variant={planName === "Pro" ? "default" : "outline"}
    >
      {isLoading ? "Processing..." : `Subscribe for $${price}`}
    </Button>
  )
}
