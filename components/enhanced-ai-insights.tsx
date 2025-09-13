"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BrainCircuit,
  LineChart,
  Lightbulb,
  AlertCircle,
  RefreshCw,
  Send,
  Bot,
  User,
  Info,
  HelpCircle,
  TrendingUp,
  Download,
  BarChart3,
} from "lucide-react"
import { analyzeDataWithAI, checkApiKeyAvailable, askFollowUpQuestion } from "@/lib/actions"
import type { AnalysisResponse } from "@/lib/api-types"
import { toast } from "@/components/ui/use-toast"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  detectTimeSeriesColumns,
  prepareTimeSeriesData,
  linearRegressionForecast,
  movingAverageForecast,
  exponentialSmoothingForecast,
  holtWintersForecast,
  type ForecastResult,
} from "@/lib/forecasting-utils"
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

// Find the detectTimeSeriesColumns function and update it to better detect date columns
// Replace the existing detectTimeSeriesColumns function with this improved version:

// export function detectTimeSeriesColumns(data: any[]): string[] {
//   if (!data || data.length === 0) return [];

//   const columns = Object.keys(data[0]);
//   const timeColumns: string[] = [];

//   for (const column of columns) {
//     // Check if column contains date-like values
//     const sampleValues = data.slice(0, Math.min(20, data.length)).map((row) => row[column]);

//     // More robust date detection
//     const dateCount = sampleValues.filter((value) => {
//       if (!value) return false;

//       // Check if it's already a Date object
//       if (value instanceof Date) return true;

//       // Check if it's a string that can be parsed as a date
//       if (typeof value === 'string') {
//         // Check for common date formats
//         if (
//           /\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(value) || // YYYY-MM-DD or YYYY/MM/DD
//           /\d{1,2}[-/]\d{1,2}[-/]\d{4}/.test(value) || // DD-MM-YYYY or MM-DD-YYYY
//           /\w{3,9}\s+\d{1,2},?\s+\d{4}/.test(value) || // Month DD, YYYY
//           /\d{1,2}\s+\w{3,9},?\s+\d{4}/.test(value)    // DD Month YYYY
//         ) {
//           const dateValue = new Date(value);
//           return !isNaN(dateValue.getTime());
//         }
//       }

//       // Check if it's a timestamp number
//       if (typeof value === 'number' && value > 946684800000) { // Jan 1, 2000 timestamp
//         return true;
//       }

//       return false;
//     }).length;

//     if (dateCount >= Math.min(5, sampleValues.length * 0.5)) {
//       timeColumns.push(column);
//     }
//   }

//   return timeColumns;
// }

// // Also update the prepareTimeSeriesData function to handle data better:

// export function prepareTimeSeriesData(data: any[], dateColumn: string, valueColumn: string): TimeSeriesData | null {
//   try {
//     if (!data || !Array.isArray(data) || data.length < 3) {
//       console.error("Invalid or insufficient data for time series analysis");
//       return null;
//     }

//     // Filter out rows with missing data
//     const filteredData = data
//       .filter((row) => {
//         return row &&
//                row[dateColumn] !== undefined && row[dateColumn] !== null &&
//                row[valueColumn] !== undefined && row[valueColumn] !== null;
//       })
//       .map((row) => {
//         let dateValue;

//         // Handle different date formats
//         if (row[dateColumn] instanceof Date) {
//           dateValue = row[dateColumn];
//         } else if (typeof row[dateColumn] === 'number') {
//           // Assume it's a timestamp
//           dateValue = new Date(row[dateColumn]);
//         } else {
//           // Try to parse as string
//           dateValue = new Date(row[dateColumn]);
//         }

//         // Format date as ISO string and take just the date part
//         const formattedDate = dateValue.toISOString().split('T')[0];

//         // Convert value to number
//         const numValue = Number(row[valueColumn]);

//         return {
//           date: formattedDate,
//           value: numValue
//         };
//       })
//       .filter((item) => !isNaN(item.value) && !isNaN(Date.parse(item.date)))
//       .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

//     if (filteredData.length < 3) {
//       console.error("Insufficient valid data points after filtering");
//       return null;
//     }

