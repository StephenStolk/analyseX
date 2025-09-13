"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Clock, Download, Info, Lightbulb } from "lucide-react"
import { decomposeTimeSeries } from "@/lib/advanced-analysis-utils"
import type { TimeSeriesDecomposition } from "@/lib/advanced-analysis-utils"
import { SimpleSelect, SimpleSelectItem } from "./simple-select"

interface TimeSeriesAnalysisProps {
  data: any[]
  dateColumns: string[]
  numericColumns: string[]
  onError: (error: string | null) => void
}

export function TimeSeriesAnalysis({ data, dateColumns, numericColumns, onError }: TimeSeriesAnalysisProps) {
  const [result, setResult] = useState<TimeSeriesDecomposition | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedDateColumn, setSelectedDateColumn] = useState<string>("")
  const [selectedValueColumn, setSelectedValueColumn] = useState<string>("")

  useEffect(() => {
    if (dateColumns.length > 0 && numericColumns.length > 0) {
      setSelectedDateColumn(dateColumns[0])
      setSelectedValueColumn(numericColumns[0])
    }
  }, [dateColumns, numericColumns])

  const performAnalysis = async () => {
    if (!selectedDateColumn || !selectedValueColumn) {
      onError("Please select both date and value columns")
      return
    }

    setIsLoading(true)
    onError(null)

    try {
      const analysisResult = decomposeTimeSeries(data, selectedDateColumn, selectedValueColumn)
      setResult(analysisResult)
    } catch (error) {
      console.error("Time series analysis error:", error)
      onError(`Time series analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsLoading(false)
    }
  }

  const downloadResults = () => {
    if (!result) return

    const results = {
      analysis: "Time Series Decomposition",
      timestamp: new Date().toISOString(),
      dateColumn: selectedDateColumn,
      valueColumn: selectedValueColumn,
      dataPoints: result.original.length,
      explanation: result.explanation,
      trendDirection: result.trend[result.trend.length - 1] > result.trend[0] ? "Rising" : "Declining",
      seasonalityDetected: result.seasonal.some((s) => Math.abs(s) > 0.1),
    }

    const blob = new Blob([JSON.stringify(results, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "timeseries_analysis.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  if (dateColumns.length === 0 || numericColumns.length === 0) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Time series analysis requires at least one date column and one numeric column. Found {dateColumns.length} date
          column(s) and {numericColumns.length} numeric column(s).
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold">Time Series Decomposition</h3>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={performAnalysis}
            disabled={isLoading || !selectedDateColumn || !selectedValueColumn}
          >
            {isLoading ? "Analyzing..." : "Run Analysis"}
          </Button>
          {result && (
            <Button variant="outline" size="sm" onClick={downloadResults}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          )}
        </div>
      </div>

      {/* Theory Section */}
      <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
            <Lightbulb className="h-4 w-4" />
            What is Time Series Decomposition?
          </CardTitle>
        </CardHeader>
        <CardContent className="text-green-700 dark:text-green-300">
          <p className="mb-3">
            <strong>Time Series Decomposition</strong> breaks down a time series into three components: trend (long-term
            direction), seasonality (repeating patterns), and residuals (random noise).
          </p>
          <p className="mb-3">
            <strong>Mathematical Foundation:</strong> Uses additive model: Y(t) = Trend(t) + Seasonal(t) + Residual(t),
            where components are estimated using moving averages and seasonal indices.
          </p>
          <p>
            <strong>Why it matters:</strong> Decomposition helps isolate cyclical patterns and irregular noise,
            essential for forecasting, anomaly detection, and understanding underlying data patterns.
          </p>
        </CardContent>
      </Card>

      {/* Column Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Columns</CardTitle>
          <CardDescription>Choose the date and value columns for time series analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Date Column</label>
              <SimpleSelect value={selectedDateColumn} onValueChange={setSelectedDateColumn}>
                {dateColumns.map((col) => (
                  <SimpleSelectItem key={col} value={col}>
                    {col}
                  </SimpleSelectItem>
                ))}
              </SimpleSelect>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Value Column</label>
              <SimpleSelect value={selectedValueColumn} onValueChange={setSelectedValueColumn}>
                {numericColumns.map((col) => (
                  <SimpleSelectItem key={col} value={col}>
                    {col}
                  </SimpleSelectItem>
                ))}
              </SimpleSelect>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p>Decomposing time series...</p>
            </div>
          </CardContent>
        </Card>
      ) : result ? (
        <div className="grid gap-6">
          {/* Summary Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Decomposition Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-lg font-bold text-green-600">Data Points</div>
                  <div className="text-sm text-muted-foreground">{result.original.length}</div>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-lg font-bold text-blue-600">Trend</div>
                  <div className="text-sm text-muted-foreground">
                    {result.trend[result.trend.length - 1] > result.trend[0] ? "Rising" : "Declining"}
                  </div>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-lg font-bold text-purple-600">Seasonality</div>
                  <div className="text-sm text-muted-foreground">
                    {result.seasonal.some((s) => Math.abs(s) > 0.1) ? "Detected" : "Minimal"}
                  </div>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-lg font-bold text-orange-600">Residuals</div>
                  <div className="text-sm text-muted-foreground">Calculated</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Decomposition Charts */}
          <div className="grid gap-4">
            {/* Original Series */}
            <Card>
              <CardHeader>
                <CardTitle>Original Time Series</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart
                    data={result.original.map((value, i) => ({
                      date: result.dates[i],
                      value: value,
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Trend Component */}
            <Card>
              <CardHeader>
                <CardTitle>Trend Component</CardTitle>
                <CardDescription>Long-term direction of the data</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart
                    data={result.trend.map((value, i) => ({
                      date: result.dates[i],
                      trend: value,
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="trend" stroke="#10b981" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Seasonal Component */}
            <Card>
              <CardHeader>
                <CardTitle>Seasonal Component</CardTitle>
                <CardDescription>Repeating patterns in the data</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart
                    data={result.seasonal.map((value, i) => ({
                      date: result.dates[i],
                      seasonal: value,
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="seasonal" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Residual Component */}
            <Card>
              <CardHeader>
                <CardTitle>Residual Component</CardTitle>
                <CardDescription>Random noise after removing trend and seasonality</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart
                    data={result.residual.map((value, i) => ({
                      date: result.dates[i],
                      residual: value,
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="residual" stroke="#f59e0b" strokeWidth={1} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Interpretation */}
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="text-blue-800 dark:text-blue-200">Analysis Interpretation</CardTitle>
            </CardHeader>
            <CardContent className="text-blue-700 dark:text-blue-300">
              <div className="space-y-3">
                <p>{result.explanation}</p>
                <p>
                  <strong>Trend Analysis:</strong>{" "}
                  {result.trend[result.trend.length - 1] > result.trend[0]
                    ? "Your data shows an overall upward trend over time."
                    : "Your data shows an overall downward trend over time."}
                </p>
                <p>
                  <strong>Seasonal Patterns:</strong>{" "}
                  {result.seasonal.some((s) => Math.abs(s) > 0.1)
                    ? "Clear seasonal patterns were detected in your data."
                    : "No significant seasonal patterns were found."}
                </p>
                <p>
                  <strong>Data Quality:</strong> The decomposition successfully separated your time series into trend,
                  seasonal, and residual components.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              Select columns and click "Run Analysis" to decompose your time series
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
