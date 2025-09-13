import { mean, median, mode, standardDeviation } from "simple-statistics"

export interface ColumnInfo {
  name: string
  type: "numeric" | "categorical" | "boolean" | "datetime" | "unknown"
  nullCount: number
  nullPercentage: number
  uniqueCount?: number
}

export interface ColumnDescription {
  mean?: number
  median?: number
  mode?: any
  std?: number
  min?: number
  max?: number
  q1?: number
  q3?: number
  iqr?: number
  outlierLowerBound?: number
  outlierUpperBound?: number
  uniqueValues?: { value: any; count: number }[]
}

/**
 * Detects the type of a column based on its values.
 * @param values An array of values from a column.
 * @returns The detected column type.
 */
function detectColumnType(values: any[]): ColumnInfo["type"] {
  const nonNullValues = values.filter((v) => v !== null && v !== undefined)
  if (nonNullValues.length === 0) return "unknown"

  const numericCount = nonNullValues.filter((v) => typeof v === "number" && !isNaN(v)).length
  const booleanCount = nonNullValues.filter((v) => typeof v === "boolean").length
  const stringCount = nonNullValues.filter((v) => typeof v === "string").length

  // Check for date-like strings
  const dateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/ // YYYY-MM-DD or ISO format
  const isDateTime = nonNullValues.every((v) => {
    if (typeof v === "string") {
      return dateRegex.test(v) || !isNaN(new Date(v).getTime())
    }
    return false
  })

  if (isDateTime && stringCount === nonNullValues.length) return "datetime"
  if (numericCount / nonNullValues.length > 0.8) return "numeric" // Mostly numbers
  if (booleanCount / nonNullValues.length > 0.8) return "boolean" // Mostly booleans

  // If many unique string values, it's categorical. Otherwise, it might be text.
  const uniqueStringValues = new Set(nonNullValues.filter((v) => typeof v === "string")).size
  if (stringCount / nonNullValues.length > 0.8 && uniqueStringValues <= Math.min(50, nonNullValues.length / 2))
    return "categorical"

  return "unknown"
}

/**
 * Gathers basic information about each column in the dataset.
 * @param data The dataset as an array of objects.
 * @returns An array of ColumnInfo objects.
 */
export function getDataInfo(data: any[]): ColumnInfo[] {
  if (data.length === 0) return []

  const columns = Object.keys(data[0])
  const columnInfo: ColumnInfo[] = []

  for (const col of columns) {
    const values = data.map((row) => row[col])
    const nullCount = values.filter((v) => v === null || v === undefined || v === "").length
    const nullPercentage = data.length > 0 ? (nullCount / data.length) * 100 : 0
    const type = detectColumnType(values)
    const uniqueCount = new Set(values.filter((v) => v !== null && v !== undefined)).size

    columnInfo.push({
      name: col,
      type,
      nullCount,
      nullPercentage,
      uniqueCount,
    })
  }
  return columnInfo
}

/**
 * Calculates descriptive statistics for numeric and categorical columns.
 * @param data The dataset as an array of objects.
 * @returns An object where keys are column names and values are ColumnDescription objects.
 */
export function getDataDescription(data: any[]): { [key: string]: ColumnDescription } {
  if (data.length === 0) return {}

  const description: { [key: string]: ColumnDescription } = {}
  const columnInfo = getDataInfo(data)

  for (const colInfo of columnInfo) {
    const values = data.map((row) => row[colInfo.name]).filter((v) => v !== null && v !== undefined && v !== "")

    if (colInfo.type === "numeric") {
      const numericValues = values.filter((v) => typeof v === "number" && !isNaN(v)) as number[]
      if (numericValues.length > 0) {
        const q1 = quantile(numericValues, 0.25)
        const q3 = quantile(numericValues, 0.75)
        const iqr = q3 - q1
        const outlierLowerBound = q1 - 1.5 * iqr
        const outlierUpperBound = q3 + 1.5 * iqr

        description[colInfo.name] = {
          mean: mean(numericValues),
          median: median(numericValues),
          mode: mode(numericValues),
          std: standardDeviation(numericValues),
          min: Math.min(...numericValues),
          max: Math.max(...numericValues),
          q1,
          q3,
          iqr,
          outlierLowerBound,
          outlierUpperBound,
        }
      } else {
        description[colInfo.name] = {} // No numeric values to describe
      }
    } else if (colInfo.type === "categorical" || colInfo.type === "boolean") {
      const valueCounts: { [key: string]: number } = {}
      values.forEach((v) => {
        const key = String(v)
        valueCounts[key] = (valueCounts[key] || 0) + 1
      })
      const uniqueValues = Object.entries(valueCounts).map(([value, count]) => ({ value, count }))
      description[colInfo.name] = { uniqueValues }
    } else {
      description[colInfo.name] = {} // No specific description for other types
    }
  }
  return description
}

/**
 * Calculates the quantile of a sorted numeric array.
 * @param arr The sorted numeric array.
 * @param q The quantile (e.g., 0.25 for Q1, 0.75 for Q3).
 * @returns The quantile value.
 */
function quantile(arr: number[], q: number): number {
  const sorted = arr.sort((a, b) => a - b)
  const pos = (sorted.length - 1) * q
  const base = Math.floor(pos)
  const rest = pos - base
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base])
  } else {
    return sorted[base]
  }
}

