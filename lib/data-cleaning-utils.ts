import { calculateStatistics, calculateQuantiles } from "@/lib/statistics" // Assuming calculateStatistics and calculateQuantiles exist

export interface MissingValueDetail {
  column: string
  count: number
  method: "mean" | "median" | "mode" | "removed" | "none"
  fillValue?: any
  explanation: string
}

export interface OutlierDetail {
  column: string
  count: number
  bounds: {
    lower: number
    upper: number
  }
  method: "removed" | "replaced_median" | "replaced_mean" | "none"
  explanation: string
}

export interface CleaningResult {
  processedData: any[]
  missingValueActions: MissingValueDetail[]
  outlierActions: OutlierDetail[]
  typeConversionActions: { column: string; from: string; to: string; success: boolean; explanation: string }[]
  totalRowsAffected: number
  totalCellsAffected: number
}

// --- Utility Functions (moved/adapted from other files) ---

// Comprehensive missing value detection
export function isMissingValue(value: any): boolean {
  return (
    value === null ||
    value === undefined ||
    value === "" ||
    value === "null" ||
    value === "undefined" ||
    value === "N/A" ||
    value === "n/a" ||
    value === "#N/A" ||
    value === "NA" ||
    value === "na" ||
    (typeof value === "string" && value.trim() === "") ||
    (typeof value === "string" && value.toLowerCase() === "nan") ||
    (typeof value === "number" && isNaN(value))
  )
}

