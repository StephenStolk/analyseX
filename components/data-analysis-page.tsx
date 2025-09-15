"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { BarChart3, TrendingUp, Activity, Target, Save, Check } from "lucide-react"
import { toast } from "@/hooks/use-toast"

import { CorrelationMatrix } from "./correlation-matrix"
import { EnhancedTrendAnalysis } from "./enhanced-trend-analysis"
import { CustomChartBuilder } from "./custom-chart-builder"
import AIDashboardGenerator from "./ai-dashboard-generator"
import { ReportsGenerator } from "./reports-generator"
import { getCurrentAnalysis, updateCurrentAnalysis, saveDashboardContent, markAsSaved } from "@/lib/data-persistence"

export function DataAnalysisPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("ai-dashboard")
  const [data, setData] = useState<any[]>([])
  const [fileName, setFileName] = useState<string>("")
  const [numericColumns, setNumericColumns] = useState<string[]>([])
  const [categoricalColumns, setCategoricalColumns] = useState<string[]>([])
  const [dateColumns, setDateColumns] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null)
  const [isSaved, setIsSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [dashboardContent, setDashboardContent] = useState<any>({})
  const sidebarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setSidebarOpen(false)
      }
    }

    if (sidebarOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [sidebarOpen])

  useEffect(() => {
    try {
      const currentSession = getCurrentAnalysis()
      let results = null
      let analysisId = null

      if (currentSession && currentSession.analysisResults) {
        console.log("[v0] Loading from current session:", currentSession.currentAnalysisId)
        results = currentSession.analysisResults
        analysisId = currentSession.currentAnalysisId
        setIsSaved(currentSession.isSaved || false)
        setDashboardContent(currentSession.dashboardContent || {})
      } else {
        const resultsString = sessionStorage.getItem("analysisResults")

        if (!resultsString) {
          console.log("No analysis results found, redirecting to upload page")
          router.push("/app/upload")
          return
        }

        results = JSON.parse(resultsString)
      }

      console.log("[v0] Raw analysis data:", results)
      console.log("[v0] Available keys in results:", Object.keys(results))

      if (results.data) {
        console.log("[v0] results.data length:", results.data.length)
        console.log("[v0] First few records from results.data:", results.data.slice(0, 3))
      }

      if (results.previewData) {
        console.log("[v0] results.previewData length:", results.previewData.length)
        console.log("[v0] First few records from results.previewData:", results.previewData.slice(0, 3))
      }

      if (results.rawData) {
        console.log("[v0] results.rawData length:", results.rawData.length)
        console.log("[v0] First few records from results.rawData:", results.rawData.slice(0, 3))
      }

      if (results.rows) {
        console.log("[v0] results.rows length:", results.rows.length)
        console.log("[v0] First few records from results.rows:", results.rows.slice(0, 3))
      }

      if (!results.fileName) {
        console.error("Invalid analysis results:", results)
        setError("The analysis results are invalid. Please upload your file again.")
        setIsLoading(false)
        return
      }

      if (analysisId) {
        setCurrentAnalysisId(analysisId)
      }

      let dataArray =
        results.rawData || results.rows || results.data || results.previewData || results.processedData || []

      if (!Array.isArray(dataArray) && typeof dataArray === "object") {
        console.log("[v0] Data is not array, checking for nested data:", dataArray)
        const possibleArrays = Object.values(dataArray).filter((val) => Array.isArray(val))
        if (possibleArrays.length > 0) {
          dataArray = possibleArrays[0] as any[]
          console.log("[v0] Found nested array data with length:", dataArray.length)
        }
      }

      if (!Array.isArray(dataArray) || dataArray.length === 0) {
        console.warn("No data found in analysis results")
        console.log("[v0] Attempted data extraction result:", dataArray)
        setError("No data available for analysis. Please upload your file again.")
        setIsLoading(false)
        return
      }

      console.log(`[v0] Final data array length: ${dataArray.length}`)
      console.log(`[v0] Analysis page loaded for ${results.fileName} with ${dataArray.length} data points`)

      if (results.rowCount && dataArray.length !== results.rowCount) {
        console.warn(`[v0] Data length mismatch: expected ${results.rowCount} rows but got ${dataArray.length} rows`)
        console.log("[v0] Checking if full dataset is available in other properties...")

        const fullDataset = results.rawData || results.rows
        if (fullDataset && Array.isArray(fullDataset) && fullDataset.length === results.rowCount) {
          console.log(`[v0] Found full dataset with ${fullDataset.length} rows, using it instead`)
          dataArray = fullDataset
        }
      }

      setData(dataArray)
      setFileName(results.fileName)

      if (dataArray.length > 0) {
        const allKeys = Object.keys(dataArray[0])

        const numeric = allKeys.filter((key) => {
          const values = dataArray
            .map((row: { [x: string]: any }) => row[key])
            .filter((val: string | null | undefined) => val !== null && val !== undefined && val !== "")

          if (values.length === 0) return false

          const numericValues = values.filter((val: any) => {
            const num = Number(val)
            return !isNaN(num) && isFinite(num)
          })

          return numericValues.length >= values.length * 0.9
        })

        const categorical = allKeys.filter((key) => {
          if (numeric.includes(key)) return false

          const values = dataArray
            .map((row: { [x: string]: any }) => row[key])
            .filter((val: string | null | undefined) => val !== null && val !== undefined && val !== "")

          if (values.length === 0) return false

          const uniqueValues = [...new Set(values)]
          return uniqueValues.length > 1 && uniqueValues.length <= Math.min(50, values.length * 0.5)
        })

        const dateColumns = allKeys.filter((key) => {
          const isDateName = /^(date|time|month_number|year|day|created|updated|timestamp)$/i.test(key)

          if (!isDateName || numeric.includes(key)) return false

          if (key.toLowerCase() === "month_number") {
            const values = dataArray
              .map((row: { [x: string]: any }) => row[key])
              .filter((val: string | null | undefined) => val !== null && val !== undefined && val !== "")

            const monthValues = values.filter((val: any) => {
              const num = Number(val)
              return !isNaN(num) && num >= 1 && num <= 12
            })

            return monthValues.length >= values.length * 0.8
          }

          return true
        })

        setNumericColumns(numeric)
        setCategoricalColumns(categorical)
        setDateColumns(dateColumns)

        console.log("[v0] Data analysis debug:", {
          totalRecords: dataArray.length,
          totalColumns: allKeys.length,
          numericColumns: numeric.length,
          categoricalColumns: categorical.length,
          dateColumns: dateColumns.length,
          allColumns: allKeys,
          numericCols: numeric,
          categoricalCols: categorical,
          dateCols: dateColumns,
          sampleData: dataArray.slice(0, 3),
        })

        console.log("Detected columns:", {
          total: allKeys.length,
          numeric: numeric.length,
          categorical: categorical.length,
          date: dateColumns.length,
          totalRecords: dataArray.length,
          columns: allKeys,
        })

        console.log("Column details:", {
          numericCols: numeric,
          categoricalCols: categorical,
          dateCols: dateColumns,
        })
      }

      setIsLoading(false)
    } catch (error) {
      console.error("Error parsing analysis results:", error)
      setError("Error parsing analysis results. Please try again.")
      setIsLoading(false)
    }
  }, [router])

  const handleAnalysisUpdate = (updates: any) => {
    if (currentAnalysisId) {
      const updatedContent = { ...dashboardContent, ...updates }
      setDashboardContent(updatedContent)
      saveDashboardContent(updatedContent)

      const success = updateCurrentAnalysis(updates)
      if (success) {
        console.log("[v0] Analysis updated in session:", updates)
      }
    }
  }

  const handleSaveAnalysis = async () => {
    if (!currentAnalysisId) return

    setIsSaving(true)
    try {
      const success = markAsSaved(currentAnalysisId)
      if (success) {
        setIsSaved(true)
        toast({
          title: "Analysis Saved",
          description: "Your analysis has been saved to history successfully.",
        })
      } else {
        toast({
          title: "Save Failed",
          description: "Failed to save analysis. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error saving analysis:", error)
      toast({
        title: "Save Failed",
        description: "An error occurred while saving the analysis.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analysis results...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="rounded-lg border bg-destructive/10 p-8">
            <h2 className="mb-4 text-2xl font-bold text-destructive">Error</h2>
            <p className="mb-6 text-muted-foreground">{error}</p>
            <Button onClick={() => router.push("/app/upload")}>Return to Upload</Button>
          </div>
        </div>
      </div>
    )
  }

  const stats = {
    totalRecords: data.length,
    totalColumns: data.length > 0 ? Object.keys(data[0]).length : 0,
    numericColumns: numericColumns.length,
    categoricalColumns: categoricalColumns.length,
    dateColumns: dateColumns.length,
  }

  return (
    <div className="min-h-screen bg-background flex">
      <div className="flex-1 flex flex-col">
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="px-6 py-4">
            <div className="flex items-center gap-4">
              <div className="space-y-1 flex-1">
                <h1 className="text-2xl font-bold tracking-tight">Data Analysis</h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-medium">{fileName}</span>
                  <Separator orientation="vertical" className="h-4" />
                  <span>Analyzed locally on your device</span>
                  {isSaved ? (
                    <>
                      <Separator orientation="vertical" className="h-4" />
                      <span className="text-green-600 flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        Saved to history
                      </span>
                    </>
                  ) : (
                    <>
                      <Separator orientation="vertical" className="h-4" />
                      <span className="text-amber-600">Not saved</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleSaveAnalysis}
                  disabled={isSaved || isSaving}
                  variant={isSaved ? "outline" : "default"}
                  size="sm"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                      Saving...
                    </>
                  ) : isSaved ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Saved
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Analysis
                    </>
                  )}
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-md">
                  <BarChart3 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">{stats.totalRecords.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total Records</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="p-2 bg-green-100 text-green-600 rounded-md">
                  <Target className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">{stats.numericColumns}</p>
                  <p className="text-xs text-muted-foreground">Numeric Columns</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="p-2 bg-purple-100 text-purple-600 rounded-md">
                  <Activity className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">{stats.categoricalColumns}</p>
                  <p className="text-xs text-muted-foreground">Categories</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="p-2 bg-orange-100 text-orange-600 rounded-md">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">{stats.totalColumns}</p>
                  <p className="text-xs text-muted-foreground">Total Columns</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="p-2 bg-teal-100 text-teal-600 rounded-md">
                  <Activity className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">{stats.dateColumns}</p>
                  <p className="text-xs text-muted-foreground">Date Columns</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 px-6 py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="ai-dashboard" className="text-sm">
                AI Dashboard
              </TabsTrigger>
              <TabsTrigger value="correlation" className="text-sm">
                Correlation
              </TabsTrigger>
              <TabsTrigger value="trends" className="text-sm">
                Trends
              </TabsTrigger>
              <TabsTrigger value="my-charts" className="text-sm">
                My Charts
              </TabsTrigger>
              <TabsTrigger value="reports" className="text-sm">
                Reports
              </TabsTrigger>
            </TabsList>
            <TabsContent value="ai-dashboard" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">Business Intelligence Dashboard</h2>
                    <p className="text-sm text-muted-foreground">AI-Generated Analysis for {fileName}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    This Quarter
                  </Badge>
                </div>
                <AIDashboardGenerator
                  data={data}
                  numericColumns={numericColumns}
                  categoricalColumns={categoricalColumns}
                  fileName={fileName}
                  onAnalysisUpdate={handleAnalysisUpdate}
                  existingContent={dashboardContent.aiDashboard}
                />
              </div>
            </TabsContent>
            <TabsContent value="correlation" className="space-y-6">
              <CorrelationMatrix />
            </TabsContent>
            <TabsContent value="trends" className="space-y-6">
              <EnhancedTrendAnalysis />
            </TabsContent>
            <TabsContent value="my-charts" className="space-y-6">
              <CustomChartBuilder
                data={data}
                columns={data.length > 0 ? Object.keys(data[0]) : []}
                numericColumns={numericColumns}
                categoricalColumns={categoricalColumns}
                onChartsUpdate={(charts) => handleAnalysisUpdate({ customCharts: charts })}
                existingCharts={dashboardContent.customCharts}
              />
            </TabsContent>
            <TabsContent value="reports" className="space-y-6">
              <ReportsGenerator
                data={data}
                fileName={fileName}
                numericColumns={numericColumns}
                categoricalColumns={categoricalColumns}
                allColumns={data.length > 0 ? Object.keys(data[0]) : []}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
