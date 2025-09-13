"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
} from "recharts"
import {
  CheckCircle,
  AlertTriangle,
  Zap,
  Download,
  TrendingUp,
  BarChart3,
  PieChartIcon,
  LineChartIcon,
  Activity,
  Sliders,
  Brain,
  Users,
  DollarSign,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Database,
  Eye,
  FileText,
  Droplet,
  Lightbulb,
} from "lucide-react"
import { unifiedDataProcessor, type UnifiedProcessingResult } from "@/lib/unified-data-processor"
import { toast } from "@/components/ui/use-toast"
import { motion, AnimatePresence } from "framer-motion"
import { calculateCorrelation, calculateStatistics } from "@/lib/statistics"
import { AiInsights } from "@/components/ai-insights"
import type { DashboardContext } from "@/lib/api-types"

interface StatisticalInsight {
  id: string
  type: "correlation" | "outlier" | "trend" | "dominance" | "variance" | "distribution"
  title: string
  description: string
  severity: "info" | "warning" | "critical"
  timestamp: Date
  value?: number
  column?: string
}

interface ColumnSliderState {
  [columnName: string]: {
    value: number
    min: number
    max: number
    originalValue: number
    mean: number
    stdDev: number
  }
}

interface KPIMetric {
  title: string
  value: string | number
  change?: number
  changeType?: "increase" | "decrease" | "neutral"
  icon: any
  color: string
  trend?: number[]
}

interface RealDataPoint {
  [key: string]: number | string
}

interface ColumnInfo {
  name: string
  type: "numeric" | "categorical" | "text" | "date"
  isActive: boolean
  uniqueValues: number
  nullCount: number
  sampleValues: any[]
}

interface SuggestedDrop {
  column: string
  reason: string
  isSelected: boolean
  originalCorrelation?: number
}

// Enhanced column type detection with text support
const detectColumnType = (data: any[], columnName: string): "numeric" | "categorical" | "text" | "date" => {
  if (!data || data.length === 0) return "categorical"

  const values = data.map((row) => row[columnName]).filter((val) => val !== null && val !== undefined && val !== "")

  if (values.length === 0) return "categorical"

  // Check for dates first
  let dateCount = 0
  values.slice(0, Math.min(50, values.length)).forEach((val) => {
    const strVal = String(val).trim()
    const datePatterns = [
      /^\d{4}-\d{2}-\d{2}/, // YYYY-MM-DD
      /^\d{2}\/\d{2}\/\d{4}/, // MM/DD/YYYY
      /^\d{2}-\d{2}-\d{4}/, // MM-DD-YYYY
      /^\d{1,2}\/\d{1,2}\/\d{2,4}/, // M/D/YY or MM/DD/YYYY
      /^\d{4}\/\d{2}\/\d{2}/, // YYYY/MM/DD
    ]

    if (datePatterns.some((pattern) => pattern.test(strVal))) {
      const dateVal = new Date(strVal)
      if (!isNaN(dateVal.getTime()) && dateVal.getFullYear() > 1900 && dateVal.getFullYear() < 2100) {
        dateCount++
      }
    }
  })

  if (dateCount > values.length * 0.6) return "date"

  // Enhanced numeric detection
  let numericCount = 0
  values.slice(0, Math.min(100, values.length)).forEach((val) => {
    const strVal = String(val).trim()
    if (strVal === "") return

    // Remove common formatting (commas, currency symbols, percentages, spaces)
    const cleanVal = strVal.replace(/[$,%\s€£¥]/g, "").replace(/^$$(.+)$$$/, "-$1")
    const numVal = Number(cleanVal)

    if (!isNaN(numVal) && isFinite(numVal)) {
      numericCount++
    }
  })

  if (numericCount >= values.length * 0.75) return "numeric"

  // Check for text vs categorical
  const avgLength = values.reduce((sum, val) => sum + String(val).length, 0) / values.length
  const uniqueRatio = new Set(values).size / values.length

  // If average length > 20 characters or high uniqueness, consider it text
  if (avgLength > 20 || uniqueRatio > 0.8) return "text"

  return "categorical"
}

// Clean and extract numeric values
const cleanNumericValue = (val: any): number | null => {
  if (val === null || val === undefined) return null

  const strVal = String(val).trim()
  if (strVal === "" || strVal.toLowerCase() === "null" || strVal.toLowerCase() === "n/a") return null

  // Remove formatting and handle accounting notation
  const cleanVal = strVal.replace(/[$,%\s€£¥]/g, "").replace(/^$$(.+)$$$/, "-$1")
  const numVal = Number(cleanVal)

  return !isNaN(numVal) && isFinite(numVal) ? numVal : null
}

// Calculate linear regression coefficients
const calculateLinearRegression = (
  x: number[],
  y: number[],
): { slope: number; intercept: number; rSquared: number } => {
  const n = Math.min(x.length, y.length)
  if (n < 2) return { slope: 0, intercept: 0, rSquared: 0 }

  const meanX = x.slice(0, n).reduce((sum, val) => sum + val, 0) / n
  const meanY = y.slice(0, n).reduce((sum, val) => sum + val, 0) / n

  let numerator = 0
  let denominator = 0

  for (let i = 0; i < n; i++) {
    const deltaX = x[i] - meanX
    const deltaY = y[i] - meanY
    numerator += deltaX * deltaY
    denominator += deltaX * deltaX
  }

  const slope = denominator === 0 ? 0 : numerator / denominator
  const intercept = meanY - slope * meanX

  // Calculate R-squared
  const correlation = calculateCorrelation(x, y)
  const rSquared = correlation * correlation

  return { slope, intercept, rSquared }
}

// Get real categorical distribution
const getRealCategoricalDistribution = (data: any[], columnName: string) => {
  const values = data.map((row) => row[columnName]).filter((val) => val !== null && val !== undefined && val !== "")
  const counts = new Map<string, number>()

  values.forEach((val) => {
    const key = String(val)
    counts.set(key, (counts.get(key) || 0) + 1)
  })

  const total = values.length
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({
      name,
      value: count,
      percentage: ((count / total) * 100).toFixed(1),
    }))
}

// Get real numeric distribution
const getRealNumericDistribution = (data: any[], columnName: string, bins = 10) => {
  const values = data.map((row) => cleanNumericValue(row[columnName])).filter((val) => val !== null) as number[]

  if (values.length === 0) return []

  const min = Math.min(...values)
  const max = Math.max(...values)

  if (min === max) {
    return [{ range: `${min.toFixed(2)}`, count: values.length, binStart: min, binEnd: max }]
  }

  const binWidth = (max - min) / bins
  const binData = Array.from({ length: bins }, (_, i) => ({
    range: `${(min + i * binWidth).toFixed(1)}-${(min + (i + 1) * binWidth).toFixed(1)}`,
    count: 0,
    binStart: min + i * binWidth,
    binEnd: min + (i + 1) * binWidth,
  }))

  values.forEach((val) => {
    const binIndex = Math.min(Math.floor((val - min) / binWidth), bins - 1)
    if (binIndex >= 0) binData[binIndex].count++
  })

  return binData.filter((bin) => bin.count > 0)
}

