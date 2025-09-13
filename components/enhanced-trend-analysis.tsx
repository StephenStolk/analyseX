"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Line,
} from "recharts"
import { Info, AlertCircle, Lightbulb, Grid3X3, Sparkles, Brain } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { CustomizableDashboard } from "@/components/customizable-dashboard"
import { AdvancedStatisticalAnalysis } from "./advanced-statistical-analysis"
import { AIGuidedTrends } from "./ai-guided-trends"

export function EnhancedTrendAnalysis() {
  const [selectedTab, setSelectedTab] = useState("ai-guided")
  const [xColumn, setXColumn] = useState("")
  const [yColumn, setYColumn] = useState("")
  const [results, setResults] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [regressionData, setRegressionData] = useState<any[]>([])
  const [histogramData, setHistogramData] = useState<any[]>([])
  const [boxPlotData, setBoxPlotData] = useState<any | null>(null)
  const [selectedModel, setSelectedModel] = useState<any | null>(null)
  const [correlationType, setCorrelationType] = useState<"pearson" | "spearman" | "kendall">("pearson")
  const [showCustomDashboard, setShowCustomDashboard] = useState(false)

  useEffect(() => {
    // Get analysis results from session storage
    const resultsString = typeof window !== "undefined" ? sessionStorage.getItem("analysisResults") : null

    if (!resultsString) {
      setError("No analysis results found. Please upload and analyze a file first.")
      setIsLoading(false)
      return
    }

    try {
      const parsedResults = JSON.parse(resultsString)
      setResults(parsedResults)

      // Extract numeric columns for selection
      const numericColumns = parsedResults?.columnStats
        ? parsedResults.columnStats.filter((col: any) => col.type === "Number").map((col: any) => col.name)
        : []

      // Set default columns if not set and columns are available
      if (numericColumns.length >= 2) {
        setXColumn(numericColumns[0])
        setYColumn(numericColumns[1])

        // Generate initial regression data
        generateRegressionData(parsedResults, numericColumns[0], numericColumns[1])

        // Generate initial histogram data
        generateHistogramData(parsedResults, numericColumns[0])
      } else {
        setError("Not enough numeric columns for trend analysis. At least 2 numeric columns are required.")
      }
    } catch (error) {
      console.error("Error parsing analysis results:", error)
      setError("Error loading analysis results. Please try refreshing the page.")
    }

    setIsLoading(false)
  }, [])

  // Generate regression data when columns change
  useEffect(() => {
    if (results && xColumn && yColumn) {
      generateRegressionData(results, xColumn, yColumn)
    }
  }, [results, xColumn, yColumn])

  // Generate histogram data when x column changes
  useEffect(() => {
    if (results && xColumn) {
      generateHistogramData(results, xColumn)
    }
  }, [results, xColumn])

  // Function to generate regression data with natural language explanation
  const generateRegressionData = (results: any, xCol: string, yCol: string) => {
    try {
      // Find the selected regression model
      const model = results?.regressionModels?.find((model: any) => model.xColumn === xCol && model.yColumn === yCol)

      setSelectedModel(model || null)

      if (!model) {
        console.log(`No regression model found for ${xCol} vs ${yCol}`)
        return
      }

      // Get preview data for scatter plot
      if (results.previewData && results.previewData.length > 0) {
        const scatterData = results.previewData
          .filter(
            (row: any) =>
              row &&
              row[xCol] !== null &&
              row[xCol] !== undefined &&
              row[yCol] !== null &&
              row[yCol] !== undefined &&
              !isNaN(Number(row[xCol])) &&
              !isNaN(Number(row[yCol])),
          )
          .map((row: any) => ({
            x: Number(row[xCol]),
            y: Number(row[yCol]),
            predicted: model.slope * Number(row[xCol]) + model.intercept,
          }))

        setRegressionData(scatterData)
        console.log(`Generated ${scatterData.length} regression data points`)
      }
    } catch (error) {
      console.error("Error generating regression data:", error)
      toast({
        title: "Error",
        description: "Could not generate regression data. Please try different columns.",
        variant: "destructive",
      })
    }
  }

  // Function to generate histogram data
  const generateHistogramData = (results: any, col: string) => {
    try {
      // Find histogram data for the column
      const histogram = results?.histograms?.find((h: any) => h.column === col)

      if (!histogram) {
        console.log(`No histogram found for ${col}`)
        return
      }

      const data = histogram.bins.slice(0, -1).map((bin: number, index: number) => ({
        bin: `${bin.toFixed(1)}-${histogram.bins[index + 1].toFixed(1)}`,
        frequency: histogram.frequencies[index],
      }))

      setHistogramData(data)

      // Find box plot data for the column
      const boxPlot = results?.boxPlots?.find((b: any) => b.column === col)
      setBoxPlotData(boxPlot || null)
    } catch (error) {
      console.error("Error generating histogram data:", error)
    }
  }

  // Handle model selection change
  const handleModelChange = (value: string) => {
    const [x, y] = value.split("_vs_")
    setXColumn(x)
    setYColumn(y)
  }

  // Extract available regression models for the dropdown
  const availableModels =
    results?.regressionModels?.map((model: any) => ({
      x: model.xColumn,
      y: model.yColumn,
      rSquared: model.rSquared,
    })) || []

  // Enhanced natural language explanations
  const getRegressionExplanation = (xCol: string, yCol: string, rSquared: number, slope: number) => {
    let strengthDescription = ""
    let realWorldAnalogy = ""

    if (rSquared > 0.8) {
      strengthDescription = "very strong"
      realWorldAnalogy =
        "like the relationship between a person's height and their shoe size - they're closely connected"
    } else if (rSquared > 0.6) {
      strengthDescription = "strong"
      realWorldAnalogy =
        "like the relationship between hours studied and test scores - generally connected but other factors matter too"
    } else if (rSquared > 0.4) {
      strengthDescription = "moderate"
      realWorldAnalogy =
        "like the relationship between exercise and weight loss - there's a connection but many other factors influence the outcome"
    } else if (rSquared > 0.2) {
      strengthDescription = "weak"
      realWorldAnalogy =
        "like the relationship between weather and ice cream sales - there's some connection but it's not very predictable"
    } else {
      strengthDescription = "very weak or no"
      realWorldAnalogy =
        "like trying to predict someone's favorite color from their age - there's essentially no meaningful connection"
    }

    const direction = slope > 0 ? "positive" : "negative"
    const directionExplanation =
      slope > 0
        ? `As ${xCol} increases, ${yCol} tends to increase too`
        : `As ${xCol} increases, ${yCol} tends to decrease`

    return {
      strength: `There is a ${strengthDescription} ${direction} relationship between ${xCol} and ${yCol} (R² = ${rSquared.toFixed(2)}).`,
      analogy: `This is ${realWorldAnalogy}.`,
      direction: directionExplanation,
      prediction: `The R² value of ${rSquared.toFixed(2)} means that ${(rSquared * 100).toFixed(0)}% of the changes in ${yCol} can be explained by changes in ${xCol}. The remaining ${(100 - rSquared * 100).toFixed(0)}% is due to other factors not captured in this analysis.`,
      slope: `The slope of ${slope.toFixed(2)} tells us that for every 1-unit increase in ${xCol}, ${yCol} typically changes by ${Math.abs(slope).toFixed(2)} units ${slope > 0 ? "upward" : "downward"}.`,
    }
  }

  const getDistributionExplanation = (
    column: string,
    mean: number,
    median: number,
    stdDev: number,
    skewness: number,
  ) => {
    let distributionShape = ""
    let skewnessExplanation = ""

    if (Math.abs(skewness) < 0.5) {
      distributionShape = "fairly symmetrical (normal)"
      skewnessExplanation = "The data is evenly distributed around the center, like a bell curve."
    } else if (skewness > 0.5) {
      distributionShape = "right-skewed (positively skewed)"
      skewnessExplanation =
        "Most values are on the lower end with a few high values pulling the average up, like household income where most people earn moderate amounts but a few earn very high amounts."
    } else {
      distributionShape = "left-skewed (negatively skewed)"
      skewnessExplanation =
        "Most values are on the higher end with a few low values pulling the average down, like test scores where most students do well but a few score poorly."
    }

    const meanMedianComparison =
      Math.abs(mean - median) > stdDev * 0.3
        ? `The mean (${mean.toFixed(2)}) and median (${median.toFixed(2)}) are quite different, confirming the skewed distribution.`
        : `The mean (${mean.toFixed(2)}) and median (${median.toFixed(2)}) are close, suggesting a balanced distribution.`

    return {
      shape: `Your ${column} data has a ${distributionShape} distribution.`,
      explanation: skewnessExplanation,
      comparison: meanMedianComparison,
      spread: `The standard deviation of ${stdDev.toFixed(2)} shows how spread out your data is. About 68% of values fall within ${stdDev.toFixed(2)} units of the mean (${mean.toFixed(2)}).`,
    }
  }

  const getCorrelationExplanation = (correlation: number, col1: string, col2: string) => {
    let strength = ""
    let interpretation = ""

    const absCorr = Math.abs(correlation)

    if (absCorr > 0.8) {
      strength = "very strong"
      interpretation = "These variables move together very predictably"
    } else if (absCorr > 0.6) {
      strength = "strong"
      interpretation = "These variables have a clear relationship"
    } else if (absCorr > 0.4) {
      strength = "moderate"
      interpretation = "These variables are somewhat related"
    } else if (absCorr > 0.2) {
      strength = "weak"
      interpretation = "These variables have a slight relationship"
    } else {
      strength = "very weak or no"
      interpretation = "These variables appear to be unrelated"
    }

    const direction = correlation > 0 ? "positive" : "negative"
    const directionText =
      correlation > 0
        ? `When one goes up, the other tends to go up too`
        : `When one goes up, the other tends to go down`

    return `${col1} and ${col2} have a ${strength} ${direction} correlation (r = ${correlation.toFixed(2)}). ${interpretation}. ${directionText}.`
  }

  if (showCustomDashboard) {
    return (
      <CustomizableDashboard
        data={results?.previewData || []}
        numericColumns={
          results?.columnStats?.filter((col: any) => col.type === "Number").map((col: any) => col.name) || []
        }
        categoricalColumns={
          results?.columnStats?.filter((col: any) => col.type !== "Number").map((col: any) => col.name) || []
        }
        onClose={() => setShowCustomDashboard(false)}
      />
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p>Loading trend analysis data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Trend Analysis</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const numericColumns =
    results?.columnStats?.filter((col: any) => col.type === "Number").map((col: any) => col.name) || []
  const categoricalColumns =
    results?.columnStats?.filter((col: any) => col.type !== "Number").map((col: any) => col.name) || []
  const dateColumns = results?.columnStats?.filter((col: any) => col.type === "Date").map((col: any) => col.name) || []

  return (
    <div className="grid gap-4">
      {/* Custom Dashboard Entry Point */}
      <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950 dark:to-indigo-950 dark:border-purple-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-800 dark:text-purple-200">
            <Grid3X3 className="h-5 w-5" />
            Customize Your Visualization Dashboard
          </CardTitle>
          <CardDescription className="text-purple-700 dark:text-purple-300">
            Create a fully customizable dashboard with drag-and-drop visualizations, statistical analyses, and
            AI-powered insights. Build your perfect analysis workspace with complete freedom to arrange, resize, and
            configure modules.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setShowCustomDashboard(true)} className="bg-purple-600 hover:bg-purple-700 text-white">
            <Sparkles className="h-4 w-4 mr-2" />
            Open Custom Dashboard
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Enhanced Trend Analysis</CardTitle>
          <CardDescription>Explore relationships between variables with detailed explanations</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
            <TabsList className="grid grid-cols-5 gap-4">
              <TabsTrigger value="ai-guided" className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                <span className="hidden sm:inline">AI-Guided</span>
              </TabsTrigger>
              <TabsTrigger value="regression">Regression</TabsTrigger>
              <TabsTrigger value="distribution">Distribution</TabsTrigger>
              <TabsTrigger value="correlation">Correlation</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="ai-guided" className="space-y-4">
              <AIGuidedTrends
                data={results?.rawData || []}
                numericColumns={numericColumns}
                categoricalColumns={categoricalColumns}
                dateColumns={dateColumns}
              />
            </TabsContent>

            <TabsContent value="regression" className="space-y-4">
              <div className="flex flex-col gap-4 md:flex-row">
                <div className="w-full md:w-1/3">
                  <div className="space-y-4">
                    <div>
                      <h3 className="mb-2 text-sm font-medium">Select Relationship</h3>
                      <Select
                        value={`${xColumn}_vs_${yColumn}`}
                        onValueChange={handleModelChange}
                        disabled={!availableModels || availableModels.length === 0}
                      >
                        <SelectTrigger className="rounded-lg">
                          <SelectValue placeholder="Select variables" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableModels.map((model: any) => (
                            <SelectItem key={`${model.x}_vs_${model.y}`} value={`${model.x}_vs_${model.y}`}>
                              {model.x} vs {model.y} (R² = {model.rSquared.toFixed(2)})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedModel && (
                      <div className="rounded-lg border p-4">
                        <h3 className="mb-2 font-medium">Regression Statistics</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>R-squared:</span>
                            <span className="font-medium">{selectedModel.rSquared.toFixed(4)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Slope:</span>
                            <span className="font-medium">{selectedModel.slope.toFixed(4)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Intercept:</span>
                            <span className="font-medium">{selectedModel.intercept.toFixed(4)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="w-full md:w-2/3">
                  {regressionData && regressionData.length > 0 && selectedModel ? (
                    <div>
                      <ResponsiveContainer width="100%" height={400}>
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 40 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            type="number"
                            dataKey="x"
                            name={xColumn}
                            label={{ value: xColumn, position: "bottom", offset: 10 }}
                          />
                          <YAxis
                            type="number"
                            dataKey="y"
                            name={yColumn}
                            label={{ value: yColumn, angle: -90, position: "left" }}
                          />
                          <Tooltip
                            cursor={{ strokeDasharray: "3 3" }}
                            formatter={(value: any) => [value, ""]}
                            labelFormatter={(value) => `${xColumn}: ${value}`}
                            contentStyle={{ borderRadius: "8px" }}
                          />
                          <Legend />
                          <Scatter name="Actual Data" data={regressionData} fill="#8884d8" />
                          <Line
                            name="Regression Line"
                            type="monotone"
                            dataKey="predicted"
                            data={regressionData}
                            stroke="#82ca9d"
                            strokeWidth={2}
                            dot={false}
                          />
                        </ScatterChart>
                      </ResponsiveContainer>

                      {/* Natural Language Explanation */}
                      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-start gap-3">
                          <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                          <div className="space-y-2">
                            <h4 className="font-semibold text-blue-800 dark:text-blue-200">What This Chart Shows:</h4>
                            {(() => {
                              const explanation = getRegressionExplanation(
                                xColumn,
                                yColumn,
                                selectedModel.rSquared,
                                selectedModel.slope,
                              )
                              return (
                                <div className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                                  <p>
                                    {explanation.strength} {explanation.analogy}
                                  </p>
                                  <p>{explanation.direction}</p>
                                  <p>{explanation.prediction}</p>
                                  <p>{explanation.slope}</p>
                                </div>
                              )
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-[400px] items-center justify-center rounded-lg border">
                      <p className="text-muted-foreground">Select variables to view regression analysis</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="distribution" className="space-y-4">
              <div className="flex flex-col gap-4 md:flex-row">
                <div className="w-full md:w-1/3">
                  <div className="space-y-4">
                    <div>
                      <h3 className="mb-2 text-sm font-medium">Select Variable</h3>
                      <Select value={xColumn} onValueChange={setXColumn}>
                        <SelectTrigger className="rounded-lg">
                          <SelectValue placeholder="Select variable" />
                        </SelectTrigger>
                        <SelectContent>
                          {results?.columnStats
                            ?.filter((col: any) => col.type === "Number")
                            .map((col: any) => (
                              <SelectItem key={col.name} value={col.name}>
                                {col.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {xColumn && (
                      <div className="rounded-lg border p-4">
                        <h3 className="mb-2 font-medium">Distribution Statistics</h3>
                        <div className="space-y-2 text-sm">
                          {results.columnStats.find((col: any) => col.name === xColumn)?.mean !== undefined && (
                            <>
                              <div className="flex justify-between">
                                <span>Mean:</span>
                                <span className="font-medium">
                                  {results.columnStats.find((col: any) => col.name === xColumn)?.mean.toFixed(2)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Median:</span>
                                <span className="font-medium">
                                  {results.columnStats.find((col: any) => col.name === xColumn)?.median.toFixed(2)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Std Dev:</span>
                                <span className="font-medium">
                                  {results.columnStats.find((col: any) => col.name === xColumn)?.stdDev.toFixed(2)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Skewness:</span>
                                <span className="font-medium">
                                  {results.columnStats.find((col: any) => col.name === xColumn)?.skew?.toFixed(2) ||
                                    "N/A"}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="w-full md:w-2/3">
                  {xColumn ? (
                    <div className="grid gap-4">
                      <div className="h-[200px]">
                        <h3 className="mb-2 text-sm font-medium">Histogram</h3>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={histogramData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="bin" />
                            <YAxis />
                            <Tooltip
                              formatter={(value) => [value, "Frequency"]}
                              contentStyle={{ borderRadius: "8px" }}
                            />
                            <Bar dataKey="frequency" fill="#8884d8" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Natural Language Explanation for Distribution */}
                      {results.columnStats.find((col: any) => col.name === xColumn)?.mean !== undefined && (
                        <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="flex items-start gap-3">
                            <Info className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                            <div className="space-y-2">
                              <h4 className="font-semibold text-green-800 dark:text-green-200">
                                Distribution Analysis:
                              </h4>
                              {(() => {
                                const columnData = results.columnStats.find((col: any) => col.name === xColumn)
                                const explanation = getDistributionExplanation(
                                  xColumn,
                                  columnData.mean,
                                  columnData.median,
                                  columnData.stdDev,
                                  columnData.skew || 0,
                                )
                                return (
                                  <div className="space-y-2 text-sm text-green-700 dark:text-green-300">
                                    <p>{explanation.shape}</p>
                                    <p>{explanation.explanation}</p>
                                    <p>{explanation.comparison}</p>
                                    <p>{explanation.spread}</p>
                                  </div>
                                )
                              })()}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex h-[400px] items-center justify-center rounded-lg border">
                      <p className="text-muted-foreground">Select a variable to view distribution</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="correlation" className="space-y-4">
              <div className="mb-4">
                <div className="flex items-center gap-4 mb-4">
                  <h3 className="text-sm font-medium">Correlation Type:</h3>
                  <Select value={correlationType} onValueChange={(value: any) => setCorrelationType(value)}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pearson">Pearson</SelectItem>
                      <SelectItem value="spearman">Spearman</SelectItem>
                      <SelectItem value="kendall">Kendall</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800 mb-4">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>Pearson:</strong> Measures linear relationships (straight-line connections).
                    <strong> Spearman:</strong> Measures monotonic relationships (consistent direction, not necessarily
                    straight).
                    <strong> Kendall:</strong> Measures rank-based relationships (good for small datasets).
                  </p>
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <h3 className="mb-4 font-medium">Correlation Matrix</h3>
                <div className="overflow-x-auto">
                  {results?.correlationMatrix?.labels && results.correlationMatrix.labels.length > 0 ? (
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="bg-gray-50 px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Variable
                          </th>
                          {results.correlationMatrix.labels.map((label: string) => (
                            <th
                              key={label}
                              className="bg-gray-50 px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                            >
                              {label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {results.correlationMatrix.labels.map((rowLabel: string, rowIndex: number) => (
                          <tr key={rowLabel}>
                            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                              {rowLabel}
                            </td>
                            {results.correlationMatrix.matrix[rowIndex].map((value: number, colIndex: number) => (
                              <td
                                key={`${rowIndex}-${colIndex}`}
                                className="whitespace-nowrap px-6 py-4 text-sm text-gray-500"
                                style={{
                                  backgroundColor: `rgba(${
                                    value > 0 ? "0, 128, 0" : "255, 0, 0"
                                  }, ${Math.abs(value) * 0.5})`,
                                  color: Math.abs(value) > 0.6 ? "white" : "black",
                                }}
                                title={getCorrelationExplanation(
                                  value,
                                  rowLabel,
                                  results.correlationMatrix.labels[colIndex],
                                )}
                              >
                                {value.toFixed(2)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground">No correlation data available</p>
                    </div>
                  )}
                </div>

                {/* Natural Language Explanations for Strong Correlations */}
                {results?.correlationMatrix?.strongPairs && results.correlationMatrix.strongPairs.length > 0 && (
                  <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">
                          Key Relationships Found:
                        </h4>
                        <div className="space-y-2">
                          {results.correlationMatrix.strongPairs.slice(0, 3).map((pair: any, index: number) => (
                            <p key={index} className="text-sm text-purple-700 dark:text-purple-300">
                              {getCorrelationExplanation(pair.value, pair.column1, pair.column2)}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              <AdvancedStatisticalAnalysis
                data={results?.previewData || []}
                columns={results?.columnStats?.map((col) => ({ name: col.name, type: col.type })) || []}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
