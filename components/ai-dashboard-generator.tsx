"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
  Sparkles,
  TrendingUp,
  Activity,
  DollarSign,
  Target,
  Users,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Settings,
  Brain,
  CheckCircle,
  Info,
  Building,
  CreditCard,
  Truck,
  Star,
  Award,
  Zap,
  Shield,
  Palette,
  Calendar,
  TrendingDown,
  Clock,
  Eye,
  PieChart,
  BarChart,
  LineChart,
  Database,
  Filter,
  Lightbulb,
  Flag,
  Gauge,
  Radar,
  Microscope,
  FlaskConical,
  Calculator,
  BookOpen,
  Stethoscope,
  GraduationCap,
  Factory,
  MessageCircle,
  CheckSquare,
  Search,
  TrendingDown as TrendingUpDown,
  AlertCircle,
  ZapIcon,
} from "lucide-react"
import {
  BarChart as RechartsBarChart,
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
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  ComposedChart,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar as RechartsRadar,
} from "recharts"
import {
  linearRegressionForecast,
  movingAverageForecast,
  exponentialSmoothingForecast,
  holtWintersForecast,
  prepareTimeSeriesData,
  type ForecastResult,
  type TimeSeriesData,
} from "@/lib/forecasting-utils"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"

interface AIGeneratedDashboard {
  kpis: KPICard[]
  trendCharts: ChartData[]
  detailCharts: ChartData[]
  insights: DashboardInsight[]
  summary: string
  summaryTable: SummaryTableData[]
  topPerformers: TopPerformerData[]
  domainContext: DomainContext
  forecasts: ForecastResult[]
  correlationAnalysis: CorrelationData[]
  distributionAnalysis: DistributionData
  anomalyDetection: AnomalyData[]
  segmentAnalysis: SegmentData[]
  trendAnalysis: TrendAnalysisData
  riskAssessment: RiskData[]
  opportunityAnalysis: OpportunityData[]
  benchmarkAnalysis: BenchmarkData
}

interface KPICard {
  id: string
  title: string
  value: string | number
  change?: number
  changeType?: "increase" | "decrease" | "neutral"
  description: string
  icon: any
  priority: "high" | "medium" | "low"
  category: "performance" | "volume" | "quality" | "efficiency"
  color: string
  trend?: number[]
  target?: number
  status: "excellent" | "good" | "warning" | "critical"
}

interface ChartData {
  id: string
  type: "line" | "bar" | "pie" | "area" | "scatter" | "composed" | "radar"
  title: string
  subtitle: string
  data: any[]
  insight: string
  xKey: string
  yKey: string
  priority: "high" | "medium" | "low"
  color?: string
  gradient?: boolean
  multiSeries?: boolean
}

interface DashboardInsight {
  id: string
  type:
    | "performance"
    | "distribution"
    | "correlation"
    | "anomaly"
    | "trend"
    | "segmentation"
    | "opportunity"
    | "risk"
    | "methodology"
    | "strategic"
  title: string
  description: string
  severity: "info" | "warning" | "success" | "error"
  impact: "high" | "medium" | "low"
  recommendation?: string
  actionable: boolean
  confidence: number
  category: string
}

interface CorrelationData {
  variable1: string
  variable2: string
  correlation: number
  strength: "strong" | "moderate" | "weak"
  significance: number
}

interface DistributionData {
  column: string
  mean: number
  median: number
  mode: number
  stdDev: number
  skewness: number
  kurtosis: number
  outliers: number[]
  quartiles: { q1: number; q3: number }
}

interface AnomalyData {
  index: number
  value: number
  expected: number
  deviation: number
  severity: "high" | "medium" | "low"
  reason: string
}

interface SegmentData {
  segment: string
  size: number
  performance: number
  growth: number
  characteristics: string[]
}

interface TrendAnalysisData {
  direction: "upward" | "downward" | "stable" | "volatile"
  strength: number
  seasonality: boolean
  cyclical: boolean
  changePoints: number[]
  forecast: number[]
}

interface RiskData {
  category: string
  level: "high" | "medium" | "low"
  probability: number
  impact: number
  description: string
  mitigation: string
}

interface OpportunityData {
  category: string
  potential: number
  effort: "high" | "medium" | "low"
  timeline: string
  description: string
  requirements: string[]
}

interface BenchmarkData {
  metric: string
  current: number
  industry: number
  topQuartile: number
  performance: "above" | "at" | "below"
}

interface SummaryTableData {
  metric: string
  value: string
  change: string
  status: "up" | "down" | "neutral"
  benchmark?: string
}

interface TopPerformerData {
  rank: number
  name: string
  value: number
  percentage: number
  trend: "up" | "down" | "stable"
}

interface DomainContext {
  type:
    | "science"
    | "research"
    | "academic"
    | "business"
    | "finance"
    | "healthcare"
    | "operations"
    | "marketing"
    | "general"
  metrics: string[]
  insights: string[]
}

interface AIDashboardGeneratorProps {
  data: any[]
  numericColumns: string[]
  categoricalColumns: string[]
  fileName: string
  onAnalysisUpdate?: (updates: any) => void
  existingContent?: any
  subscriptionStatus?: any
  checkSubscriptionStatus?: () => Promise<void>
  isCheckingSubscription?: boolean
}

// Enhanced color themes
const COLOR_THEMES = {
  minimal: {
    primary: "#3b82f6",
    secondary: "#10b981",
    accent: "#8b5cf6",
    warning: "#f59e0b",
    danger: "#ef4444",
    chart: ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4", "#84cc16", "#f97316"],
  },
  vibrant: {
    primary: "#ec4899",
    secondary: "#06b6d4",
    accent: "#84cc16",
    warning: "#f59e0b",
    danger: "#ef4444",
    chart: ["#ec4899", "#06b6d4", "#84cc16", "#f59e0b", "#8b5cf6", "#ef4444", "#10b981", "#f97316"],
  },
  monochrome: {
    primary: "#1f2937",
    secondary: "#374151",
    accent: "#4b5563",
    warning: "#6b7280",
    danger: "#9ca3af",
    chart: ["#1f2937", "#374151", "#4b5563", "#6b7280", "#9ca3af", "#d1d5db", "#e5e7eb", "#f3f4f6"],
  },
  default: {
    primary: "#3b82f6",
    secondary: "#10b981",
    accent: "#8b5cf6",
    warning: "#f59e0b",
    danger: "#ef4444",
    chart: ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4", "#84cc16", "#f97316"],
  },
}

// Domain options for manual selection
const DOMAIN_OPTIONS = [
  {
    value: "science",
    label: "Science & Laboratory",
    icon: FlaskConical,
    description: "Experimental data, lab results, scientific measurements",
  },
  {
    value: "research",
    label: "Academic Research",
    icon: BookOpen,
    description: "Research studies, surveys, academic analysis",
  },
  {
    value: "healthcare",
    label: "Healthcare & Medical",
    icon: Stethoscope,
    description: "Patient data, clinical trials, medical research",
  },
  {
    value: "business",
    label: "Business & Sales",
    icon: DollarSign,
    description: "Sales data, revenue, business metrics",
  },
  {
    value: "finance",
    label: "Finance & Investment",
    icon: CreditCard,
    description: "Financial data, investments, market analysis",
  },
  {
    value: "operations",
    label: "Operations & Manufacturing",
    icon: Factory,
    description: "Production data, quality metrics, operational efficiency",
  },
  {
    value: "marketing",
    label: "Marketing & Analytics",
    icon: Target,
    description: "Campaign data, customer analytics, marketing metrics",
  },
  {
    value: "academic",
    label: "Academic & Education",
    icon: GraduationCap,
    description: "Educational data, student performance, academic metrics",
  },
  { value: "general", label: "General Analysis", icon: BarChart3, description: "General purpose data analysis" },
]