// Function to suggest columns to drop based on correlation and other criteria
const suggestColumnsToDrop = (
  data: RealDataPoint[],
  columnInfos: ColumnInfo[],
  targetCol: string,
  columnStats: { [key: string]: { mean: number; stdDev: number; min: number; max: number; values: number[] } },
): SuggestedDrop[] => {
  const suggestions: SuggestedDrop[] = []
  const numericCols = columnInfos.filter((c) => c.type === "numeric" && c.isActive)
  const droppedCandidates = new Set<string>()

  // Step 1: Identify constant columns (variance = 0)
  numericCols.forEach((col) => {
    const stats = columnStats[col.name]
    if (stats && stats.stdDev === 0) {
      if (!droppedCandidates.has(col.name)) {
        suggestions.push({
          column: col.name,
          reason: `Column '${col.name}' has a constant value (standard deviation is 0), providing no predictive power.`,
          isSelected: true,
        })
        droppedCandidates.add(col.name)
      }
    }
  })

  // Step 2 & 3: Compute Correlation Matrix and Apply Threshold Logic
  const CORRELATION_THRESHOLD = 0.85

  // Calculate correlation with target for all active numeric columns
  const targetCorrelations: { [key: string]: number } = {}
  if (targetCol && columnStats[targetCol]) {
    const targetValues = columnStats[targetCol].values
    numericCols.forEach((col) => {
      if (col.name !== targetCol && columnStats[col.name]) {
        const colValues = columnStats[col.name].values
        const correlation = calculateCorrelation(colValues, targetValues)
        targetCorrelations[col.name] = correlation

        // Special check: Perfect correlation with target -> data leakage
        if (Math.abs(correlation) === 1 && !droppedCandidates.has(col.name)) {
          suggestions.push({
            column: col.name,
            reason: `Column '${col.name}' has a perfect correlation (${correlation.toFixed(2)}) with the target column '${targetCol}', indicating possible data leakage. Consider dropping it to prevent overfitting.`,
            isSelected: true,
            originalCorrelation: correlation,
          })
          droppedCandidates.add(col.name)
        }
      }
    })
  }

  // Iterate through pairs of active numeric columns for high inter-correlation
  for (let i = 0; i < numericCols.length; i++) {
    for (let j = i + 1; j < numericCols.length; j++) {
      const colA = numericCols[i].name
      const colB = numericCols[j].name

      if (colA === targetCol || colB === targetCol) continue
      if (droppedCandidates.has(colA) || droppedCandidates.has(colB)) continue

      const valuesA = columnStats[colA]?.values
      const valuesB = columnStats[colB]?.values

      if (!valuesA || !valuesB || valuesA.length === 0 || valuesB.length === 0) continue

      const correlation = calculateCorrelation(valuesA, valuesB)

      if (Math.abs(correlation) > CORRELATION_THRESHOLD) {
        let colToDrop = ""
        let reason = ""

        const corrAWithTarget = targetCorrelations[colA] !== undefined ? Math.abs(targetCorrelations[colA]) : -1
        const corrBWithTarget = targetCorrelations[colB] !== undefined ? Math.abs(targetCorrelations[colB]) : -1

        // Prioritize keeping the column with higher correlation to the target
        if (corrAWithTarget > corrBWithTarget) {
          colToDrop = colB
          reason = `Column '${colB}' is highly correlated (${correlation.toFixed(2)}) with '${colA}'. Since '${colA}' has a stronger relationship (correlation ${corrAWithTarget.toFixed(2)}) with the target column '${targetCol}', keeping '${colA}' is generally preferred.`
        } else if (corrBWithTarget > corrAWithTarget) {
          colToDrop = colA
          reason = `Column '${colA}' is highly correlated (${correlation.toFixed(2)}) with '${colB}'. Since '${colB}' has a stronger relationship (correlation ${corrBWithTarget.toFixed(2)}) with the target column '${targetCol}', keeping '${colB}' is generally preferred.`
        } else {
          // If target correlations are equal, use other criteria (e.g., missing values)
          const missingA = columnInfos.find((c) => c.name === colA)?.nullCount || 0
          const missingB = columnInfos.find((c) => c.name === colB)?.nullCount || 0

          if (missingA > missingB) {
            colToDrop = colA
            reason = `Column '${colA}' is highly correlated (${correlation.toFixed(2)}) with '${colB}'. Both have similar target correlation, but '${colA}' has more missing values (${missingA} vs ${missingB}).`
          } else {
            colToDrop = colB
            reason = `Column '${colB}' is highly correlated (${correlation.toFixed(2)}) with '${colA}'. Both have similar target correlation, but '${colB}' has more missing values (${missingB} vs ${missingA}).`
          }
        }

        if (colToDrop && !droppedCandidates.has(colToDrop)) {
          suggestions.push({
            column: colToDrop,
            reason: reason,
            isSelected: true,
            originalCorrelation: correlation,
          })
          droppedCandidates.add(colToDrop)
        }
      }
    }
  }

  return suggestions
}

interface EnhancedDataSummaryProps {
  data?: any[]
  fileName?: string
  numericColumns?: string[]
  categoricalColumns?: string[]
  dateColumns?: string[]
}