//     return {
//       dates: filteredData.map((item) => item.date),
//       values: filteredData.map((item) => item.value),
//     };
//   } catch (error) {
//     console.error("Error preparing time series data:", error);
//     return null;
//   }
// }

export function EnhancedAiInsights() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [progress, setProgress] = useState(0)
  const [aiResults, setAiResults] = useState<AnalysisResponse | null>(null)
  const [userConsent, setUserConsent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [apiKeyMissing, setApiKeyMissing] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [userQuestion, setUserQuestion] = useState("")
  const [isAskingQuestion, setIsAskingQuestion] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Forecasting state
  const [timeSeriesColumns, setTimeSeriesColumns] = useState<string[]>([])
  const [numericColumns, setNumericColumns] = useState<string[]>([])
  const [selectedDateColumn, setSelectedDateColumn] = useState<string>("")
  const [selectedValueColumn, setSelectedValueColumn] = useState<string>("")
  const [forecastResults, setForecastResults] = useState<ForecastResult[]>([])
  const [isForecasting, setIsForecasting] = useState(false)
  const [forecastData, setForecastData] = useState<any[]>([])
  const [isGeneratingAIForecast, setIsGeneratingAIForecast] = useState(false)
  const [aiForecastInsights, setAiForecastInsights] = useState<string>("")

  // Check if we already have AI results in sessionStorage
  useEffect(() => {
    const storedAiResults = sessionStorage.getItem("aiAnalysisResults")
    if (storedAiResults) {
      try {
        setAiResults(JSON.parse(storedAiResults))
        setIsComplete(true)

        if (chatMessages.length === 0) {
          setChatMessages([
            {
              role: "assistant",
              content:
                "I've analyzed your data. You can ask me follow-up questions about specific columns, trends, or predictions.",
            },
          ])
        }
      } catch (error) {
        console.error("Error parsing AI results:", error)
      }
    }

    // Load dataset and detect time series columns
    const resultsString = sessionStorage.getItem("analysisResults")
    if (resultsString) {
      try {
        const results = JSON.parse(resultsString)
        if (results.rawData && Array.isArray(results.rawData)) {
          const timeColumns = detectTimeSeriesColumns(results.rawData)
          setTimeSeriesColumns(timeColumns)

          // Get numeric columns
          const numCols =
            results.columnStats?.filter((col: any) => col.type === "numeric")?.map((col: any) => col.name) || []
          setNumericColumns(numCols)

          // Auto-select first available columns
          if (timeColumns.length > 0 && numCols.length > 0) {
            setSelectedDateColumn(timeColumns[0])
            setSelectedValueColumn(numCols[0])
          }
        }
      } catch (error) {
        console.error("Error loading dataset:", error)
      }
    }

    // Check API key availability
    const checkApiKey = async () => {
      try {
        const isAvailable = await checkApiKeyAvailable()
        setApiKeyMissing(!isAvailable)
      } catch (error) {
        console.error("Error checking API key:", error)
        setApiKeyMissing(true)
      }
    }

    checkApiKey()
  }, [chatMessages.length])

  // Scroll to bottom of chat when new messages are added
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [chatMessages])

  const handleGenerateInsights = async () => {
    setIsGenerating(true)
    setUserConsent(true)
    setError(null)

    let currentProgress = 0
    const interval = setInterval(() => {
      currentProgress += 5
      setProgress(currentProgress)
      if (currentProgress >= 90) {
        clearInterval(interval)
      }
    }, 150)

    try {
      const resultsString = sessionStorage.getItem("analysisResults")
      if (!resultsString) {
        throw new Error("No analysis results found")
      }

      const results = JSON.parse(resultsString)

      if (!results || typeof results !== "object") {
        throw new Error("Invalid analysis results format")
      }

      const dataSubset = {
        fileName: results.fileName || "unknown_file",
        summary: {
          rowCount: results.rowCount || 0,
          columnCount: results.columnCount || 0,
          missingValues: results.missingValues || 0,
          duplicateRows: results.duplicateRows || 0,
          columns: Array.isArray(results.columnStats)
            ? results.columnStats.map((col: any) => ({
                name: col.name || "unnamed",
                type: col.type || "unknown",
                count: col.count || 0,
                missing: col.missing || 0,
                unique: col.unique || 0,
                min: col.min,
                max: col.max,
                mean: col.mean,
                median: col.median,
                stdDev: col.stdDev,
              }))
            : [],
        },
        correlations: results.correlationMatrix
          ? {
              labels: results.correlationMatrix.labels || [],
              strongPairs: results.correlationMatrix.strongPairs || [],
            }
          : { labels: [], strongPairs: [] },
        distributions: Array.isArray(results.histograms) ? results.histograms : [],
        keyStats: {
          outlierCounts: Array.isArray(results.boxPlots)
            ? results.boxPlots.map((o: any) => ({
                column: o.column,
                outliers: Array.isArray(o.outliers) ? o.outliers.length : 0,
              }))
            : [],
          regressionModels: Array.isArray(results.regressionModels)
            ? results.regressionModels.map((model: any) => ({
                xColumn: model.xColumn,
                yColumn: model.yColumn,
                rSquared: model.rSquared,
                slope: model.slope,
                intercept: model.intercept,
              }))
            : [],
        },
      }

      const aiResponse = await analyzeDataWithAI({ data: dataSubset })

      setAiResults(aiResponse)
      sessionStorage.setItem("aiAnalysisResults", JSON.stringify(aiResponse))
      setRetryCount(0)

      setChatMessages([
        {
          role: "assistant",
          content:
            "I've analyzed your data. You can ask me follow-up questions about specific columns, trends, or predictions.",
        },
      ])
    } catch (error: any) {
      console.error("Error generating AI insights:", error)
      setError(error.message || "Failed to generate AI insights")
      setRetryCount((prev) => prev + 1)

      toast({
        title: "AI Analysis Error",
        description: error.message || "There was a problem generating AI insights. Please try again.",
        variant: "destructive",
      })
    } finally {
      clearInterval(interval)
      setProgress(100)
      setTimeout(() => {
        setIsGenerating(false)
        if (aiResults || retryCount >= 2) {
          setIsComplete(true)
        }
      }, 500)
    }
  }

  const handleSendQuestion = async () => {
    if (!userQuestion.trim()) return

    setChatMessages((prev) => [...prev, { role: "user", content: userQuestion }])

    const question = userQuestion
    setUserQuestion("")
    setIsAskingQuestion(true)

    try {
      const resultsString = sessionStorage.getItem("analysisResults")
      if (!resultsString) {
        throw new Error("Analysis results not found")
      }

      const results = JSON.parse(resultsString)

      const response = await askFollowUpQuestion({
        question,
        analysisResults: results,
        previousMessages: chatMessages,
      })

      setChatMessages((prev) => [...prev, { role: "assistant", content: response.answer }])
    } catch (error: any) {
      console.error("Error asking follow-up question:", error)

      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I'm sorry, I couldn't process your question. Please try asking something else.",
        },
      ])

      toast({
        title: "Error",
        description: "Failed to get an answer. Please try a different question.",
        variant: "destructive",
      })
    } finally {
      setIsAskingQuestion(false)
    }
  }

  const handleGenerateForecast = async () => {
    if (!selectedDateColumn || !selectedValueColumn) {
      toast({
        title: "Selection Required",
        description: "Please select both date and value columns for forecasting.",
        variant: "destructive",
      })
      return
    }

    setIsForecasting(true)
    setForecastResults([])
    setForecastData([])

    try {
      const resultsString = sessionStorage.getItem("analysisResults")
      if (!resultsString) {
        throw new Error("No analysis results found")
      }

      const results = JSON.parse(resultsString)
      const rawData = results.rawData

      if (!rawData || !Array.isArray(rawData)) {
        throw new Error("No raw data available for forecasting")
      }

      // Prepare time series data
      const timeSeriesData = prepareTimeSeriesData(rawData, selectedDateColumn, selectedValueColumn)

      if (!timeSeriesData) {
        throw new Error("Unable to prepare time series data. Please check your column selections.")
      }

      if (timeSeriesData.values.length < 3) {
        throw new Error("Insufficient data points for forecasting. Need at least 3 data points.")
      }

      // Generate forecasts using different methods
      const forecasts: ForecastResult[] = []

      // Linear Regression Forecast
      forecasts.push(linearRegressionForecast(timeSeriesData, 12))

      // Moving Average Forecast
      forecasts.push(movingAverageForecast(timeSeriesData, 3, 12))

      // Exponential Smoothing Forecast
      forecasts.push(exponentialSmoothingForecast(timeSeriesData, 0.3, 12))

      // Holt-Winters Forecast (if enough data)
      if (timeSeriesData.values.length >= 24) {
        forecasts.push(holtWintersForecast(timeSeriesData, 12))
      }

      setForecastResults(forecasts)

      // Prepare chart data
      const chartData = timeSeriesData.dates.map((date, index) => ({
        date,
        actual: timeSeriesData.values[index],
        ...forecasts.reduce((acc, forecast, i) => {
          acc[`forecast_${i}`] = null
          return acc
        }, {} as any),
      }))

      // Add forecast data
      const maxForecastLength = Math.max(...forecasts.map((f) => f.predictions.length))
      for (let i = 0; i < maxForecastLength; i++) {
        const forecastPoint: any = {
          date: forecasts[0].dates[i] || "",
          actual: null,
        }

        forecasts.forEach((forecast, index) => {
          forecastPoint[`forecast_${index}`] = forecast.predictions[i] || null
        })

        chartData.push(forecastPoint)
      }

      setForecastData(chartData)

      toast({
        title: "Forecast Generated",
        description: `Successfully generated ${forecasts.length} forecast models.`,
      })
    } catch (error: any) {
      console.error("Error generating forecast:", error)
      toast({
        title: "Forecast Error",
        description: error.message || "Failed to generate forecast. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsForecasting(false)
    }
  }

  const handleGenerateAIForecastInsights = async () => {
    if (forecastResults.length === 0) {
      toast({
        title: "No Forecast Data",
        description: "Please generate mathematical forecasts first.",
        variant: "destructive",
      })
      return
    }

    setIsGeneratingAIForecast(true)

    try {
      // Prepare forecast summary for AI
      const forecastSummary = {
        selectedColumns: {
          date: selectedDateColumn,
          value: selectedValueColumn,
        },
        forecastResults: forecastResults.map((result) => ({
          method: result.method,
          predictions: result.predictions.slice(0, 6), // First 6 months
          mae: result.mae,
          rmse: result.rmse,
          mape: result.mape,
          description: result.description,
        })),
        bestModel: forecastResults.reduce((best, current) => (current.mape < best.mape ? current : best)),
      }

      const response = await askFollowUpQuestion({
        question: `Analyze these forecast results and provide insights about trends, risks, and recommendations: ${JSON.stringify(forecastSummary)}`,
        analysisResults: { forecastAnalysis: forecastSummary },
        previousMessages: [],
      })

      setAiForecastInsights(response.answer)

      toast({
        title: "AI Insights Generated",
        description: "AI has analyzed your forecast results and provided insights.",
      })
    } catch (error: any) {
      console.error("Error generating AI forecast insights:", error)
      setAiForecastInsights(
        "Unable to generate AI insights at this time. The mathematical forecasts above provide reliable predictions based on your data patterns.",
      )

      toast({
        title: "AI Insights Error",
        description: "Failed to generate AI insights, but mathematical forecasts are still available.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingAIForecast(false)
    }
  }

  const downloadForecastData = () => {
    if (forecastData.length === 0) return

    const csvContent = [
      ["Date", "Actual", ...forecastResults.map((f) => f.method)].join(","),
      ...forecastData.map((row) =>
        [row.date, row.actual || "", ...forecastResults.map((_, i) => row[`forecast_${i}`] || "")].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `forecast_${selectedValueColumn}_${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Analysis exported",
      description: "Your analysis has been exported as a CSV file.",
    })
  }

  if (!isGenerating && !isComplete) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <Card>
          <CardHeader>
            <CardTitle>AI-Powered Insights</CardTitle>
            <CardDescription>Use AI to uncover deeper patterns and predictions in your data</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center space-y-6 p-8 text-center">
            <div className="rounded-full bg-primary/10 p-4 text-primary">
              <BrainCircuit className="h-12 w-12" />
            </div>
            <div>
              <h3 className="mb-2 text-xl font-semibold">Ready for AI Analysis</h3>
              <p className="mb-6 text-muted-foreground">
                Our AI can analyze your data to provide deeper insights, forecasts, and recommendations. Only the
                necessary subset of your data will be processed.
              </p>

              <div className="rounded-lg border bg-muted/30 p-4 mb-6 text-left">
                <div className="flex items-start gap-3">
                  <HelpCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">What is AI Analysis?</h4>
                    <p className="text-sm text-muted-foreground">
                      AI analysis examines your data to find patterns that might not be obvious at first glance. It's
                      like having an expert look at your data and tell you:
                    </p>
                    <ul className="mt-2 text-sm space-y-1 text-muted-foreground">
                      <li>• Key insights about what your data shows</li>
                      <li>• Predictions about future trends</li>
                      <li>• Recommendations for actions you could take</li>
                      <li>• Answers to your specific questions about the data</li>
                    </ul>
                  </div>
                </div>
              </div>

              {apiKeyMissing ? (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 mb-6 text-left">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-destructive mb-1">API Key Missing</h4>
                      <p className="text-sm text-destructive/90">
                        The API key is missing. Please add your API key to the environment variables to use AI insights.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border bg-muted/30 p-4 mb-6 text-left">
                  <h4 className="font-semibold mb-2">Privacy Notice</h4>
                  <p className="text-sm text-muted-foreground">
                    When you click "Generate AI Insights", we'll send a subset of your data statistics (not the raw
                    data) to our AI service. This includes column names, data types, and summary statistics like means
                    and correlations.
                  </p>
                </div>
              )}
            </div>
            <Button onClick={handleGenerateInsights} className="rounded-full px-8" disabled={apiKeyMissing}>
              Generate AI Insights
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  if (isGenerating) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Generating AI Insights</CardTitle>
          <CardDescription>Our AI is analyzing your data to uncover valuable insights</CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <div className="mb-8 space-y-2">
            <div className="flex justify-between text-sm">
              <span>AI Analysis in Progress</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="mt-0.5 rounded-full bg-primary/10 p-1.5 text-primary">
                <Lightbulb className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium">Identifying Key Patterns</p>
                <p className="text-sm text-muted-foreground">
                  The AI is analyzing relationships between variables to identify significant patterns.
                </p>
              </div>
            </div>
            {progress > 30 && (
              <div className="flex items-start gap-4">
                <div className="mt-0.5 rounded-full bg-primary/10 p-1.5 text-primary">
                  <LineChart className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium">Generating Forecasts</p>
                  <p className="text-sm text-muted-foreground">
                    Creating predictive models based on historical trends in your data.
                  </p>
                </div>
              </div>
            )}
            {progress > 60 && (
              <div className="flex items-start gap-4">
                <div className="mt-0.5 rounded-full bg-primary/10 p-1.5 text-primary">
                  <BrainCircuit className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium">Formulating Recommendations</p>
                  <p className="text-sm text-muted-foreground">
                    Developing actionable recommendations based on the analysis.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error && !aiResults) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Analysis Error</CardTitle>
          <CardDescription>There was a problem generating AI insights</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-6 p-8 text-center">
          <div className="rounded-full bg-destructive/10 p-4 text-destructive">
            <AlertCircle className="h-12 w-12" />
          </div>
          <div>
            <h3 className="mb-2 text-xl font-semibold">Analysis Failed</h3>
            <p className="mb-6 text-muted-foreground">{error}</p>
            {retryCount > 0 && (
              <div className="rounded-lg border bg-muted/30 p-4 mb-6 text-left">
                <p className="text-sm text-muted-foreground">
                  We're having trouble connecting to the AI service. This could be due to temporary service issues or
                  API limitations.
                </p>
              </div>
            )}
          </div>
          <Button onClick={handleGenerateInsights} className="rounded-full px-8 gap-2">
            <RefreshCw className="h-4 w-4" /> Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <Card>
        <CardHeader>
          <CardTitle>AI-Generated Insights</CardTitle>
          <CardDescription>Discover valuable insights and predictions from your data</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="insights" className="w-full">
            <TabsList className="grid w-full grid-cols-4 rounded-full">
              <TabsTrigger value="insights" className="rounded-full">
                Key Insights
              </TabsTrigger>
              <TabsTrigger value="forecast" className="rounded-full">
                Forecast
              </TabsTrigger>
              <TabsTrigger value="recommendations" className="rounded-full">
                Recommendations
              </TabsTrigger>
              <TabsTrigger value="chat" className="rounded-full">
                Ask Questions
              </TabsTrigger>
            </TabsList>

            <TabsContent value="insights" className="mt-6 space-y-4">
              <div className="rounded-lg border bg-muted/30 p-4 mb-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">What Are Insights?</h4>
                    <p className="text-sm text-muted-foreground">
                      Insights are important patterns and findings discovered in your data. They help you understand
                      what your data is telling you and what it means for your decisions. Think of them as the "so
                      what?" of your data analysis.
                    </p>
                  </div>
                </div>
              </div>

              {(aiResults?.insights && aiResults.insights.length > 0) ||
              (aiResults?.insight && Array.isArray(aiResults.insight) && aiResults.insight.length > 0) ? (
                (aiResults?.insights || aiResults?.insight || []).map((insight: any, i: number) => (
                  <div key={i} className="rounded-lg border bg-muted/30 p-4">
                    <h3 className="mb-2 font-semibold">{insight.title}</h3>
                    <p className="text-muted-foreground">{insight.description}</p>
                    <div className="mt-3 p-2 bg-primary/5 rounded-md">
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">Why this matters:</span> This insight helps you understand
                        patterns in your data that could influence your decisions and strategies.
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border bg-muted/30 p-4 text-center">
                  <p className="text-muted-foreground">No insights available. Try regenerating the analysis.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="forecast" className="mt-6 space-y-6">
              <div className="rounded-lg border bg-muted/30 p-4 mb-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">Mathematical Forecasting</h4>
                    <p className="text-sm text-muted-foreground">
                      Generate precise forecasts using proven mathematical models. These calculations are performed
                      locally using your actual data - no dummy values or external dependencies.
                    </p>
                  </div>
                </div>
              </div>

              {/* Column Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Time Series Forecasting Setup
                  </CardTitle>
                  <CardDescription>
                    Select your date and value columns to generate mathematical forecasts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Date Column</label>
                      <Select value={selectedDateColumn} onValueChange={setSelectedDateColumn}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select date column" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeSeriesColumns.map((column) => (
                            <SelectItem key={column} value={column}>
                              {column}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {timeSeriesColumns.length === 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          No date columns detected. Ensure your data has date/time values.
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Value Column</label>
                      <Select value={selectedValueColumn} onValueChange={setSelectedValueColumn}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select value column" />
                        </SelectTrigger>
                        <SelectContent>
                          {numericColumns.map((column) => (
                            <SelectItem key={column} value={column}>
                              {column}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {numericColumns.length === 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          No numeric columns available for forecasting.
                        </p>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={handleGenerateForecast}
                    disabled={!selectedDateColumn || !selectedValueColumn || isForecasting}
                    className="w-full"
                  >
                    {isForecasting ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2"></div>
                        Generating Forecasts...
                      </>
                    ) : (
                      <>
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Generate Mathematical Forecasts
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Forecast Results */}
              {forecastResults.length > 0 && (
                <>
                  {/* Forecast Chart */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Forecast Visualization</CardTitle>
                          <CardDescription>Mathematical forecasts for {selectedValueColumn} over time</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={downloadForecastData}>
                          <Download className="h-4 w-4 mr-2" />
                          Download CSV
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsLineChart data={forecastData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={60} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip
                              labelFormatter={(value) => `Date: ${value}`}
                              formatter={(value: any, name: any) => [
                                value ? Number(value).toFixed(2) : "N/A",
                                name === "actual"
                                  ? "Actual"
                                  : forecastResults[Number.parseInt(name.split("_")[1])]?.method || name,
                              ]}
                            />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="actual"
                              stroke="#8884d8"
                              strokeWidth={2}
                              name="Actual"
                              connectNulls={false}
                            />
                            {forecastResults.map((_, index) => (
                              <Line
                                key={index}
                                type="monotone"
                                dataKey={`forecast_${index}`}
                                stroke={`hsl(${(index * 60) % 360}, 70%, 50%)`}
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                name={forecastResults[index].method}
                                connectNulls={false}
                              />
                            ))}
                          </RechartsLineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Forecast Models Performance */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Model Performance Comparison</CardTitle>
                      <CardDescription>
                        Evaluation metrics for each forecasting method (lower is better)
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {forecastResults.map((result, index) => (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold">{result.method}</h4>
                              <Badge variant={index === 0 ? "default" : "secondary"}>
                                {index === 0 ? "Best MAPE" : `Rank ${index + 1}`}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">{result.description}</p>

                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <div className="font-medium">MAE</div>
                                <div className="text-muted-foreground">{result.mae.toFixed(2)}</div>
                                <div className="text-xs text-muted-foreground">Mean Absolute Error</div>
                              </div>
                              <div>
                                <div className="font-medium">RMSE</div>
                                <div className="text-muted-foreground">{result.rmse.toFixed(2)}</div>
                                <div className="text-xs text-muted-foreground">Root Mean Squared Error</div>
                              </div>
                              <div>
                                <div className="font-medium">MAPE</div>
                                <div className="text-muted-foreground">{result.mape.toFixed(2)}%</div>
                                <div className="text-xs text-muted-foreground">Mean Absolute Percentage Error</div>
                              </div>
                            </div>

                            <div className="mt-3 p-2 bg-muted/50 rounded text-xs">
                              <strong>What this means:</strong>{" "}
                              {result.mape < 10
                                ? "Excellent accuracy - predictions are very reliable"
                                : result.mape < 20
                                  ? "Good accuracy - predictions are generally reliable"
                                  : result.mape < 30
                                    ? "Fair accuracy - use predictions with caution"
                                    : "Poor accuracy - consider collecting more data or using different methods"}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* AI Forecast Insights */}
                  <Card>
                    <CardHeader>
                      <CardTitle>AI Forecast Analysis</CardTitle>
                      <CardDescription>
                        Get AI-powered insights about your forecast results, trends, and recommendations
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {!aiForecastInsights ? (
                        <div className="text-center py-6">
                          <Button
                            onClick={handleGenerateAIForecastInsights}
                            disabled={isGeneratingAIForecast || apiKeyMissing}
                            className="gap-2"
                          >
                            {isGeneratingAIForecast ? (
                              <>
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                                Analyzing Forecasts...
                              </>
                            ) : (
                              <>
                                <BrainCircuit className="h-4 w-4" />
                                Generate AI Forecast Insights
                              </>
                            )}
                          </Button>
                          {apiKeyMissing && (
                            <p className="text-sm text-muted-foreground mt-2">API key required for AI insights</p>
                          )}
                        </div>
                      ) : (
                        <div className="rounded-lg border bg-muted/30 p-4">
                          <div className="flex items-start gap-3 mb-3">
                            <Bot className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                            <h4 className="font-semibold">AI Analysis Results</h4>
                          </div>
                          <div className="prose prose-sm max-w-none">
                            <p className="whitespace-pre-wrap text-muted-foreground">{aiForecastInsights}</p>
                          </div>
                          <div className="mt-4 pt-3 border-t">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleGenerateAIForecastInsights}
                              disabled={isGeneratingAIForecast}
                            >
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Regenerate Analysis
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}

              {/* Fallback for no time series data */}
              {timeSeriesColumns.length === 0 && (
                <Card>
                  <CardContent className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">No Time Series Data Detected</h3>
                    <p className="text-muted-foreground mb-4">
                      To use forecasting features, your dataset needs to contain date/time columns and numeric values.
                    </p>
                    <div className="text-sm text-muted-foreground">
                      <p>Make sure your data includes:</p>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>A column with dates (e.g., 2023-01-01, Jan 2023)</li>
                        <li>A column with numeric values to forecast</li>
                        <li>At least 3 data points for basic forecasting</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="recommendations" className="mt-6 space-y-4">
              <div className="rounded-lg border bg-muted/30 p-4 mb-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">What Are Recommendations?</h4>
                    <p className="text-sm text-muted-foreground">
                      Recommendations are suggested actions based on the insights and forecasts from your data. They
                      help you decide what to do next to achieve better results. Think of them as advice from a
                      consultant who has studied your data thoroughly.
                    </p>
                  </div>
                </div>
              </div>

              {(aiResults?.recommendations && aiResults.recommendations.length > 0) ||
              (aiResults?.recommendation &&
                Array.isArray(aiResults.recommendation) &&
                aiResults.recommendation.length > 0) ? (
                (aiResults?.recommendations || aiResults?.recommendation || []).map(
                  (recommendation: any, i: number) => (
                    <div key={i} className="rounded-lg border bg-muted/30 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{recommendation.title}</h3>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            recommendation.priority === "high" || recommendation.priority === "High"
                              ? "bg-destructive/10 text-destructive"
                              : recommendation.priority === "medium" || recommendation.priority === "Medium"
                                ? "bg-amber-500/10 text-amber-500"
                                : "bg-primary/10 text-primary"
                          }`}
                        >
                          {typeof recommendation.priority === "string"
                            ? recommendation.priority.charAt(0).toUpperCase() +
                              recommendation.priority.slice(1).toLowerCase()
                            : "Medium"}{" "}
                          Priority
                        </span>
                      </div>
                      <p className="text-muted-foreground">{recommendation.description}</p>
                      <div className="mt-3 p-2 bg-primary/5 rounded-md">
                        <p className="text-xs text-muted-foreground">
                          <span className="font-medium">Why this matters:</span> This recommendation is like a doctor's
                          advice after reviewing your test results - it's a specific action you can take based on what
                          your data is showing.
                        </p>
                      </div>
                    </div>
                  ),
                )
              ) : (
                <div className="rounded-lg border bg-muted/30 p-4 text-center">
                  <p className="text-muted-foreground">No recommendations available. Try regenerating the analysis.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="chat" className="mt-6">
              <Card>
                <CardContent className="p-4">
                  <div className="mb-4">
                    <div className="rounded-lg border bg-muted/30 p-4 mb-4">
                      <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-semibold mb-1">Ask Questions About Your Data</h4>
                          <p className="text-sm text-muted-foreground">
                            You can ask specific questions about your data and get personalized answers. This is like
                            having a data analyst on call to explain what your data means in plain language.
                          </p>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-2">Try asking questions like:</p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => setUserQuestion("What are the most important insights from my data?")}
                      >
                        Key insights
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => setUserQuestion("Explain the strongest correlation in simple terms")}
                      >
                        Explain correlations
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => setUserQuestion("What unusual values or outliers exist in my data?")}
                      >
                        Find outliers
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => setUserQuestion("What actions should I take based on this data?")}
                      >
                        Suggest actions
                      </Button>
                    </div>
                  </div>

                  <div className="border rounded-lg mb-4">
                    <ScrollArea className="h-[300px] p-4">
                      {chatMessages.length > 0 ? (
                        <div className="space-y-4">
                          {chatMessages.map((message, index) => (
                            <div
                              key={index}
                              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                className={`flex items-start gap-2 max-w-[80%] ${
                                  message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                                } p-3 rounded-lg`}
                              >
                                {message.role === "assistant" && <Bot className="h-5 w-5 mt-0.5 flex-shrink-0" />}
                                <div>
                                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                </div>
                                {message.role === "user" && <User className="h-5 w-5 mt-0.5 flex-shrink-0" />}
                              </div>
                            </div>
                          ))}
                          <div ref={chatEndRef} />
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center">
                          <p className="text-muted-foreground text-center">
                            Ask a question about your data to start the conversation
                          </p>
                        </div>
                      )}
                    </ScrollArea>
                  </div>

                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Ask a question about your data..."
                      value={userQuestion}
                      onChange={(e) => setUserQuestion(e.target.value)}
                      className="resize-none"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          handleSendQuestion()
                        }
                      }}
                    />
                    <Button
                      onClick={handleSendQuestion}
                      disabled={!userQuestion.trim() || isAskingQuestion}
                      className="flex-shrink-0"
                    >
                      {isAskingQuestion ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="mt-6 flex justify-center">
            <Button variant="outline" className="rounded-full gap-2" onClick={handleGenerateInsights}>
              Regenerate AI Analysis <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