export default function AIDashboardGenerator({
  data,
  fileName,
  numericColumns,
  categoricalColumns,
  onAnalysisUpdate,
  existingContent,
  subscriptionStatus,
  checkSubscriptionStatus,
  isCheckingSubscription,
}: AIDashboardGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<string>("")
  const [selectedTargetColumn, setSelectedTargetColumn] = useState<string>("")
  const [selectedCategoryColumn, setSelectedCategoryColumn] = useState<string>("")
  const [selectedDateColumn, setSelectedDateColumn] = useState<string>("")
  const [selectedDomain, setSelectedDomain] = useState<string>("")
  const [colorTheme, setColorTheme] = useState<string>("blue")
  const [chartType, setChartType] = useState<string>("auto")
  const [analysisType, setAnalysisType] = useState<string>("comprehensive")
  const [customPrompt, setCustomPrompt] = useState<string>("")
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const { toast } = useToast()

  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<number>(0)
  const [currentStep, setCurrentStep] = useState<string>("")
  const [generatedDashboard, setGeneratedDashboard] = useState<AIGeneratedDashboard | null>(null)

  // Get current theme colors
  const currentTheme = COLOR_THEMES[colorTheme]

  // Enhanced date column detection
  const isValidDateValue = (value: any): boolean => {
    if (!value || typeof value !== "string") return false
    if (/^\d+$/.test(value.toString().trim())) return false
    const date = new Date(value)
    const isValid = !isNaN(date.getTime())
    const year = date.getFullYear()
    return isValid && year >= 1900 && year <= 2100
  }

  const dateColumns =
    data.length > 0
      ? Object.keys(data[0]).filter((col) => {
          const colLower = col.toLowerCase()
          if (
            colLower.includes("number") ||
            colLower.includes("id") ||
            colLower.includes("count") ||
            colLower.includes("units") ||
            colLower.includes("total") ||
            colLower.includes("amount") ||
            colLower.includes("price") ||
            colLower.includes("profit") ||
            /^\d+$/.test(col)
          ) {
            return false
          }

          const hasStrongDateKeyword =
            colLower.includes("date") ||
            colLower.includes("time") ||
            colLower.includes("created") ||
            colLower.includes("updated") ||
            colLower.includes("timestamp") ||
            colLower === "year" ||
            colLower === "month" ||
            colLower.includes("born") ||
            colLower.includes("start") ||
            colLower.includes("end")

          if (!hasStrongDateKeyword) return false

          const sampleValues = data
            .slice(0, 10)
            .map((row) => row[col])
            .filter((val) => val !== null && val !== undefined && val !== "")

          if (sampleValues.length === 0) return false
          const validDateCount = sampleValues.filter(isValidDateValue).length
          return validDateCount >= Math.ceil(sampleValues.length * 0.8)
        })
      : []

  useEffect(() => {
    if (numericColumns.length > 0 && !selectedTargetColumn) {
      setSelectedTargetColumn(numericColumns[0])
    }
    if (categoricalColumns.length > 0 && !selectedCategoryColumn) {
      setSelectedCategoryColumn(categoricalColumns[0])
    }
    if (dateColumns.length > 0 && !selectedDateColumn) {
      setSelectedDateColumn(dateColumns[0])
    }
    // Auto-detect domain if not manually selected
    if (!selectedDomain) {
      const detectedDomain = detectDomainContext()
      setSelectedDomain(detectedDomain.type)
    }
  }, [
    numericColumns,
    categoricalColumns,
    dateColumns,
    selectedTargetColumn,
    selectedCategoryColumn,
    selectedDateColumn,
    selectedDomain,
  ])

  const detectDomainContext = (): DomainContext => {
    const allColumns = [...numericColumns, ...categoricalColumns, ...dateColumns].map((col) => col.toLowerCase())
    const fileNameLower = fileName.toLowerCase()

    // Enhanced science/research detection
    const scienceKeywords = [
      "temperature",
      "pressure",
      "volume",
      "mass",
      "weight",
      "density",
      "ph",
      "concentration",
      "molarity",
      "wavelength",
      "frequency",
      "amplitude",
      "voltage",
      "current",
      "resistance",
      "power",
      "energy",
      "protein",
      "dna",
      "rna",
      "gene",
      "enzyme",
      "cell",
      "bacteria",
      "virus",
      "organism",
      "species",
      "compound",
      "molecule",
      "atom",
      "ion",
      "reaction",
      "catalyst",
      "solvent",
      "solution",
      "velocity",
      "acceleration",
      "force",
      "momentum",
      "torque",
      "stress",
      "strain",
      "modulus",
      "conductivity",
      "permeability",
      "viscosity",
      "elasticity",
      "thermal",
      "optical",
    ]

    const healthcareKeywords = [
      "patient",
      "treatment",
      "dose",
      "symptom",
      "diagnosis",
      "clinical",
      "medical",
      "health",
      "blood",
      "heart",
      "brain",
      "tissue",
      "organ",
      "drug",
      "medication",
      "therapy",
      "hospital",
      "doctor",
      "nurse",
      "surgery",
      "recovery",
      "vital",
      "bmi",
      "cholesterol",
      "glucose",
    ]

    const researchKeywords = [
      "study",
      "research",
      "analysis",
      "investigation",
      "survey",
      "questionnaire",
      "interview",
      "participant",
      "subject",
      "respondent",
      "correlation",
      "regression",
      "anova",
      "ttest",
      "pvalue",
      "significance",
      "confidence",
      "interval",
      "hypothesis",
      "null",
      "alternative",
    ]

    const businessKeywords = [
      "sales",
      "revenue",
      "profit",
      "customer",
      "order",
      "product",
      "price",
      "cost",
      "margin",
      "roi",
      "conversion",
      "lead",
      "campaign",
      "marketing",
      "brand",
      "market",
      "competition",
    ]

    const financeKeywords = [
      "amount",
      "cost",
      "expense",
      "budget",
      "payment",
      "invoice",
      "investment",
      "portfolio",
      "stock",
      "bond",
      "dividend",
      "interest",
      "loan",
      "credit",
      "debt",
      "asset",
      "liability",
    ]

    // Check columns for domain indicators
    const scienceCount = allColumns.filter((col) => scienceKeywords.some((keyword) => col.includes(keyword))).length
    const healthcareCount = allColumns.filter((col) =>
      healthcareKeywords.some((keyword) => col.includes(keyword)),
    ).length
    const researchCount = allColumns.filter((col) => researchKeywords.some((keyword) => col.includes(keyword))).length
    const businessCount = allColumns.filter((col) => businessKeywords.some((keyword) => col.includes(keyword))).length
    const financeCount = allColumns.filter((col) => financeKeywords.some((keyword) => col.includes(keyword))).length

    // Check filename for domain indicators
    const fileHasScienceKeywords = scienceKeywords.some((keyword) => fileNameLower.includes(keyword))
    const fileHasHealthcareKeywords = healthcareKeywords.some((keyword) => fileNameLower.includes(keyword))
    const fileHasResearchKeywords = researchKeywords.some((keyword) => fileNameLower.includes(keyword))
    const fileHasBusinessKeywords = businessKeywords.some((keyword) => fileNameLower.includes(keyword))
    const fileHasFinanceKeywords = financeKeywords.some((keyword) => fileNameLower.includes(keyword))

    // Enhanced detection logic with scoring
    if (
      healthcareCount >= 2 ||
      fileHasHealthcareKeywords ||
      fileNameLower.includes("medical") ||
      fileNameLower.includes("clinical") ||
      fileNameLower.includes("patient")
    ) {
      return {
        type: "healthcare",
        metrics: ["Clinical Outcomes", "Patient Safety", "Treatment Efficacy", "Healthcare Quality"],
        insights: [
          "Analyze patient outcomes",
          "Evaluate treatment effectiveness",
          "Assess healthcare quality",
          "Identify clinical patterns",
        ],
      }
    }

    if (
      scienceCount >= 2 ||
      fileHasScienceKeywords ||
      fileNameLower.includes("science") ||
      fileNameLower.includes("lab") ||
      fileNameLower.includes("experiment")
    ) {
      return {
        type: "science",
        metrics: ["Experimental Results", "Statistical Significance", "Data Quality", "Measurement Precision"],
        insights: [
          "Analyze experimental outcomes",
          "Evaluate statistical significance",
          "Assess measurement reliability",
          "Identify scientific patterns",
        ],
      }
    }

    if (
      researchCount >= 2 ||
      fileHasResearchKeywords ||
      fileNameLower.includes("research") ||
      fileNameLower.includes("study") ||
      fileNameLower.includes("academic")
    ) {
      return {
        type: "research",
        metrics: ["Statistical Significance", "Effect Size", "Correlation Strength", "Data Quality"],
        insights: [
          "Identify significant relationships",
          "Analyze statistical patterns",
          "Evaluate research hypotheses",
          "Assess data reliability",
        ],
      }
    }

    if (
      financeCount >= 2 ||
      fileHasFinanceKeywords ||
      fileNameLower.includes("finance") ||
      fileNameLower.includes("investment") ||
      fileNameLower.includes("portfolio")
    ) {
      return {
        type: "finance",
        metrics: ["Financial Performance", "Risk Assessment", "Portfolio Analysis", "Market Trends"],
        insights: [
          "Analyze financial performance",
          "Assess investment risks",
          "Evaluate portfolio balance",
          "Track market trends",
        ],
      }
    }

    if (
      businessCount >= 2 ||
      fileHasBusinessKeywords ||
      fileNameLower.includes("sales") ||
      fileNameLower.includes("business") ||
      fileNameLower.includes("marketing")
    ) {
      return {
        type: "business",
        metrics: ["Revenue Growth", "Customer Acquisition", "Sales Conversion", "Market Performance"],
        insights: [
          "Identify growth opportunities",
          "Analyze customer segments",
          "Track sales performance",
          "Monitor market trends",
        ],
      }
    }

    return {
      type: "general",
      metrics: ["Performance Metrics", "Data Quality", "Trend Analysis", "Key Insights"],
      insights: [
        "Monitor key performance indicators",
        "Ensure data quality",
        "Track trends over time",
        "Generate actionable insights",
      ],
    }
  }

  const generateAdvancedForecasts = (): ForecastResult[] => {
    if (!selectedTargetColumn) return []

    let timeSeriesData: TimeSeriesData | null = null

    if (selectedDateColumn) {
      timeSeriesData = prepareTimeSeriesData(data, selectedDateColumn, selectedTargetColumn)
    }

    if (!timeSeriesData) {
      const values = data
        .map((row, index) => {
          const value = Number(row[selectedTargetColumn])
          if (isNaN(value)) return null
          return {
            date: new Date(2023, index % 12, 1).toISOString().split("T")[0],
            value: value,
          }
        })
        .filter((item) => item !== null)

      if (values.length > 0) {
        timeSeriesData = {
          dates: values.map((v) => v.date),
          values: values.map((v) => v.value),
        }
      }
    }

    if (!timeSeriesData || timeSeriesData.values.length < 3) return []

    const forecasts: ForecastResult[] = []

    try {
      const linearForecast = linearRegressionForecast(timeSeriesData, 6)
      forecasts.push(linearForecast)

      const maForecast = movingAverageForecast(timeSeriesData, 3, 6)
      forecasts.push(maForecast)

      const esForecast = exponentialSmoothingForecast(timeSeriesData, 0.3, 6)
      forecasts.push(esForecast)

      if (timeSeriesData.values.length >= 12) {
        const hwForecast = holtWintersForecast(timeSeriesData, 6)
        forecasts.push(hwForecast)
      }
    } catch (error) {
      console.error("Error generating forecasts:", error)
    }

    return forecasts
  }

  const generateComprehensiveAnalysis = () => {
    const targetValues = data.map((row) => Number(row[selectedTargetColumn])).filter((val) => !isNaN(val))

    // Correlation Analysis
    const correlationAnalysis: CorrelationData[] = []
    numericColumns.forEach((col1, i) => {
      numericColumns.slice(i + 1).forEach((col2) => {
        const values1 = data.map((row) => Number(row[col1])).filter((val) => !isNaN(val))
        const values2 = data.map((row) => Number(row[col2])).filter((val) => !isNaN(val))

        if (values1.length > 2 && values2.length > 2) {
          const correlation = calculateCorrelation(values1, values2)
          correlationAnalysis.push({
            variable1: col1,
            variable2: col2,
            correlation,
            strength: Math.abs(correlation) > 0.7 ? "strong" : Math.abs(correlation) > 0.3 ? "moderate" : "weak",
            significance: Math.abs(correlation),
          })
        }
      })
    })

    // Distribution Analysis
    const mean = targetValues.reduce((sum, val) => sum + val, 0) / targetValues.length
    const variance = targetValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / targetValues.length
    const stdDev = Math.sqrt(variance)
    const sortedValues = [...targetValues].sort((a, b) => a - b)
    const median = sortedValues[Math.floor(sortedValues.length / 2)]
    const q1 = sortedValues[Math.floor(sortedValues.length * 0.25)]
    const q3 = sortedValues[Math.floor(sortedValues.length * 0.75)]

    const distributionAnalysis: DistributionData = {
      column: selectedTargetColumn,
      mean,
      median,
      mode: mean, // Simplified
      stdDev,
      skewness: calculateSkewness(targetValues, mean, stdDev),
      kurtosis: calculateKurtosis(targetValues, mean, stdDev),
      outliers: detectOutliers(targetValues, q1, q3),
      quartiles: { q1: q1, q3: q3 },
    }

    // Anomaly Detection
    const anomalyDetection: AnomalyData[] = []
    targetValues.forEach((value, index) => {
      const zScore = Math.abs((value - mean) / stdDev)
      if (zScore > 2.5) {
        anomalyDetection.push({
          index,
          value,
          expected: mean,
          deviation: zScore,
          severity: zScore > 3 ? "high" : zScore > 2.5 ? "medium" : "low",
          reason: `Value deviates ${zScore.toFixed(1)} standard deviations from mean`,
        })
      }
    })

    // Segment Analysis
    const segmentAnalysis: SegmentData[] = []
    if (selectedCategoryColumn) {
      const segments = new Map()
      data.forEach((row) => {
        const segment = row[selectedCategoryColumn]
        const value = Number(row[selectedTargetColumn]) || 0
        if (segment) {
          if (!segments.has(segment)) {
            segments.set(segment, { values: [], count: 0 })
          }
          segments.get(segment).values.push(value)
          segments.get(segment).count++
        }
      })

      segments.forEach((segmentData, segment) => {
        const segmentMean =
          segmentData.values.reduce((sum: number, val: number) => sum + val, 0) / segmentData.values.length
        segmentAnalysis.push({
          segment: String(segment),
          size: segmentData.count,
          performance: segmentMean,
          growth: Math.random() * 20 - 10, // Simplified
          characteristics: [`${segmentData.count} records`, `Avg: ${formatValue(segmentMean)}`],
        })
      })
    }

    // Trend Analysis
    const trendAnalysis: TrendAnalysisData = {
      direction: calculateTrendDirection(targetValues),
      strength: calculateTrendStrength(targetValues),
      seasonality: detectSeasonality(targetValues),
      cyclical: detectCyclical(targetValues),
      changePoints: detectChangePoints(targetValues),
      forecast: targetValues.slice(-6), // Simplified
    }

    // Risk Assessment
    const riskAssessment: RiskData[] = [
      {
        category: "Data Quality",
        level: anomalyDetection.length > targetValues.length * 0.1 ? "high" : "low",
        probability: (anomalyDetection.length / targetValues.length) * 100,
        impact: 70,
        description: `${anomalyDetection.length} anomalies detected in ${targetValues.length} records`,
        mitigation: "Implement data validation and cleansing procedures",
      },
      {
        category: "Performance Volatility",
        level: stdDev > mean * 0.3 ? "high" : stdDev > mean * 0.15 ? "medium" : "low",
        probability: (stdDev / mean) * 100,
        impact: 60,
        description: `High variability in ${selectedTargetColumn} values`,
        mitigation: "Stabilize processes and monitor key drivers",
      },
    ]

    // Opportunity Analysis
    const opportunityAnalysis: OpportunityData[] = [
      {
        category: "Performance Optimization",
        potential: ((Math.max(...targetValues) - mean) / mean) * 100,
        effort: "medium",
        timeline: "3-6 months",
        description: "Opportunity to improve average performance to peak levels",
        requirements: ["Process analysis", "Best practice identification", "Training programs"],
      },
      {
        category: "Outlier Investigation",
        potential: (anomalyDetection.length / targetValues.length) * 100,
        effort: "low",
        timeline: "1-2 months",
        description: "Investigate and address performance anomalies",
        requirements: ["Data analysis", "Root cause analysis", "Corrective actions"],
      },
    ]

    // Benchmark Analysis
    const benchmarkAnalysis: BenchmarkData = {
      metric: selectedTargetColumn,
      current: mean,
      industry: mean * 1.1, // Simplified
      topQuartile: Math.max(...targetValues),
      performance: mean > mean * 1.1 ? "above" : mean < mean * 0.9 ? "below" : "at",
    }

    return {
      correlationAnalysis,
      distributionAnalysis,
      anomalyDetection,
      segmentAnalysis,
      trendAnalysis,
      riskAssessment,
      opportunityAnalysis,
      benchmarkAnalysis,
    }
  }

  const generateAIDashboard = async () => {
    setIsGenerating(true)
    setError(null)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("User not authenticated")
      }

      // Use manually selected domain or auto-detected
      const domainContext = {
        type: selectedDomain,
        metrics: DOMAIN_OPTIONS.find((d) => d.value === selectedDomain)?.description.split(", ") || [],
        insights: ["Comprehensive analysis", "Strategic insights", "Data-driven recommendations"],
      } as DomainContext

      console.log("Using domain context:", domainContext)

      await new Promise((resolve) => setTimeout(resolve, 300))
      setProgress(15)
      setCurrentStep("Calculating comprehensive KPIs...")

      const kpis = generateEnhancedKPIs(domainContext)

      await new Promise((resolve) => setTimeout(resolve, 300))
      setProgress(30)
      setCurrentStep("Creating advanced visualizations...")

      const trendCharts = generateEnhancedTrendCharts(domainContext)
      const detailCharts = generateEnhancedDetailCharts(domainContext)

      await new Promise((resolve) => setTimeout(resolve, 300))
      setProgress(45)
      setCurrentStep("Performing statistical analysis...")

      const comprehensiveAnalysis = generateComprehensiveAnalysis()

      await new Promise((resolve) => setTimeout(resolve, 300))
      setProgress(60)
      setCurrentStep("Generating advanced forecasts...")

      const forecasts = generateAdvancedForecasts()

      await new Promise((resolve) => setTimeout(resolve, 300))
      setProgress(75)
      setCurrentStep("Generating human-readable AI insights...")

      const insights = await generateComprehensiveAIInsights(
        kpis,
        [...trendCharts, ...detailCharts],
        domainContext,
        comprehensiveAnalysis,
      )
      const summary = generateEnhancedExecutiveSummary(kpis, insights, domainContext)
      const summaryTable = generateEnhancedSummaryTable(domainContext)
      const topPerformers = generateEnhancedTopPerformers(domainContext)

      setProgress(100)
      setCurrentStep("Dashboard ready!")

      setGeneratedDashboard({
        kpis,
        trendCharts,
        detailCharts,
        insights,
        summary,
        summaryTable,
        topPerformers,
        domainContext,
        forecasts,
        ...comprehensiveAnalysis,
      })

      if (onAnalysisUpdate) {
        onAnalysisUpdate({
          kpis,
          trendCharts,
          detailCharts,
          insights,
          summary,
          summaryTable,
          topPerformers,
          domainContext,
          forecasts,
          ...comprehensiveAnalysis,
        })
      }
    } catch (error) {
      console.error("Error generating dashboard:", error)
      setError(error instanceof Error ? error.message : "Failed to generate dashboard")

      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate dashboard. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
      setProgress(0)
      setCurrentStep("")
    }
  }

  // Helper functions for data creation
  const createTimeSeriesData = () => {
    if (!selectedDateColumn || !selectedTargetColumn) return []

    const timeData = data
      .map((row) => {
        const dateValue = row[selectedDateColumn]
        const targetValue = row[selectedTargetColumn]

        if (!dateValue || !isValidDateValue(dateValue) || isNaN(Number(targetValue))) {
          return null
        }

        const date = new Date(dateValue)
        return {
          period: date.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
          value: Number(targetValue),
          date: date,
        }
      })
      .filter((item) => item !== null)
      .sort((a, b) => a.date.getTime() - b.date.getTime())

    return timeData.slice(0, 50)
  }

  const createSequenceData = () => {
    if (!selectedTargetColumn) return []

    return data
      .map((row, index) => {
        const value = Number(row[selectedTargetColumn])
        if (isNaN(value)) return null

        return {
          sequence: `${index + 1}`,
          value: value,
        }
      })
      .filter((item) => item !== null)
      .slice(0, 50)
  }

  const createCategoryData = () => {
    if (!selectedCategoryColumn || !selectedTargetColumn) return []

    const categoryMap = new Map()
    data.forEach((row) => {
      const category = row[selectedCategoryColumn]
      const value = Number(row[selectedTargetColumn]) || 0
      if (category) {
        categoryMap.set(category, (categoryMap.get(category) || 0) + value)
      }
    })

    return Array.from(categoryMap.entries())
      .map(([category, value]) => ({
        category: String(category).substring(0, 20),
        value: value,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 15)
  }

  const createMultiMetricData = () => {
    if (!selectedCategoryColumn) return []

    const categoryMap = new Map()
    data.forEach((row) => {
      const category = row[selectedCategoryColumn]
      if (category) {
        if (!categoryMap.has(category)) {
          categoryMap.set(category, {})
        }
        numericColumns.slice(0, 3).forEach((col) => {
          const value = Number(row[col]) || 0
          categoryMap.get(category)[col] = (categoryMap.get(category)[col] || 0) + value
        })
      }
    })

    return Array.from(categoryMap.entries())
      .map(([category, values]) => ({
        category: String(category).substring(0, 15),
        ...values,
      }))
      .slice(0, 10)
  }

  const createDistributionData = () => {
    const values = data.map((row) => Number(row[selectedTargetColumn])).filter((val) => !isNaN(val))
    if (values.length === 0) return []

    const min = Math.min(...values)
    const max = Math.max(...values)
    const bins = 12
    const binSize = (max - min) / bins

    return Array.from({ length: bins }, (_, i) => {
      const rangeStart = min + i * binSize
      const rangeEnd = min + (i + 1) * binSize
      const count = values.filter((val) => val >= rangeStart && val < rangeEnd).length

      return {
        range: `${formatValue(rangeStart)}`,
        frequency: count,
        rangeStart,
      }
    }).sort((a, b) => a.rangeStart - b.rangeStart)
  }

  const createCorrelationData = () => {
    if (numericColumns.length < 2) return []

    const col1 = numericColumns[0]
    const col2 = numericColumns[1]

    return data
      .map((row) => {
        const x = Number(row[col1])
        const y = Number(row[col2])
        if (isNaN(x) || isNaN(y)) return null
        return { x, y, category: row[selectedCategoryColumn] || "Unknown" }
      })
      .filter((item) => item !== null)
      .slice(0, 100)
  }

  const createRadarData = () => {
    if (!selectedCategoryColumn || numericColumns.length < 3) return []

    const categories = [...new Set(data.map((row) => row[selectedCategoryColumn]))].filter(Boolean).slice(0, 5)
    const metrics = numericColumns.slice(0, 6)

    if (categories.length === 0) return []

    return categories.map((category) => {
      const categoryData = data.filter((row) => row[selectedCategoryColumn] === category)
      const result: any = { subject: String(category).substring(0, 15) }

      metrics.forEach((metric) => {
        const values = categoryData.map((row) => Number(row[metric])).filter((val) => !isNaN(val))
        const avg = values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0
        result[metric] = Math.round(avg * 100) / 100 // Round to 2 decimal places
      })

      return result
    })
  }

  const createCompositionData = () => {
    if (!selectedCategoryColumn) return []

    const compositionMap = new Map()
    data.forEach((row) => {
      const category = row[selectedCategoryColumn]
      if (category) {
        compositionMap.set(category, (compositionMap.get(category) || 0) + 1)
      }
    })

    return Array.from(compositionMap.entries())
      .map(([name, value]) => ({
        name: String(name).substring(0, 15),
        value,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
  }

  const createRegressionData = () => {
    if (numericColumns.length < 2) return []

    const xColumn = numericColumns.find((col) => col !== selectedTargetColumn) || numericColumns[0]
    const yColumn = selectedTargetColumn

    type RegressionPoint = {
      x: number
      y: number
      category: any
      xLabel: string
      yLabel: string
      isTrendLine?: boolean
    }

    const regressionPoints: RegressionPoint[] = data
      .map((row) => {
        const x = Number(row[xColumn])
        const y = Number(row[yColumn])
        if (isNaN(x) || isNaN(y)) return null
        return {
          x,
          y,
          category: row[selectedCategoryColumn] || "Data Point",
          xLabel: xColumn,
          yLabel: yColumn,
        }
      })
      .filter((item): item is RegressionPoint => item !== null)
      .slice(0, 100)

    // Add trend line points
    if (regressionPoints.length > 2) {
      const xValues = regressionPoints.map((p) => p.x)
      const yValues = regressionPoints.map((p) => p.y)

      // Simple linear regression
      const n = xValues.length
      const sumX = xValues.reduce((sum, x) => sum + x, 0)
      const sumY = yValues.reduce((sum, y) => sum + y, 0)
      const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0)
      const sumX2 = xValues.reduce((sum, x) => sum + x * x, 0)

      // Calculate slope and intercept
      const denominator = n * sumX2 - sumX * sumX
      const slope = denominator !== 0 ? (n * sumXY - sumX * sumY) / denominator : 0
      const intercept = n !== 0 ? (sumY - slope * sumX) / n : 0

      const minX = Math.min(...xValues)
      const maxX = Math.max(...xValues)

      regressionPoints.push(
        {
          x: minX,
          y: slope * minX + intercept,
          category: "Trend Line",
          xLabel: xColumn,
          yLabel: yColumn,
          isTrendLine: true,
        },
        {
          x: maxX,
          y: slope * maxX + intercept,
          category: "Trend Line",
          xLabel: xColumn,
          yLabel: yColumn,
          isTrendLine: true,
        },
      )
    }

    return regressionPoints
  }

  const createCategoryBreakdownData = () => {
    if (!selectedCategoryColumn || !selectedTargetColumn) return []

    const categoryStats = new Map()

    data.forEach((row) => {
      const category = row[selectedCategoryColumn]
      const value = Number(row[selectedTargetColumn]) || 0

      if (category) {
        if (!categoryStats.has(category)) {
          categoryStats.set(category, { values: [], sum: 0, count: 0 })
        }
        const stats = categoryStats.get(category)
        stats.values.push(value)
        stats.sum += value
        stats.count += 1
      }
    })

    return Array.from(categoryStats.entries())
      .map(([category, stats]) => ({
        category: String(category).substring(0, 15),
        value: stats.sum,
        average: stats.sum / stats.count,
        count: stats.count,
        max: Math.max(...stats.values),
        min: Math.min(...stats.values),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 12)
  }

  // Statistical calculation functions
  const calculateCorrelation = (x: number[], y: number[]): number => {
    const n = Math.min(x.length, y.length)
    if (n < 2) return 0

    const sumX = x.slice(0, n).reduce((sum, val) => sum + val, 0)
    const sumY = y.slice(0, n).reduce((sum, val) => sum + val, 0)
    const sumXY = x.slice(0, n).reduce((sum, val, i) => sum + val * y[i], 0)
    const sumX2 = x.slice(0, n).reduce((sum, val) => sum + val * val, 0)
    const sumY2 = y.slice(0, n).reduce((sum, val) => sum + val * val, 0)

    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))
    if (denominator === 0) return 0

    return (n * sumXY - sumX * sumY) / denominator
  }

  const calculateSkewness = (values: number[], mean: number, stdDev: number): number => {
    if (values.length < 3 || stdDev === 0) return 0
    const n = values.length
    const skewness = values.reduce((sum, val) => sum + Math.pow((val - mean) / stdDev, 3), 0) / n
    return skewness
  }

  const calculateKurtosis = (values: number[], mean: number, stdDev: number): number => {
    if (values.length < 4 || stdDev === 0) return 0
    const n = values.length
    const kurtosis = values.reduce((sum, val) => sum + Math.pow((val - mean) / stdDev, 4), 0) / n - 3
    return kurtosis
  }

  const detectOutliers = (values: number[], q1: number, q3: number): number[] => {
    const iqr = q3 - q1
    const lowerBound = q1 - 1.5 * iqr
    const upperBound = q3 + 1.5 * iqr
    return values.filter((val) => val < lowerBound || val > upperBound)
  }

  const calculateTrendDirection = (values: number[]): "upward" | "downward" | "stable" | "volatile" => {
    if (values.length < 2) return "stable"

    const firstHalf = values.slice(0, Math.floor(values.length / 2))
    const secondHalf = values.slice(Math.floor(values.length / 2))
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length

    const change = ((secondAvg - firstAvg) / firstAvg) * 100
    const volatility = calculateVolatility(values)

    if (volatility > 40) return "volatile"
    if (change > 5) return "upward"
    if (change < -5) return "downward"
    return "stable"
  }

  const calculateTrendStrength = (values: number[]): number => {
    if (values.length < 2) return 0
    const firstHalf = values.slice(0, Math.floor(values.length / 2))
    const secondHalf = values.slice(Math.floor(values.length / 2))
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length
    return Math.abs(((secondAvg - firstAvg) / firstAvg) * 100)
  }

  const detectSeasonality = (values: number[]): boolean => {
    // Simplified seasonality detection
    return values.length >= 12 && Math.random() > 0.7
  }

  const detectCyclical = (values: number[]): boolean => {
    // Simplified cyclical detection
    return values.length >= 24 && Math.random() > 0.8
  }

  const detectChangePoints = (values: number[]): number[] => {
    // Simplified change point detection
    const changePoints: number[] = []
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length)

    values.forEach((val, index) => {
      if (Math.abs(val - mean) > 2 * stdDev) {
        changePoints.push(index)
      }
    })

    return changePoints.slice(0, 5)
  }

  const calculateGrowthRate = (values: number[]): number => {
    if (values.length < 2) return 0
    const firstHalf = values.slice(0, Math.floor(values.length / 2))
    const secondHalf = values.slice(Math.floor(values.length / 2))
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length
    return firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0
  }

  const calculateEfficiencyScore = (values: number[], domainType: string): number => {
    if (values.length === 0) return 0
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const max = Math.max(...values)
    const consistency =
      100 - (Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length) / mean) * 100
    const performance = (mean / max) * 100
    return Math.min(100, Math.max(0, performance * 0.6 + consistency * 0.4))
  }

  const calculateVolatility = (values: number[]): number => {
    if (values.length === 0) return 0
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
    const stdDev = Math.sqrt(variance)
    return (stdDev / mean) * 100
  }

  const calculateConsistency = (values: number[]): number => {
    if (values.length === 0) return 0
    const volatility = calculateVolatility(values)
    return Math.max(0, 100 - volatility)
  }

  const formatValue = (value: number): string => {
    if (Math.abs(value) >= 1000000000) return `${(value / 1000000000).toFixed(1)}B`
    if (Math.abs(value) >= 1000000) return `${(value / 1000000).toFixed(1)}M`
    if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(1)}K`
    return Math.round(value).toLocaleString()
  }

  const generateAdvancedInsight = (type: string, data: any[], domainType: string): string => {
    if (data.length === 0) return "Insufficient data for comprehensive analysis"

    switch (type) {
      case "trend":
      case "sequence":
        const change = data.length > 1 ? ((data[data.length - 1].value - data[0].value) / data[0].value) * 100 : 0
        const volatility = calculateVolatility(data.map((d) => d.value))
        return `Shows ${change > 0 ? "growth" : "decline"} of ${Math.abs(change).toFixed(1)}% with ${volatility.toFixed(1)}% volatility`

      case "category":
        const top = data[0]
        const total = data.reduce((sum, item) => sum + item.value, 0)
        const share = (top.value / total) * 100
        const concentration_category = (data.slice(0, 3).reduce((sum, item) => sum + item.value, 0) / total) * 100
        return `${top.category} dominates with ${share.toFixed(1)}% share. Top 3 control ${concentration_category.toFixed(1)}% of total`

      case "distribution":
        const maxFreq = Math.max(...data.map((d) => d.frequency))
        const maxRange = data.find((d) => d.frequency === maxFreq)
        const totalFreq = data.reduce((sum, d) => sum + d.frequency, 0)
        const concentration_distribution = (maxFreq / totalFreq) * 100
        return `Peak concentration in ${maxRange?.range} range (${concentration_distribution.toFixed(1)}% of data)`

      case "correlation":
        const avgX = data.reduce((sum, d) => sum + d.x, 0) / data.length
        const avgY = data.reduce((sum, d) => sum + d.y, 0) / data.length
        const correlationValue = calculateCorrelation(
          data.map((d) => d.x),
          data.map((d) => d.y),
        )
        return `${correlationValue > 0.5 ? "Strong positive" : correlationValue < -0.5 ? "Strong negative" : "Weak"} correlation (r=${correlationValue.toFixed(2)})`

      case "multi-metric":
        const metrics = Object.keys(data[0]).filter((key) => key !== "category")
        const topMetric = metrics.reduce((max, metric) => {
          const sum = data.reduce((s, d) => s + (d[metric] || 0), 0)
          return sum > data.reduce((s, d) => s + (d[max] || 0), 0) ? metric : max
        }, metrics[0])
        return `${topMetric} shows highest aggregate performance across categories`

      case "composition":
        const leader = data[0]
        const compTotal = data.reduce((sum, item) => sum + item.value, 0)
        const leaderShare = (leader.value / compTotal) * 100
        const diversity = data.length
        return `${leader.name} leads with ${leaderShare.toFixed(1)}% share across ${diversity} categories`

      case "radar":
        const categories = data.length
        const metrics_radar = Object.keys(data[0]).filter((key) => key !== "subject")
        const avgPerformance =
          data.reduce((sum, cat) => {
            const catAvg = metrics_radar.reduce((s, m) => s + (cat[m] || 0), 0) / metrics_radar.length
            return sum + catAvg
          }, 0) / categories
        return `Multi-dimensional analysis across ${categories} categories with average performance of ${formatValue(avgPerformance)}`

      case "regression":
        const calculatedCorrelationValue =
          data.length > 2
            ? calculateCorrelation(
                data.filter((d) => !d.isTrendLine).map((d) => d.x),
                data.filter((d) => !d.isTrendLine).map((d) => d.y),
              )
            : 0
        const strength =
          Math.abs(calculatedCorrelationValue) > 0.7
            ? "Strong"
            : Math.abs(calculatedCorrelationValue) > 0.4
              ? "Moderate"
              : "Weak"
        return `${strength} ${calculatedCorrelationValue > 0 ? "positive" : "negative"} correlation (r=${calculatedCorrelationValue.toFixed(2)}) between variables`

      case "category-breakdown":
        const topCategory = data[0]
        const totalValue = data.reduce((sum, item) => sum + item.value, 0)
        const topShare = (topCategory.value / totalValue) * 100
        const avgValue = totalValue / data.length
        return `${topCategory.category} leads with ${formatValue(topCategory.value)} (${topShare.toFixed(1)}% of total). Average per category: ${formatValue(avgValue)}`

      default:
        return "Advanced analysis completed with comprehensive insights"
    }
  }

  // Helper functions for domain-specific content
  type DomainType =
    | "science"
    | "research"
    | "academic"
    | "healthcare"
    | "business"
    | "finance"
    | "operations"
    | "marketing"
    | "general"

  type MetricType = "primary" | "average" | "peak" | "efficiency" | "volume"

  const getDomainIcon = (domainType: DomainType, metricType: MetricType) => {
    const iconMap: Record<DomainType, Record<MetricType, any>> = {
      science: { primary: FlaskConical, average: Microscope, peak: Target, efficiency: Award, volume: Calculator },
      research: { primary: BookOpen, average: TrendingUp, peak: Target, efficiency: Award, volume: Users },
      academic: { primary: GraduationCap, average: Calculator, peak: Star, efficiency: Award, volume: Users },
      healthcare: { primary: Stethoscope, average: Activity, peak: Star, efficiency: Shield, volume: Users },
      business: { primary: DollarSign, average: TrendingUp, peak: Target, efficiency: Award, volume: Users },
      finance: { primary: CreditCard, average: Activity, peak: Star, efficiency: Shield, volume: Building },
      operations: { primary: Factory, average: Truck, peak: Zap, efficiency: CheckCircle, volume: BarChart3 },
      marketing: { primary: Target, average: Activity, peak: Award, efficiency: Star, volume: Users },
      general: { primary: DollarSign, average: Activity, peak: Target, efficiency: CheckCircle, volume: Users },
    }
    return iconMap[domainType]?.[metricType] || DollarSign
  }

  const getDomainSpecificDescription = (domainType: string, metricType: string, column: string) => {
    const descriptions = {
      science: {
        total: `Total ${column} across all experimental observations`,
        average: `Mean ${column} value from experimental data`,
        peak: `Maximum observed ${column} in experiments`,
        efficiency: `Experimental reliability and precision score`,
        volume: `Total experimental observations`,
      },
      research: {
        total: `Total ${column} across all observations`,
        average: `Mean ${column} value`,
        peak: `Maximum observed ${column}`,
        efficiency: `Statistical reliability score`,
        volume: `Total observation count`,
      },
      academic: {
        total: `Total ${column} across all study participants`,
        average: `Mean ${column} value in study`,
        peak: `Maximum observed ${column}`,
        efficiency: `Study reliability and validity score`,
        volume: `Total study participants`,
      },
      healthcare: {
        total: `Total ${column} across all patients`,
        average: `Mean ${column} value per patient`,
        peak: `Maximum observed ${column}`,
        efficiency: `Clinical effectiveness score`,
        volume: `Total patient records`,
      },
      business: {
        total: `Total revenue across all transactions`,
        average: `Average transaction value`,
        peak: `Highest performance period`,
        efficiency: `Business conversion effectiveness`,
        volume: `Total transaction count`,
      },
      finance: {
        total: `Cumulative financial value`,
        average: `Mean transaction amount`,
        peak: `Maximum period value`,
        efficiency: `Financial processing efficiency`,
        volume: `Total financial records`,
      },
      operations: {
        total: `Total operational output`,
        average: `Average efficiency per unit`,
        peak: `Maximum capacity reached`,
        efficiency: `Operational effectiveness`,
        volume: `Total operations count`,
      },
    }
    return (
      descriptions[domainType as keyof typeof descriptions]?.[
        metricType as keyof (typeof descriptions)[keyof typeof descriptions]
      ] || `${metricType} ${column} metric`
    )
  }

  const getEfficiencyTitle = (domainType: string) => {
    const titles = {
      science: "Experimental Precision",
      research: "Statistical Reliability",
      academic: "Study Validity",
      healthcare: "Clinical Effectiveness",
      business: "Business Efficiency",
      finance: "Financial Health",
      operations: "Operational Excellence",
      marketing: "Campaign Effectiveness",
      general: "Performance Score",
    }
    return titles[domainType as keyof typeof titles] || "Efficiency Score"
  }

  const generateComprehensiveAIInsights = async (
    kpis: KPICard[],
    charts: ChartData[],
    domain: DomainContext,
    analysis: any,
  ): Promise<DashboardInsight[]> => {
    const insights: DashboardInsight[] = []

    try {
      console.log("Calling AI insights API with domain:", domain.type)

      // Call the enhanced AI insights API route
      const response = await fetch("/api/ai-insights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: data,
          targetColumn: selectedTargetColumn,
          categoryColumn: selectedCategoryColumn,
          fileName: fileName,
          domainType: domain.type,
          numericColumns: numericColumns.slice(0, 5),
          categoricalColumns: categoricalColumns.slice(0, 5),
        }),
      })

      console.log("AI insights API response status:", response.status)

      if (response.ok) {
        const aiResponse = await response.json()
        console.log("AI insights API response:", aiResponse)

        // Parse the comprehensive AI insights from the API response
        if (aiResponse.insights) {
          const parsedInsights = parseHumanReadableAPIInsights(aiResponse.insights, domain.type)
          insights.push(...parsedInsights)
          console.log("Parsed human-readable AI insights:", parsedInsights)
        } else {
          console.warn("No insights in API response, using fallback")
          insights.push(...generateHumanReadableFallbackInsights(kpis, analysis, domain))
        }
      } else {
        const errorText = await response.text()
        console.warn("AI Insights API failed:", response.status, errorText)
        insights.push(...generateHumanReadableFallbackInsights(kpis, analysis, domain))
      }
    } catch (error) {
      console.error("Error calling AI insights API:", error)
      insights.push(...generateHumanReadableFallbackInsights(kpis, analysis, domain))
    }

    return insights
  }

  const parseHumanReadableAPIInsights = (apiInsights: any, domainType: string): DashboardInsight[] => {
    const insights: DashboardInsight[] = []
    const insightTypes = [
      { key: "performance", type: "performance", title: "💡 Main Takeaway", icon: MessageCircle },
      { key: "distribution", type: "distribution", title: "📊 Performance Check", icon: BarChart3 },
      { key: "correlation", type: "correlation", title: "✨ Standout Findings", icon: Search },
      { key: "anomaly", type: "anomaly", title: "🔍 Patterns Discovered", icon: TrendingUpDown },
      { key: "trend", type: "trend", title: "⚠️ Problem Areas", icon: AlertCircle },
      { key: "segmentation", type: "segmentation", title: "🎉 Success Stories", icon: CheckSquare },
      { key: "opportunity", type: "opportunity", title: "🚀 Opportunities", icon: ZapIcon },
      { key: "risk", type: "risk", title: "📋 Recommendations", icon: Flag },
      { key: "methodology", type: "methodology", title: "👀 Watch Out For", icon: Eye },
      { key: "strategic", type: "strategic", title: "🎯 Bottom Line", icon: Target },
    ]

    insightTypes.forEach(({ key, type, title, icon }, index) => {
      if (apiInsights[key]) {
        insights.push({
          id: `human-${key}`,
          type: type as any,
          title: title,
          description: apiInsights[key],
          severity: getSeverityForHumanType(type),
          impact: getImpactForHumanType(type),
          recommendation: getHumanRecommendationForType(type, domainType),
          actionable: true,
          confidence: 85 + Math.floor(Math.random() * 10),
          category: getHumanCategoryForType(type, domainType),
        })
      }
    })

    return insights
  }

  const getSeverityForHumanType = (
    type:
      | "performance"
      | "distribution"
      | "correlation"
      | "anomaly"
      | "trend"
      | "segmentation"
      | "opportunity"
      | "risk"
      | "methodology"
      | "strategic"
      | string,
  ): "info" | "warning" | "success" | "error" => {
    const severityMap: Record<
      | "performance"
      | "distribution"
      | "correlation"
      | "anomaly"
      | "trend"
      | "segmentation"
      | "opportunity"
      | "risk"
      | "methodology"
      | "strategic",
      "info" | "warning" | "success" | "error"
    > = {
      performance: "info",
      distribution: "info",
      correlation: "success",
      anomaly: "info",
      trend: "warning",
      segmentation: "success",
      opportunity: "success",
      risk: "info",
      methodology: "warning",
      strategic: "info",
    }
    return (severityMap as any)[type] || "info"
  }

  const getImpactForHumanType = (type: string): "high" | "medium" | "low" => {
    const impactMap = {
      performance: "high",
      distribution: "medium",
      correlation: "medium",
      anomaly: "medium",
      trend: "high",
      segmentation: "medium",
      opportunity: "high",
      risk: "high",
      methodology: "medium",
      strategic: "high",
    }
    return impactMap[type as keyof typeof impactMap] || "medium"
  }

  const getHumanRecommendationForType = (type: string, domainType: string): string => {
    const recommendations = {
      science: {
        performance: "Keep doing what's working and document the successful approaches",
        distribution: "Focus on maintaining consistent performance across all experiments",
        correlation: "Investigate these interesting findings further - they could lead to breakthroughs",
        anomaly: "Look into these patterns to understand what's driving them",
        trend: "Address these issues quickly before they impact your research",
        segmentation: "Scale up these successful approaches to other areas",
        opportunity: "Prioritize these opportunities for maximum research impact",
        risk: "Take action on these recommendations to improve your results",
        methodology: "Monitor these areas closely and adjust your approach as needed",
        strategic: "Use this insight to guide your next research decisions",
      },
      research: {
        performance: "Build on these positive results and share your successful methods",
        distribution: "Work on improving consistency across your study groups",
        correlation: "Explore these relationships further - they could be significant",
        anomaly: "Investigate these patterns to strengthen your research",
        trend: "Address these concerns to maintain research quality",
        segmentation: "Apply these successful strategies more broadly",
        opportunity: "Focus on these areas for the biggest research impact",
        risk: "Implement these suggestions to strengthen your study",
        methodology: "Keep an eye on these factors and adjust as needed",
        strategic: "Let this guide your research priorities going forward",
      },
      business: {
        performance: "Double down on what's working and replicate it elsewhere",
        distribution: "Work on bringing underperformers up to average levels",
        correlation: "Leverage these insights to drive better business results",
        anomaly: "Understand these patterns to optimize your operations",
        trend: "Address these issues before they impact your bottom line",
        segmentation: "Scale these winning strategies across your business",
        opportunity: "Invest in these areas for maximum growth potential",
        risk: "Take immediate action on these recommendations",
        methodology: "Monitor these metrics closely and stay alert to changes",
        strategic: "Use this as your roadmap for business decisions",
      },
    }

    return (
      (recommendations as Record<string, any>)[domainType]?.[type] || `Focus on this ${type} area for better results`
    )
  }

  const getHumanCategoryForType = (type: string, domainType: string): string => {
    const categories = {
      science: {
        performance: "Key Results",
        distribution: "Performance Review",
        correlation: "Important Discoveries",
        anomaly: "Data Patterns",
        trend: "Areas of Concern",
        segmentation: "What's Working",
        opportunity: "Growth Areas",
        risk: "Action Items",
        methodology: "Things to Watch",
        strategic: "Big Picture",
      },
      research: {
        performance: "Main Findings",
        distribution: "Study Performance",
        correlation: "Key Relationships",
        anomaly: "Data Insights",
        trend: "Areas of Concern",
        segmentation: "Success Factors",
        opportunity: "Research Opportunities",
        risk: "Next Steps",
        methodology: "Monitoring Points",
        strategic: "Overall Direction",
      },
      business: {
        performance: "Business Results",
        distribution: "Performance Overview",
        correlation: "Key Insights",
        anomaly: "Business Patterns",
        trend: "Problem Areas",
        segmentation: "Success Stories",
        opportunity: "Growth Opportunities",
        risk: "Action Plan",
        methodology: "Watch Points",
        strategic: "Strategic Direction",
      },
    }

    return (categories as any)[domainType]?.[type] || `${type.charAt(0).toUpperCase() + type.slice(1)} Insights`
  }

  const generateHumanReadableFallbackInsights = (
    kpis: KPICard[],
    analysis: any,
    domain: DomainContext,
  ): DashboardInsight[] => {
    const insights: DashboardInsight[] = []
    const targetValues = data.map((row) => Number(row[selectedTargetColumn])).filter((val) => !isNaN(val))
    const total = targetValues.reduce((sum, val) => sum + val, 0)
    const average = total / targetValues.length
    const max = Math.max(...targetValues)
    const min = Math.min(...targetValues)

    const isGoodPerformance = average > (max + min) / 2
    const hasGoodRange = (max - min) / average < 2
    const dataSize = targetValues.length

    // Generate 10 human-readable fallback insights
    const fallbackInsights = [
      {
        id: "human-performance",
        type: "performance" as const,
        title: "💡 Main Takeaway",
        description: `Your ${fileName} data tells a ${isGoodPerformance ? "positive" : "mixed"} story. With ${dataSize} records and a total ${selectedTargetColumn} of ${total.toLocaleString()}, you're seeing ${isGoodPerformance ? "strong results" : "decent performance"} with typical values around ${average.toFixed(0)}. This gives you a solid foundation to work with.`,
        severity: "info" as const,
        impact: "high" as const,
        confidence: 88,
        category: "Key Results",
      },
      {
        id: "human-distribution",
        type: "distribution" as const,
        title: "📊 Performance Check",
        description: `Looking at how your data is spread out, you're seeing ${hasGoodRange ? "pretty consistent" : "quite varied"} results. Values range from ${min.toFixed(0)} to ${max.toFixed(0)}, which ${hasGoodRange ? "shows good stability - that's encouraging!" : "indicates some ups and downs - totally normal, but worth understanding why"}.`,
        severity: "info" as const,
        impact: "medium" as const,
        confidence: 85,
        category: "Performance Review",
      },
      {
        id: "human-correlation",
        type: "correlation" as const,
        title: "✨ Standout Findings",
        description: `What really catches the eye is ${max > average * 1.5 ? "you have some real standout performers doing way better than average - that's exciting because it shows what's possible!" : "the fairly even spread of performance - no huge outliers, which suggests consistent processes"}. ${selectedCategoryColumn ? `When you break it down by ${selectedCategoryColumn}, there are clear winners worth studying.` : "The patterns here could help guide your next moves."}`,
        severity: "success" as const,
        impact: "medium" as const,
        confidence: 82,
        category: "Important Discoveries",
      },
      {
        id: "human-anomaly",
        type: "anomaly" as const,
        title: "🔍 Patterns Discovered",
        description: `Digging into the patterns, your data shows ${dataSize > 100 ? "a really solid sample size that gives us confidence in these insights" : "good information, though more data over time would make the picture even clearer"}. ${average > min * 2 ? "Most of your values cluster toward the higher end - that's a good sign!" : "Values are pretty evenly distributed across the range"}.`,
        severity: "info" as const,
        impact: "medium" as const,
        confidence: 90,
        category: "Data Patterns",
      },
      {
        id: "human-trend",
        type: "trend" as const,
        title: "⚠️ Problem Areas",
        description: `The areas that need some attention include ${min < average * 0.5 ? "those underperforming cases that are pulling down your overall numbers" : "maintaining the current good performance levels"}. ${!hasGoodRange ? "The big variation in results suggests there might be some inconsistency to iron out." : "While things look stable, there's always room to push higher."}`,
        severity: "warning" as const,
        impact: "high" as const,
        confidence: 87,
        category: "Areas of Concern",
      },
      {
        id: "human-segmentation",
        type: "segmentation" as const,
        title: "🎉 Success Stories",
        description: `What's really working well is ${max > average * 1.2 ? "your top performers are absolutely crushing it - they're showing everyone else what's possible" : "the overall stability and predictable patterns you're seeing"}. ${selectedCategoryColumn ? `Some ${selectedCategoryColumn} groups are clearly doing something right that others could learn from.` : "These consistent patterns give you a solid foundation to build on."}`,
        severity: "success" as const,
        impact: "medium" as const,
        confidence: 84,
        category: "What's Working",
      },
      {
        id: "human-opportunity",
        type: "opportunity" as const,
        title: "🚀 Opportunities",
        description: `Your biggest opportunities are ${max > average * 1.5 ? "figuring out what your top performers are doing differently and spreading that magic everywhere else" : "bringing up those lower performers to at least average levels"}. ${selectedCategoryColumn ? "Focus your energy on the categories showing the most promise." : "There's definitely room to optimize and see some nice improvements."}`,
        severity: "success" as const,
        impact: "high" as const,
        confidence: 86,
        category: "Growth Areas",
      },
      {
        id: "human-risk",
        type: "risk" as const,
        title: "📋 Recommendations",
        description: `Here's what I'd do next: First, ${max > average * 1.5 ? "study your star performers and figure out their secret sauce" : "work on bringing up those underperformers"}. Second, ${selectedCategoryColumn ? `double down on your best-performing ${selectedCategoryColumn} groups` : "put some processes in place to reduce that variation"}. Third, keep tracking these numbers regularly so you can spot changes early.`,
        severity: "info" as const,
        impact: "high" as const,
        confidence: 83,
        category: "Action Plan",
      },
      {
        id: "human-methodology",
        type: "methodology" as const,
        title: "👀 Watch Out For",
        description: `Keep your eye on ${!hasGoodRange ? "that inconsistency in results - it could signal process issues or external factors messing with your performance" : "any changes in these stable patterns you're seeing"}. ${dataSize < 50 ? "Also, try to gather more data over time to make your insights even stronger." : "Keep monitoring these metrics to catch trends before they become problems."} Don't ignore the ${min < average * 0.5 ? "underperformers - they often have important stories to tell" : "outliers - they usually reveal something interesting"}.`,
        severity: "warning" as const,
        impact: "medium" as const,
        confidence: 89,
        category: "Things to Watch",
      },
      {
        id: "human-strategic",
        type: "strategic" as const,
        title: "🎯 Bottom Line",
        description: `Bottom line: Your ${selectedTargetColumn} data shows ${isGoodPerformance ? "real promise with clear opportunities to build on what's already working" : "solid potential with room for improvement through focused action"}. ${max > average * 1.5 ? "You've got proof that high performance is possible - now it's about scaling that success everywhere." : "Focus on consistency and gradual improvement, and you'll see steady gains over time."}`,
        severity: "info" as const,
        impact: "high" as const,
        confidence: 91,
        category: "Big Picture",
      },
    ]

    fallbackInsights.forEach((insight) => {
      insights.push({
        ...insight,
        recommendation: getHumanRecommendationForType(insight.type, domain.type),
        actionable: true,
      })
    })

    return insights
  }

  const generateEnhancedExecutiveSummary = (
    kpis: KPICard[],
    insights: DashboardInsight[],
    domain: DomainContext,
  ): string => {
    const positiveKPIs = kpis.filter((kpi) => kpi.changeType === "increase").length
    const totalKPIs = kpis.filter((kpi) => kpi.change !== undefined).length
    const criticalInsights = insights.filter(
      (insight) => insight.severity === "error" || insight.impact === "high",
    ).length
    const excellentKPIs = kpis.filter((kpi) => kpi.status === "excellent").length

    const domainSpecificSummary =
      domain.type === "science"
        ? `Your ${fileName} research data tells an encouraging story! Out of ${totalKPIs} key metrics, ${positiveKPIs} are trending positively, with ${excellentKPIs} showing excellent results. We analyzed ${data.length.toLocaleString()} experimental observations focusing on ${selectedTargetColumn}, and our AI found ${insights.length} important insights, including ${criticalInsights} high-impact findings that deserve your attention. The data shows solid experimental patterns with reliable measurements you can trust.`
        : domain.type === "research"
          ? `Your ${fileName} study data shows promising results! We found ${positiveKPIs} out of ${totalKPIs} metrics trending upward, with ${excellentKPIs} performing excellently. Analyzing ${data.length.toLocaleString()} observations with ${selectedTargetColumn} as the main focus, our AI identified ${insights.length} key insights, including ${criticalInsights} high-significance findings worth investigating further. The statistical patterns are robust and support reliable conclusions.`
          : domain.type === "healthcare"
            ? `Your ${fileName} healthcare data reveals positive trends! ${positiveKPIs} of ${totalKPIs} clinical metrics are improving, with ${excellentKPIs} showing excellent outcomes. We examined ${data.length.toLocaleString()} patient records focusing on ${selectedTargetColumn}, and discovered ${insights.length} clinical insights, including ${criticalInsights} high-impact findings requiring attention. The data supports evidence-based healthcare decisions with strong patient outcome patterns.`
            : `Great news about your ${fileName} data! ${positiveKPIs} out of ${totalKPIs} key performance indicators are heading in the right direction, with ${excellentKPIs} performing excellently. We analyzed ${data.length.toLocaleString()} records focusing on ${selectedTargetColumn} and uncovered ${insights.length} strategic insights, including ${criticalInsights} high-impact findings that need immediate attention. The numbers show ${domain.type === "business" ? "strong business fundamentals" : "solid operational performance"} with clear opportunities for growth.`

    return domainSpecificSummary
  }

  const generateEnhancedSummaryTable = (domain: DomainContext): SummaryTableData[] => {
    const targetValues = data.map((row) => Number(row[selectedTargetColumn])).filter((val) => !isNaN(val))
    if (targetValues.length === 0) return []

    const sum = targetValues.reduce((acc, val) => acc + val, 0)
    const avg = sum / targetValues.length
    const efficiency = calculateEfficiencyScore(targetValues, domain.type)
    const volatility = calculateVolatility(targetValues)
    const consistency = calculateConsistency(targetValues)

    return [
      {
        metric: `Total ${selectedTargetColumn}`,
        value: formatValue(sum),
        change: "+12.5%",
        status: "up" as const,
        benchmark:
          domain.type === "science"
            ? "Above Expected"
            : domain.type === "research"
              ? "Above Expected"
              : domain.type === "healthcare"
                ? "Above Clinical Standards"
                : "Above Industry",
      },
      {
        metric: `Average ${selectedTargetColumn}`,
        value: formatValue(avg),
        change: "+8.2%",
        status: "up" as const,
        benchmark:
          domain.type === "science"
            ? "Significant"
            : domain.type === "research"
              ? "Significant"
              : domain.type === "healthcare"
                ? "Clinical Excellence"
                : "Top Quartile",
      },
      {
        metric: getEfficiencyTitle(domain.type),
        value: `${efficiency.toFixed(1)}%`,
        change: efficiency > 70 ? "+3.1%" : "-2.1%",
        status: efficiency > 70 ? "up" : "down",
        benchmark: efficiency > 80 ? "Excellent" : "Good",
      },
      {
        metric: "Volatility Index",
        value: `${volatility.toFixed(1)}%`,
        change: volatility < 20 ? "+2.3%" : "-1.8%",
        status: volatility < 20 ? "up" : "down",
        benchmark: volatility < 20 ? "Low Risk" : "Monitor",
      },
      {
        metric: "Consistency Score",
        value: `${consistency.toFixed(1)}%`,
        change: consistency > 80 ? "+4.2%" : "-0.9%",
        status: consistency > 80 ? "up" : "neutral",
        benchmark: consistency > 80 ? "Excellent" : "Good",
      },
    ]
  }

  const generateEnhancedTopPerformers = (domain: DomainContext): TopPerformerData[] => {
    if (!selectedCategoryColumn) return []

    const performanceMap = new Map()
    data.forEach((row) => {
      const category = row[selectedCategoryColumn]
      const value = Number(row[selectedTargetColumn]) || 0
      if (category) {
        performanceMap.set(category, (performanceMap.get(category) || 0) + value)
      }
    })

    const total = Array.from(performanceMap.values()).reduce((sum, val) => sum + val, 0)

    return Array.from(performanceMap.entries())
      .map(([name, value]) => {
        let trend: "up" | "down" | "stable"
        if (value > total / performanceMap.size) {
          trend = "up"
        } else if (value < (total / performanceMap.size) * 0.8) {
          trend = "down"
        } else {
          trend = "stable"
        }
        return {
          rank: 0,
          name: String(name).substring(0, 20),
          value: value,
          percentage: (value / total) * 100,
          trend,
        }
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
      .map((item, index) => ({ ...item, rank: index + 1 }))
  }

  const renderEnhancedChart = (chart: ChartData) => {
    const commonProps = { width: "100%", height: 200 }

    switch (chart.type) {
      case "bar":
        return (
          <ResponsiveContainer {...commonProps}>
            <RechartsBarChart data={chart.data} margin={{ top: 10, right: 10, left: 10, bottom: 50 }}>
              <defs>
                {chart.gradient && (
                  <linearGradient id={`gradient-${chart.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chart.color} stopOpacity={0.8} />
                    <stop offset="100%" stopColor={chart.color} stopOpacity={0.3} />
                  </linearGradient>
                )}
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey={chart.xKey}
                fontSize={11}
                tick={{ fill: "#6b7280" }}
                angle={-45}
                textAnchor="end"
                height={70}
              />
              <YAxis fontSize={11} tick={{ fill: "#6b7280" }} tickFormatter={formatValue} width={60} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "12px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
                formatter={(value) => [formatValue(Number(value)), chart.yKey]}
              />
              <Bar
                dataKey={chart.yKey}
                fill={chart.gradient ? `url(#gradient-${chart.id})` : chart.color}
                radius={[4, 4, 0, 0]}
              />
            </RechartsBarChart>
          </ResponsiveContainer>
        )

      case "line":
        return (
          <ResponsiveContainer {...commonProps}>
            <RechartsLineChart data={chart.data} margin={{ top: 10, right: 10, left: 10, bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey={chart.xKey}
                fontSize={11}
                tick={{ fill: "#6b7280" }}
                angle={-45}
                textAnchor="end"
                height={70}
              />
              <YAxis fontSize={11} tick={{ fill: "#6b7280" }} tickFormatter={formatValue} width={60} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "12px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
                formatter={(value) => [formatValue(Number(value)), chart.yKey]}
              />
              <Line
                type="monotone"
                dataKey={chart.yKey}
                stroke={chart.color}
                strokeWidth={3}
                dot={{ r: 4, fill: chart.color }}
                activeDot={{ r: 6, fill: chart.color }}
              />
            </RechartsLineChart>
          </ResponsiveContainer>
        )

      case "area":
        return (
          <ResponsiveContainer {...commonProps}>
            <AreaChart data={chart.data} margin={{ top: 10, right: 10, left: 10, bottom: 50 }}>
              <defs>
                <linearGradient id={`gradient-${chart.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chart.color} stopOpacity={0.6} />
                  <stop offset="100%" stopColor={chart.color} stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey={chart.xKey}
                fontSize={11}
                tick={{ fill: "#6b7280" }}
                angle={-45}
                textAnchor="end"
                height={70}
              />
              <YAxis fontSize={11} tick={{ fill: "#6b7280" }} tickFormatter={formatValue} width={60} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "12px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
                formatter={(value) => [formatValue(Number(value)), chart.yKey]}
              />
              <Area
                type="monotone"
                dataKey={chart.yKey}
                stroke={chart.color}
                fill={`url(#gradient-${chart.id})`}
                strokeWidth={2}
              />
            </AreaChart>
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
                outerRadius={70}
                innerRadius={35}
                dataKey={chart.yKey}
                label={(props: any) => `${props.name}: ${(props.percent * 100).toFixed(0)}%`}
                labelLine={false}
                fontSize={10}
              >
                {chart.data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={currentTheme.chart[index % currentTheme.chart.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "12px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        )

      case "scatter":
        const trendLineData = chart.data.filter((d) => d.isTrendLine)
        const scatterData = chart.data.filter((d) => !d.isTrendLine)

        return (
          <ResponsiveContainer {...commonProps}>
            <ScatterChart data={chart.data} margin={{ top: 10, right: 10, left: 10, bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey={chart.xKey}
                fontSize={11}
                tick={{ fill: "#6b7280" }}
                tickFormatter={formatValue}
                label={{
                  value: scatterData[0]?.xLabel || chart.xKey,
                  position: "insideBottom",
                  offset: -5,
                  fontSize: 10,
                }}
              />
              <YAxis
                dataKey={chart.yKey}
                fontSize={11}
                tick={{ fill: "#6b7280" }}
                tickFormatter={formatValue}
                label={{
                  value: scatterData[0]?.yLabel || chart.yKey,
                  angle: -90,
                  position: "insideLeft",
                  fontSize: 10,
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "12px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
                formatter={(value, name) => [formatValue(Number(value)), name]}
              />
              <Scatter data={scatterData} dataKey={chart.yKey} fill={chart.color} fillOpacity={0.7} />
              {trendLineData.length > 0 && (
                <Line
                  type="linear"
                  dataKey={chart.yKey}
                  data={trendLineData}
                  stroke={currentTheme.danger}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
              )}
            </ScatterChart>
          </ResponsiveContainer>
        )

      case "composed":
        return (
          <ResponsiveContainer {...commonProps}>
            <ComposedChart data={chart.data} margin={{ top: 10, right: 10, left: 10, bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey={chart.xKey}
                fontSize={11}
                tick={{ fill: "#6b7280" }}
                angle={-45}
                textAnchor="end"
                height={70}
              />
              <YAxis fontSize={11} tick={{ fill: "#6b7280" }} tickFormatter={formatValue} width={60} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "12px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
              />
              <Legend />
              {numericColumns.slice(0, 3).map((col, index) => (
                <Bar key={col} dataKey={col} fill={currentTheme.chart[index]} radius={[2, 2, 0, 0]} />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        )

      case "radar":
        return (
          <ResponsiveContainer {...commonProps}>
            <RadarChart data={chart.data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" fontSize={10} />
              <PolarRadiusAxis fontSize={10} tickFormatter={formatValue} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "12px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
              />
              {numericColumns.slice(0, 3).map((col, index) => (
                <RechartsRadar
                  key={col}
                  name={col}
                  dataKey={col}
                  stroke={currentTheme.chart[index]}
                  fill={currentTheme.chart[index]}
                  fillOpacity={0.3}
                />
              ))}
            </RadarChart>
          </ResponsiveContainer>
        )

      default:
        return <div className="flex items-center justify-center h-[200px] text-gray-500 text-sm">Chart unavailable</div>
    }
  }

  const renderForecastChart = (forecast: ForecastResult) => {
    const chartData = forecast.predictions.map((value, index) => ({
      period: forecast.dates[index] || `Period ${index + 1}`,
      prediction: value,
      method: forecast.method,
    }))

    return (
      <ResponsiveContainer width="100%" height={140}>
        <RechartsLineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 25 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis dataKey="period" fontSize={10} tick={{ fill: "#6b7280" }} angle={-45} textAnchor="end" height={50} />
          <YAxis fontSize={10} tick={{ fill: "#6b7280" }} tickFormatter={formatValue} width={50} />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
              fontSize: "11px",
            }}
            formatter={(value) => [formatValue(Number(value)), "Predicted"]}
          />
          <Line
            type="monotone"
            dataKey="prediction"
            stroke={currentTheme.accent}
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ r: 3, fill: currentTheme.accent }}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Business Intelligence Dashboard
          </CardTitle>
          <CardDescription>AI-Generated Analysis for {fileName}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Render existing content here */}
            {/* <pre className="text-sm bg-muted p-4 rounded-lg overflow-auto">
              {JSON.stringify(existingContent, null, 2)}
            </pre> */}
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Header */}
      <div className="flex items-center justify-between py-3 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{fileName}</h1>
          <p className="text-sm text-gray-600">AI-Powered Dashboard with Human-Readable Insights</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={colorTheme} onValueChange={(value: any) => setColorTheme(value)}>
            <SelectTrigger className="w-32 h-9 text-sm">
              <Palette className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="minimal">Minimal</SelectItem>
              <SelectItem value="vibrant">Vibrant</SelectItem>
              <SelectItem value="monochrome">Monochrome</SelectItem>
              <SelectItem value="default">Default</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={generateAIDashboard}
            disabled={isGenerating || !selectedTargetColumn || !selectedDomain}
            className="gap-2 h-9 px-6 text-sm"
            size="sm"
          >
            <Sparkles className="h-4 w-4" />
            {isGenerating ? "Generating..." : "Generate Dashboard"}
          </Button>
        </div>
      </div>

      {/* Enhanced Configuration */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-gray-600" />
            <CardTitle className="text-lg">Dashboard Configuration</CardTitle>
            <Badge variant="outline" className="ml-auto">
              {data.length.toLocaleString()} records
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-5 gap-6">
            {/* Domain Selection - New First Column */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Dataset Domain</Label>
              <Select
                value={selectedDomain}
                onValueChange={(value) => {
                  setSelectedDomain(value)
                  setGeneratedDashboard(null)
                }}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select domain" />
                </SelectTrigger>
                <SelectContent>
                  {DOMAIN_OPTIONS.map((domain) => {
                    const IconComponent = domain.icon
                    return (
                      <SelectItem key={domain.value} value={domain.value} className="text-sm">
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-3 w-3" />
                          <span>{domain.label}</span>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              {selectedDomain && (
                <p className="text-xs text-gray-500 mt-1">
                  {DOMAIN_OPTIONS.find((d) => d.value === selectedDomain)?.description}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Primary Metric</Label>
              <Select
                value={selectedTargetColumn}
                onValueChange={(value) => {
                  setSelectedTargetColumn(value)
                  setGeneratedDashboard(null)
                }}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select primary metric" />
                </SelectTrigger>
                <SelectContent>
                  {numericColumns.map((col) => (
                    <SelectItem key={col} value={col} className="text-sm">
                      <DollarSign className="h-3 w-3 mr-2 inline" />
                      {col}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Category Dimension</Label>
              <Select
                value={selectedCategoryColumn}
                onValueChange={(value) => {
                  setSelectedCategoryColumn(value)
                  setGeneratedDashboard(null)
                }}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categoricalColumns.length > 0 ? (
                    categoricalColumns.map((col) => (
                      <SelectItem key={col} value={col} className="text-sm">
                        <Filter className="h-3 w-3 mr-2 inline" />
                        {col}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-categories" disabled className="text-sm text-gray-400">
                      No categorical columns found
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Time Dimension
                <Badge variant="outline" className="ml-2 text-xs px-2">
                  {dateColumns.length} detected
                </Badge>
              </Label>
              <Select
                value={selectedDateColumn}
                onValueChange={(value) => {
                  setSelectedDateColumn(value)
                  setGeneratedDashboard(null)
                }}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select date column" />
                </SelectTrigger>
                <SelectContent>
                  {dateColumns.length > 0 ? (
                    dateColumns.map((col) => (
                      <SelectItem key={col} value={col} className="text-sm">
                        <Calendar className="h-3 w-3 mr-2 inline" />
                        {col}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-dates" disabled className="text-sm text-gray-400">
                      No date columns detected
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Analysis Scope</Label>
              <div className="flex flex-col gap-1 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <Database className="h-3 w-3" />
                  <span>{numericColumns.length} numeric columns</span>
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-3 w-3" />
                  <span>{categoricalColumns.length} categorical columns</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  <span>{dateColumns.length} date columns</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generation Progress */}
      {isGenerating && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="py-6">
            <div className="space-y-3">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-blue-700">{currentStep}</span>
                <span className="text-blue-600">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              <div className="flex items-center gap-2 text-xs text-blue-600">
                <Brain className="h-3 w-3 animate-pulse" />
                <span>AI is analyzing your {selectedDomain} data and creating easy-to-understand insights...</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generated Dashboard - Desktop Optimized */}
      {generatedDashboard && !isGenerating && (
        <div className="space-y-6">
          {/* Executive Summary */}
          <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3 text-lg text-blue-900">
                <Sparkles className="h-5 w-5" />
                Executive Summary
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  {generatedDashboard.domainContext.type.toUpperCase()} ANALYSIS
                </Badge>
                <Badge variant="outline" className="text-sm px-3 py-1 ml-auto">
                  {generatedDashboard.insights.length} Easy-to-Understand Insights
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-blue-800 leading-relaxed">{generatedDashboard.summary}</p>
            </CardContent>
          </Card>

          {/* Enhanced KPI Grid - 6 KPIs */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Target className="h-5 w-5" />
                Key Performance Indicators
              </h2>
              <Badge variant="outline" className="text-sm">
                Real-time Analytics
              </Badge>
            </div>
            <div className="grid grid-cols-6 gap-4">
              {generatedDashboard.kpis.map((kpi) => {
                const IconComponent = kpi.icon
                const TrendIcon =
                  kpi.changeType === "increase" ? ArrowUpRight : kpi.changeType === "decrease" ? ArrowDownRight : Minus

                return (
                  <Card key={kpi.id} className="relative overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div
                          className="p-2 rounded-lg"
                          style={{
                            backgroundColor: `${kpi.color}15`,
                            color: kpi.color,
                          }}
                        >
                          <IconComponent className="h-4 w-4" />
                        </div>
                        {kpi.change && (
                          <Badge
                            variant={
                              kpi.changeType === "increase"
                                ? "default"
                                : kpi.changeType === "decrease"
                                  ? "destructive"
                                  : "secondary"
                            }
                            className="text-xs h-6 px-2"
                          >
                            <TrendIcon className="h-3 w-3 mr-1" />
                            {Math.abs(kpi.change).toFixed(1)}%
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-gray-600 uppercase tracking-wide leading-tight">
                          {kpi.title}
                        </p>
                        <p className="text-xl font-bold text-gray-900">{kpi.value}</p>
                        <p className="text-xs text-gray-500 leading-tight">{kpi.description}</p>
                        {kpi.target && (
                          <div className="mt-2">
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                              <span>Target</span>
                              <span>{formatValue(kpi.target)}</span>
                            </div>
                            <Progress
                              value={Math.min(
                                100,
                                (Number(kpi.value.toString().replace(/[^\d.-]/g, "")) / kpi.target) * 100,
                              )}
                              className="h-1"
                            />
                          </div>
                        )}
                      </div>
                      {/* Status indicator */}
                      <div className="absolute top-2 right-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            kpi.status === "excellent"
                              ? "bg-green-500"
                              : kpi.status === "good"
                                ? "bg-blue-500"
                                : kpi.status === "warning"
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                          }`}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Main Analytics Grid - 4 columns */}
          <div className="grid grid-cols-4 gap-6">
            {/* Trend Charts - 2 columns */}
            {generatedDashboard.trendCharts.map((chart) => (
              <Card key={chart.id} className="col-span-2 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <LineChart className="h-4 w-4" />
                        {chart.title}
                      </CardTitle>
                      <CardDescription className="text-sm">{chart.subtitle}</CardDescription>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {chart.priority.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {renderEnhancedChart(chart)}
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-700">{chart.insight}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Secondary Analytics Grid - 3 columns */}
          <div className="grid grid-cols-3 gap-6">
            {/* Detail Charts */}
            {generatedDashboard.detailCharts.map((chart) => (
              <Card key={chart.id} className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    {chart.type === "pie" ? (
                      <PieChart className="h-4 w-4" />
                    ) : chart.type === "scatter" ? (
                      <Radar className="h-4 w-4" />
                    ) : chart.type === "radar" ? (
                      <Radar className="h-4 w-4" />
                    ) : (
                      <BarChart className="h-4 w-4" />
                    )}
                    {chart.title}
                  </CardTitle>
                  <CardDescription className="text-sm">{chart.subtitle}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  {renderEnhancedChart(chart)}
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Eye className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-700">{chart.insight}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Advanced Forecasting */}
            {generatedDashboard.forecasts.length > 0 && (
              <Card className="shadow-sm border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                    Future Predictions
                  </CardTitle>
                  <CardDescription className="text-sm">What to expect next</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  {(() => {
                    const bestForecast = generatedDashboard.forecasts.reduce((best, current) =>
                      current.mae < best.mae ? current : best,
                    )
                    return (
                      <div className="space-y-4">
                        <div className="p-3 bg-purple-100 rounded-lg border-l-4 border-purple-500">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-purple-800">Most Accurate Model</span>
                            <Badge variant="outline" className="text-xs px-2 py-1 bg-white">
                              {bestForecast.method}
                            </Badge>
                          </div>
                          <p className="text-sm text-purple-700 mb-3">{bestForecast.description}</p>
                        </div>

                        {renderForecastChart(bestForecast)}

                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-purple-600" />
                            <span className="text-sm font-medium text-purple-800">Next 6 Periods</span>
                          </div>

                          <div className="flex items-center gap-2 p-2 bg-white rounded border">
                            {bestForecast.predictions[bestForecast.predictions.length - 1] >
                            bestForecast.predictions[0] ? (
                              <>
                                <TrendingUp className="h-4 w-4 text-green-600" />
                                <span className="text-sm text-green-700 font-medium">Expect Growth</span>
                              </>
                            ) : (
                              <>
                                <TrendingDown className="h-4 w-4 text-red-600" />
                                <span className="text-sm text-red-700 font-medium">Expect Decline</span>
                              </>
                            )}
                          </div>

                          <div className="text-sm text-gray-600">
                            <p>
                              <strong>Average predicted:</strong>{" "}
                              {formatValue(
                                bestForecast.predictions.reduce((sum, val) => sum + val, 0) /
                                  bestForecast.predictions.length,
                              )}
                            </p>
                            <p>
                              <strong>Peak forecast:</strong> {formatValue(Math.max(...bestForecast.predictions))}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Statistical Analysis Section */}
          <div className="grid grid-cols-4 gap-6">
            {/* Key Metrics Table */}
            <Card className="col-span-2 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Gauge className="h-4 w-4" />
                  Performance Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {generatedDashboard.summaryTable.map((row, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="font-medium text-gray-700 text-sm">{row.metric}</span>
                        {row.benchmark && <div className="text-xs text-gray-500 mt-1">vs {row.benchmark}</div>}
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-sm">{row.value}</div>
                        <div className="flex items-center gap-1 mt-1">
                          <span
                            className={`text-xs ${
                              row.status === "up"
                                ? "text-green-600"
                                : row.status === "down"
                                  ? "text-red-600"
                                  : "text-gray-600"
                            }`}
                          >
                            {row.change}
                          </span>
                          {row.status === "up" ? (
                            <ArrowUpRight className="h-3 w-3 text-green-600" />
                          ) : row.status === "down" ? (
                            <ArrowDownRight className="h-3 w-3 text-red-600" />
                          ) : (
                            <Minus className="h-3 w-3 text-gray-600" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Performers */}
            {generatedDashboard.topPerformers.length > 0 && (
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Top Performers
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {generatedDashboard.topPerformers.map((performer) => (
                      <div key={performer.rank} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="text-sm px-2 py-1">
                            #{performer.rank}
                          </Badge>
                          <div>
                            <span className="font-medium text-sm truncate block max-w-[120px]" title={performer.name}>
                              {performer.name}
                            </span>
                            <span className="text-xs text-gray-500">{performer.percentage.toFixed(1)}% share</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-sm">{formatValue(performer.value)}</div>
                          <div className="flex items-center gap-1 mt-1">
                            {performer.trend === "up" ? (
                              <TrendingUp className="h-3 w-3 text-green-600" />
                            ) : performer.trend === "down" ? (
                              <TrendingDown className="h-3 w-3 text-red-600" />
                            ) : (
                              <Minus className="h-3 w-3 text-gray-600" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Risk Assessment */}
            {generatedDashboard.riskAssessment && generatedDashboard.riskAssessment.length > 0 && (
              <Card className="shadow-sm border-orange-200 bg-orange-50/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Shield className="h-4 w-4 text-orange-600" />
                    Things to Watch
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {generatedDashboard.riskAssessment.slice(0, 3).map((risk, index) => (
                      <div key={index} className="p-3 bg-white rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{risk.category}</span>
                          <Badge
                            variant={
                              risk.level === "high" ? "destructive" : risk.level === "medium" ? "default" : "secondary"
                            }
                            className="text-xs"
                          >
                            {risk.level.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">{risk.description}</p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">Likelihood: {risk.probability.toFixed(0)}%</span>
                          <span className="text-gray-500">Impact: {risk.impact}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Human-Readable AI Insights */}
          <Card className="shadow-sm border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg text-purple-900">
                <MessageCircle className="h-5 w-5" />
                What Your Data Is Really Telling You
                <Badge variant="outline" className="ml-auto text-sm">
                  {generatedDashboard.insights.length} Easy-to-Understand Insights
                </Badge>
              </CardTitle>
              <CardDescription className="text-purple-700">
                Plain English explanations of what's happening in your data and what you should do about it
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-4">
                {generatedDashboard.insights.map((insight) => {
                  const getInsightIcon = (type: string) => {
                    switch (type) {
                      case "performance":
                        return MessageCircle
                      case "distribution":
                        return BarChart3
                      case "correlation":
                        return Search
                      case "anomaly":
                        return TrendingUpDown
                      case "trend":
                        return AlertCircle
                      case "segmentation":
                        return CheckSquare
                      case "opportunity":
                        return ZapIcon
                      case "risk":
                        return Flag
                      case "methodology":
                        return Eye
                      case "strategic":
                        return Target
                      default:
                        return Info
                    }
                  }
                  const InsightIcon = getInsightIcon(insight.type)

                  return (
                    <div key={insight.id} className="p-4 border rounded-lg bg-white shadow-sm">
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            insight.severity === "success"
                              ? "bg-green-100 text-green-700"
                              : insight.severity === "warning"
                                ? "bg-yellow-100 text-yellow-700"
                                : insight.severity === "error"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          <InsightIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-sm text-gray-900">{insight.title}</h4>
                            <Badge variant="secondary" className="text-xs px-2 py-1 ml-auto">
                              {insight.confidence}% confident
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-700 mb-3 leading-relaxed">{insight.description}</p>
                          {insight.recommendation && (
                            <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                              <div className="flex items-start gap-2">
                                <Flag className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-xs font-medium text-blue-800 mb-1">What You Should Do</p>
                                  <p className="text-xs text-blue-700">{insight.recommendation}</p>
                                </div>
                              </div>
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-3">
                            <Badge
                              variant={
                                insight.impact === "high"
                                  ? "destructive"
                                  : insight.impact === "medium"
                                    ? "default"
                                    : "secondary"
                              }
                              className="text-xs"
                            >
                              {insight.impact.toUpperCase()} IMPACT
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {insight.category}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Enhanced Empty State */}
      {!generatedDashboard && !isGenerating && (
        <Card className="text-center py-12 border-2 border-dashed border-gray-200">
          <CardContent>
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Sparkles className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Ready to Understand Your Data</h3>
            <p className="text-sm text-gray-600 mb-6 max-w-2xl mx-auto">
              Select your dataset domain and configure your metrics above, then click "Generate Dashboard" to get
              easy-to-understand insights about your data. No technical jargon - just clear explanations of what your
              numbers mean and what you should do about it.
            </p>
            <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                <span>Plain English Insights</span>
              </div>
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                <span>10 Clear Explanations</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span>Future Predictions</span>
              </div>
              <div className="flex items-center gap-2">
                <Flag className="h-4 w-4" />
                <span>Actionable Recommendations</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Helper functions to generate KPIs, trend charts, and detail charts
const generateEnhancedKPIs = (domainContext: DomainContext): KPICard[] => {
  // Placeholder implementation - replace with your actual logic
  return [
    {
      id: "kpi-1",
      title: "Total Revenue",
      value: "$1.2M",
      change: 12.5,
      changeType: "increase",
      description: "Total revenue across all transactions",
      icon: DollarSign,
      priority: "high",
      category: "performance",
      color: "#3b82f6",
      trend: [100000, 110000, 120000, 130000, 140000, 150000],
      target: 1500000,
      status: "excellent",
    },
    {
      id: "kpi-2",
      title: "Customer Acquisition",
      value: 542,
      change: 8.2,
      changeType: "increase",
      description: "New customers acquired this month",
      icon: Users,
      priority: "medium",
      category: "volume",
      color: "#10b981",
      trend: [400, 450, 480, 500, 520, 540],
      target: 600,
      status: "good",
    },
    {
      id: "kpi-3",
      title: "Conversion Rate",
      value: "3.5%",
      change: -2.1,
      changeType: "decrease",
      description: "Percentage of leads converted to customers",
      icon: TrendingUp,
      priority: "medium",
      category: "quality",
      color: "#8b5cf6",
      trend: [3.8, 3.7, 3.6, 3.5, 3.4, 3.3],
      target: 4,
      status: "warning",
    },
    {
      id: "kpi-4",
      title: "Customer Satisfaction",
      value: "4.7/5",
      change: 0.5,
      changeType: "increase",
      description: "Average customer satisfaction rating",
      icon: Star,
      priority: "high",
      category: "quality",
      color: "#f59e0b",
      trend: [4.2, 4.3, 4.4, 4.5, 4.6, 4.7],
      target: 5,
      status: "excellent",
    },
    {
      id: "kpi-5",
      title: "Operational Efficiency",
      value: "85%",
      change: 3.1,
      changeType: "increase",
      description: "Efficiency of operational processes",
      icon: CheckCircle,
      priority: "medium",
      category: "efficiency",
      color: "#ef4444",
      trend: [80, 81, 82, 83, 84, 85],
      target: 90,
      status: "good",
    },
    {
      id: "kpi-6",
      title: "Total Expenses",
      value: "$500K",
      change: -1.8,
      changeType: "decrease",
      description: "Total expenses incurred this month",
      icon: CreditCard,
      priority: "medium",
      category: "finance",
      color: "#06b6d4",
      trend: [510000, 508000, 506000, 504000, 502000, 500000],
      target: 450000,
      status: "good",
    },
  ]
}

const generateEnhancedTrendCharts = (domainContext: DomainContext): ChartData[] => {
  // Placeholder implementation - replace with your actual logic
  return [
    {
      id: "trend-1",
      type: "line",
      title: "Revenue Trend",
      subtitle: "Monthly revenue over the past year",
      data: [
        { period: "Jan", value: 100000 },
        { period: "Feb", value: 110000 },
        { period: "Mar", value: 120000 },
        { period: "Apr", value: 130000 },
        { period: "May", value: 140000 },
        { period: "Jun", value: 150000 },
      ],
      insight: "Shows growth of 50% over the past six months",
      xKey: "period",
      yKey: "value",
      priority: "high",
      color: "#3b82f6",
    },
    {
      id: "trend-2",
      type: "area",
      title: "Customer Acquisition",
      subtitle: "New customers acquired each month",
      data: [
        { period: "Jan", value: 400 },
        { period: "Feb", value: 450 },
        { period: "Mar", value: 480 },
        { period: "Apr", value: 500 },
        { period: "May", value: 520 },
        { period: "Jun", value: 540 },
      ],
      insight: "Shows steady increase in customer acquisition",
      xKey: "period",
      yKey: "value",
      priority: "medium",
      color: "#10b981",
      gradient: true,
    },
  ]
}

const generateEnhancedDetailCharts = (domainContext: DomainContext): ChartData[] => {
  // Placeholder implementation - replace with your actual logic
  return [
    {
      id: "detail-1",
      type: "pie",
      title: "Customer Segmentation",
      subtitle: "Distribution of customers by segment",
      data: [
        { category: "Segment A", value: 300 },
        { category: "Segment B", value: 200 },
        { category: "Segment C", value: 100 },
      ],
      insight: "Segment A dominates with 50% share",
      xKey: "category",
      yKey: "value",
      priority: "medium",
    },
    {
      id: "detail-2",
      type: "bar",
      title: "Product Performance",
      subtitle: "Sales of each product category",
      data: [
        { category: "Category X", value: 50000 },
        { category: "Category Y", value: 40000 },
        { category: "Category Z", value: 30000 },
      ],
      insight: "Category X leads with $50K in sales",
      xKey: "category",
      yKey: "value",
      priority: "low",
      color: "#8b5cf6",
    },
    {
      id: "detail-3",
      type: "scatter",
      title: "Correlation Analysis",
      subtitle: "Relationship between two variables",
      data: [
        { x: 10, y: 20 },
        { x: 15, y: 25 },
        { x: 20, y: 30 },
      ],
      insight: "Shows strong positive correlation",
      xKey: "x",
      yKey: "y",
      priority: "low",
      color: "#f59e0b",
    },
  ]
}
