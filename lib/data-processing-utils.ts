// Enhanced data processing utilities with better column type detection

export interface ColumnStats {
  name: string
  type: "numeric" | "categorical" | "date"
  count: number
  missing: number
  unique: number
  min?: number | string
  max?: number | string
  mean?: number
  median?: number
  stdDev?: number
  sampleValues: any[]
}

// Clean and parse numeric values with better formatting support
export const cleanNumericValue = (val: any): number | null => {
  if (val === null || val === undefined) return null

  const strVal = String(val).trim()
  if (strVal === "" || strVal.toLowerCase() === "null" || strVal.toLowerCase() === "n/a") return null

  // Remove common formatting: commas, currency symbols, percentages, spaces
  const cleanVal = strVal.replace(/[$,%\s€£¥]/g, "")

  // Handle parentheses for negative numbers (accounting format)
  const withNegatives = cleanVal.replace(/^$$(.+)$$$/, "-$1")

  const numVal = Number(withNegatives)
  return !isNaN(numVal) && isFinite(numVal) ? numVal : null
}

// Enhanced column type detection
export const getColumnType = (data: any[], columnName: string): "numeric" | "categorical" | "date" => {
  if (!data || data.length === 0) return "categorical"

  const values = data.map((row) => row[columnName]).filter((val) => val !== null && val !== undefined && val !== "")

  if (values.length === 0) return "categorical"

  // Sample size for type detection (performance optimization)
  const sampleSize = Math.min(100, values.length)
  const sample = values.slice(0, sampleSize)

  // Check for dates first
  let dateCount = 0
  sample.forEach((val) => {
    const strVal = String(val).trim()

    // Common date patterns
    const datePatterns = [
      /^\d{4}-\d{2}-\d{2}/, // YYYY-MM-DD
      /^\d{2}\/\d{2}\/\d{4}/, // MM/DD/YYYY
      /^\d{2}-\d{2}-\d{4}/, // MM-DD-YYYY
      /^\d{1,2}\/\d{1,2}\/\d{2,4}/, // M/D/YY or MM/DD/YYYY
      /^\d{4}\/\d{2}\/\d{2}/, // YYYY/MM/DD
    ]

    const hasDatePattern = datePatterns.some((pattern) => pattern.test(strVal))

    if (hasDatePattern) {
      const dateVal = new Date(strVal)
      if (!isNaN(dateVal.getTime()) && dateVal.getFullYear() > 1900 && dateVal.getFullYear() < 2100) {
        dateCount++
      }
    }
  })

  // If 60% or more values match date patterns, consider it a date column
  if (dateCount >= sample.length * 0.6) return "date"

  // Check for numeric values
  let numericCount = 0
  sample.forEach((val) => {
    const cleanedVal = cleanNumericValue(val)
    if (cleanedVal !== null) {
      numericCount++
    }
  })

  // If 70% or more values are numeric, consider it numeric
  return numericCount >= sample.length * 0.7 ? "numeric" : "categorical"
}

