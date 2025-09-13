import { parseDataFile } from "./excel-parser"
import * as Stats from "./statistics"

export interface AnomalyDetection {
  column: string
  value: any
  rowIndex: number
  reason: string
  severity: "high" | "medium" | "low"
  zScore?: number
}

export interface DataCleaningSuggestion {
  column: string
  issue: string
  severity: "critical" | "warning" | "info"
  suggestion: string
  missingPercentage?: number
  dataTypeIssue?: boolean
  lowVariance?: boolean
}

export interface SmartColumnCard {
  column: string
  type: "numeric" | "categorical" | "date"
  mean?: number
  median?: number
  mode?: any
  nullPercentage: number
  outlierCount: number
  mostFrequentValue: any
  uniqueValues: number
  standardDeviation?: number
  skewness?: number
  kurtosis?: number
  distribution?: {
    bins: number[]
    frequencies: number[]
  }
  topCategories?: { value: string; count: number; percentage: number }[]
}

export interface ForecastResult {
  column: string
  predictions: number[]
  confidenceInterval: {
    lower: number[]
    upper: number[]
  }
  trend: "increasing" | "decreasing" | "stationary"
  explanation: string
  accuracy: number
}

export interface ScenarioSimulation {
  targetColumn: string
  changedFeatures: { [key: string]: number }
  predictedValue: number
  explanation: string
  confidence: number
  featureImpacts: { feature: string; impact: "positive" | "negative" | "neutral"; magnitude: number }[]
}

export interface NarrativeInsight {
  title: string
  summary: string
  keyFindings: string[]
  recommendations: string[]
  confidence: number
}

export interface AdvancedAnalysisResults {
  fileName: string
  smartColumnCards: SmartColumnCard[]
  anomalies: AnomalyDetection[]
  cleaningSuggestions: DataCleaningSuggestion[]
  narrativeInsights: NarrativeInsight[]
  forecasts: ForecastResult[]
  scenarioSimulations: ScenarioSimulation[]
}

// Helper function to detect anomalies
function detectAnomalies(data: any[], columns: string[]): AnomalyDetection[] {
  const anomalies: AnomalyDetection[] = []

  columns.forEach((column) => {
    const values = data.map((row) => row[column]).filter((v) => v !== null && v !== undefined)
    const columnType = getColumnType(data, column)

    if (columnType === "Number") {
      // Numeric anomaly detection using Z-score
      const numericValues = values.map((v) => Number(v)).filter((v) => !isNaN(v))
      if (numericValues.length < 3) return

      const mean = numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length
      const variance = numericValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / numericValues.length
      const stdDev = Math.sqrt(variance)

      if (stdDev === 0) return // No variation

      data.forEach((row, index) => {
        const value = Number(row[column])
        if (!isNaN(value)) {
          const zScore = Math.abs((value - mean) / stdDev)
          if (zScore > 3) {
            anomalies.push({
              column,
              value,
              rowIndex: index,
              reason: `Outlier (Z-Score: ${zScore.toFixed(2)})`,
              severity: zScore > 4 ? "high" : zScore > 3.5 ? "medium" : "low",
              zScore,
            })
          }
        }
      })
    } else if (columnType === "String") {
      // Categorical anomaly detection - rare categories
      const valueCounts = new Map<string, number>()
      values.forEach((value) => {
        const strValue = String(value)
        valueCounts.set(strValue, (valueCounts.get(strValue) || 0) + 1)
      })

      const totalCount = values.length
      const threshold = Math.max(1, Math.floor(totalCount * 0.02)) // 2% threshold

      data.forEach((row, index) => {
        const value = String(row[column] || "")
        const count = valueCounts.get(value) || 0
        if (count > 0 && count < threshold && value !== "") {
          anomalies.push({
            column,
            value,
            rowIndex: index,
            reason: `Rare category (${((count / totalCount) * 100).toFixed(1)}% frequency)`,
            severity: count === 1 ? "high" : "medium",
          })
        }
      })
    }
  })

  return anomalies
}

