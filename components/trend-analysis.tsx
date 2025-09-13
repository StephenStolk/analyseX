"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Cell,
} from "recharts"
import { HelpCircle, Info, AlertCircle } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

export function TrendAnalysis() {
  const [selectedTab, setSelectedTab] = useState("regression")
  const [xColumn, setXColumn] = useState("")
  const [yColumn, setYColumn] = useState("")
  const [results, setResults] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [regressionData, setRegressionData] = useState<any[]>([])
  const [histogramData, setHistogramData] = useState<any[]>([])
  const [boxPlotData, setBoxPlotData] = useState<any | null>(null)
  const [selectedModel, setSelectedModel] = useState<any | null>(null)

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

  // Function to generate regression data
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

  // Get real-world regression example
  const getRegressionExample = (xCol: string, yCol: string, rSquared: number, slope: number) => {
    let example = ""

    if (rSquared > 0.7) {
      example = `This is a strong relationship (R² = ${rSquared.toFixed(2)}), similar to how height and weight are closely related - taller people generally weigh more.`
    } else if (rSquared > 0.4) {
      example = `This is a moderate relationship (R² = ${rSquared.toFixed(2)}), similar to how study time and test scores are somewhat related - more studying often helps, but other factors matter too.`
    } else {
      example = `This is a weak relationship (R² = ${rSquared.toFixed(2)}), similar to how weather and restaurant sales might be slightly related - nice weather may increase customers, but many other factors have greater influence.`
    }

    example += ` The slope of ${slope.toFixed(2)} means that for each one-unit increase in ${xCol}, ${yCol} typically changes by ${slope.toFixed(2)} units.`

    if (slope > 0) {
      example += ` As ${xCol} goes up, ${yCol} tends to go up too.`
    } else {
      example += ` As ${xCol} goes up, ${yCol} tends to go down.`
    }

    return example
  }

  // Get distribution example
  const getDistributionExample = (
    column: string,
    mean: number,
    median: number,
    stdDev: number,
    hasOutliers: boolean,
  ) => {
    let example = `The average (mean) ${column} is ${mean.toFixed(2)}, while the middle value (median) is ${median.toFixed(2)}.`

    if (Math.abs(mean - median) > stdDev * 0.5) {
      example += ` Since these values are quite different, your data is likely skewed (not symmetrical).`
    } else {
      example += ` These values are close, suggesting your data is fairly symmetrical.`
    }

    example += ` The standard deviation of ${stdDev.toFixed(2)} shows how spread out your data is - like measuring how far most values are from the average.`

    if (hasOutliers) {
      example += ` Your data contains some unusual values (outliers) that are far from most other values - like finding a few millionaires in a dataset of typical household incomes.`
    }

    return example
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

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Trend Analysis</CardTitle>
          <CardDescription>
            Explore relationships between variables, distributions, and regression models
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
            <TabsList className="grid grid-cols-3 gap-4">
              <TabsTrigger value="regression">Regression</TabsTrigger>
              <TabsTrigger value="distribution">Distribution</TabsTrigger>
              <TabsTrigger value="correlation">Correlation</TabsTrigger>
            </TabsList>

            <TabsContent value="regression" className="space-y-4">
              {/* Regression explanation */}
              <div className="rounded-lg border bg-muted/30 p-4 mb-4">
                <div className="flex items-start gap-3">
                  <HelpCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">What is Regression Analysis?</h4>
                    <p className="text-sm text-muted-foreground">
                      Regression analysis helps predict one value based on another. Think of it like:
                    </p>
                    <ul className="mt-2 text-sm space-y-1 text-muted-foreground">
                      <li>
                        <span className="font-medium">The Line:</span> A "best guess" line through your data points,
                        like drawing a line through scattered dots to show the overall trend.
                      </li>
                      <li>
                        <span className="font-medium">R-squared (R²):</span> How well the line fits your data (0-1).
                        It's like a score from 0% to 100% - higher means better prediction power. An R² of 0.7 means the
                        model explains 70% of the variation in your data.
                      </li>
                      <li>
                        <span className="font-medium">Slope:</span> How much Y changes when X increases by 1. Like how
                        much your heating bill increases for each degree the temperature drops.
                      </li>
                      <li>
                        <span className="font-medium">Intercept:</span> The Y value when X is zero. Like your base
                        heating cost before temperature effects.
                      </li>
                    </ul>
                    <div className="mt-3 p-2 bg-primary/5 rounded-md">
                      <p className="text-sm font-medium text-primary mb-1">
                        <Info className="h-4 w-4 inline mr-1" />
                        Real-World Example
                      </p>
                      <p className="text-sm text-muted-foreground">
                        A store might use regression to predict daily sales (Y) based on advertising spend (X). If the
                        slope is 5, it means each $1 spent on ads typically generates $5 in sales. An R² of 0.8 would
                        mean advertising explains 80% of the variation in sales.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

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
                          <div className="flex justify-between">
                            <span>Equation:</span>
                            <span className="font-medium">
                              {yColumn} = {selectedModel.slope.toFixed(2)} × {xColumn}{" "}
                              {selectedModel.intercept >= 0 ? "+" : ""}
                              {selectedModel.intercept.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t">
                          <h4 className="text-sm font-medium mb-2">What This Means:</h4>
                          <p className="text-xs text-muted-foreground">
                            {getRegressionExample(xColumn, yColumn, selectedModel.rSquared, selectedModel.slope)}
                          </p>
                        </div>

                        <div className="mt-4 pt-4 border-t">
                          <h4 className="text-sm font-medium mb-2">How To Use This:</h4>
                          <p className="text-xs text-muted-foreground">
                            You can use this equation to predict {yColumn} when you know {xColumn}. For example, if{" "}
                            {xColumn} is{" "}
                            {results?.columnStats?.find((col: any) => col.name === xColumn)?.median.toFixed(1)}, you
                            would expect {yColumn} to be about{" "}
                            {(
                              selectedModel.slope *
                                results?.columnStats?.find((col: any) => col.name === xColumn)?.median +
                              selectedModel.intercept
                            ).toFixed(1)}
                            .
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="w-full md:w-2/3">
                  {regressionData && regressionData.length > 0 ? (
                    <div>
                      <div className="mb-3 p-3 bg-muted/20 rounded-lg">
                        <h4 className="text-sm font-medium mb-1">How to Read This Chart:</h4>
                        <p className="text-xs text-muted-foreground">
                          Each blue dot is a data point showing actual values. The green line is the "best fit"
                          regression line that predicts {yColumn} based on {xColumn}. The closer dots are to the line,
                          the better the prediction. Dots far from the line are cases where the prediction would be less
                          accurate.
                        </p>
                      </div>

                      <ResponsiveContainer width="100%" height={400}>
                        <ScatterChart
                          margin={{
                            top: 20,
                            right: 20,
                            bottom: 40,
                            left: 40,
                          }}
                        >
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
                          <Scatter name="Actual Data" data={regressionData} fill="#8884d8">
                            {regressionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill="#8884d8" fillOpacity={0.7} />
                            ))}
                          </Scatter>
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
              {/* Distribution explanation */}
              <div className="rounded-lg border bg-muted/30 p-4 mb-4">
                <div className="flex items-start gap-3">
                  <HelpCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">Understanding Distributions</h4>
                    <p className="text-sm text-muted-foreground">
                      Distribution analysis shows how values are spread across your data:
                    </p>
                    <ul className="mt-2 text-sm space-y-1 text-muted-foreground">
                      <li>
                        <span className="font-medium">Histogram:</span> Shows how many items fall into different value
                        ranges. Like sorting people by height ranges (5'0"-5'3", 5'4"-5'7", etc.) and counting how many
                        people are in each group.
                      </li>
                      <li>
                        <span className="font-medium">Box Plot:</span> A compact way to show five key statistics:
                        <ul className="ml-4 mt-1">
                          <li>• Minimum: The smallest value</li>
                          <li>• Q1: 25% of values are below this point</li>
                          <li>• Median: The middle value (50% above, 50% below)</li>
                          <li>• Q3: 75% of values are below this point</li>
                          <li>• Maximum: The largest value</li>
                        </ul>
                      </li>
                      <li>
                        <span className="font-medium">Mean vs. Median:</span> Mean is the average (sum divided by
                        count). Median is the middle value. When they're different, your data is skewed.
                      </li>
                    </ul>
                    <div className="mt-3 p-2 bg-primary/5 rounded-md">
                      <p className="text-sm font-medium text-primary mb-1">
                        <Info className="h-4 w-4 inline mr-1" />
                        Real-World Example
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Think of income distribution in a neighborhood. A histogram would show how many households earn
                        $0-$25K, $25K-$50K, etc. A box plot would show the minimum, maximum, and middle incomes. If a
                        few wealthy families move in, the mean (average) income would increase, but the median might not
                        change much.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

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
                                <span>Min:</span>
                                <span className="font-medium">
                                  {typeof results.columnStats.find((col: any) => col.name === xColumn)?.min === "number"
                                    ? results.columnStats.find((col: any) => col.name === xColumn)?.min.toFixed(2)
                                    : results.columnStats.find((col: any) => col.name === xColumn)?.min}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Max:</span>
                                <span className="font-medium">
                                  {typeof results.columnStats.find((col: any) => col.name === xColumn)?.max === "number"
                                    ? results.columnStats.find((col: any) => col.name === xColumn)?.max.toFixed(2)
                                    : results.columnStats.find((col: any) => col.name === xColumn)?.max}
                                </span>
                              </div>
                            </>
                          )}
                        </div>

                        <div className="mt-4 pt-4 border-t">
                          <h4 className="text-sm font-medium mb-2">What This Means:</h4>
                          <p className="text-xs text-muted-foreground">
                            {results.columnStats.find((col: any) => col.name === xColumn)?.mean !== undefined &&
                              getDistributionExample(
                                xColumn,
                                results.columnStats.find((col: any) => col.name === xColumn)?.mean,
                                results.columnStats.find((col: any) => col.name === xColumn)?.median,
                                results.columnStats.find((col: any) => col.name === xColumn)?.stdDev,
                                boxPlotData?.outliers?.length > 0,
                              )}
                          </p>
                        </div>

                        <div className="mt-4 pt-4 border-t">
                          <h4 className="text-sm font-medium mb-2">In Simple Terms:</h4>
                          <p className="text-xs text-muted-foreground">
                            These numbers help you understand what's "normal" for {xColumn} in your data. The mean and
                            median show the typical value, while min and max show the range. Standard deviation shows
                            how much variation exists - a higher number means values are more spread out.
                          </p>
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
                        <div className="mb-2 p-2 bg-muted/20 rounded-lg">
                          <p className="text-xs text-muted-foreground">
                            This histogram shows how many data points fall into each value range. Taller bars mean more
                            data points in that range. This helps you see what values are most common.
                          </p>
                        </div>
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

                      <div className="h-[200px]">
                        <h3 className="mb-2 text-sm font-medium">Box Plot</h3>
                        <div className="mb-2 p-2 bg-muted/20 rounded-lg">
                          <p className="text-xs text-muted-foreground">
                            This box plot shows the spread of your data. The box shows where the middle 50% of values
                            fall. The line inside the box is the median. The "whiskers" extend to the minimum and
                            maximum values (excluding outliers).
                          </p>
                        </div>
                        {boxPlotData ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={[boxPlotData]}
                              layout="vertical"
                              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis type="number" />
                              <YAxis dataKey="column" type="category" />
                              <Tooltip
                                formatter={(value: any) => [value, ""]}
                                labelFormatter={() => "Box Plot Statistics"}
                                contentStyle={{ borderRadius: "8px" }}
                              />
                              <Bar dataKey="min" fill="#8884d8" stackId="a" name="Min" />
                              <Bar dataKey="q1" fill="#82ca9d" stackId="a" name="Q1" />
                              <Bar dataKey="median" fill="#ffc658" stackId="a" name="Median" />
                              <Bar dataKey="q3" fill="#ff8042" stackId="a" name="Q3" />
                              <Bar dataKey="max" fill="#0088fe" stackId="a" name="Max" />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex h-full items-center justify-center rounded-lg border">
                            <p className="text-muted-foreground">No box plot data available</p>
                          </div>
                        )}
                      </div>
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
              {/* Correlation explanation */}
              <div className="rounded-lg border bg-muted/30 p-4 mb-4">
                <div className="flex items-start gap-3">
                  <HelpCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">Understanding Correlation Matrix</h4>
                    <p className="text-sm text-muted-foreground">
                      A correlation matrix shows how each pair of variables relates to each other:
                    </p>
                    <ul className="mt-2 text-sm space-y-1 text-muted-foreground">
                      <li>
                        <span className="font-medium">+1.00 (Dark Blue):</span> Perfect positive correlation - when one
                        goes up, the other always goes up too
                      </li>
                      <li>
                        <span className="font-medium">0.00 (White):</span> No correlation - no relationship between
                        variables
                      </li>
                      <li>
                        <span className="font-medium">-1.00 (Dark Red):</span> Perfect negative correlation - when one
                        goes up, the other always goes down
                      </li>
                    </ul>
                    <div className="mt-3 p-2 bg-primary/5 rounded-md">
                      <p className="text-sm font-medium text-primary mb-1">
                        <Info className="h-4 w-4 inline mr-1" />
                        Real-World Example
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Think of a store's data: Sales and advertising spend might have a strong positive correlation
                        (+0.8) because more advertising usually means more sales. Sales and product returns might have a
                        weak positive correlation (+0.3) because more sales generally mean more returns, but not always
                        proportionally. Sales and store temperature might have no correlation (0) because they're
                        unrelated.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="rounded-lg border p-4">
                  <h3 className="mb-4 font-medium">Correlation Matrix</h3>
                  <div className="mb-3 p-3 bg-muted/20 rounded-lg">
                    <h4 className="text-sm font-medium mb-1">How to Read This Matrix:</h4>
                    <p className="text-xs text-muted-foreground">
                      Each cell shows how strongly two variables are related. The colors indicate the strength and
                      direction of the relationship - blue for positive, red for negative, white for none. The diagonal
                      (top-left to bottom-right) always shows 1.00 because each variable perfectly correlates with
                      itself.
                    </p>
                  </div>
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
                                  title={`${results.correlationMatrix.labels[rowIndex]} vs ${results.correlationMatrix.labels[colIndex]}: ${value.toFixed(2)}`}
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
                </div>

                <div className="rounded-lg border p-4">
                  <h3 className="mb-4 font-medium">Strong Correlations</h3>
                  <div className="mb-3 p-3 bg-muted/20 rounded-lg">
                    <h4 className="text-sm font-medium mb-1">What Are Strong Correlations?</h4>
                    <p className="text-xs text-muted-foreground">
                      These are the strongest relationships found in your data. Values above 0.5 or below -0.5 suggest
                      meaningful connections that could be important for decision-making. These relationships are most
                      likely to be useful for predictions and insights.
                    </p>
                  </div>
                  <div className="space-y-2">
                    {results?.correlationMatrix?.strongPairs && results.correlationMatrix.strongPairs.length > 0 ? (
                      results.correlationMatrix.strongPairs.map((pair: any, index: number) => (
                        <div key={index} className="flex items-center justify-between rounded-lg border p-3">
                          <div>
                            <span className="font-medium">{pair.column1}</span> vs{" "}
                            <span className="font-medium">{pair.column2}</span>
                          </div>
                          <div
                            className={`rounded px-2 py-1 text-white ${
                              pair.value > 0 ? "bg-green-600" : pair.value < 0 ? "bg-red-600" : "bg-gray-600"
                            }`}
                          >
                            r = {pair.value.toFixed(2)}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-muted-foreground">No strong correlations found in the dataset</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 p-3 bg-primary/5 rounded-lg">
                    <p className="text-sm font-medium text-primary mb-1">
                      <AlertCircle className="h-4 w-4 inline mr-1" />
                      Important Note
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Remember that correlation doesn't mean causation. Just because two things move together doesn't
                      mean one causes the other. Always look for logical explanations behind the relationships you find.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