export function EnhancedDataSummary({
  data: propData,
  fileName: propFileName,
  numericColumns: propNumericColumns,
  categoricalColumns: propCategoricalColumns,
  dateColumns: propDateColumns,
}: EnhancedDataSummaryProps = {}) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingResults, setProcessingResults] = useState<UnifiedProcessingResult | null>(null)
  const [showProcessingDetails, setShowProcessingDetails] = useState(false)
  const [actualMissingCount, setActualMissingCount] = useState(0)

  // Interactive dashboard state
  const [sliderStates, setSliderStates] = useState<ColumnSliderState>({})
  const [insights, setInsights] = useState<StatisticalInsight[]>([])
  const [simulationMode, setSimulationMode] = useState(false)
  const [autoInsights, setAutoInsights] = useState(true)
  const [targetColumn, setTargetColumn] = useState<string>("")
  const [simulatedData, setSimulatedData] = useState<RealDataPoint[]>([])
  const [regressionModels, setRegressionModels] = useState<{
    [key: string]: { slope: number; intercept: number; rSquared: number }
  }>({})
  const [columnInfo, setColumnInfo] = useState<ColumnInfo[]>([])
  const [activeChartType, setActiveChartType] = useState<string>("auto")

  // State for column dropping feature
  const [suggestedDrops, setSuggestedDrops] = useState<SuggestedDrop[]>([])
  const [showDropSuggestionsDialog, setShowDropSuggestionsDialog] = useState(false)

  const [showAIChatbot, setShowAIChatbot] = useState(false)

  // Loading and error states
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Use refs to prevent infinite loops
  const initializedRef = useRef(false)
  const dataLoadedRef = useRef(false)

  // Get analysis results from session storage - memoized to prevent re-renders
  const results = useMemo(() => {
    if (typeof window === "undefined") return null

    try {
      const resultsString = sessionStorage.getItem("analysisResults")
      return resultsString ? JSON.parse(resultsString) : null
    } catch (error) {
      console.error("Error parsing analysis results:", error)
      setError("Failed to load analysis data")
      return null
    }
  }, []) // Empty dependency array - only run once

  // Memoized data processing - stable reference
  const processedData = useMemo(() => {
    if (propData && Array.isArray(propData) && propData.length > 0) {
      console.log(`Using prop data with ${propData.length} rows`)
      return propData
    }

    if (!results) {
      console.log("No results found in sessionStorage")
      return []
    }

    // Ensure we have data, prioritizing the main data over preview
    const data = results.rawData || results.rows || results.data || results.previewData || []

    // Additional validation to ensure we have actual data
    if (!Array.isArray(data) || data.length === 0) {
      console.warn("No valid data found in results:", results)
      return []
    }

    console.log(`Loaded ${data.length} rows from sessionStorage`)
    return data
  }, [results, propData])

  // Analyze all columns and their types - memoized with stable dependencies
  const fullColumnAnalysis = useMemo(() => {
    if (!processedData.length) {
      console.log("No processed data available for column analysis")
      return []
    }

    const firstRow = processedData[0]
    if (!firstRow || typeof firstRow !== "object") {
      console.warn("Invalid first row in processed data:", firstRow)
      return []
    }

    const columns = Object.keys(firstRow)
    console.log(`Analyzing ${columns.length} columns:`, columns)

    return columns.map((col) => {
      const type = detectColumnType(processedData, col)
      const values = processedData.map((row) => row[col])
      const nonNullValues = values.filter((v) => v !== null && v !== undefined && v !== "")
      const uniqueValues = new Set(nonNullValues).size
      const nullCount = values.length - nonNullValues.length

      return {
        name: col,
        type,
        isActive: true,
        uniqueValues,
        nullCount,
        sampleValues: [...new Set(nonNullValues)].slice(0, 3),
      }
    })
  }, [processedData])

  // Initialize data loading state
  useEffect(() => {
    if (!dataLoadedRef.current) {
      if (results && processedData.length > 0 && fullColumnAnalysis.length > 0) {
        setColumnInfo(fullColumnAnalysis)
        setIsLoading(false)
        dataLoadedRef.current = true

        // Set default target column
        const numericCols = fullColumnAnalysis.filter((col) => col.type === "numeric")
        if (numericCols.length > 0 && !targetColumn) {
          setTargetColumn(numericCols[0].name)
        }
      } else if (results && processedData.length === 0) {
        setError("No data found in the uploaded file")
        setIsLoading(false)
      } else if (!results) {
        setError("No analysis results found. Please upload a file first.")
        setIsLoading(false)
      }
    }
  }, [results, processedData.length, fullColumnAnalysis])

  // Get active columns only
  const activeColumns = useMemo(() => {
    return columnInfo.filter((col) => col.isActive)
  }, [columnInfo])

  // Separate columns by type (only active ones)
  const columnsByType = useMemo(() => {
    const numeric = activeColumns.filter((col) => col.type === "numeric")
    const categorical = activeColumns.filter((col) => col.type === "categorical")
    const text = activeColumns.filter((col) => col.type === "text")
    const date = activeColumns.filter((col) => col.type === "date")

    return { numeric, categorical, text, date }
  }, [activeColumns])

  // Calculate real statistics for active numeric columns
  const columnStats = useMemo(() => {
    const stats: { [key: string]: { mean: number; stdDev: number; min: number; max: number; values: number[] } } = {}

    columnsByType.numeric.forEach((col) => {
      const values = processedData
        .map((row) => cleanNumericValue(row[col.name]))
        .filter((val) => val !== null) as number[]

      if (values.length > 0) {
        const calculatedStats = calculateStatistics(values)
        stats[col.name] = {
          mean: calculatedStats.mean,
          stdDev: calculatedStats.stdDev,
          min: calculatedStats.min,
          max: calculatedStats.max,
          values: values,
        }
      }
    })

    return stats
  }, [processedData, columnsByType.numeric])

  // Build regression models - only when target column changes and we have stats
  useEffect(() => {
    if (!targetColumn || !columnStats[targetColumn] || Object.keys(columnStats).length === 0) return

    const models: { [key: string]: { slope: number; intercept: number; rSquared: number } } = {}
    const targetValues = columnStats[targetColumn].values

    columnsByType.numeric.forEach((col) => {
      if (col.name !== targetColumn && columnStats[col.name]) {
        const inputValues = columnStats[col.name].values
        const regression = calculateLinearRegression(inputValues, targetValues)
        models[col.name] = regression
      }
    })

    setRegressionModels(models)
  }, [targetColumn, columnStats, columnsByType.numeric])

  // Initialize slider states - only when we have column stats
  useEffect(() => {
    if (
      columnsByType.numeric.length > 0 &&
      processedData.length > 0 &&
      Object.keys(columnStats).length > 0 &&
      Object.keys(sliderStates).length === 0 // Only initialize once
    ) {
      const initialStates: ColumnSliderState = {}

      columnsByType.numeric.forEach((col) => {
        if (columnStats[col.name]) {
          const stats = columnStats[col.name]
          const range = stats.max - stats.min
          const buffer = range * 0.1

          initialStates[col.name] = {
            value: stats.mean,
            min: Math.max(stats.min - buffer, stats.min * 0.5),
            max: Math.min(stats.max + buffer, stats.max * 1.5),
            originalValue: stats.mean,
            mean: stats.mean,
            stdDev: stats.stdDev,
          }
        }
      })

      setSliderStates(initialStates)
    }
  }, [columnsByType.numeric, processedData.length, columnStats, sliderStates])

  // Generate real KPI metrics from actual data
  const kpiMetrics = useMemo((): KPIMetric[] => {
    if (!processedData.length) return []

    const metrics: KPIMetric[] = []
    const totalCells = processedData.length * activeColumns.length
    const missingPercentage = totalCells > 0 ? (actualMissingCount / totalCells) * 100 : 0

    // Total Records
    metrics.push({
      title: "Total Records",
      value: processedData.length.toLocaleString(),
      icon: Users,
      color: "bg-blue-500",
      changeType: "increase",
    })

    // Data Quality Score
    metrics.push({
      title: "Data Quality",
      value: `${(100 - missingPercentage).toFixed(1)}%`,
      changeType: missingPercentage > 5 ? "decrease" : "increase",
      icon: Target,
      color: missingPercentage > 5 ? "bg-red-500" : "bg-green-500",
    })

    // Active Columns
    metrics.push({
      title: "Active Columns",
      value: activeColumns.length,
      icon: BarChart3,
      color: "bg-green-500",
    })

    // Target Column Average (real value)
    if (targetColumn && columnStats[targetColumn]) {
      const targetStats = columnStats[targetColumn]
      const currentValue =
        simulationMode && simulatedData.length > 0
          ? simulatedData.reduce((sum, row) => sum + (cleanNumericValue(row[targetColumn]) || 0), 0) /
            simulatedData.length
          : targetStats.mean

      metrics.push({
        title: `Avg ${targetColumn}`,
        value: currentValue > 1000 ? `${(currentValue / 1000).toFixed(1)}K` : currentValue.toFixed(2),
        icon: DollarSign,
        color: "bg-purple-500",
        changeType: simulationMode ? (currentValue > targetStats.mean ? "increase" : "decrease") : "neutral",
      })
    }

    return metrics
  }, [processedData, activeColumns, actualMissingCount, targetColumn, columnStats, simulationMode, simulatedData])

  // Handle column activation/deactivation
  const toggleColumn = useCallback((columnName: string) => {
    setColumnInfo((prev) => prev.map((col) => (col.name === columnName ? { ...col, isActive: !col.isActive } : col)))
  }, [])

  // Handle slider changes with real mathematical relationships
  const handleSliderChange = useCallback(
    (column: string, value: number[]) => {
      const newValue = value[0]

      setSliderStates((prev) => ({
        ...prev,
        [column]: { ...prev[column], value: newValue },
      }))

      if (simulationMode && targetColumn && regressionModels[column] && processedData.length > 0) {
        // Calculate new target value using real regression model
        const model = regressionModels[column]
        const predictedTargetValue = model.slope * newValue + model.intercept

        // Create simulated dataset with updated values
        const newSimulatedData = processedData.map((row) => {
          const newRow = { ...row }
          newRow[column] = newValue

          // Update target column based on regression model
          if (column !== targetColumn) {
            newRow[targetColumn] = predictedTargetValue
          }

          return newRow
        })

        setSimulatedData(newSimulatedData)

        // Generate real insight about the change
        const originalValue = sliderStates[column]?.originalValue || 0
        const originalTargetValue = columnStats[targetColumn]?.mean || 0
        const targetChange =
          originalTargetValue !== 0
            ? (((predictedTargetValue - originalTargetValue) / originalTargetValue) * 100).toFixed(1)
            : "0"

        const insight: StatisticalInsight = {
          id: `simulation-${column}-${Date.now()}`,
          type: "trend",
          title: `What-If: Changing '${column}' to ${newValue.toFixed(2)}`,
          description: `This change predicts a ${targetChange}% impact on '${targetColumn}', moving its average to ${predictedTargetValue.toFixed(2)}. (R²=${model.rSquared.toFixed(3)})`,
          severity: Math.abs(Number.parseFloat(targetChange)) > 10 ? "warning" : "info",
          timestamp: new Date(),
          value: predictedTargetValue,
          column: `${column} → ${targetColumn}`,
        }

        if (autoInsights) {
          setInsights((prev) => [insight, ...prev.slice(0, 9)])
        }
      }
    },
    [simulationMode, processedData, sliderStates, targetColumn, regressionModels, columnStats, autoInsights],
  )

  // Count actual missing values - only run when data changes
  useEffect(() => {
    if (results && (results.data || results.previewData) && activeColumns.length > 0) {
      const data = results.data || results.previewData
      let missingCount = 0

      if (data && data.length > 0) {
        activeColumns.forEach((col) => {
          const missing = data.filter((row: any) => {
            const value = row[col.name]
            return (
              value === null ||
              value === undefined ||
              value === "" ||
              value === "null" ||
              value === "undefined" ||
              value === "N/A" ||
              value === "n/a" ||
              value === "#N/A" ||
              (typeof value === "string" && value.trim() === "") ||
              (typeof value === "string" && value.toLowerCase() === "nan") ||
              (typeof value === "number" && isNaN(value))
            )
          }).length
          missingCount += missing
        })
      }

      setActualMissingCount(missingCount)
    }
  }, [results, activeColumns])

  // Chart data preparation using real data
  const chartData = useMemo(() => {
    if (!processedData.length) return { trends: [], distributions: [], categories: [], scatterPlots: [] }

    const dataToUse = simulationMode && simulatedData.length > 0 ? simulatedData : processedData

    // Real trend data for target column
    const trends = targetColumn
      ? [
          {
            column: targetColumn,
            data: dataToUse
              .map((row, index) => ({
                index: index + 1,
                value: cleanNumericValue(row[targetColumn]) || 0,
                name: `Point ${index + 1}`,
              }))
              .slice(0, Math.min(100, dataToUse.length)),
          },
        ]
      : []

    // Real distribution data for numeric columns
    const distributions = columnsByType.numeric
      .filter((col) => col.name === targetColumn)
      .map((col) => ({
        column: col.name,
        data: getRealNumericDistribution(dataToUse, col.name),
      }))

    // Real category data with actual percentages
    const categories = columnsByType.categorical.slice(0, 1).map((col) => ({
      column: col.name,
      data: getRealCategoricalDistribution(dataToUse, col.name),
    }))

    // Scatter plots for numeric-numeric relationships
    const scatterPlots = targetColumn
      ? columnsByType.numeric
          .filter((col) => col.name !== targetColumn)
          .slice(0, 2)
          .map((col) => ({
            xColumn: col.name,
            yColumn: targetColumn,
            data: dataToUse
              .map((row) => ({
                x: cleanNumericValue(row[col.name]) || 0,
                y: cleanNumericValue(row[targetColumn]) || 0,
              }))
              .filter((point) => !isNaN(point.x) && !isNaN(point.y))
              .slice(0, 100),
          }))
      : []

    return { trends, distributions, categories, scatterPlots }
  }, [processedData, simulatedData, simulationMode, targetColumn, columnsByType])

  const handleUnifiedAutoFill = async () => {
    setIsProcessing(true)

    try {
      const rawData = results.data || results.previewData

      if (!rawData || rawData.length === 0) {
        throw new Error("❌ No data found! Please re-upload your dataset.")
      }

      const processingResult = unifiedDataProcessor(rawData)

      if (processingResult.totalMissingFilled === 0 && processingResult.totalOutliersFixed === 0) {
        toast({
          title: "ℹ️ Data Already Clean",
          description: "No missing values or outliers were found that needed correction.",
        })
        setIsProcessing(false)
        return
      }

      const updatedResults = {
        ...results,
        data: processingResult.processedData,
        previewData: processingResult.processedData.slice(0, 10),
        rawData: processingResult.processedData,
        missingValues: 0,
      }

      sessionStorage.setItem("analysisResults", JSON.stringify(updatedResults))
      setProcessingResults(processingResult)
      setShowProcessingDetails(true)
      setActualMissingCount(0)

      toast({
        title: "🎉 Data Processing Complete!",
        description: `${processingResult.totalMissingFilled} missing values filled, ${processingResult.totalOutliersFixed} outliers corrected!`,
      })

      // Reload to ensure all memoized values and states are reset with new data
      setTimeout(() => {
        window.location.reload()
      }, 4000)
    } catch (error) {
      console.error("❌ Processing error:", error)
      toast({
        title: "Processing Error",
        description: error instanceof Error ? error.message : "Failed to process data",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const displayMissingCount = results ? (actualMissingCount > 0 ? actualMissingCount : results.missingValues || 0) : 0

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D", "#FF6B6B", "#4ECDC4"]

  // Handlers for column dropping feature
  const handleSuggestColumnsToDrop = useCallback(() => {
    if (!processedData.length || !targetColumn) {
      toast({
        title: "Cannot Suggest Columns",
        description: "Please ensure data is loaded and a target column is selected.",
        variant: "destructive",
      })
      return
    }

    const suggestions = suggestColumnsToDrop(processedData, columnInfo, targetColumn, columnStats)
    setSuggestedDrops(suggestions)
    setShowDropSuggestionsDialog(true)
  }, [processedData, columnInfo, targetColumn, columnStats])

  const handleToggleSuggestedDrop = useCallback((columnName: string) => {
    setSuggestedDrops((prev) => prev.map((s) => (s.column === columnName ? { ...s, isSelected: !s.isSelected } : s)))
  }, [])

  const handleDropSelectedColumns = useCallback(() => {
    const columnsToDeactivate = suggestedDrops.filter((s) => s.isSelected).map((s) => s.column)
    setColumnInfo((prev) =>
      prev.map((col) => (columnsToDeactivate.includes(col.name) ? { ...col, isActive: false } : col)),
    )
    setShowDropSuggestionsDialog(false)
    setSuggestedDrops([])
    toast({
      title: "Columns Deactivated",
      description: `${columnsToDeactivate.length} column(s) have been removed from active analysis.`,
    })
  }, [suggestedDrops])

  // Prepare dashboard context for AI
  const dashboardContext: DashboardContext = useMemo(() => {
    const currentResults = results || {
      fileName: "N/A",
      rowCount: 0,
      columnCount: 0,
      missingValues: 0,
      duplicateRows: 0,
      columnStats: [],
      correlationMatrix: { labels: [], strongPairs: [] },
      histograms: [],
      boxPlots: [],
      regressionModels: [],
    }

    return {
      fileName: currentResults.fileName || "N/A",
      rowCount: processedData.length,
      columnCount: activeColumns.length,
      missingValuesCount: displayMissingCount,
      targetColumn: targetColumn,
      activeColumns: activeColumns.map((col) => ({ name: col.name, type: col.type })),
      numericColumns: columnsByType.numeric.map((col) => ({ name: col.name, type: col.type })),
      categoricalColumns: columnsByType.categorical.map((col) => ({ name: col.name, type: col.type })),
      textColumns: columnsByType.text.map((col) => ({ name: col.name, type: col.type })),
      dateColumns: columnsByType.date.map((col) => ({ name: col.name, type: col.type })),
      columnStats: columnStats,
      regressionModels: regressionModels,
      kpiMetrics: kpiMetrics,
      summary: {
        rowCount: currentResults.rowCount || 0,
        columnCount: currentResults.columnCount || 0,
        missingValues: currentResults.missingValues || 0,
        duplicateRows: currentResults.duplicateRows || 0,
        columns: Array.isArray(currentResults.columnStats)
          ? currentResults.columnStats.map((col: any) => ({
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
      correlations: currentResults.correlationMatrix
        ? {
            labels: currentResults.correlationMatrix.labels || [],
            strongPairs: currentResults.correlationMatrix.strongPairs || [],
          }
        : { labels: [], strongPairs: [] },
      distributions: Array.isArray(currentResults.histograms) ? currentResults.histograms : [],
      keyStats: {
        outlierCounts: Array.isArray(currentResults.boxPlots)
          ? currentResults.boxPlots.map((o: any) => ({
              column: o.column,
              outliers: Array.isArray(o.outliers) ? o.outliers.length : 0,
            }))
          : [],
        regressionModels: Array.isArray(currentResults.regressionModels)
          ? currentResults.regressionModels.map((model: any) => ({
              xColumn: model.xColumn,
              yColumn: model.yColumn,
              rSquared: model.rSquared,
              slope: model.slope,
              intercept: model.intercept,
            }))
          : [],
      },
    }
  }, [
    results,
    processedData.length,
    activeColumns,
    displayMissingCount,
    targetColumn,
    columnsByType,
    columnStats,
    regressionModels,
    kpiMetrics,
  ])

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard data...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="rounded-lg border bg-destructive/10 p-8">
            <h2 className="mb-4 text-2xl font-bold text-destructive">Error Loading Data</h2>
            <p className="mb-6">{error}</p>
            <Button onClick={() => (window.location.href = "/app/upload")}>Return to Upload</Button>
          </div>
        </div>
      </div>
    )
  }

  // No data state
  if (!results || processedData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Data Dashboard</CardTitle>
          <CardDescription>No data available for analysis</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with Controls */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Live Data Analytics Dashboard
              </CardTitle>
              <CardDescription>
                {results.fileName} • {processedData.length.toLocaleString()} rows • {activeColumns.length} active
                columns • {columnsByType.numeric.length} numeric, {columnsByType.categorical.length} categorical,{" "}
                {columnsByType.text.length} text
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="target-select" className="text-sm">
                  Target Column:
                </Label>
                <Select value={targetColumn} onValueChange={setTargetColumn}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Select target" />
                  </SelectTrigger>
                  <SelectContent>
                    {columnsByType.numeric.map((col) => (
                      <SelectItem key={col.name} value={col.name}>
                        {col.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="simulation-mode" checked={simulationMode} onCheckedChange={setSimulationMode} />
                <Label htmlFor="simulation-mode" className="text-sm">
                  What-If Mode
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="auto-insights" checked={autoInsights} onCheckedChange={setAutoInsights} />
                <Label htmlFor="auto-insights" className="text-sm">
                  Auto Insights
                </Label>
              </div>
              <Button
                onClick={() => {
                  setShowAIChatbot(true)
                }}
                className="rounded-full px-4 py-2 text-sm gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <Lightbulb className="h-4 w-4" /> Understand Dashboard
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* KPI Cards Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiMetrics.map((metric, index) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{metric.title}</p>
                    <p className="text-2xl font-bold mt-1">{metric.value}</p>
                    {metric.changeType && metric.changeType !== "neutral" && (
                      <div className="flex items-center gap-1 mt-2">
                        {metric.changeType === "increase" ? (
                          <ArrowUpRight className="h-3 w-3 text-green-500" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3 text-red-500" />
                        )}
                        <span
                          className={`text-xs font-medium ${
                            metric.changeType === "increase" ? "text-green-500" : "text-red-500"
                          }`}
                        >
                          {metric.changeType === "increase" ? "Increased" : "Decreased"}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className={`p-2 rounded-lg ${metric.color}`}>
                    <metric.icon className="h-4 w-4 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid gap-4 lg:grid-cols-12">
        {/* Left Column - Column Management & Controls */}
        <div className="lg:col-span-3 space-y-4">
          {/* Column Management */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Database className="h-4 w-4" />
                Column Management
              </CardTitle>
              <CardDescription className="text-xs">
                Select columns to include in analysis ({activeColumns.length}/{columnInfo.length} active)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px] pr-2">
                <div className="space-y-2">
                  {columnInfo.map((col) => (
                    <div key={col.name} className="flex items-center justify-between p-2 rounded border">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Checkbox
                          checked={col.isActive}
                          onCheckedChange={() => toggleColumn(col.name)}
                          className="flex-shrink-0"
                        />
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Badge
                            variant="outline"
                            className={`text-xs px-1 py-0 flex-shrink-0 ${
                              col.type === "numeric"
                                ? "border-green-200 text-green-700"
                                : col.type === "categorical"
                                  ? "border-blue-200 text-blue-700"
                                  : col.type === "text"
                                    ? "border-purple-200 text-purple-700"
                                    : "border-orange-200 text-orange-700"
                            }`}
                          >
                            {col.type === "numeric"
                              ? "NUM"
                              : col.type === "categorical"
                                ? "CAT"
                                : col.type === "text"
                                  ? "TXT"
                                  : "DATE"}
                          </Badge>
                          <span
                            className={`truncate text-sm font-medium ${
                              col.name === targetColumn ? "text-purple-700 dark:text-purple-300" : ""
                            }`}
                            title={col.name}
                          >
                            {col.name}
                          </span>
                          {col.name === targetColumn && (
                            <Badge variant="secondary" className="text-xs px-1 py-0 flex-shrink-0">
                              TARGET
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                        <span>{col.uniqueValues}</span>
                        {col.nullCount > 0 && <AlertTriangle className="h-3 w-3 text-yellow-500" />}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <Button
                onClick={handleSuggestColumnsToDrop}
                size="sm"
                className="w-full mt-4 gap-2 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700"
              >
                <Droplet className="h-3 w-3" />
                Suggest Columns to Drop
              </Button>
            </CardContent>
          </Card>

          {/* What-If Controls */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sliders className="h-4 w-4" />
                What-If Controls
              </CardTitle>
              <CardDescription className="text-xs">
                {simulationMode
                  ? `Live simulation mode (${columnsByType.numeric.length} columns) → ${targetColumn}`
                  : "Enable What-If Mode to start"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] pr-2">
                <div className="space-y-3">
                  {columnsByType.numeric
                    .filter((col) => col.name !== targetColumn)
                    .map((col) => {
                      const sliderState = sliderStates[col.name]
                      if (!sliderState) return null

                      const regressionModel = regressionModels[col.name]
                      const hasStrongRelation = regressionModel && Math.abs(regressionModel.rSquared) > 0.1

                      return (
                        <div key={col.name} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <Label className="text-xs font-medium truncate max-w-[80px]" title={col.name}>
                                {col.name}
                              </Label>
                              {hasStrongRelation && (
                                <Badge variant="outline" className="text-xs px-1 py-0">
                                  R²={regressionModel.rSquared.toFixed(2)}
                                </Badge>
                              )}
                            </div>
                            <Badge variant="outline" className="text-xs px-1 py-0">
                              {sliderState.value.toFixed(2)}
                            </Badge>
                          </div>
                          <Slider
                            value={[sliderState.value]}
                            onValueChange={(value) => handleSliderChange(col.name, value)}
                            min={sliderState.min}
                            max={sliderState.max}
                            step={(sliderState.max - sliderState.min) / 100}
                            disabled={!simulationMode}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{sliderState.min.toFixed(1)}</span>
                            <span>μ={sliderState.mean.toFixed(1)}</span>
                            <span>{sliderState.max.toFixed(1)}</span>
                          </div>
                          {regressionModel && simulationMode && (
                            <div className="text-xs text-muted-foreground">
                              Impact on {targetColumn}: {regressionModel.slope > 0 ? "+" : ""}
                              {regressionModel.slope.toFixed(3)} × {col.name}
                            </div>
                          )}
                        </div>
                      )
                    })}

                  {columnsByType.numeric.length <= 1 && (
                    <div className="text-center py-6 text-muted-foreground">
                      <Sliders className="h-6 w-6 mx-auto mb-2 opacity-50" />
                      <p className="text-xs">Need at least 2 numeric columns</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Live Insights */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Brain className="h-4 w-4" />
                Live Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px] pr-2">
                <div className="space-y-2">
                  <AnimatePresence>
                    {insights.slice(0, 5).map((insight) => (
                      <motion.div
                        key={insight.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className={`p-2 rounded-md border text-xs ${
                          insight.severity === "critical"
                            ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950"
                            : insight.severity === "warning"
                              ? "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950"
                              : "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {insight.type === "correlation" && <TrendingUp className="h-3 w-3 mt-0.5 flex-shrink-0" />}
                          {insight.type === "outlier" && <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />}
                          {insight.type === "trend" && <LineChartIcon className="h-3 w-3 mt-0.5 flex-shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{insight.title}</p>
                            <p className="text-muted-foreground text-xs mt-1 line-clamp-2">{insight.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {insight.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {insights.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground">
                      <Brain className="h-6 w-6 mx-auto mb-2 opacity-50" />
                      <p className="text-xs">No insights yet</p>
                      <p className="text-xs">Interact with controls</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Center Column - Main Charts */}
        <div className="lg:col-span-6 space-y-4">
          {/* Chart Type Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-4 w-4" />
                Real Data Visualizations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeChartType} onValueChange={setActiveChartType}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="auto">Auto</TabsTrigger>
                  <TabsTrigger value="numeric">Numeric</TabsTrigger>
                  <TabsTrigger value="categorical">Categories</TabsTrigger>
                  <TabsTrigger value="relationships">Relations</TabsTrigger>
                </TabsList>

                <TabsContent value="auto" className="space-y-4 mt-4">
                  {/* Trend Analysis */}
                  {chartData.trends.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm">
                          <LineChartIcon className="h-4 w-4" />
                          Real Trend Analysis - {chartData.trends[0].column}
                          {simulationMode && (
                            <Badge variant="outline" className="text-xs">
                              SIMULATED
                            </Badge>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[200px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData.trends[0].data}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                              <YAxis tick={{ fontSize: 10 }} />
                              <Tooltip />
                              <Area
                                type="monotone"
                                dataKey="value"
                                stroke={simulationMode ? "#ff6b6b" : "#8884d8"}
                                fill={simulationMode ? "#ff6b6b" : "#8884d8"}
                                fillOpacity={0.3}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Real Categories with Actual Percentages */}
                  {chartData.categories.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm">
                          <PieChartIcon className="h-4 w-4" />
                          Real Categories - {chartData.categories[0].column}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[200px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={chartData.categories[0].data}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percentage }) => `${name}: ${percentage}%`}
                                outerRadius={60}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {chartData.categories[0].data.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip
                                formatter={(value, name, props) => [
                                  `${value} records`,
                                  `${props.payload.percentage}% ${name}`,
                                ]}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="numeric" className="space-y-4 mt-4">
                  {/* Distribution Chart */}
                  {chartData.distributions.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm">
                          <BarChart3 className="h-4 w-4" />
                          Real Distribution - {chartData.distributions[0].column}
                          {simulationMode && (
                            <Badge variant="outline" className="text-xs">
                              SIMULATED
                            </Badge>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[200px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData.distributions[0].data}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                              <YAxis tick={{ fontSize: 10 }} />
                              <Tooltip />
                              <Bar dataKey="count" fill={simulationMode ? "#ff6b6b" : "#00C49F"} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  {chartData.distributions.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground">
                      <BarChart3 className="h-6 w-6 mx-auto mb-2 opacity-50" />
                      <p className="text-xs">No numeric distribution to display.</p>
                      <p className="text-xs">Ensure a numeric target column is selected.</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="categorical" className="space-y-4 mt-4">
                  {/* Categorical Analysis */}
                  {chartData.categories.length > 0 && (
                    <div className="space-y-4">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-2 text-sm">
                            <BarChart3 className="h-4 w-4" />
                            Category Distribution - {chartData.categories[0].column}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={chartData.categories[0].data} layout="horizontal">
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" tick={{ fontSize: 10 }} />
                                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={60} />
                                <Tooltip
                                  formatter={(value, name, props) => [
                                    `${value} records`,
                                    `${props.payload.percentage}% ${name}`,
                                  ]}
                                />
                                <Bar dataKey="value" fill="#8884d8" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-2 text-sm">
                            <PieChartIcon className="h-4 w-4" />
                            Category Proportions - {chartData.categories[0].column}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={chartData.categories[0].data}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                                  outerRadius={60}
                                  fill="#8884d8"
                                  dataKey="value"
                                >
                                  {chartData.categories[0].data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip
                                  formatter={(value, name, props) => [
                                    `${value} records`,
                                    `${props.payload.percentage}% ${name}`,
                                  ]}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                  {chartData.categories.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground">
                      <PieChartIcon className="h-6 w-6 mx-auto mb-2 opacity-50" />
                      <p className="text-xs">No categorical data to display.</p>
                      <p className="text-xs">Ensure active categorical columns exist.</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="relationships" className="space-y-4 mt-4">
                  {/* Scatter Plots for Numeric-Numeric Relationships */}
                  {chartData.scatterPlots.length > 0 && (
                    <div className="space-y-4">
                      {chartData.scatterPlots.map((scatter, index) => (
                        <Card key={index}>
                          <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-sm">
                              <Activity className="h-4 w-4" />
                              {scatter.xColumn} vs {scatter.yColumn}
                              {regressionModels[scatter.xColumn] && (
                                <Badge variant="outline" className="text-xs">
                                  R²={regressionModels[scatter.xColumn].rSquared.toFixed(3)}
                                </Badge>
                              )}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="h-[200px]">
                              <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart data={scatter.data}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="x" name={scatter.xColumn} tick={{ fontSize: 10 }} />
                                  <YAxis dataKey="y" name={scatter.yColumn} tick={{ fontSize: 10 }} />
                                  <Tooltip
                                    formatter={(value, name) => [
                                      value,
                                      name === "x" ? scatter.xColumn : scatter.yColumn,
                                    ]}
                                  />
                                  <Scatter dataKey="y" fill="#8884d8" />
                                </ScatterChart>
                              </ResponsiveContainer>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* Regression Analysis */}
                  {targetColumn && Object.keys(regressionModels).length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm">
                          <Activity className="h-4 w-4" />
                          Regression Models for {targetColumn}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {Object.entries(regressionModels)
                            .filter(([_, model]) => Math.abs(model.rSquared) > 0.05)
                            .sort(([_, a], [__, b]) => Math.abs(b.rSquared) - Math.abs(a.rSquared))
                            .slice(0, 5)
                            .map(([col, model]) => (
                              <div key={col} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    R²={model.rSquared.toFixed(3)}
                                  </Badge>
                                  <span className="font-medium">{col}</span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {targetColumn} = {model.slope.toFixed(3)} × {col} + {model.intercept.toFixed(2)}
                                </div>
                              </div>
                            ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  {chartData.scatterPlots.length === 0 && Object.keys(regressionModels).length === 0 && (
                    <div className="text-center py-6 text-muted-foreground">
                      <Activity className="h-6 w-6 mx-auto mb-2 opacity-50" />
                      <p className="text-xs">No relationships to display.</p>
                      <p className="text-xs">Ensure multiple numeric columns are active and a target is selected.</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Data Quality & Summary */}
        <div className="lg:col-span-3 space-y-4">
          {/* Data Quality Overview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-4 w-4" />
                Data Quality
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Missing Values</span>
                    <span className="font-medium">{displayMissingCount.toLocaleString()}</span>
                  </div>
                  <Progress
                    value={100 - (displayMissingCount / (processedData.length * activeColumns.length || 1)) * 100}
                    className="h-2"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Numeric Columns</span>
                    <span className="font-medium">{columnsByType.numeric.length}</span>
                  </div>
                  <Progress
                    value={(columnsByType.numeric.length / (activeColumns.length || 1)) * 100}
                    className="h-2"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Categorical Columns</span>
                    <span className="font-medium">{columnsByType.categorical.length}</span>
                  </div>
                  <Progress
                    value={(columnsByType.categorical.length / (activeColumns.length || 1)) * 100}
                    className="h-2"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Text Columns</span>
                    <span className="font-medium">{columnsByType.text.length}</span>
                  </div>
                  <Progress value={(columnsByType.text.length / (activeColumns.length || 1)) * 100} className="h-2" />
                </div>
              </div>

              {displayMissingCount > 0 && (
                <Button
                  onClick={handleUnifiedAutoFill}
                  disabled={isProcessing}
                  size="sm"
                  className="w-full gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  {isProcessing ? (
                    <div className="flex items-center">
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span className="ml-2">Processing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Zap className="h-3 w-3" />
                      <span className="ml-2">Auto-Fill Missing Values</span>
                    </div>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Column Type Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4" />
                Column Types Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {columnsByType.numeric.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="border-green-200 text-green-700">
                        NUMERIC ({columnsByType.numeric.length})
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      {columnsByType.numeric.slice(0, 3).map((col) => (
                        <div key={col.name} className="flex justify-between">
                          <span className="truncate">{col.name}</span>
                          <span>{col.uniqueValues} unique</span>
                        </div>
                      ))}
                      {columnsByType.numeric.length > 3 && (
                        <div className="text-center">+{columnsByType.numeric.length - 3} more</div>
                      )}
                    </div>
                  </div>
                )}

                {columnsByType.categorical.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="border-blue-200 text-blue-700">
                        CATEGORICAL ({columnsByType.categorical.length})
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      {columnsByType.categorical.slice(0, 3).map((col) => (
                        <div key={col.name} className="flex justify-between">
                          <span className="truncate">{col.name}</span>
                          <span>{col.uniqueValues} categories</span>
                        </div>
                      ))}
                      {columnsByType.categorical.length > 3 && (
                        <div className="text-center">+{columnsByType.categorical.length - 3} more</div>
                      )}
                    </div>
                  </div>
                )}

                {columnsByType.text.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="border-purple-200 text-purple-700">
                        TEXT ({columnsByType.text.length})
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      {columnsByType.text.slice(0, 3).map((col) => (
                        <div key={col.name} className="flex justify-between">
                          <span className="truncate">{col.name}</span>
                          <span>{col.uniqueValues} unique</span>
                        </div>
                      ))}
                      {columnsByType.text.length > 3 && (
                        <div className="text-center">+{columnsByType.text.length - 3} more</div>
                      )}
                    </div>
                  </div>
                )}

                {columnsByType.date.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="border-orange-200 text-orange-700">
                        DATE ({columnsByType.date.length})
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      {columnsByType.date.slice(0, 3).map((col) => (
                        <div key={col.name} className="flex justify-between">
                          <span className="truncate">{col.name}</span>
                          <span>{col.uniqueValues} unique</span>
                        </div>
                      ))}
                      {columnsByType.date.length > 3 && (
                        <div className="text-center">+{columnsByType.date.length - 3} more</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Sample Data Preview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Eye className="h-4 w-4" />
                Sample Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px] pr-2">
                <div className="space-y-2">
                  {processedData.slice(0, 5).map((row, index) => (
                    <div key={index} className="p-2 bg-muted rounded text-xs">
                      <div className="font-medium mb-1">Row {index + 1}</div>
                      <div className="space-y-1">
                        {activeColumns.slice(0, 3).map((col) => (
                          <div key={col.name} className="flex justify-between">
                            <span className="text-muted-foreground truncate max-w-[60px]">{col.name}:</span>
                            <span className="truncate max-w-[80px]" title={String(row[col.name])}>
                              {String(row[col.name] || "null")}
                            </span>
                          </div>
                        ))}
                        {activeColumns.length > 3 && (
                          <div className="text-center text-muted-foreground">
                            +{activeColumns.length - 3} more columns
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Processing Results */}
      {showProcessingDetails && processingResults && (
        <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 dark:border-green-800 dark:from-green-950 dark:to-emerald-950">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <CheckCircle className="h-5 w-5" />🎉 Data Processing Complete!
            </CardTitle>
            <CardDescription className="text-green-600 dark:text-green-400">
              ✅ {processingResults.totalMissingFilled} missing values filled • 🎯{" "}
              {processingResults.totalOutliersFixed} outliers corrected
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => {
                toast({
                  title: "Download Started",
                  description: "Your cleaned dataset is being prepared for download.",
                })
              }}
              className="w-full gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
            >
              <Download className="h-4 w-4" />
              Download Cleaned Dataset (CSV)
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Dialog for Suggested Columns to Drop */}
      <Dialog open={showDropSuggestionsDialog} onOpenChange={setShowDropSuggestionsDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Droplet className="h-5 w-5" />
              Suggested Columns to Deactivate
            </DialogTitle>
            <DialogDescription>
              Based on correlation and data quality, these columns are suggested for deactivation to improve model
              performance and reduce redundancy. You can select/deselect before confirming.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-4 py-2">
              {suggestedDrops.length > 0 ? (
                suggestedDrops.map((suggestion) => (
                  <div key={suggestion.column} className="flex items-start space-x-3 p-3 border rounded-md">
                    <Checkbox
                      id={`drop-${suggestion.column}`}
                      checked={suggestion.isSelected}
                      onCheckedChange={() => handleToggleSuggestedDrop(suggestion.column)}
                      className="mt-1"
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor={`drop-${suggestion.column}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {suggestion.column}
                        {suggestion.originalCorrelation !== undefined && (
                          <Badge variant="outline" className="ml-2 text-xs px-1 py-0">
                            Corr: {suggestion.originalCorrelation.toFixed(2)}
                          </Badge>
                        )}
                      </label>
                      <p className="text-sm text-muted-foreground">{suggestion.reason}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  <CheckCircle className="h-8 w-8 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No columns suggested for deactivation at this time.</p>
                  <p className="text-xs">Your active numeric columns appear to be well-suited for analysis.</p>
                </div>
              )}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDropSuggestionsDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleDropSelectedColumns}
              disabled={suggestedDrops.filter((s) => s.isSelected).length === 0}
            >
              Deactivate Selected Columns
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AiInsights
        initialPromptType="dashboard_understanding"
        dashboardContext={dashboardContext}
        isOpen={showAIChatbot}
        onClose={() => setShowAIChatbot(false)}
      />
    </div>
  )
}
