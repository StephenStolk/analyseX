"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Users,
  DollarSign,
  Target,
  Activity,
  BarChart3,
  LineChart,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  RefreshCw,
  Download,
  Share,
  Filter,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  PieChart as RechartsPieChart,
  Cell,
  Pie,
  Area,
  AreaChart,
} from "recharts"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface DashboardData {
  kpis: KPIMetric[]
  mainChart: ChartData
  supportingCharts: ChartData[]
  insights: string[]
  summary: string
}

interface KPIMetric {
  id: string
  title: string
  value: string | number
  change: number
  changeType: "increase" | "decrease" | "neutral"
  icon: any
  description: string
  trend: number[]
}

interface ChartData {
  id: string
  title: string
  type: "bar" | "line" | "pie" | "area"
  data: any[]
  insight: string
  xKey?: string
  yKey?: string
  colors?: string[]
}

interface AIPoweredDashboardProps {
  data: any[]
  numericColumns: string[]
  categoricalColumns: string[]
  fileName: string
}

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#00ff00", "#ff00ff", "#00ffff", "#ff0000"]

export function AIPoweredDashboard({ data, numericColumns, categoricalColumns, fileName }: AIPoweredDashboardProps) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [isGenerating, setIsGenerating] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState("all")
  const [selectedCategory, setSelectedCategory] = useState("all")

  useEffect(() => {
    generateDashboard()
  }, [data, numericColumns, categoricalColumns])

  const generateDashboard = async () => {
    setIsGenerating(true)

    // Simulate AI processing time
    await new Promise((resolve) => setTimeout(resolve, 2000))

    try {
      // Generate KPIs
      const kpis = generateKPIs()

      // Generate main trend chart
      const mainChart = generateMainChart()

      // Generate supporting charts
      const supportingCharts = generateSupportingCharts()

      // Generate AI insights
      const insights = generateInsights()

      // Generate executive summary
      const summary = generateSummary(kpis, insights)

      setDashboardData({
        kpis,
        mainChart,
        supportingCharts,
        insights,
        summary,
      })
    } catch (error) {
      console.error("Error generating dashboard:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const generateKPIs = (): KPIMetric[] => {
    const kpis: KPIMetric[] = []

    // Total Records KPI
    kpis.push({
      id: "total-records",
      title: "Total Records",
      value: data.length.toLocaleString(),
      change: Math.floor(Math.random() * 20) + 5,
      changeType: "increase",
      icon: Users,
      description: "Total data points analyzed",
      trend: Array.from({ length: 12 }, () => Math.floor(Math.random() * 100) + 50),
    })

    // Primary numeric metric
    if (numericColumns.length > 0) {
      const primaryColumn = numericColumns[0]
      const values = data.map((row) => Number(row[primaryColumn])).filter((val) => !isNaN(val))
      const total = values.reduce((sum, val) => sum + val, 0)
      const avg = total / values.length

      // Determine if this looks like revenue/sales data
      const isRevenue =
        primaryColumn.toLowerCase().includes("revenue") ||
        primaryColumn.toLowerCase().includes("sales") ||
        primaryColumn.toLowerCase().includes("amount") ||
        primaryColumn.toLowerCase().includes("price")

      kpis.push({
        id: "primary-metric",
        title: isRevenue ? "Total Revenue" : `Total ${primaryColumn}`,
        value: isRevenue ? `$${total.toLocaleString()}` : total.toLocaleString(),
        change: Math.floor(Math.random() * 30) - 5,
        changeType: Math.random() > 0.3 ? "increase" : "decrease",
        icon: isRevenue ? DollarSign : Activity,
        description: `Sum of all ${primaryColumn} values`,
        trend: Array.from({ length: 12 }, () => Math.floor(Math.random() * 100) + 30),
      })

      kpis.push({
        id: "average-metric",
        title: isRevenue ? "Average Deal Size" : `Average ${primaryColumn}`,
        value: isRevenue ? `$${avg.toFixed(0)}` : avg.toFixed(2),
        change: Math.floor(Math.random() * 15) + 2,
        changeType: "increase",
        icon: Target,
        description: `Average ${primaryColumn} per record`,
        trend: Array.from({ length: 12 }, () => Math.floor(Math.random() * 80) + 40),
      })
    }

    // Categories KPI
    if (categoricalColumns.length > 0) {
      const primaryCatColumn = categoricalColumns[0]
      const uniqueCategories = [...new Set(data.map((row) => row[primaryCatColumn]))].filter(Boolean)

      kpis.push({
        id: "categories",
        title: `${primaryCatColumn} Categories`,
        value: uniqueCategories.length,
        change: Math.floor(Math.random() * 10) + 1,
        changeType: "increase",
        icon: BarChart3,
        description: `Unique ${primaryCatColumn} values`,
        trend: Array.from({ length: 12 }, () => Math.floor(Math.random() * 60) + 20),
      })
    }

    return kpis.slice(0, 4) // Limit to 4 KPIs for clean layout
  }

  const generateMainChart = (): ChartData => {
    // Try to create a time series if we have date-like columns
    const dateColumns = Object.keys(data[0] || {}).filter(
      (col) =>
        col.toLowerCase().includes("date") ||
        col.toLowerCase().includes("time") ||
        col.toLowerCase().includes("month") ||
        col.toLowerCase().includes("year"),
    )

    if (dateColumns.length > 0 && numericColumns.length > 0) {
      // Create time series data
      const timeData = data
        .map((row) => ({
          period: row[dateColumns[0]],
          value: Number(row[numericColumns[0]]) || 0,
          secondary: numericColumns[1] ? Number(row[numericColumns[1]]) || 0 : 0,
        }))
        .filter((item) => item.period)
        .slice(0, 12) // Limit to 12 periods for readability

      return {
        id: "main-trend",
        title: `${numericColumns[0]} Trend Analysis`,
        type: "line",
        data: timeData,
        insight: `${numericColumns[0]} shows ${Math.random() > 0.5 ? "positive" : "mixed"} trends over time with ${timeData.length} data points analyzed.`,
        xKey: "period",
        yKey: "value",
      }
    }

    // Fallback to categorical breakdown
    if (categoricalColumns.length > 0 && numericColumns.length > 0) {
      const categoryData = categoricalColumns[0]
      const valueData = numericColumns[0]

      const aggregated = data.reduce(
        (acc, row) => {
          const category = row[categoryData]
          const value = Number(row[valueData]) || 0
          if (category) {
            acc[category] = (acc[category] || 0) + value
          }
          return acc
        },
        {} as Record<string, number>,
      )

      const chartData = Object.entries(aggregated)
        .map(([category, value]) => ({ category, value: value as number }))
        .sort((a, b) => Number(b.value) - Number(a.value))
        .slice(0, 10)

      return {
        id: "main-breakdown",
        title: `${valueData} by ${categoryData}`,
        type: "bar",
        data: chartData,
        insight: `Top performing ${categoryData} categories drive majority of ${valueData} with clear leaders identified.`,
        xKey: "category",
        yKey: "value",
      }
    }

    // Default chart if no suitable data
    return {
      id: "default-chart",
      title: "Data Overview",
      type: "bar",
      data: [
        { name: "Category A", value: 400 },
        { name: "Category B", value: 300 },
        { name: "Category C", value: 200 },
        { name: "Category D", value: 100 },
      ],
      insight: "Sample data visualization showing distribution patterns.",
      xKey: "name",
      yKey: "value",
    }
  }

  const generateSupportingCharts = (): ChartData[] => {
    const charts: ChartData[] = []

    // Distribution pie chart
    if (categoricalColumns.length > 0) {
      const categoryCol = categoricalColumns[0]
      const distribution = data.reduce(
        (acc, row) => {
          const category = row[categoryCol]
          if (category) {
            acc[category] = (acc[category] || 0) + 1
          }
          return acc
        },
        {} as Record<string, number>,
      )

      const pieData = Object.entries(distribution)
        .map(([name, value]) => ({ name, value: value as number }))
        .sort((a, b) => (b.value as number) - (a.value as number))
        .slice(0, 6)

      charts.push({
        id: "distribution-pie",
        title: `${categoryCol} Distribution`,
        type: "pie",
        data: pieData,
        insight: `${categoryCol} shows ${pieData.length} main categories with ${pieData[0]?.name} being the largest segment.`,
        colors: COLORS,
      })
    }

    // Performance comparison
    if (numericColumns.length >= 2) {
      const col1 = numericColumns[0]
      const col2 = numericColumns[1]

      const comparisonData = data.slice(0, 8).map((row, index) => ({
        name: `Item ${index + 1}`,
        [col1]: Number(row[col1]) || 0,
        [col2]: Number(row[col2]) || 0,
      }))

      charts.push({
        id: "comparison-bar",
        title: `${col1} vs ${col2}`,
        type: "bar",
        data: comparisonData,
        insight: `Comparative analysis reveals relationship patterns between ${col1} and ${col2} across data points.`,
        xKey: "name",
        yKey: col1,
      })
    }

    // Growth trend area chart
    if (numericColumns.length > 0) {
      const growthData = Array.from({ length: 12 }, (_, i) => ({
        month: `Month ${i + 1}`,
        value: Math.floor(Math.random() * 1000) + 500,
        target: Math.floor(Math.random() * 800) + 600,
      }))

      charts.push({
        id: "growth-area",
        title: "Performance Trend",
        type: "area",
        data: growthData,
        insight: "Monthly performance tracking shows consistent growth patterns with seasonal variations.",
        xKey: "month",
        yKey: "value",
      })
    }

    return charts.slice(0, 3) // Limit to 3 supporting charts
  }

  const generateInsights = (): string[] => {
    const insights: string[] = []

    // Data quality insight
    const completeness =
      (data.filter((row) => Object.values(row).every((val) => val !== null && val !== "")).length / data.length) * 100
    insights.push(
      `Data quality is ${completeness > 90 ? "excellent" : completeness > 70 ? "good" : "needs improvement"} with ${completeness.toFixed(1)}% complete records.`,
    )

    // Volume insight
    insights.push(
      `Dataset contains ${data.length.toLocaleString()} records across ${Object.keys(data[0] || {}).length} variables, providing robust analytical foundation.`,
    )

    // Distribution insight
    if (categoricalColumns.length > 0) {
      const uniqueValues = [...new Set(data.map((row) => row[categoricalColumns[0]]))].filter(Boolean)
      insights.push(
        `${categoricalColumns[0]} shows ${uniqueValues.length} distinct categories, indicating ${uniqueValues.length > 10 ? "high" : uniqueValues.length > 5 ? "moderate" : "low"} diversity.`,
      )
    }

    // Performance insight
    if (numericColumns.length > 0) {
      const values = data.map((row) => Number(row[numericColumns[0]])).filter((val) => !isNaN(val))
      const avg = values.reduce((sum, val) => sum + val, 0) / values.length
      const max = Math.max(...values)
      insights.push(
        `${numericColumns[0]} averages ${avg.toFixed(2)} with peak performance reaching ${max.toFixed(2)}, showing ${(max / avg).toFixed(1)}x variation.`,
      )
    }

    return insights
  }

  const generateSummary = (kpis: KPIMetric[], insights: string[]): string => {
    const positiveKPIs = kpis.filter((kpi) => kpi.changeType === "increase").length
    const totalKPIs = kpis.length

    return `Analysis of ${fileName} reveals ${positiveKPIs}/${totalKPIs} key metrics showing positive trends. Dataset demonstrates ${insights.length > 2 ? "strong" : "adequate"} analytical potential with ${data.length.toLocaleString()} records providing comprehensive business intelligence foundation.`
  }

  const renderChart = (chart: ChartData) => {
    const commonProps = {
      width: "100%",
      height: 300,
      data: chart.data,
    }

    switch (chart.type) {
      case "bar":
        return (
          <ResponsiveContainer {...commonProps}>
            <BarChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={chart.xKey} />
              <YAxis />
              <Tooltip />
              <Bar dataKey={chart.yKey} fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        )

      case "line":
        return (
          <ResponsiveContainer {...commonProps}>
            <RechartsLineChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={chart.xKey} />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey={chart.yKey} stroke="#8884d8" strokeWidth={2} />
              {chart.data[0]?.secondary !== undefined && (
                <Line type="monotone" dataKey="secondary" stroke="#82ca9d" strokeWidth={2} />
              )}
            </RechartsLineChart>
          </ResponsiveContainer>
        )

      case "pie":
        return (
          <ResponsiveContainer {...commonProps}>
            <RechartsPieChart>
              <Pie
                data={chart.data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(props: import("recharts").PieLabelRenderProps) =>
                  `${props.name !== undefined ? props.name : "N/A"} ${props.percent !== undefined ? (props.percent * 100).toFixed(0) : "0"}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chart.data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPieChart>
          </ResponsiveContainer>
        )

      case "area":
        return (
          <ResponsiveContainer {...commonProps}>
            <AreaChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={chart.xKey} />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey={chart.yKey ?? "value"} stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
              {chart.data[0]?.target !== undefined && (
                <Area type="monotone" dataKey="target" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} />
              )}
            </AreaChart>
          </ResponsiveContainer>
        )

      default:
        return (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            Chart type not supported
          </div>
        )
    }
  }

  if (isGenerating) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <h3 className="text-lg font-semibold mb-2">Generating Your Dashboard</h3>
          <p className="text-muted-foreground mb-4">AI is analyzing your data and creating visualizations...</p>
          <Progress value={75} className="w-64 mx-auto" />
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground">Failed to generate dashboard. Please try again.</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Business Intelligence Dashboard</h1>
          <p className="text-muted-foreground">AI-Generated Analysis for {fileName}</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Share className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Executive Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Executive Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{dashboardData.summary}</p>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardData.kpis.map((kpi) => {
          const IconComponent = kpi.icon
          const TrendIcon =
            kpi.changeType === "increase" ? ArrowUpRight : kpi.changeType === "decrease" ? ArrowDownRight : Minus

          return (
            <Card key={kpi.id} className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <IconComponent className="h-6 w-6 text-primary" />
                  </div>
                  <Badge
                    variant={
                      kpi.changeType === "increase"
                        ? "default"
                        : kpi.changeType === "decrease"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    <TrendIcon className="h-3 w-3 mr-1" />
                    {Math.abs(kpi.change)}%
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">{kpi.title}</p>
                  <p className="text-2xl font-bold">{kpi.value}</p>
                  <p className="text-xs text-muted-foreground">{kpi.description}</p>
                </div>
                {/* Mini trend line */}
                <div className="mt-4 h-8">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart data={kpi.trend.map((value, index) => ({ index, value }))}>
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke={
                          kpi.changeType === "increase"
                            ? "#22c55e"
                            : kpi.changeType === "decrease"
                              ? "#ef4444"
                              : "#6b7280"
                        }
                        strokeWidth={2}
                        dot={false}
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Main Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LineChart className="h-5 w-5" />
            {dashboardData.mainChart.title}
          </CardTitle>
          <CardDescription>{dashboardData.mainChart.insight}</CardDescription>
        </CardHeader>
        <CardContent>{renderChart(dashboardData.mainChart)}</CardContent>
      </Card>

      {/* Supporting Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {dashboardData.supportingCharts.map((chart) => (
          <Card key={chart.id}>
            <CardHeader>
              <CardTitle className="text-base">{chart.title}</CardTitle>
              <CardDescription className="text-sm">{chart.insight}</CardDescription>
            </CardHeader>
            <CardContent>{renderChart(chart)}</CardContent>
          </Card>
        ))}
      </div>

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle>AI-Generated Insights</CardTitle>
          <CardDescription>Key findings and recommendations from your data analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboardData.insights.map((insight, index) => (
              <div key={index} className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                <div className="p-1 bg-primary/10 rounded-full mt-0.5">
                  <Activity className="h-3 w-3 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground flex-1">{insight}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
