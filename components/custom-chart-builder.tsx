"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import {
  BarChart3,
  Download,
  Lightbulb,
  RefreshCw,
  MoreHorizontal,
  Bot,
  User,
  MessageSquareText,
  Send,
  Eraser,
} from "lucide-react"
import { getDetailedChartInsight } from "@/lib/chart-insights" // Still used for local detailed analysis before sending to AI
import { generateChartReportWithAI, askFollowUpQuestion } from "@/lib/actions" // Import new action
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "@/components/ui/use-toast"
import type { ChatMessage } from "@/lib/api-types"

interface CustomChartBuilderProps {
  data: any[]
  columns: string[]
  numericColumns: string[]
  categoricalColumns: string[]
}

// Using Tailwind's chart colors
const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
]

// Custom components for ReactMarkdown rendering
const MarkdownComponents: object = {
  h1: ({ node, ...props }) => <h1 className="text-3xl font-bold mt-6 mb-3" {...props} />,
  h2: ({ node, ...props }) => <h2 className="text-2xl font-bold mt-5 mb-2" {...props} />,
  h3: ({ node, ...props }) => <h3 className="text-xl font-semibold mt-4 mb-2" {...props} />,
  h4: ({ node, ...props }) => <h4 className="text-lg font-semibold mt-3 mb-1" {...props} />,
  h5: ({ node, ...props }) => <h5 className="text-base font-semibold mt-2 mb-1" {...props} />,
  h6: ({ node, ...props }) => <h6 className="text-sm font-semibold mt-2 mb-1" {...props} />,
  p: ({ node, ...props }) => <p className="mb-2 leading-relaxed text-muted-foreground" {...props} />,
  ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-2 space-y-1 text-muted-foreground" {...props} />,
  ol: ({ node, ...props }) => (
    <ol className="list-decimal list-inside mb-2 space-y-1 text-muted-foreground" {...props} />
  ),
  li: ({ node, ...props }) => <li className="mb-1" {...props} />,
  table: ({ node, ...props }) => (
    <div className="w-full overflow-x-auto my-4">
      <table className="w-full text-sm border-collapse" {...props} />
    </div>
  ),
  thead: ({ node, ...props }) => <thead className="[&_tr]:border-b bg-muted/50" {...props} />,
  tbody: ({ node, ...props }) => <tbody className="[&_tr:last-child]:border-0" {...props} />,
  tr: ({ node, ...props }) => (
    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted" {...props} />
  ),
  th: ({ node, ...props }) => (
    <th
      className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([data-tooltip-trigger])]:pr-0"
      {...props}
    />
  ),
  td: ({ node, ...props }) => <td className="p-4 align-middle [&:has([data-tooltip-trigger])]:pr-0" {...props} />,
  pre: ({ node, ...props }) => (
    <pre className="bg-gray-800 text-white p-4 rounded-md overflow-x-auto my-4 text-sm" {...props} />
  ),
  code: ({ node, inline, ...props }) => (
    <code className={inline ? "bg-muted px-1 py-0.5 rounded-sm font-mono text-sm" : "block font-mono"} {...props} />
  ),
  blockquote: ({ node, ...props }) => (
    <blockquote className="mt-6 border-l-4 pl-4 italic text-muted-foreground" {...props} />
  ),
}