/**
 * Handles missing values in a specified column.
 * @param data The dataset.
 * @param column The column to process.
 * @param strategy The strategy to use ('mean', 'median', 'mode', 'remove', 'zero').
 * @returns The data with missing values handled.
 */
export function handleMissingValues(
  data: any[],
  column: string,
  strategy: "mean" | "median" | "mode" | "remove" | "zero",
): any[] {
  if (!data || data.length === 0 || !column) return data

  const columnValues = data.map((row) => row[column])
  const nonNullValues = columnValues.filter((v) => v !== null && v !== undefined && v !== "")

  if (strategy === "remove") {
    return data.filter((row) => row[column] !== null && row[column] !== undefined && row[column] !== "")
  }

  let fillValue: any
  const numericValues = nonNullValues.filter((v) => typeof v === "number" && !isNaN(v)) as number[]

  switch (strategy) {
    case "mean":
      fillValue = numericValues.length > 0 ? mean(numericValues) : 0
      break
    case "median":
      fillValue = numericValues.length > 0 ? median(numericValues) : 0
      break
    case "mode":
      fillValue = nonNullValues.length > 0 ? mode(nonNullValues) : ""
      break
    case "zero":
      fillValue = 0
      break
    default:
      return data
  }

  return data.map((row) => {
    if (row[column] === null || row[column] === undefined || row[column] === "") {
      return { ...row, [column]: fillValue }
    }
    return row
  })
}

/**
 * Handles outliers in a specified numeric column.
 * @param data The dataset.
 * @param column The numeric column to process.
 * @param strategy The treatment strategy ('remove', 'median', 'mean', 'cap').
 * @param method The detection method ('iqr', 'zscore').
 * @returns The data with outliers handled.
 */
export function handleOutliers(
  data: any[],
  column: string,
  strategy: "remove" | "median" | "mean" | "cap",
  method: "iqr" | "zscore",
): any[] {
  if (!data || data.length === 0 || !column) return data

  const numericValues = data.map((row) => row[column]).filter((v) => typeof v === "number" && !isNaN(v)) as number[]

  if (numericValues.length === 0) return data

  let lowerBound: number
  let upperBound: number

  if (method === "iqr") {
    const q1 = quantile(numericValues, 0.25)
    const q3 = quantile(numericValues, 0.75)
    const iqr = q3 - q1
    lowerBound = q1 - 1.5 * iqr
    upperBound = q3 + 1.5 * iqr
  } else {
    // Z-score method
    const colMean = mean(numericValues)
    const colStdDev = standardDeviation(numericValues)
    const zScoreThreshold = 3 // Common threshold for Z-score
    lowerBound = colMean - zScoreThreshold * colStdDev
    upperBound = colMean + zScoreThreshold * colStdDev
  }

  if (strategy === "remove") {
    return data.filter((row) => {
      const value = row[column]
      return typeof value !== "number" || (value >= lowerBound && value <= upperBound)
    })
  }

  let replacementValue: number
  if (strategy === "median") {
    replacementValue = median(numericValues)
  } else if (strategy === "mean") {
    replacementValue = mean(numericValues)
  } else {
    // Default to mean if strategy is not recognized or for 'cap'
    replacementValue = mean(numericValues)
  }

  return data.map((row) => {
    const value = row[column]
    if (typeof value === "number" && !isNaN(value)) {
      if (value < lowerBound) {
        return { ...row, [column]: strategy === "cap" ? lowerBound : replacementValue }
      }
      if (value > upperBound) {
        return { ...row, [column]: strategy === "cap" ? upperBound : replacementValue }
      }
    }
    return row
  })
}

/**
 * Removes duplicate rows from the dataset.
 * @param data The dataset.
 * @returns The data with duplicate rows removed.
 */
export function removeDuplicateRows(data: any[]): any[] {
  if (!data || data.length === 0) return data

  const seen = new Set()
  return data.filter((row) => {
    const stringifiedRow = JSON.stringify(row)
    if (seen.has(stringifiedRow)) {
      return false
    }
    seen.add(stringifiedRow)
    return true
  })
}

/**
 * Filters rows based on a condition in a specified column.
 * @param data The dataset.
 * @param column The column to filter by.
 * @param operator The comparison operator.
 * @param value The value to compare against.
 * @returns The filtered data.
 */
export function filterRowsByValue(data: any[], column: string, operator: string, value: string): any[] {
  if (!data || data.length === 0 || !column || value === undefined || value === null) return data

  return data.filter((row) => {
    const cellValue = row[column]
    if (cellValue === undefined || cellValue === null) return false

    // Attempt to convert value for numeric comparisons
    const numericCellValue = typeof cellValue === "number" ? cellValue : Number.parseFloat(cellValue)
    const numericFilterValue = Number.parseFloat(value)
    const isNumericComparison = !isNaN(numericCellValue) && !isNaN(numericFilterValue)

    switch (operator) {
      case "equals":
        return String(cellValue) === value
      case "not_equals":
        return String(cellValue) !== value
      case "greater_than":
        return isNumericComparison && numericCellValue > numericFilterValue
      case "less_than":
        return isNumericComparison && numericCellValue < numericFilterValue
      case "contains":
        return typeof cellValue === "string" && cellValue.includes(value)
      case "starts_with":
        return typeof cellValue === "string" && cellValue.startsWith(value)
      case "ends_with":
        return typeof cellValue === "string" && cellValue.endsWith(value)
      default:
        return true
    }
  })
}