// Helper function to generate cleaning suggestions
function generateCleaningSuggestions(data: any[], columns: string[]): DataCleaningSuggestion[] {
  const suggestions: DataCleaningSuggestion[] = []

  columns.forEach((column) => {
    const values = data.map((row) => row[column])
    const nonNullValues = values.filter((v) => v !== null && v !== undefined && v !== "")
    const nullCount = values.length - nonNullValues.length
    const nullPercentage = (nullCount / values.length) * 100

    // Check for high missing values
    if (nullPercentage > 40) {
      suggestions.push({
        column,
        issue: `High missing values (${nullPercentage.toFixed(1)}%)`,
        severity: "critical",
        suggestion: "Consider dropping this column or imputing missing values using median/mode",
        missingPercentage: nullPercentage,
      })
    } else if (nullPercentage > 20) {
      suggestions.push({
        column,
        issue: `Moderate missing values (${nullPercentage.toFixed(1)}%)`,
        severity: "warning",
        suggestion: "Consider imputing missing values or investigate the pattern of missingness",
        missingPercentage: nullPercentage,
      })
    }

    // Check for mixed data types
    const types = new Set(nonNullValues.map((v) => typeof v))
    if (types.size > 1) {
      suggestions.push({
        column,
        issue: "Mixed data types detected",
        severity: "warning",
        suggestion: "Standardize data types - convert all values to the same type (number, string, etc.)",
        dataTypeIssue: true,
      })
    }

    // Check for low variance in numeric columns
    const columnType = getColumnType(data, column)
    if (columnType === "Number" && nonNullValues.length > 1) {
      const numericValues = nonNullValues.map((v) => Number(v)).filter((v) => !isNaN(v))
      if (numericValues.length > 1) {
        const mean = numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length
        const variance = numericValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / numericValues.length
        const stdDev = Math.sqrt(variance)

        if (stdDev < 0.01 * Math.abs(mean) || stdDev === 0) {
          suggestions.push({
            column,
            issue: "Very low variance detected",
            severity: "info",
            suggestion: "This column has little variation and may not be useful for analysis or modeling",
            lowVariance: true,
          })
        }
      }
    }

    // Check for string inconsistencies in categorical data
    if (columnType === "String" && nonNullValues.length > 1) {
      const stringValues = nonNullValues.map((v) => String(v).trim().toLowerCase())
      const uniqueValues = [...new Set(stringValues)]
      const similarValues = new Map<string, string[]>()

      // Group similar values (simple similarity check)
      uniqueValues.forEach((value) => {
        const similar = uniqueValues.filter((other) => {
          if (value === other) return false
          return (
            value.includes(other) ||
            other.includes(value) ||
            levenshteinDistance(value, other) <= Math.min(value.length, other.length) * 0.3
          )
        })
        if (similar.length > 0) {
          similarValues.set(value, similar)
        }
      })

      if (similarValues.size > 0) {
        suggestions.push({
          column,
          issue: "Potential categorical inconsistencies",
          severity: "warning",
          suggestion: "Check for typos, different cases, or similar categories that should be merged",
        })
      }
    }
  })

  return suggestions
}

