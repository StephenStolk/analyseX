"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SmartColumnCards } from "@/components/smart-column-cards"
import { DataRulesSection } from "@/components/data-rules-section"
import { RealAutoMLSystem } from "@/components/real-automl-system"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Brain, Shield, Sparkles, Database } from "lucide-react"

export function ComprehensiveAdvancedAnalysis() {
  const [advancedResults, setAdvancedResults] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    const resultsString = sessionStorage.getItem("advancedAnalysisResults")
    if (resultsString) {
      try {
        const results = JSON.parse(resultsString)
        setAdvancedResults(results)
      } catch (error) {
        console.error("Error loading advanced analysis results:", error)
      }
    }
  }, [])

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">Advanced Analysis Suite</h2>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
            Comprehensive data analysis with smart insights, quality rules, and production-ready AutoML
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 rounded-full bg-muted p-1">
            <TabsTrigger value="overview" className="rounded-full">
              <Database className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="insights" className="rounded-full">
              <Sparkles className="h-4 w-4 mr-2" />
              Smart Insights
            </TabsTrigger>
            <TabsTrigger value="rules" className="rounded-full">
              <Shield className="h-4 w-4 mr-2" />
              Data Rules
            </TabsTrigger>
            <TabsTrigger value="automl" className="rounded-full">
              <Brain className="h-4 w-4 mr-2" />
              AutoML
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="rounded-3xl border-2 border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-700">
                    <Sparkles className="h-5 w-5" />
                    Smart Column Analysis
                  </CardTitle>
                  <CardDescription>AI-powered insights for each column in your dataset</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Columns Analyzed:</span>
                      <Badge variant="secondary">{advancedResults?.smartColumnCards?.length || 0}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Anomalies Found:</span>
                      <Badge variant="destructive">{advancedResults?.anomalies?.length || 0}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Quality Score:</span>
                      <Badge variant="default">{advancedResults?.qualityScore || "N/A"}%</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-2 border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700">
                    <Shield className="h-5 w-5" />
                    Data Quality Rules
                  </CardTitle>
                  <CardDescription>Comprehensive data validation and quality checks</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Rules Applied:</span>
                      <Badge variant="secondary">25+</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Passed:</span>
                      <Badge variant="default">{advancedResults?.rulesResults?.passed || 0}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Warnings:</span>
                      <Badge variant="outline">{advancedResults?.rulesResults?.warnings || 0}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-2 border-purple-200 bg-purple-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-700">
                    <Brain className="h-5 w-5" />
                    AutoML System
                  </CardTitle>
                  <CardDescription>Production-ready machine learning model training</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Algorithms:</span>
                      <Badge variant="secondary">10+</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Export Format:</span>
                      <Badge variant="default">.pkl</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Real-time Predictions:</span>
                      <Badge variant="default">✓</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="insights" className="mt-6">
            <SmartColumnCards />
          </TabsContent>

          <TabsContent value="rules" className="mt-6">
            <DataRulesSection />
          </TabsContent>

          <TabsContent value="automl" className="mt-6">
            <RealAutoMLSystem />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}
