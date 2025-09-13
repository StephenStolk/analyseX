"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { useState, useEffect } from "react"
import { ArrowRight, FileSpreadsheet, LineChart, PieChart, Table } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AppHeader } from "@/components/app-header"
import { PlanSelectionModal } from "@/components/plan-selection-modal"
import { UsageDisplay } from "@/components/usage-display"
import { createClient } from "@/lib/supabase/client"

export function AppStartPage() {
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [hasSubscription, setHasSubscription] = useState(false)
  const [usageInfo, setUsageInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    checkSubscription()
  }, [])

  const checkSubscription = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const res = await fetch(`/api/subscriptions/usage?userId=${user.id}`, {
        credentials: "include",
      })

      if (!res.ok) {
        setHasSubscription(false)
        setShowPlanModal(true)
        return
      }

      const json = await res.json()

      setHasSubscription(json.hasSubscription ?? false)
      setUsageInfo({
        datasetsUsed: json.datasetsUsed ?? 0,
        datasetsLimit: json.datasetsLimit ?? 0,
        isUnlimited: json.isUnlimited ?? false,
        canGenerate: json.canGenerate ?? false,
        planName: json.planName ?? "",
      })

      if (!json.hasSubscription) {
        setShowPlanModal(true)
      }
    } catch (error) {
      console.error("Error checking subscription:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPlan = async (_planId: string) => {
    await checkSubscription()
    setShowPlanModal(false)
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  }

  const steps = [
    { icon: FileSpreadsheet, title: "Upload Your Data", description: "Start by uploading your Excel (.xlsx) or CSV file to begin the analysis process." },
    { icon: Table, title: "Local Analysis", description: "We'll analyze your data locally on your device, ensuring privacy and security." },
    { icon: LineChart, title: "Visualize Trends", description: "Explore interactive visualizations that reveal patterns and insights in your data." },
    { icon: PieChart, title: "AI-Powered Insights", description: "Get deeper analysis and predictions powered by advanced AI algorithms." },
  ]

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 bg-gradient-to-b from-background to-background/80">
        <div className="container flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-12 md:px-6">
          {hasSubscription && usageInfo && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-md mb-8"
            >
              {/* Pass usage info to UsageDisplay */}
              <UsageDisplay
                datasetsUsed={usageInfo.datasetsUsed}
                datasetsLimit={usageInfo.datasetsLimit}
                isUnlimited={usageInfo.isUnlimited}
                canGenerate={usageInfo.canGenerate}
                onUpgrade={() => setShowPlanModal(true)}
              />
            </motion.div>
          )}

          <motion.div initial="hidden" animate="visible" variants={containerVariants} className="max-w-3xl text-center">
            <motion.h1 variants={itemVariants} className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
              Welcome to <span className="text-primary">AnalyzeX</span>
            </motion.h1>

            <motion.p variants={itemVariants} className="mt-4 text-xl text-muted-foreground">
              Transform your data into actionable insights with our powerful analysis platform.
            </motion.p>

            <motion.div variants={itemVariants} className="mt-12 grid gap-8 sm:grid-cols-2">
              {steps.map((step, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center rounded-3xl bg-muted/30 p-6 text-center transition-all hover:bg-muted/50"
                >
                  <div className="mb-4 rounded-full bg-primary/10 p-3 text-primary">
                    <step.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-xl font-bold">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </motion.div>

            <motion.div variants={itemVariants} className="mt-12 space-y-4">
              {hasSubscription ? (
                <Button asChild size="lg" className="rounded-full px-8">
                  <Link href="/app/upload">
                    Upload Your Dataset <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <Button size="lg" className="rounded-full px-8" onClick={() => setShowPlanModal(true)}>
                  Choose Your Plan <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}

              {hasSubscription && (
                <div>
                  <Button variant="outline" size="sm" onClick={() => setShowPlanModal(true)}>
                    Upgrade Plan
                  </Button>
                </div>
              )}
            </motion.div>
          </motion.div>
        </div>
      </main>

      <PlanSelectionModal
        isOpen={showPlanModal}
        onClose={() => setShowPlanModal(false)}
        onSelectPlan={handleSelectPlan}
      />
    </div>
  )
}