// Helper function to create smart column cards
function createSmartColumnCards(data: any[], columns: string[]): SmartColumnCard[] {
  return columns.map((column) => {
    const values = data.map((row) => row[column])
    const nonNullValues = values.filter((v) => v !== null && v !== undefined && v !== "")
    const nullCount = values.length - nonNullValues.length
    const nullPercentage = (nullCount / values.length) * 100
    const columnType = getColumnType(data, column)

    // Count unique values
    const uniqueValues = [...new Set(nonNullValues)].length

    // Find most frequent value
    const valueCounts = new Map<any, number>()
    nonNullValues.forEach((value) => {
      valueCounts.set(value, (valueCounts.get(value) || 0) + 1)
    })
    const mostFrequentEntry = [...valueCounts.entries()].sort((a, b) => b[1] - a[1])[0]
    const mostFrequentValue = mostFrequentEntry ? mostFrequentEntry[0] : null

    const card: SmartColumnCard = {
      column,
      type: columnType === "Number" ? "numeric" : columnType === "Date" ? "date" : "categorical",
      nullPercentage,
      outlierCount: 0,
      mostFrequentValue,
      uniqueValues,
    }

    if (columnType === "Number") {
      const numericValues = nonNullValues.map((v) => Number(v)).filter((v) => !isNaN(v))
      if (numericValues.length > 0) {
        // Calculate statistics
        const sorted = [...numericValues].sort((a, b) => a - b)
        const mean = numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length
        const median = sorted[Math.floor(sorted.length / 2)]

        // Calculate standard deviation
        const variance = numericValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / numericValues.length
        const standardDeviation = Math.sqrt(variance)

        // Calculate skewness and kurtosis
        let skewness = 0
        let kurtosis = 0
        if (numericValues.length >= 3 && standardDeviation > 0) {
          const n = numericValues.length
          skewness =
            (n / ((n - 1) * (n - 2))) *
            numericValues.reduce((sum, val) => sum + Math.pow((val - mean) / standardDeviation, 3), 0)

          if (numericValues.length >= 4) {
            const a = (n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))
            const b = numericValues.reduce((sum, val) => sum + Math.pow((val - mean) / standardDeviation, 4), 0)
            const c = (3 * Math.pow(n - 1, 2)) / ((n - 2) * (n - 3))
            kurtosis = a * b - c
          }
        }

        // Count outliers using IQR method
        const q1 = sorted[Math.floor(sorted.length * 0.25)]
        const q3 = sorted[Math.floor(sorted.length * 0.75)]
        const iqr = q3 - q1
        const lowerBound = q1 - 1.5 * iqr
        const upperBound = q3 + 1.5 * iqr
        const outlierCount = numericValues.filter((v) => v < lowerBound || v > upperBound).length

        // Create histogram
        const { bins, frequencies } = Stats.calculateHistogram(numericValues, 10)

        card.mean = mean
        card.median = median
        card.mode = mostFrequentValue
        card.standardDeviation = standardDeviation
        card.skewness = skewness
        card.kurtosis = kurtosis
        card.outlierCount = outlierCount
        card.distribution = { bins, frequencies }
      }
    } else if (columnType === "String") {
      // For categorical data, get top categories
      const sortedCounts = [...valueCounts.entries()].sort((a, b) => b[1] - a[1])
      const topCategories = sortedCounts.slice(0, 10).map(([value, count]) => ({
        value: String(value),
        count,
        percentage: (count / nonNullValues.length) * 100,
      }))

      card.topCategories = topCategories
      card.mode = mostFrequentValue
    }

    return card
  })
}

// Helper function to generate simple forecasts
function generateSimpleForecasts(data: any[], numericColumns: string[]): ForecastResult[] {
  const forecasts: ForecastResult[] = []

  numericColumns.forEach((column) => {
    const values = data
      .map((row, index) => ({ value: Number(row[column]), index }))
      .filter((item) => !isNaN(item.value))

    if (values.length < 5) return // Need at least 5 data points

    // Simple trend analysis
    const n = values.length
    const sumX = values.reduce((sum, item) => sum + item.index, 0)
    const sumY = values.reduce((sum, item) => sum + item.value, 0)
    const sumXY = values.reduce((sum, item) => sum + item.index * item.value, 0)
    const sumXX = values.reduce((sum, item) => sum + item.index * item.index, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    // Generate predictions for next 3 periods
    const predictions: number[] = []
    const confidenceInterval = { lower: [] as number[], upper: [] as number[] }

    for (let i = 1; i <= 3; i++) {
      const nextIndex = n + i
      const prediction = slope * nextIndex + intercept
      predictions.push(prediction)

      // Simple confidence interval (±10% of the prediction)
      const margin = Math.abs(prediction * 0.1)
      confidenceInterval.lower.push(prediction - margin)
      confidenceInterval.upper.push(prediction + margin)
    }

    // Determine trend
    let trend: "increasing" | "decreasing" | "stationary" = "stationary"
    if (Math.abs(slope) > 0.01) {
      trend = slope > 0 ? "increasing" : "decreasing"
    }

    // Calculate simple accuracy based on recent trend consistency
    const recentValues = values.slice(-5).map((item) => item.value)
    const recentTrend = recentValues[recentValues.length - 1] - recentValues[0]
    const predictedTrend = predictions[predictions.length - 1] - values[values.length - 1].value
    const accuracy = Math.max(0, 100 - (Math.abs(recentTrend - predictedTrend) / Math.abs(recentTrend)) * 100)

    forecasts.push({
      column,
      predictions,
      confidenceInterval,
      trend,
      explanation: `Based on the ${trend} trend in your data, we predict the next 3 values will be ${predictions.map((p) => p.toFixed(2)).join(", ")}. The trend shows a ${slope > 0 ? "positive" : slope < 0 ? "negative" : "neutral"} slope of ${slope.toFixed(4)} per period.`,
      accuracy: Math.min(100, Math.max(0, accuracy)),
    })
  })

  return forecasts
}

// Helper functions
function getColumnType(data: any[], column: string): string {
  const values = data.map((row) => row[column]).filter((v) => v !== null && v !== undefined)

  // Check if it's a date
  const dateValues = values.filter((v) => {
    const date = new Date(v)
    return !isNaN(date.getTime())
  })
  if (dateValues.length > values.length * 0.8) return "Date"

  // Check if it's numeric
  const numericValues = values.filter((v) => !isNaN(Number(v)))
  if (numericValues.length > values.length * 0.8) return "Number"

  return "String"
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = []
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
      }
    }
  }
  return matrix[str2.length][str1.length]
}