export function CustomChartBuilder({ data, columns, numericColumns, categoricalColumns }: CustomChartBuilderProps) {
  const [xColumn, setXColumn] = useState<string>("")
  const [yColumn, setYColumn] = useState<string>("")
  const [groupBy, setGroupBy] = useState<string>("none")
  const [generatedCharts, setGeneratedCharts] = useState<any[]>([])
  const [aiReport, setAiReport] = useState<string | null>(null) // Stores the AI-generated report
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [showChat, setShowChat] = useState(false) // Controls chat visibility
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [userQuestion, setUserQuestion] = useState("")
  const [isAskingQuestion, setIsAskingQuestion] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom of chat when new messages are added
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [chatMessages])

  // Custom Tooltip component for Recharts
  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-md border bg-popover p-2 text-popover-foreground shadow-md text-xs">
          <p className="font-bold">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} style={{ color: entry.color }}>
              {`${entry.name || entry.dataKey}: ${entry.value}`}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  // Process data for general charts (Bar, Line, Scatter, Area)
  const processedData = useMemo(() => {
    if (!data || data.length === 0 || !xColumn || !yColumn) return []

    let currentProcessedData = data
      .filter((row) => row[xColumn] !== null && row[xColumn] !== undefined)
      .map((row) => ({
        x: row[xColumn],
        y: Number(row[yColumn]) || 0,
        group: groupBy !== "none" ? String(row[groupBy]) : "default",
        ...row,
      }))

    // Sort by x-axis for line and area charts
    currentProcessedData = currentProcessedData.sort((a, b) => {
      if (typeof a.x === "number" && typeof b.x === "number") {
        return a.x - b.x
      }
      return String(a.x).localeCompare(String(b.x))
    })

    return currentProcessedData
  }, [data, xColumn, yColumn, groupBy])

  // Process data for Pie chart specifically
  const pieChartData = useMemo(() => {
    if (!data || data.length === 0 || !xColumn || !categoricalColumns.includes(xColumn)) return []

    const counts = data.reduce(
      (acc, row) => {
        const key = String(row[xColumn] || "Unknown")
        acc[key] = (acc[key] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [data, xColumn, categoricalColumns])

  const handleGenerateChartsAndReport = async () => {
    if (!data || data.length === 0 || !xColumn) {
      setGeneratedCharts([])
      setAiReport(null)
      return
    }

    setIsGeneratingReport(true)
    setAiReport(null) // Clear previous report
    setChatMessages([]) // Clear chat on new report generation
    setShowChat(false) // Hide chat initially

    const charts: any[] = []
    const insightsForAI: any[] = [] // Collect detailed insights for AI report

    // Generate Bar, Line, Scatter, Area charts if Y-axis is selected
    if (yColumn) {
      const commonChartProps = {
        data: processedData,
        xColumn,
        yColumn,
        groupBy: groupBy !== "none" ? groupBy : undefined,
      }

      const chartTypesToGenerate = ["bar", "line", "scatter", "area"]
      chartTypesToGenerate.forEach((type) => {
        const chartConfig = {
          type,
          label: `${type.charAt(0).toUpperCase() + type.slice(1)} Chart`,
          ...commonChartProps,
        }
        charts.push(chartConfig)
        // Get detailed insight for each chart to pass to the AI
        insightsForAI.push({
          ...chartConfig,
          detailedAnalysis: getDetailedChartInsight(
            type,
            processedData,
            xColumn,
            yColumn,
            groupBy !== "none" ? groupBy : undefined,
          ),
        })
      })
    }

    // Generate Pie chart if X-axis is categorical
    if (categoricalColumns.includes(xColumn) && pieChartData.length > 0) {
      const pieConfig = {
        type: "pie",
        label: "Pie Chart",
        data: pieChartData,
        xColumn,
        yColumn: undefined, // Pie charts don't use a Y-axis
        groupBy: undefined,
      }
      charts.push(pieConfig)
      insightsForAI.push({
        ...pieConfig,
        detailedAnalysis: getDetailedChartInsight("pie", pieChartData, xColumn, undefined, undefined),
      })
    }

    setGeneratedCharts(charts)

    // Now, generate the comprehensive AI report
    try {
      const { report } = await generateChartReportWithAI(insightsForAI)
      setAiReport(report)
      setChatMessages([
        {
          role: "assistant",
          content: "I've generated a comprehensive report based on your charts. Let me know if you have any questions!",
        },
      ])
    } catch (error: any) {
      // Explicitly type error as any to access message
      console.error("Error generating AI report:", error)
      toast({
        title: "AI Report Error",
        description: error.message || "Failed to generate AI report. Please try again.",
        variant: "destructive",
      })
      setAiReport("Failed to generate AI report. Please check your API key and try again.")
    } finally {
      setIsGeneratingReport(false)
    }
  }

  const handleSendQuestion = async () => {
    if (!userQuestion.trim()) return

    setChatMessages((prev) => [...prev, { role: "user", content: userQuestion }])
    const question = userQuestion
    setUserQuestion("")
    setIsAskingQuestion(true)

    try {
      // Pass the generated charts metadata as context for follow-up questions
      const contextForAI = {
        charts: generatedCharts.map((chart) => ({
          type: chart.type,
          xColumn: chart.xColumn,
          yColumn: chart.yColumn,
          groupBy: chart.groupBy,
          dataPoints: chart.data.length,
          sampleData: chart.data.slice(0, 5), // Send a small sample
        })),
        report: aiReport, // Include the generated report in context
      }

      const response = await askFollowUpQuestion({
        question,
        analysisResults: contextForAI, // Use analysisResults to pass chart context
        previousMessages: chatMessages,
        model: "openai/gpt-oss-20b:free", // Use GPT-OSS-20B for follow-up questions
      })

      setChatMessages((prev) => [...prev, { role: "assistant", content: response.answer }])
    } catch (error: any) {
      // Explicitly type error as any to access message
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
        description: error.message || "Failed to get an answer. Please try a different question.",
        variant: "destructive",
      })
    } finally {
      setIsAskingQuestion(false)
    }
  }

  const handleClearChat = () => {
    setChatMessages([
      {
        role: "assistant",
        content: "I've generated a comprehensive report based on your charts. Let me know if you have any questions!",
      },
    ])
    setUserQuestion("")
  }

  const downloadChart = (chartConfig: any) => {
    const chartInfo = {
      type: chartConfig.type,
      xAxis: chartConfig.xColumn,
      yAxis: chartConfig.yColumn,
      groupBy: chartConfig.groupBy || "None",
      dataPoints: chartConfig.data.length,
      timestamp: new Date().toISOString(),
      data: chartConfig.data,
    }

    const blob = new Blob([JSON.stringify(chartInfo, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `custom_chart_${chartConfig.type}_${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const renderSingleChart = (chartConfig: any, chartIndex: number) => {
    const commonProps = {
      width: "100%",
      height: 250, // Further reduced height for more charts on screen
      data: chartConfig.data,
    }

    const mainChartColor = CHART_COLORS[chartIndex % CHART_COLORS.length]

    switch (chartConfig.type) {
      case "bar":
        return (
          <ResponsiveContainer {...commonProps}>
            <BarChart data={chartConfig.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" vertical={false} opacity={0.5} />
              <XAxis dataKey="x" tickLine={false} axisLine={false} style={{ fontSize: "10px" }} />
              <YAxis tickLine={false} axisLine={false} style={{ fontSize: "10px" }} />
              <Tooltip content={<CustomChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: "10px" }} />
              <Bar dataKey="y" fill={mainChartColor} name={chartConfig.yColumn} />
            </BarChart>
          </ResponsiveContainer>
        )

      case "line":
        return (
          <ResponsiveContainer {...commonProps}>
            <LineChart data={chartConfig.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" vertical={false} opacity={0.5} />
              <XAxis dataKey="x" tickLine={false} axisLine={false} style={{ fontSize: "10px" }} />
              <YAxis tickLine={false} axisLine={false} style={{ fontSize: "10px" }} />
              <Tooltip content={<CustomChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: "10px" }} />
              <Line type="monotone" dataKey="y" stroke={mainChartColor} strokeWidth={2} name={chartConfig.yColumn} />
            </LineChart>
          </ResponsiveContainer>
        )

      case "scatter":
        return (
          <ResponsiveContainer {...commonProps}>
            <ScatterChart data={chartConfig.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" vertical={false} opacity={0.5} />
              <XAxis
                dataKey="x"
                name={chartConfig.xColumn}
                tickLine={false}
                axisLine={false}
                style={{ fontSize: "10px" }}
              />
              <YAxis
                dataKey="y"
                name={chartConfig.yColumn}
                tickLine={false}
                axisLine={false}
                style={{ fontSize: "10px" }}
              />
              <Tooltip cursor={{ strokeDasharray: "3 3" }} content={<CustomChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: "10px" }} />
              <Scatter
                data={chartConfig.data}
                fill={mainChartColor}
                name={`${chartConfig.xColumn} vs ${chartConfig.yColumn}`}
              />
            </ScatterChart>
          </ResponsiveContainer>
        )

      case "pie":
        return (
          <ResponsiveContainer {...commonProps}>
            <PieChart>
              <Pie
                data={chartConfig.data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80} // Further reduced radius
                fill={mainChartColor}
                dataKey="value"
              >
                {chartConfig.data.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: "10px" }} />
            </PieChart>
          </ResponsiveContainer>
        )

      case "area":
        return (
          <ResponsiveContainer {...commonProps}>
            <AreaChart data={chartConfig.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" vertical={false} opacity={0.5} />
              <XAxis dataKey="x" tickLine={false} axisLine={false} style={{ fontSize: "10px" }} />
              <YAxis tickLine={false} axisLine={false} style={{ fontSize: "10px" }} />
              <Tooltip content={<CustomChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: "10px" }} />
              <Area
                type="monotone"
                dataKey="y"
                stroke={mainChartColor}
                fill={mainChartColor}
                fillOpacity={0.6}
                name={chartConfig.yColumn}
              />
            </AreaChart>
          </ResponsiveContainer>
        )

      default:
        return null
    }
  }

  const getAvailableColumns = (type: "x" | "y") => {
    if (type === "x") {
      return columns // X-axis can be any column for general charts, or categorical for pie
    }
    return numericColumns // Y-axis must be numeric
  }

  if (!data || data.length === 0) {
    return (
      <Alert>
        <BarChart3 className="h-4 w-4" />
        <AlertDescription>No data available for chart building. Please upload a dataset first.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-purple-600" />
        <h3 className="text-lg font-semibold">Custom Chart Builder</h3>
      </div>

      <Card className="border-purple-200 bg-purple-50 dark:bg-purple-950 dark:border-purple-800">
        <CardHeader>
          <CardTitle className="text-purple-800 dark:text-purple-200">📊 Custom Chart Builder</CardTitle>
          <CardDescription className="text-purple-700 dark:text-purple-300">
            Create custom visualizations by selecting your preferred data columns. This tool automatically generates
            multiple chart types and insights to help you understand your data better.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Chart Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Chart Configuration</CardTitle>
          <CardDescription>Select data columns to generate multiple charts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">X-Axis Column</label>
              <Select value={xColumn} onValueChange={setXColumn}>
                <SelectTrigger>
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableColumns("x").map((col) => (
                    <SelectItem key={col} value={col}>
                      {col}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Y-Axis Column (for Bar, Line, Scatter, Area)</label>
              <Select value={yColumn} onValueChange={setYColumn}>
                <SelectTrigger>
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableColumns("y").map((col) => (
                    <SelectItem key={col} value={col}>
                      {col}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Group By (Optional)</label>
              <Select value={groupBy} onValueChange={setGroupBy}>
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {categoricalColumns.map((col) => (
                    <SelectItem key={col} value={col}>
                      {col}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Debug: Data rows: {data.length} | Columns: {columns.length} | Numeric: {numericColumns.length}
              <br />
              Selected: X="{xColumn}" Y="{yColumn}"
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleGenerateChartsAndReport}
                disabled={!xColumn || (!yColumn && !categoricalColumns.includes(xColumn)) || isGeneratingReport}
              >
                {isGeneratingReport ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mr-1"></div>
                ) : (
                  <RefreshCw className="h-4 w-4 mr-1" />
                )}
                {isGeneratingReport ? "Generating Report..." : "Generate All Charts & Report"}
              </Button>
              <Button variant="outline">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">More options</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generated Charts Section */}
      {generatedCharts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {generatedCharts.map((chartConfig, index) => (
            <Card key={index}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{chartConfig.label}</CardTitle>
                <CardDescription className="text-sm">
                  {chartConfig.type === "pie"
                    ? `Distribution of ${chartConfig.xColumn}`
                    : `${chartConfig.yColumn} by ${chartConfig.xColumn}`}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="mb-3 flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs">
                    {chartConfig.data.length} data points
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {chartConfig.type} chart
                  </Badge>
                  {chartConfig.groupBy && (
                    <Badge variant="outline" className="text-xs">
                      Grouped by {chartConfig.groupBy}
                    </Badge>
                  )}
                </div>

                {renderSingleChart(chartConfig, index)}

                <div className="flex justify-end mt-4">
                  <Button variant="outline" size="sm" onClick={() => downloadChart(chartConfig)}>
                    <Download className="h-3 w-3 mr-1" />
                    Export
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Centralized AI Insights Report Section */}
      {aiReport && (
        <Card className="mt-6 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
              <Lightbulb className="h-5 w-5" />
              Comprehensive AI Business Report
            </CardTitle>
            <CardDescription className="text-blue-700 dark:text-blue-300">
              Here's a detailed business report generated by AI based on your charts.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <ReactMarkdown
              className="prose prose-sm max-w-none"
              remarkPlugins={[remarkGfm]}
              components={MarkdownComponents}
            >
              {aiReport}
            </ReactMarkdown>
            <div className="flex justify-center mt-4">
              <Button onClick={() => setShowChat(!showChat)} className="gap-2">
                <MessageSquareText className="h-4 w-4" />
                {showChat ? "Hide Chat" : "Ask Follow-up Questions"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chat Interface (conditionally rendered) */}
      {showChat && aiReport && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Chat with AI</CardTitle>
            <CardDescription>Ask specific questions about the report or your data.</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="border rounded-lg mb-4">
              <ScrollArea className="h-[300px] p-4">
                {chatMessages.length > 0 ? (
                  <div className="space-y-4">
                    {chatMessages.map((message, index) => (
                      <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`flex items-start gap-2 max-w-[80%] ${
                            message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                          } p-3 rounded-lg`}
                        >
                          {message.role === "assistant" && <Bot className="h-5 w-5 mt-0.5 flex-shrink-0" />}
                          <div>
                            <ReactMarkdown
                              className="prose prose-sm max-w-none"
                              remarkPlugins={[remarkGfm]}
                              components={MarkdownComponents}
                            >
                              {message.content}
                            </ReactMarkdown>
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
            <Button
              variant="outline"
              onClick={handleClearChat}
              className="w-full mt-4 gap-2 text-sm text-muted-foreground bg-transparent"
            >
              <Eraser className="h-4 w-4" /> Clear Chat
            </Button>
          </CardContent>
        </Card>
      )}

      {generatedCharts.length === 0 && xColumn && (yColumn || categoricalColumns.includes(xColumn)) && (
        <Alert>
          <AlertDescription>
            No data available for the selected configuration or no valid charts could be generated. Please check your
            column selections and data.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