// Calculate comprehensive column statistics
export const calculateColumnStats = (data: any[], columnName: string): ColumnStats => {
  const values = data.map((row) => row[columnName])
  const nonNullValues = values.filter((v) => v !== null && v !== undefined && v !== "")
  const type = getColumnType(data, columnName)

  const stats: ColumnStats = {
    name: columnName,
    type,
    count: nonNullValues.length,
    missing: data.length - nonNullValues.length,
    unique: new Set(nonNullValues).size,
    sampleValues: [...new Set(nonNullValues)].slice(0, 5),
  }

  if (type === "numeric") {
    const numericValues = nonNullValues.map((val) => cleanNumericValue(val)).filter((val) => val !== null) as number[]

    if (numericValues.length > 0) {
      const sorted = [...numericValues].sort((a, b) => a - b)
      const sum = numericValues.reduce((acc, val) => acc + val, 0)
      const mean = sum / numericValues.length

      stats.min = Math.min(...numericValues)
      stats.max = Math.max(...numericValues)
      stats.mean = mean
      stats.median = sorted[Math.floor(sorted.length / 2)]

      // Calculate standard deviation
      const variance = numericValues.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / numericValues.length
      stats.stdDev = Math.sqrt(variance)
    }
  } else if (type === "date") {
    const dateValues = nonNullValues.map((val) => new Date(val)).filter((date) => !isNaN(date.getTime()))

    if (dateValues.length > 0) {
      const timestamps = dateValues.map((date) => date.getTime())
      const minDate = new Date(Math.min(...timestamps))
      const maxDate = new Date(Math.max(...timestamps))

      stats.min = minDate.toISOString().split("T")[0]
      stats.max = maxDate.toISOString().split("T")[0]
    }
  } else {
    // For categorical data, find most/least frequent values
    const valueCounts = new Map()
    nonNullValues.forEach((val) => {
      const key = String(val)
      valueCounts.set(key, (valueCounts.get(key) || 0) + 1)
    })

    const sortedCounts = [...valueCounts.entries()].sort((a, b) => b[1] - a[1])
    if (sortedCounts.length > 0) {
      stats.min = sortedCounts[sortedCounts.length - 1][0] // Least frequent
      stats.max = sortedCounts[0][0] // Most frequent
    }
  }

  return stats
}

// Detect outliers using IQR method
export const detectOutliers = (values: number[]): { outliers: number[]; bounds: { lower: number; upper: number } } => {
  if (values.length < 4) return { outliers: [], bounds: { lower: 0, upper: 0 } }

  const sorted = [...values].sort((a, b) => a - b)
  const q1 = sorted[Math.floor(sorted.length * 0.25)]
  const q3 = sorted[Math.floor(sorted.length * 0.75)]
  const iqr = q3 - q1
  const lowerBound = q1 - 1.5 * iqr
  const upperBound = q3 + 1.5 * iqr

  const outliers = values.filter((val) => val < lowerBound || val > upperBound)

  return {
    outliers,
    bounds: { lower: lowerBound, upper: upperBound },
  }
}

// Calculate correlation between two numeric arrays
export const calculateCorrelation = (x: number[], y: number[]): number => {
  const n = Math.min(x.length, y.length)
  if (n < 2) return 0

  const meanX = x.slice(0, n).reduce((sum, val) => sum + val, 0) / n
  const meanY = y.slice(0, n).reduce((sum, val) => sum + val, 0) / n

  let numerator = 0
  let sumXSquared = 0
  let sumYSquared = 0

  for (let i = 0; i < n; i++) {
    const deltaX = x[i] - meanX
    const deltaY = y[i] - meanY
    numerator += deltaX * deltaY
    sumXSquared += deltaX * deltaX
    sumYSquared += deltaY * deltaY
  }

  const denominator = Math.sqrt(sumXSquared * sumYSquared)
  return denominator === 0 ? 0 : numerator / denominator
}

// Generate histogram bins for numeric data
export const generateHistogramBins = (
  values: number[],
  binCount = 10,
): Array<{ range: string; count: number; binStart: number; binEnd: number }> => {
  if (values.length === 0) return []

  const min = Math.min(...values)
  const max = Math.max(...values)

  if (min === max) {
    return [{ range: `${min}`, count: values.length, binStart: min, binEnd: max }]
  }

  const binWidth = (max - min) / binCount
  const bins = Array.from({ length: binCount }, (_, i) => ({
    range: `${(min + i * binWidth).toFixed(1)}-${(min + (i + 1) * binWidth).toFixed(1)}`,
    count: 0,
    binStart: min + i * binWidth,
    binEnd: min + (i + 1) * binWidth,
  }))

  values.forEach((val) => {
    const binIndex = Math.min(Math.floor((val - min) / binWidth), binCount - 1)
    if (binIndex >= 0) bins[binIndex].count++
  })

  return bins
}
