"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CleanAutoMLBuilder } from "./clean-automl-builder"
import { DataRulesSection } from "./data-rules-section"

export function AdvancedAnalysisPage() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading advanced analysis...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Tabs defaultValue="rules" className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-full">
            <TabsTrigger value="rules" className="rounded-full">
              Data Quality Rules
            </TabsTrigger>
            <TabsTrigger value="automl" className="rounded-full">
              Smart Model Builder
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rules" className="mt-6">
            <DataRulesSection />
          </TabsContent>

          <TabsContent value="automl" className="mt-6">
            <CleanAutoMLBuilder />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}