// Main analysis function - updated to work with parsed data
export async function performAdvancedAnalysisFromData(
  fileName: string,
  data: any[],
  headers: string[],
  numericColumns: string[],
  categoricalColumns: string[],
): Promise<AdvancedAnalysisResults> {
  console.log(`Starting advanced analysis of ${fileName}`)

  try {
    console.log(`Analyzing ${data.length} rows with ${headers.length} columns`)

    const columns = headers

    // Generate smart column cards
    console.log("Generating smart column cards...")
    const smartColumnCards = createSmartColumnCards(data, columns)

    // Detect anomalies
    console.log("Detecting anomalies...")
    const anomalies = detectAnomalies(data, columns)

    // Generate cleaning suggestions
    console.log("Generating cleaning suggestions...")
    const cleaningSuggestions = generateCleaningSuggestions(data, columns)

    // Generate simple forecasts for numeric columns
    console.log("Generating forecasts...")
    const forecasts = generateSimpleForecasts(data, numericColumns)

    // Generate narrative insights (placeholder for now - will be enhanced with AI)
    const narrativeInsights: NarrativeInsight[] = [
      {
        title: "Data Quality Overview",
        summary: `Your dataset contains ${data.length} rows and ${columns.length} columns. ${anomalies.length} anomalies were detected across ${new Set(anomalies.map((a) => a.column)).size} columns.`,
        keyFindings: [
          `${numericColumns.length} numeric columns available for statistical analysis`,
          `${cleaningSuggestions.filter((s) => s.severity === "critical").length} critical data quality issues identified`,
          `${smartColumnCards.filter((c) => c.nullPercentage > 20).length} columns have significant missing values`,
        ],
        recommendations: [
          "Review and address critical data quality issues before proceeding with analysis",
          "Consider the impact of missing values on your analysis results",
          "Investigate detected anomalies to determine if they represent errors or genuine outliers",
        ],
        confidence: 95,
      },
    ]

    const results: AdvancedAnalysisResults = {
      fileName,
      smartColumnCards,
      anomalies,
      cleaningSuggestions,
      narrativeInsights,
      forecasts,
      scenarioSimulations: [], // Will be implemented with AI integration
    }

    console.log("Advanced analysis complete")
    return results
  } catch (error) {
    console.error("Error in advanced analysis:", error)
    throw error
  }
}

// Keep the original function for backward compatibility
export async function performAdvancedAnalysis(file: File): Promise<AdvancedAnalysisResults> {
  console.log(`Starting advanced analysis of ${file.name}`)

  try {
    // Parse the file
    const parsedData = await parseDataFile(file)
    console.log(`Successfully parsed ${parsedData.rows.length} rows with ${parsedData.headers.length} columns`)

    return performAdvancedAnalysisFromData(
      file.name,
      parsedData.rows,
      parsedData.headers,
      parsedData.numericColumns,
      parsedData.categoricalColumns,
    )
  } catch (error) {
    console.error("Error in advanced analysis:", error)
    throw error
  }
}