// Detect column type based on non-missing values
export function detectColumnType(data: any[], columnName: string): "numeric" | "categorical" | "text" | "date" {
  if (!data || data.length === 0) return "categorical"

  const values = data.map((row) => row[columnName]).filter((val) => !isMissingValue(val))

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
    const cleanVal = strVal.replace(/[$,%\s€£¥]/g, "").replace(/^$$(.+)$$$/, "-$1") // Handle (123) for -123
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
export const cleanNumericValue = (val: any): number | null => {
  if (val === null || val === undefined) return null

  const strVal = String(val).trim()
  if (strVal === "" || strVal.toLowerCase() === "null" || strVal.toLowerCase() === "n/a") return null

  // Remove formatting and handle accounting notation
  const cleanVal = strVal.replace(/[$,%\s€£¥]/g, "").replace(/^$$(.+)$$$/, "-$1")
  const numVal = Number(cleanVal)

  return !isNaN(numVal) && isFinite(numVal) ? numVal : null
}

// Calculate skewness for numeric data
export function calculateSkewness(values: number[]): number {
  if (values.length < 3) return 0

  const n = values.length
  const mean = values.reduce((sum, val) => sum + val, 0) / n
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n
  const stdDev = Math.sqrt(variance)

  if (stdDev === 0) return 0

  const skewness = values.reduce((sum, val) => sum + Math.pow((val - mean) / stdDev, 3), 0) / n
  return skewness
}

// Get mode (most frequent value) for categorical data
export function getMode(values: any[]): any {
  const frequency = new Map()
  values.forEach((value) => {
    frequency.set(value, (frequency.get(value) || 0) + 1)
  })

  let maxCount = 0
  let mode = null
  frequency.forEach((count, value) => {
    if (count > maxCount) {
      maxCount = count
      mode = value
    }
  })

  return mode
}

// --- Missing Value Handling ---

export function fillMissingValues(
  data: any[],
  columnName: string,
  method: "mean" | "median" | "mode",
): { processedData: any[]; detail: MissingValueDetail } {
  const processedData = JSON.parse(JSON.stringify(data)) // Deep copy
  const columnType = detectColumnType(processedData, columnName)
  let fillValue: any = null
  let filledCount = 0

  const nonMissingValues = processedData.map((row) => row[columnName]).filter((val) => !isMissingValue(val))

  if (nonMissingValues.length === 0) {
    return {
      processedData,
      detail: {
        column: columnName,
        count: 0,
        method: "none",
        explanation: "No non-missing values to determine fill value.",
      },
    }
  }

  if (columnType === "numeric") {
    const numericValues = nonMissingValues.map(cleanNumericValue).filter((val) => val !== null) as number[]
    if (numericValues.length === 0) {
      return {
        processedData,
        detail: {
          column: columnName,
          count: 0,
          method: "none",
          explanation: "No valid numeric values to determine fill value.",
        },
      }
    }

    if (method === "mean") {
      fillValue = numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length
    } else if (method === "median") {
      const sorted = [...numericValues].sort((a, b) => a - b)
      fillValue = sorted[Math.floor(sorted.length / 2)]
    } else {
      // Fallback for mode on numeric, though less common
      fillValue = getMode(numericValues)
    }
  } else {
    // Categorical/Text/Date - always use mode
    fillValue = getMode(nonMissingValues)
    if (fillValue === null) {
      fillValue = "Unknown" // Default for completely empty categorical columns
    }
  }

  processedData.forEach((row) => {
    if (isMissingValue(row[columnName])) {
      row[columnName] = fillValue
      filledCount++
    }
  })

  return {
    processedData,
    detail: {
      column: columnName,
      count: filledCount,
      method,
      fillValue,
      explanation: `Filled ${filledCount} missing values with ${method} (${
        typeof fillValue === "number" ? fillValue.toFixed(2) : fillValue
      }).`,
    },
  }
}

export function removeRowsWithMissing(
  data: any[],
  columnsToConsider: string[] = [],
): { processedData: any[]; detail: MissingValueDetail } {
  const initialRowCount = data.length
  let removedCount = 0

  const processedData = data.filter((row) => {
    const colsToCheck = columnsToConsider.length > 0 ? columnsToConsider : Object.keys(row)
    const hasMissing = colsToCheck.some((col) => isMissingValue(row[col]))
    if (hasMissing) {
      removedCount++
      return false
    }
    return true
  })

  return {
    processedData,
    detail: {
      column: "All considered columns",
      count: removedCount,
      method: "removed",
      explanation: `Removed ${removedCount} rows containing missing values in specified columns.`,
    },
  }
}

export function removeColumnsWithMissing(
  data: any[],
  threshold = 0, // Percentage of missing values to trigger removal (0-100)
): { processedData: any[]; detail: MissingValueDetail[] } {
  if (data.length === 0) {
    return { processedData: [], detail: [] }
  }

  const columns = Object.keys(data[0])
  const columnsToRemove: string[] = []
  const missingDetails: MissingValueDetail[] = []

  columns.forEach((col) => {
    const missingCount = data.filter((row) => isMissingValue(row[col])).length
    const missingPercentage = (missingCount / data.length) * 100

    if (missingPercentage >= threshold) {
      columnsToRemove.push(col)
      missingDetails.push({
        column: col,
        count: missingCount,
        method: "removed",
        explanation: `Removed column '${col}' due to ${missingPercentage.toFixed(1)}% missing values (threshold: ${threshold}%).`,
      })
    }
  })

  const processedData = data.map((row) => {
    const newRow: any = {}
    for (const col of columns) {
      if (!columnsToRemove.includes(col)) {
        newRow[col] = row[col]
      }
    }
    return newRow
  })

  return { processedData, detail: missingDetails }
}

// --- Outlier Handling (IQR Method) ---

export function detectOutliersIQR(
  data: any[],
  columnName: string,
): { outliers: number[]; lowerBound: number; upperBound: number; numericValues: number[] } {
  const numericValues = data.map((row) => cleanNumericValue(row[columnName])).filter((val) => val !== null) as number[]

  if (numericValues.length < 4) {
    return { outliers: [], lowerBound: 0, upperBound: 0, numericValues }
  }

  const sorted = [...numericValues].sort((a, b) => a - b)
  const { q1, q3 } = calculateQuantiles(sorted) // Assuming calculateQuantiles is available
  const iqr = q3 - q1
  const lowerBound = q1 - 1.5 * iqr
  const upperBound = q3 + 1.5 * iqr

  const outliers = numericValues.filter((val) => val < lowerBound || val > upperBound)

  return { outliers, lowerBound, upperBound, numericValues }
}

export function handleOutliers(
  data: any[],
  columnName: string,
  method: "remove" | "replace_median" | "replace_mean",
): { processedData: any[]; detail: OutlierDetail } {
  const processedData = JSON.parse(JSON.stringify(data)) // Deep copy
  const { outliers, lowerBound, upperBound, numericValues } = detectOutliersIQR(processedData, columnName)
  let fixedCount = 0

  if (outliers.length === 0) {
    return {
      processedData,
      detail: {
        column: columnName,
        count: 0,
        bounds: { lower: lowerBound, upper: upperBound },
        method: "none",
        explanation: "No outliers detected.",
      },
    }
  }

  if (method === "remove") {
    const originalRowCount = processedData.length
    const filteredData = processedData.filter((row) => {
      const value = cleanNumericValue(row[columnName])
      return value === null || (value >= lowerBound && value <= upperBound)
    })
    fixedCount = originalRowCount - filteredData.length
    return {
      processedData: filteredData,
      detail: {
        column: columnName,
        count: fixedCount,
        bounds: { lower: lowerBound, upper: upperBound },
        method: "removed",
        explanation: `Removed ${fixedCount} rows containing outliers in '${columnName}'.`,
      },
    }
  } else {
    const stats = calculateStatistics(numericValues) // Assuming calculateStatistics is available
    const replacementValue = method === "replace_median" ? stats.median : stats.mean

    processedData.forEach((row) => {
      const value = cleanNumericValue(row[columnName])
      if (value !== null && (value < lowerBound || value > upperBound)) {
        row[columnName] = replacementValue
        fixedCount++
      }
    })

    return {
      processedData,
      detail: {
        column: columnName,
        count: fixedCount,
        bounds: { lower: lowerBound, upper: upperBound },
        method,
        explanation: `Replaced ${fixedCount} outliers in '${columnName}' with ${method} (${replacementValue.toFixed(2)}).`,
      },
    }
  }
}

// --- Data Type Conversion ---

export function convertColumnType(
  data: any[],
  columnName: string,
  newType: "numeric" | "categorical" | "text" | "date",
): {
  processedData: any[]
  detail: { column: string; from: string; to: string; success: boolean; explanation: string }
} {
  const processedData = JSON.parse(JSON.stringify(data)) // Deep copy
  const originalType = detectColumnType(data, columnName)
  let success = true
  let explanation = `Converted '${columnName}' from ${originalType} to ${newType}.`

  processedData.forEach((row) => {
    const value = row[columnName]
    if (isMissingValue(value)) {
      row[columnName] = null // Keep missing values as null
      return
    }

    try {
      if (newType === "numeric") {
        const numVal = cleanNumericValue(value)
        if (numVal === null) throw new Error("Cannot convert to number")
        row[columnName] = numVal
      } else if (newType === "categorical" || newType === "text") {
        row[columnName] = String(value)
      } else if (newType === "date") {
        const dateVal = new Date(value)
        if (isNaN(dateVal.getTime())) throw new Error("Cannot convert to date")
        row[columnName] = dateVal.toISOString().split("T")[0] // Store as YYYY-MM-DD string
      }
    } catch (e: any) {
      success = false
      explanation = `Failed to convert some values in '${columnName}' to ${newType}: ${e.message}.`
      // Optionally, set to null or original value if conversion fails
      row[columnName] = value // Revert to original if conversion fails
    }
  })

  return {
    processedData,
    detail: {
      column: columnName,
      from: originalType,
      to: newType,
      success,
      explanation,
    },
  }
}
