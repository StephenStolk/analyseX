"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

interface Plan {
  id: string
  name: string
  priceUSD: number
  priceINR: number
  reports: number | string
  features: string[]
  popular?: boolean
}

const plans: Plan[] = [
  {
    id: "single_report",
    name: "Single Report",
    priceUSD: 4.99,
    priceINR: 414,
    reports: 1,
    features: ["1 Data Analysis Report", "Basic Visualizations", "CSV/Excel Support"],
  },
  {
    id: "starter",
    name: "Starter",
    priceUSD: 15,
    priceINR: 1245,
    reports: 10,
    features: ["10 Data Analysis Reports", "Advanced Visualizations", "Priority Support"],
  },
  {
    id: "pro",
    name: "Pro",
    priceUSD: 19,
    priceINR: 1577,
    reports: 30,
    features: ["30 Data Analysis Reports", "AI-Powered Insights", "Custom Charts", "Export Options"],
    popular: true,
  },
]

interface PlanSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectPlan: (planId: string) => void
}

declare global {
  interface Window {
    Razorpay: any
  }
}

async function loadRazorpay(): Promise<void> {
  if (typeof window !== "undefined" && (window as any).Razorpay) return
  await new Promise<void>((resolve, reject) => {
    const scriptId = "razorpay-checkout-js"
    if (document.getElementById(scriptId)) {
      setTimeout(() => resolve(), 100)
      return
    }
    const script = document.createElement("script")
    script.id = scriptId
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("Failed to load Razorpay"))
    document.body.appendChild(script)
  })
}

export function PlanSelectionModal({ isOpen, onClose, onSelectPlan }: PlanSelectionModalProps) {
  const [loading, setLoading] = useState<string>("")

  const handleSelectPlan = async (planId: string) => {
    setLoading(planId)
    try {
      await loadRazorpay()

      // 🔹 Create Razorpay order
      const response = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      })

      const orderData = await response.json()
      console.log("Create order response:", orderData)

      if (!response.ok) {
        throw new Error(orderData.error || "Failed to create order")
      }

      if (!window.Razorpay || !orderData.keyId) {
        throw new Error("Razorpay not available or key missing")
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "AnalyzeX",
        description: `${orderData.planName} Subscription`,
        order_id: orderData.order_id,
        handler: async (rp: any) => {
          try {
            const verifyResponse = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: rp.razorpay_order_id,
                razorpay_payment_id: rp.razorpay_payment_id,
                razorpay_signature: rp.razorpay_signature,
                planId: orderData.planId,
              }),
            })

            if (verifyResponse.ok) {
              onSelectPlan(planId)
              onClose()
            } else {
              const err = await verifyResponse.json()
              alert("Payment verification failed: " + (err.error || "Unknown error"))
            }
          } catch (error) {
            console.error("Payment verification error:", error)
            alert("Payment verification failed")
          }
        },
        prefill: {
          name: "Test User",
          email: "test@example.com", // replace with Supabase user.email
        },
        theme: {
          color: "#3B82F6",
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (error) {
      console.error("Payment error:", error)
      alert((error as Error)?.message || "Failed to initiate payment")
    } finally {
      setLoading("")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Choose Your Plan</DialogTitle>
          <p className="text-center text-muted-foreground">Select a plan to start analyzing your data</p>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-6">
          {plans.map((plan) => (
            <motion.div
              key={plan.id}
              whileHover={{ scale: 1.02 }}
              className={`relative rounded-lg border-2 p-6 transition-all ${
                plan.popular ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary">Best Value</Badge>
              )}

              <div className="text-center">
                <h3 className="text-lg font-bold">{plan.name}</h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold">${plan.priceUSD}</span>
                  <span className="text-sm text-muted-foreground ml-1">USD</span>
                </div>
                <div className="text-sm text-muted-foreground">₹{plan.priceINR} INR</div>
                <div className="mt-2 text-sm font-medium">
                  {typeof plan.reports === "number" ? `${plan.reports} Reports` : plan.reports}
                </div>
              </div>

              <ul className="mt-4 space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-sm">
                    <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                className="w-full mt-6"
                variant={plan.popular ? "default" : "outline"}
                onClick={() => handleSelectPlan(plan.id)}
                disabled={loading === plan.id}
              >
                {loading === plan.id ? "Processing..." : "Select Plan"}
              </Button>
            </motion.div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
