"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  Legend,
} from "recharts"
import { HelpCircle, Info, BrainCircuit, RefreshCw, Loader2 } from "lucide-react"
import type { CorrelationMatrix as CorrelationMatrixType } from "@/lib/data-analyzer"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm" // Import remark-gfm
import { generateCorrelationInsights } from "@/lib/actions"

export function CorrelationMatrix() {
  const [correlationData, setCorrelationData] = useState<CorrelationMatrixType | null>(null)
  const [selectedView, setSelectedView] = useState("heatmap")
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPair, setSelectedPair] = useState<{ x: string; y: string } | null>(null)
  const [scatterData, setScatterData] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [aiInsights, setAiInsights] = useState<string | null>(null)
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false)
  const [insightsGenerated, setInsightsGenerated] = useState(false)

  useEffect(() => {
    // Get analysis results from sessionStorage
    const resultsString = sessionStorage.getItem("analysisResults")
    if (resultsString) {
      try {
        const results = JSON.parse(resultsString)

        // Verify we have real correlation data
        if (!results.correlationMatrix || !results.correlationMatrix.matrix) {
          console.error("Invalid correlation data:", results.correlationMatrix)
          setError("Correlation data is not available or invalid")
          setIsLoading(false)
          return
        }

        console.log(
          `Correlation matrix size: ${results.correlationMatrix.matrix.length}x${results.correlationMatrix.matrix[0]?.length || 0}`,
        )
        console.log(`Correlation columns: ${results.correlationMatrix.labels.join(", ")}`)

        setCorrelationData(results.correlationMatrix)

        // Set default selected pair if strong correlations exist
        if (results.correlationMatrix.strongPairs && results.correlationMatrix.strongPairs.length > 0) {
          const strongest = results.correlationMatrix.strongPairs[0]
          setSelectedPair({
            x: strongest.column1,
            y: strongest.column2,
          })

          // Get scatter data for the selected pair
          if (results.previewData && results.previewData.length > 0) {
            generateScatterData(results.previewData, strongest.column1, strongest.column2)
          }
        }

        // Check if AI insights are already generated and stored
        const storedInsights = sessionStorage.getItem("correlationAiInsights")
        if (storedInsights) {
          setAiInsights(storedInsights)
          setInsightsGenerated(true)
        }
      } catch (error) {
        console.error("Error parsing analysis results:", error)
        setError("Error loading correlation data. Please try refreshing the page.")
      }
    } else {
      setError("No analysis results found. Please upload and analyze a file first.")
    }
    setIsLoading(false)
  }, [])

  // Function to generate scatter data from preview data
  const generateScatterData = (previewData: any[], xColumn: string, yColumn: string) => {
    try {
      if (!previewData || !Array.isArray(previewData) || previewData.length === 0) {
        console.error("Invalid preview data for scatter plot")
        return
      }

      const scatterPoints = previewData
        .filter(
          (row) =>
            row &&
            row[xColumn] !== null &&
            row[xColumn] !== undefined &&
            row[yColumn] !== null &&
            row[yColumn] !== undefined &&
            !isNaN(Number(row[xColumn])) &&
            !isNaN(Number(row[yColumn])),
        )
        .map((row) => ({
          x: Number(row[xColumn]),
          y: Number(row[yColumn]),
        }))

      console.log(`Generated ${scatterPoints.length} scatter points for ${xColumn} vs ${yColumn}`)
      setScatterData(scatterPoints)
    } catch (error) {
      console.error("Error generating scatter data:", error)
      toast({
        title: "Error",
        description: "Could not generate scatter plot data. Please try a different column pair.",
        variant: "destructive",
      })
    }
  }

  // Update scatter data when selected pair changes
  useEffect(() => {
    if (!selectedPair) return

    const resultsString = sessionStorage.getItem("analysisResults")
    if (resultsString) {
      try {
        const results = JSON.parse(resultsString)

        if (results.previewData && results.previewData.length > 0) {
          generateScatterData(results.previewData, selectedPair.x, selectedPair.y)
        }
      } catch (error) {
        console.error("Error updating scatter data:", error)
      }
    }
  }, [selectedPair])

  // Function to generate AI insights for correlations
  const generateAiInsights = async () => {
    if (!correlationData) return

    setIsGeneratingInsights(true)

    try {
      const resultsString = sessionStorage.getItem("analysisResults")
      if (!resultsString) {
        throw new Error("No analysis results found")
      }

      const results = JSON.parse(resultsString)

      // Prepare correlation data for AI analysis
      const correlationContext = {
        fileName: results.fileName || "dataset",
        strongPairs: correlationData.strongPairs || [],
        correlationMatrix: {
          labels: correlationData.labels,
          matrix: correlationData.matrix,
        },
        columnStats: results.columnStats || [],
        previewData: results.previewData?.slice(0, 10) || [], // Send only first 10 rows for context
      }

      // Call the server action
      const result = await generateCorrelationInsights(correlationContext)

      setAiInsights(result.insights)
      setInsightsGenerated(true)

      // Store insights in sessionStorage
      sessionStorage.setItem("correlationAiInsights", result.insights)

      toast({
        title: "AI Insights Generated",
        description: "Comprehensive business insights have been generated for your correlation analysis.",
      })
    } catch (error) {
      console.error("Error generating AI insights:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate AI insights. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingInsights(false)
    }
  }

  const getCorrelationColor = (value: number) => {
    // Color scale from red (negative) to white (neutral) to blue (positive)
    if (value === 1) return "bg-primary/90 text-primary-foreground"
    if (value > 0.7) return "bg-primary/70 text-primary-foreground"
    if (value > 0.4) return "bg-primary/50 text-primary-foreground"
    if (value > 0.2) return "bg-primary/30 text-foreground"
    if (value > 0) return "bg-primary/10 text-foreground"
    if (value === 0) return "bg-muted text-muted-foreground"
    if (value > -0.2) return "bg-destructive/10 text-foreground"
    if (value > -0.4) return "bg-destructive/30 text-foreground"
    if (value > -0.7) return "bg-destructive/50 text-destructive-foreground"
    return "bg-destructive/70 text-destructive-foreground"
  }

  const getCorrelationDescription = (value: number) => {
    if (value > 0.9) return "Very strong positive correlation"
    if (value > 0.7) return "Strong positive correlation"
    if (value > 0.5) return "Moderate positive correlation"
    if (value > 0.3) return "Weak positive correlation"
    if (value > 0.1) return "Very weak positive correlation"
    if (value > -0.1) return "No correlation"
    if (value > -0.3) return "Very weak negative correlation"
    if (value > -0.5) return "Weak negative correlation"
    if (value > -0.7) return "Moderate negative correlation"
    if (value > -0.9) return "Strong negative correlation"
    return "Very strong negative correlation"
  }

  const getCorrelationExample = (value: number, x: string, y: string) => {
    if (value > 0.7) {
      return `As ${x} increases, ${y} almost always increases too. Like how taller people tend to weigh more, or how more hours worked usually means higher pay.`
    } else if (value > 0.3) {
      return `As ${x} increases, ${y} tends to increase somewhat. Like how more study time often leads to better grades, but other factors also matter.`
    } else if (value > -0.3 && value < 0.3) {
      return `There's little to no relationship between ${x} and ${y}. Like how shoe size and test scores aren't related.`
    } else if (value > -0.7) {
      return `As ${x} increases, ${y} tends to decrease somewhat. Like how more rainfall might lead to fewer outdoor activities.`
    } else {
      return `As ${x} increases, ${y} almost always decreases. Like how higher discounts lead to lower profits per item, or how more time spent on social media often means less time studying.`
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p>Loading correlation data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border bg-muted/30 p-8 text-center">
        <h3 className="mb-2 text-xl font-semibold">Error</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline">
          Refresh
        </Button>
      </div>
    )
  }

  if (!correlationData || correlationData.labels.length < 2) {
    return (
      <div className="rounded-lg border bg-muted/30 p-8 text-center">
        <h3 className="mb-2 text-xl font-semibold">No Correlation Data Available</h3>
        <p className="text-muted-foreground">
          Your dataset doesn't contain enough numeric columns to calculate correlations.
        </p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <CardTitle>Correlation Analysis</CardTitle>
              <CardDescription>Explore relationships between numerical variables in your dataset</CardDescription>
            </div>
            <Select defaultValue={selectedView} onValueChange={setSelectedView}>
              <SelectTrigger className="w-[180px] rounded-full">
                <SelectValue placeholder="Select view" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="heatmap">Heatmap</SelectItem>
                <SelectItem value="scatter">Scatter Plot</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {/* Correlation explanation */}
          <div className="mb-6 rounded-lg border bg-muted/30 p-4">
            <div className="flex items-start gap-3">
              <HelpCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold mb-1">What is Correlation?</h4>
                <p className="text-sm text-muted-foreground">
                  Correlation shows how two things change together. Think of it like this:
                </p>
                <ul className="mt-2 text-sm space-y-1 text-muted-foreground">
                  <li>
                    <span className="font-medium">+1 (Strong Positive):</span> When one goes up, the other always goes
                    up too. Like ice cream sales and temperature - hotter days mean more ice cream sold.
                  </li>
                  <li>
                    <span className="font-medium">0 (No Correlation):</span> No relationship at all. Like shoe size and
                    test scores - they don't affect each other.
                  </li>
                  <li>
                    <span className="font-medium">-1 (Strong Negative):</span> When one goes up, the other always goes
                    down. Like heating costs and outdoor temperature - colder days mean higher heating bills.
                  </li>
                </ul>
                <div className="mt-3 p-2 bg-primary/5 rounded-md text-sm">
                  <p className="font-medium text-primary mb-1">
                    <Info className="h-4 w-4 inline mr-1" />
                    Remember: Correlation doesn't mean causation
                  </p>
                  <p className="text-muted-foreground">
                    Just because two things move together doesn't mean one causes the other. Ice cream sales and
                    drownings both increase in summer, but ice cream doesn't cause drownings - hot weather increases
                    both!
                  </p>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Click on any cell in the matrix to see a scatter plot of that relationship.
                </p>
              </div>
            </div>
          </div>

          <Tabs defaultValue="matrix" className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-full">
              <TabsTrigger value="matrix" className="rounded-full">
                Correlation Matrix
              </TabsTrigger>
              <TabsTrigger value="insights" className="rounded-full">
                Key Insights
              </TabsTrigger>
            </TabsList>

            <TabsContent value="matrix" className="mt-6">
              <div className="mb-4 p-3 bg-muted/20 rounded-lg">
                <h4 className="text-sm font-medium mb-1">How to Read This Matrix:</h4>
                <p className="text-xs text-muted-foreground">
                  Each cell shows how strongly two variables are related. Darker blue means stronger positive
                  relationship, darker red means stronger negative relationship. White means no relationship. Click any
                  cell to see a scatter plot visualization.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="p-2 text-left font-medium"></th>
                      {correlationData.labels.map((col) => (
                        <th key={col} className="p-2 text-left font-medium">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {correlationData.matrix.map((row, i) => (
                      <tr key={i}>
                        <td className="p-2 font-medium">{correlationData.labels[i]}</td>
                        {row.map((value, j) => (
                          <td
                            key={j}
                            className={`p-2 text-center ${getCorrelationColor(value)} transition-all duration-200 hover:opacity-80`}
                            onClick={() => {
                              if (i !== j) {
                                setSelectedPair({
                                  x: correlationData.labels[i],
                                  y: correlationData.labels[j],
                                })
                                toast({
                                  title: `${correlationData.labels[i]} vs ${correlationData.labels[j]}`,
                                  description: getCorrelationDescription(value),
                                })
                              }
                            }}
                            style={{ cursor: i !== j ? "pointer" : "default" }}
                            title={`${correlationData.labels[i]} vs ${correlationData.labels[j]}: ${value.toFixed(2)} - ${getCorrelationDescription(value)}`}
                          >
                            {value.toFixed(2)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex items-center justify-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-sm bg-destructive/70"></div>
                  <span className="text-sm">Strong Negative</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-sm bg-muted"></div>
                  <span className="text-sm">No Correlation</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-sm bg-primary/70"></div>
                  <span className="text-sm">Strong Positive</span>
                </div>
              </div>

              {selectedPair && (
                <div className="mt-6 rounded-lg border bg-muted/30 p-4">
                  <h3 className="mb-2 text-lg font-semibold">
                    Scatter Plot: {selectedPair.x} vs {selectedPair.y}
                  </h3>

                  <div className="mb-3 p-3 bg-muted/20 rounded-lg">
                    <h4 className="text-sm font-medium mb-1">How to Read This Scatter Plot:</h4>
                    <p className="text-xs text-muted-foreground">
                      Each dot represents one data point. The horizontal position shows the {selectedPair.x} value, and
                      the vertical position shows the {selectedPair.y} value. If dots form a pattern (like moving from
                      bottom-left to top-right), it shows a relationship exists.
                    </p>
                  </div>

                  <div className="aspect-[16/9] w-full bg-background/50 rounded-md p-4">
                    <div className="h-full w-full">
                      {scatterData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 40 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              type="number"
                              dataKey="x"
                              name={selectedPair.x}
                              label={{ value: selectedPair.x, position: "bottom", offset: 10 }}
                            />
                            <YAxis
                              type="number"
                              dataKey="y"
                              name={selectedPair.y}
                              label={{ value: selectedPair.y, angle: -90, position: "left" }}
                            />
                            <Tooltip
                              cursor={{ strokeDasharray: "3 3" }}
                              formatter={(value) => [value, ""]}
                              labelFormatter={(value) => `${selectedPair.x}: ${value}`}
                              contentStyle={{ borderRadius: "8px" }}
                            />
                            <Legend />
                            <Scatter name={`${selectedPair.y} values`} data={scatterData} fill="hsl(var(--primary))">
                              {scatterData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill="hsl(var(--primary))" fillOpacity={0.7} />
                              ))}
                            </Scatter>
                          </ScatterChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <p className="text-muted-foreground">No data available for scatter plot</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Real-world explanation */}
                  <div className="mt-4 p-3 bg-primary/5 rounded-lg">
                    <h4 className="text-sm font-medium mb-1">What This Means:</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedPair &&
                        getCorrelationExample(
                          correlationData.matrix[correlationData.labels.indexOf(selectedPair.x)][
                            correlationData.labels.indexOf(selectedPair.y)
                          ],
                          selectedPair.x,
                          selectedPair.y,
                        )}
                    </p>
                  </div>

                  <p className="mt-2 text-sm text-muted-foreground text-center">
                    Click on any correlation value in the matrix to view a different relationship
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="insights" className="mt-6">
              <div className="space-y-4">
                {/* AI Insights Generation Section */}
                <div className="rounded-lg border bg-muted/30 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <BrainCircuit className="h-6 w-6 text-primary" />
                      <div>
                        <h3 className="font-semibold">AI-Powered Business Insights</h3>
                        <p className="text-sm text-muted-foreground">
                          Get comprehensive business analysis of your correlation patterns
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={generateAiInsights}
                      disabled={isGeneratingInsights}
                      className="gap-2"
                      variant={insightsGenerated ? "outline" : "default"}
                    >
                      {isGeneratingInsights ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : insightsGenerated ? (
                        <>
                          <RefreshCw className="h-4 w-4" />
                          Regenerate Insights
                        </>
                      ) : (
                        <>
                          <BrainCircuit className="h-4 w-4" />
                          Generate AI Insights
                        </>
                      )}
                    </Button>
                  </div>

                  {aiInsights ? (
                    <div className="ai-insights-content">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]} // Add remark-gfm plugin here
                        components={{
                          h1: ({ children }) => (
                            <h1 className="text-2xl font-bold mb-4 text-foreground border-b pb-2">{children}</h1>
                          ),
                          h2: ({ children }) => (
                            <h2 className="text-xl font-semibold mb-3 mt-6 text-foreground">{children}</h2>
                          ),
                          h3: ({ children }) => (
                            <h3 className="text-lg font-medium mb-2 mt-4 text-foreground">{children}</h3>
                          ),
                          h4: ({ children }) => (
                            <h4 className="text-base font-medium mb-2 mt-3 text-foreground">{children}</h4>
                          ),
                          p: ({ children }) => (
                            <p className="mb-3 text-sm text-muted-foreground leading-relaxed">{children}</p>
                          ),
                          ul: ({ children }) => (
                            <ul className="mb-4 ml-4 space-y-1 text-sm text-muted-foreground list-disc">{children}</ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="mb-4 ml-4 space-y-1 text-sm text-muted-foreground list-decimal">
                              {children}
                            </ol>
                          ),
                          li: ({ children }) => (
                            <li className="flex items-start">
                              {/* Removed custom bullet to let list-disc handle it */}
                              <span>{children}</span>
                            </li>
                          ),
                          strong: ({ children }) => (
                            <strong className="font-semibold text-foreground">{children}</strong>
                          ),
                          em: ({ children }) => <em className="italic text-muted-foreground">{children}</em>,
                          blockquote: ({ children }) => (
                            <blockquote className="border-l-4 border-primary pl-4 py-2 my-4 bg-muted/30 rounded-r-lg">
                              {children}
                            </blockquote>
                          ),
                          code: ({ children }) => (
                            <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground">
                              {children}
                            </code>
                          ),
                          table: ({ children }) => (
                            <div className="overflow-x-auto my-4">
                              <table className="w-full border-collapse border border-border rounded-lg">
                                {children}
                              </table>
                            </div>
                          ),
                          thead: ({ children }) => <thead className="bg-muted/50">{children}</thead>,
                          tbody: ({ children }) => <tbody>{children}</tbody>,
                          tr: ({ children }) => <tr className="border-b border-border">{children}</tr>,
                          th: ({ children }) => (
                            <th className="border border-border px-3 py-2 text-left font-semibold text-foreground">
                              {children}
                            </th>
                          ),
                          td: ({ children }) => (
                            <td className="border border-border px-3 py-2 text-sm text-muted-foreground">{children}</td>
                          ),
                        }}
                      >
                        {aiInsights}
                      </ReactMarkdown>
                    </div>
                  ) : !isGeneratingInsights ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">
                        Click "Generate AI Insights" to get comprehensive business analysis including:
                      </p>
                      <ul className="text-sm text-muted-foreground space-y-1 text-left max-w-md mx-auto">
                        <li>• Monthly trends and seasonal patterns</li>
                        <li>• Product relationship analysis</li>
                        <li>• Key drivers of performance metrics</li>
                        <li>• Impact of negative correlations</li>
                        <li>• Actionable business recommendations</li>
                      </ul>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                      <p className="text-muted-foreground">Analyzing your data to generate business insights...</p>
                    </div>
                  )}
                </div>

                {/* Fallback Basic Insights (shown only if AI insights haven't been generated) */}
                {!aiInsights && !isGeneratingInsights && (
                  <>
                    {correlationData.strongPairs && correlationData.strongPairs.length > 0 ? (
                      correlationData.strongPairs.slice(0, 5).map((corr, i) => (
                        <div key={i} className="rounded-lg border bg-muted/30 p-4">
                          <h3 className="mb-2 font-semibold">
                            {corr.value > 0 ? "Positive Correlation" : "Negative Correlation"}
                            <span className="ml-2 text-sm font-normal px-2 py-0.5 rounded-full bg-primary/10">
                              {Math.abs(corr.value).toFixed(2)}
                            </span>
                          </h3>
                          <p className="text-muted-foreground">
                            <span className="font-medium">{corr.column1}</span> and{" "}
                            <span className="font-medium">{corr.column2}</span>:
                            {corr.value > 0
                              ? ` As ${corr.column1} increases, ${corr.column2} tends to increase. This suggests a direct relationship between these variables.`
                              : ` As ${corr.column1} increases, ${corr.column2} tends to decrease. This suggests an inverse relationship between these variables.`}
                          </p>
                          <div className="mt-3 p-2 bg-muted/20 rounded-md">
                            <h4 className="text-sm font-medium mb-1">Real-World Example:</h4>
                            <p className="text-sm text-muted-foreground">
                              {getCorrelationExample(corr.value, corr.column1, corr.column2)}
                            </p>
                          </div>
                          <div className="mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs bg-transparent"
                              onClick={() => {
                                setSelectedPair({
                                  x: corr.column1,
                                  y: corr.column2,
                                })
                                document
                                  .querySelector('[value="matrix"]')
                                  ?.dispatchEvent(new Event("click", { bubbles: true }))
                              }}
                            >
                              View Scatter Plot
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-lg border bg-muted/30 p-4">
                        <h3 className="mb-2 font-semibold">No Strong Correlations</h3>
                        <p className="text-muted-foreground">
                          No strong correlations (above 0.5 or below -0.5) were found between the numeric variables in
                          your dataset. This suggests that the variables in your dataset may be largely independent of
                          each other.
                        </p>
                        <div className="mt-3 p-2 bg-muted/20 rounded-md">
                          <h4 className="text-sm font-medium mb-1">What This Means:</h4>
                          <p className="text-sm text-muted-foreground">
                            It's like having a group of people where everyone's height, weight, age, and income are all
                            unrelated to each other. This is unusual in real-world data, where we typically expect some
                            relationships. It could mean your data captures truly independent factors, or it might
                            suggest looking for non-linear relationships.
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="rounded-lg border bg-muted/30 p-4">
                      <h3 className="mb-2 font-semibold">What These Correlations Mean For You</h3>
                      <p className="text-muted-foreground">
                        Strong correlations can help you make better decisions by understanding what factors are
                        connected:
                      </p>
                      <ul className="mt-2 space-y-1 text-muted-foreground">
                        <li>
                          <span className="font-medium">• Prediction:</span> If you know one value, you can make an
                          educated guess about the other (like predicting sales based on advertising spend)
                        </li>
                        <li>
                          <span className="font-medium">• Focus areas:</span> Identify which factors might be most
                          important to your goals (like which customer behaviors relate to retention)
                        </li>
                        <li>
                          <span className="font-medium">• Efficiency:</span> Find redundant measurements where you might
                          be collecting the same information twice
                        </li>
                        <li>
                          <span className="font-medium">• Investigation:</span> Discover unexpected relationships worth
                          exploring further
                        </li>
                      </ul>
                      <div className="mt-3 p-2 bg-primary/5 rounded-md">
                        <p className="text-sm font-medium text-primary mb-1">
                          <Info className="h-4 w-4 inline mr-1" />
                          Important Note
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Correlation shows that two things move together, but doesn't prove that one causes the other.
                          Always look for logical explanations and consider other factors that might influence both
                          variables.
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  )
}
