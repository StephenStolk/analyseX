import * as XLSX from "xlsx"
import jStat from "jstat"

export interface ColumnInfo {
  name: string
  type: string
  count: number
  missing: number
  unique: number
  min?: number | string
  max?: number | string
  mean?: number
  median?: number
  stdDev?: number
  skew?: number
  kurtosis?: number
  memoryUsage?: number
}

export interface DataSummary {
  fileName: string
  rowCount: number
  columnCount: number
  missingValues: number
  duplicateRows: number
  columns: ColumnInfo[]
  previewData: any[]
}

export interface CorrelationData {
  matrix: number[][]
  labels: string[]
}

export interface DistributionData {
  column: string
  bins: number[]
  frequencies: number[]
  min: number
  max: number
}

export interface BoxPlotData {
  column: string
  min: number
  q1: number
  median: number
  q3: number
  max: number
  outliers: number[]
}

export interface ValueCountData {
  column: string
  values: string[]
  counts: number[]
}

export interface TimeSeriesData {
  timeColumn: string
  valueColumn: string
  dates: string[]
  values: number[]
}

export interface OutlierData {
  column: string
  count: number
  indices: number[]
}

export interface PivotData {
  categoryColumn: string
  valueColumn: string
  categories: string[]
  values: number[]
}

export interface AnalysisResults {
  summary: DataSummary
  correlations: CorrelationData
  distributions: DistributionData[]
  boxPlots: BoxPlotData[]
  skewKurtosis: { column: string; skew: number; kurtosis: number }[]
  valueCounts: ValueCountData[]
  timeSeries: TimeSeriesData | null
  outliers: OutlierData[]
  pivotData: PivotData[]
  uniqueCounts: { column: string; count: number }[]
  memoryUsage: { column: string; bytes: number }[]
}

// Helper function to determine if a column is numeric
function isNumericColumn(data: any[], column: string): boolean {
  return data.some((row) => {
    const value = row[column]
    return value !== null && value !== undefined && !isNaN(Number(value))
  })
}

// Helper function to determine if a column is a date
function isDateColumn(data: any[], column: string): boolean {
  return data.some((row) => {
    const value = row[column]
    if (!value) return false
    const date = new Date(value)
    return !isNaN(date.getTime())
  })
}

// Helper function to get column type
function getColumnType(data: any[], column: string): string {
  if (isDateColumn(data, column)) return "Date"
  if (isNumericColumn(data, column)) return "Number"
  return "String"
}

// Helper function to get unique values in a column
function getUniqueValues(data: any[], column: string): any[] {
  const values = data.map((row) => row[column])
  return [...new Set(values.filter((v) => v !== null && v !== undefined))]
}

// Helper function to calculate quartiles
function calculateQuartiles(values: number[]): { q1: number; median: number; q3: number } {
  if (values.length === 0) {
    return { q1: 0, median: 0, q3: 0 }
  }

  const sorted = [...values].sort((a, b) => a - b)
  const q1Index = Math.floor(sorted.length * 0.25)
  const medianIndex = Math.floor(sorted.length * 0.5)
  const q3Index = Math.floor(sorted.length * 0.75)

  return {
    q1: sorted[q1Index] || 0,
    median: sorted[medianIndex] || 0,
    q3: sorted[q3Index] || 0,
  }
}

// Helper function to detect outliers using IQR method
function detectOutliers(values: number[]): number[] {
  if (values.length === 0) return []

  const { q1, q3 } = calculateQuartiles(values)
  const iqr = q3 - q1
  const lowerBound = q1 - 1.5 * iqr
  const upperBound = q3 + 1.5 * iqr

  return values.filter((v) => v < lowerBound || v > upperBound)
}

// Helper function to calculate skewness
function calculateSkewness(values: number[]): number {
  if (values.length < 3) return 0
  try {
    return jStat.skewness(values)
  } catch (error) {
    console.error("Error calculating skewness:", error)
    return 0
  }
}

// Helper function to calculate kurtosis
function calculateKurtosis(values: number[]): number {
  if (values.length < 4) return 0
  try {
    return jStat.kurtosis(values)
  } catch (error) {
    console.error("Error calculating kurtosis:", error)
    return 0
  }
}

// Helper function to calculate correlation matrix
function calculateCorrelation(data: any[], numericColumns: string[]): number[][] {
  if (numericColumns.length === 0) return [[]]

  const matrix: number[][] = []

  for (const col1 of numericColumns) {
    const row: number[] = []
    for (const col2 of numericColumns) {
      const values1 = data.map((d) => Number(d[col1])).filter((v) => !isNaN(v))
      const values2 = data.map((d) => Number(d[col2])).filter((v) => !isNaN(v))

      if (col1 === col2) {
        row.push(1) // Perfect correlation with itself
      } else if (values1.length < 2 || values2.length < 2) {
        row.push(0) // Not enough data
      } else {
        try {
          const correlation = jStat.corrcoeff(values1, values2)
          row.push(isNaN(correlation) ? 0 : correlation)
        } catch (error) {
          console.error(`Error calculating correlation between ${col1} and ${col2}:`, error)
          row.push(0)
        }
      }
    }
    matrix.push(row)
  }

  return matrix
}

// Helper function to calculate histogram data
function calculateHistogram(values: number[], bins = 10): { bins: number[]; frequencies: number[] } {
  if (values.length === 0) {
    return { bins: Array(bins + 1).fill(0), frequencies: Array(bins).fill(0) }
  }

  const min = Math.min(...values)
  const max = Math.max(...values)

  // Handle case where all values are the same
  if (min === max) {
    const histBins = Array(bins + 1).fill(min)
    const frequencies = Array(bins).fill(0)
    frequencies[0] = values.length // All values in the first bin
    return { bins: histBins, frequencies }
  }

  const binWidth = (max - min) / bins

  const histBins: number[] = []
  const frequencies: number[] = Array(bins).fill(0)

  // Create bin edges
  for (let i = 0; i <= bins; i++) {
    histBins.push(min + i * binWidth)
  }

  // Count values in each bin
  values.forEach((value) => {
    const binIndex = Math.min(Math.floor((value - min) / binWidth), bins - 1)
    frequencies[binIndex]++
  })

  return { bins: histBins, frequencies }
}

// Helper function to check for duplicate rows
function findDuplicateRows(data: any[]): number {
  const stringified = data.map((row) => JSON.stringify(row))
  const uniqueStringified = new Set(stringified)
  return data.length - uniqueStringified.size
}

// Helper function to calculate memory usage (approximate)
function calculateMemoryUsage(data: any[], column: string): number {
  let bytes = 0

  data.forEach((row) => {
    const value = row[column]
    if (value === null || value === undefined) return

    if (typeof value === "number") {
      bytes += 8 // 64-bit number
    } else if (typeof value === "string") {
      bytes += value.length * 2 // UTF-16 encoding (2 bytes per character)
    } else if (value instanceof Date) {
      bytes += 8 // Date objects are typically 8 bytes
    } else {
      bytes += 4 // Default estimate for other types
    }
  })

  return bytes
}

// Main analysis function
export async function analyzeFile(file: File): Promise<AnalysisResults> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = e.target?.result
        let parsedData: any[] = []

        if (file.name.endsWith(".csv")) {
          // Parse CSV
          const text = data as string
          const lines = text.split("\n").filter((line) => line.trim() !== "")

          if (lines.length === 0) {
            throw new Error("Empty CSV file")
          }

          // Handle different delimiters (comma, semicolon, tab)
          let delimiter = ","
          if (lines[0].includes(";")) delimiter = ";"
          else if (lines[0].includes("\t")) delimiter = "\t"

          const headers = lines[0].split(delimiter).map((h) => h.trim().replace(/^"|"$/g, ""))
          console.log(`CSV headers: ${headers.join(", ")}`)

          for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue

            // Handle quoted values with commas inside
            let values: string[] = []
            let currentValue = ""
            let inQuotes = false

            for (const char of lines[i]) {
              if (char === '"') {
                inQuotes = !inQuotes
              } else if (char === delimiter && !inQuotes) {
                values.push(currentValue)
                currentValue = ""
              } else {
                currentValue += char
              }
            }
            values.push(currentValue) // Add the last value

            // If simple splitting works better (no quotes), use it
            if (values.length !== headers.length) {
              values = lines[i].split(delimiter)
            }

            const row: any = {}

            headers.forEach((header, index) => {
              if (index < values.length) {
                // Try to convert numeric values
                const value = values[index].trim().replace(/^"|"$/g, "")
                const numValue = Number(value)
                row[header] = !isNaN(numValue) ? numValue : value
              } else {
                row[header] = null // Handle missing values
              }
            })

            parsedData.push(row)
          }

          console.log(`Parsed ${parsedData.length} rows from CSV`)
        } else {
          // Parse Excel
          try {
            const workbook = XLSX.read(data, { type: "binary" })
            const firstSheet = workbook.SheetNames[0]
            const worksheet = workbook.Sheets[firstSheet]
            parsedData = XLSX.utils.sheet_to_json(worksheet, { defval: null })
            console.log(`Parsed ${parsedData.length} rows from Excel`)
          } catch (error) {
            console.error("Error parsing Excel file:", error)
            throw new Error("Invalid Excel file format")
          }
        }

        if (parsedData.length === 0) {
          throw new Error("No data found in file")
        }

        // Perform all analyses
        const results = performAnalyses(parsedData, file.name)
        resolve(results)
      } catch (error) {
        console.error("Error parsing file:", error)
        reject(error)
      }
    }

    reader.onerror = (error) => {
      console.error("FileReader error:", error)
      reject(new Error("Error reading file"))
    }

    if (file.name.endsWith(".csv")) {
      reader.readAsText(file)
    } else {
      reader.readAsBinaryString(file)
    }
  })
}

function performAnalyses(data: any[], fileName: string): AnalysisResults {
  console.log(`Performing analysis on ${fileName} with ${data.length} rows`)

  // Get all column names
  const columns = Object.keys(data[0] || {})
  console.log(`Columns: ${columns.join(", ")}`)

  // Identify numeric and date columns
  const numericColumns: string[] = []
  const dateColumns: string[] = []
  const categoricalColumns: string[] = []

  columns.forEach((column) => {
    const type = getColumnType(data, column)
    if (type === "Number") numericColumns.push(column)
    else if (type === "Date") dateColumns.push(column)
    else categoricalColumns.push(column)
  })

  console.log(`Numeric columns: ${numericColumns.join(", ")}`)
  console.log(`Date columns: ${dateColumns.join(", ")}`)
  console.log(`Categorical columns: ${categoricalColumns.join(", ")}`)

  // 1. Shape & Size
  const rowCount = data.length
  const columnCount = columns.length

  // 2. Column List & dtypes
  const columnInfo: ColumnInfo[] = columns.map((column) => {
    const type = getColumnType(data, column)
    const values = data.map((row) => row[column])
    const nonNullValues = values.filter((v) => v !== null && v !== undefined)
    const uniqueValues = getUniqueValues(data, column)

    let min: number | string | undefined
    let max: number | string | undefined
    let mean: number | undefined
    let median: number | undefined
    let stdDev: number | undefined
    let skew: number | undefined
    let kurtosis: number | undefined

    if (type === "Number") {
      const numericValues = nonNullValues.map((v) => Number(v)).filter((v) => !isNaN(v))

      if (numericValues.length > 0) {
        min = Math.min(...numericValues)
        max = Math.max(...numericValues)

        try {
          mean = jStat.mean(numericValues)
          median = jStat.median(numericValues)
          stdDev = jStat.stdev(numericValues)

          if (numericValues.length >= 3) {
            skew = calculateSkewness(numericValues)
          }

          if (numericValues.length >= 4) {
            kurtosis = calculateKurtosis(numericValues)
          }
        } catch (error) {
          console.error(`Error calculating statistics for column ${column}:`, error)
        }
      }
    } else if (type === "Date") {
      // For date columns, find min and max dates
      const dateValues = nonNullValues.map((v) => new Date(v)).filter((d) => !isNaN(d.getTime()))
      if (dateValues.length > 0) {
        min = new Date(Math.min(...dateValues.map((d) => d.getTime()))).toISOString()
        max = new Date(Math.max(...dateValues.map((d) => d.getTime()))).toISOString()
      }
    } else {
      // For string columns, find min and max length
      if (nonNullValues.length > 0) {
        const lengths = nonNullValues.map((v) => String(v).length)
        min = Math.min(...lengths)
        max = Math.max(...lengths)
      }
    }

    return {
      name: column,
      type,
      count: nonNullValues.length,
      missing: rowCount - nonNullValues.length,
      unique: uniqueValues.length,
      min,
      max,
      mean,
      median,
      stdDev,
      skew,
      kurtosis,
      memoryUsage: calculateMemoryUsage(data, column),
    }
  })

  // 3. Missing-value table
  const missingValues = columnInfo.reduce((sum, col) => sum + col.missing, 0)

  // 6. Numeric distribution (histograms)
  const distributions: DistributionData[] = numericColumns.map((column) => {
    const values = data.map((row) => Number(row[column])).filter((v) => !isNaN(v))

    const { bins, frequencies } = calculateHistogram(values)

    return {
      column,
      bins,
      frequencies,
      min: values.length > 0 ? Math.min(...values) : 0,
      max: values.length > 0 ? Math.max(...values) : 0,
    }
  })

  // 7. Box-plots for outliers
  const boxPlots: BoxPlotData[] = numericColumns.map((column) => {
    const values = data.map((row) => Number(row[column])).filter((v) => !isNaN(v))

    if (values.length === 0) {
      return {
        column,
        min: 0,
        q1: 0,
        median: 0,
        q3: 0,
        max: 0,
        outliers: [],
      }
    }

    const { q1, median, q3 } = calculateQuartiles(values)
    const outliers = detectOutliers(values)

    return {
      column,
      min: Math.min(...values),
      q1,
      median,
      q3,
      max: Math.max(...values),
      outliers,
    }
  })

  // 8. Skew & Kurtosis
  const skewKurtosis = numericColumns.map((column) => {
    const values = data.map((row) => Number(row[column])).filter((v) => !isNaN(v))

    return {
      column,
      skew: values.length >= 3 ? calculateSkewness(values) : 0,
      kurtosis: values.length >= 4 ? calculateKurtosis(values) : 0,
    }
  })

  // 9. Top-N value counts (categoricals)
  const valueCounts: ValueCountData[] = categoricalColumns.map((column) => {
    const values = data.map((row) => String(row[column] || ""))
    const countMap = new Map<string, number>()

    values.forEach((value) => {
      if (value) {
        countMap.set(value, (countMap.get(value) || 0) + 1)
      }
    })

    // Sort by count (descending) and take top 10
    const sortedEntries = [...countMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)

    return {
      column,
      values: sortedEntries.map(([value]) => value),
      counts: sortedEntries.map(([, count]) => count),
    }
  })

  // 10 & 11. Correlation matrix and heatmap
  const correlations: CorrelationData = {
    matrix: calculateCorrelation(data, numericColumns),
    labels: numericColumns,
  }

  // 14. Time-series line plot
  let timeSeries: TimeSeriesData | null = null

  if (dateColumns.length > 0 && numericColumns.length > 0) {
    const timeColumn = dateColumns[0]
    const valueColumn = numericColumns[0]

    try {
      // Sort data by date
      const validData = data.filter(
        (row) =>
          row[timeColumn] &&
          !isNaN(new Date(row[timeColumn]).getTime()) &&
          row[valueColumn] !== null &&
          row[valueColumn] !== undefined &&
          !isNaN(Number(row[valueColumn])),
      )

      const sortedData = [...validData].sort((a, b) => {
        const dateA = new Date(a[timeColumn])
        const dateB = new Date(b[timeColumn])
        return dateA.getTime() - dateB.getTime()
      })

      if (sortedData.length > 0) {
        timeSeries = {
          timeColumn,
          valueColumn,
          dates: sortedData.map((row) => String(row[timeColumn])),
          values: sortedData.map((row) => Number(row[valueColumn])),
        }
      }
    } catch (error) {
      console.error("Error creating time series:", error)
    }
  }

  // 15. Outlier count (z > 3)
  const outliers: OutlierData[] = numericColumns.map((column) => {
    const values = data.map((row) => Number(row[column])).filter((v) => !isNaN(v))

    if (values.length < 2) {
      return { column, count: 0, indices: [] }
    }

    try {
      const mean = jStat.mean(values)
      const stdDev = jStat.stdev(values)

      if (stdDev === 0) {
        return { column, count: 0, indices: [] }
      }

      const outlierIndices: number[] = []
      values.forEach((value, index) => {
        const zScore = Math.abs((value - mean) / stdDev)
        if (zScore > 3) {
          outlierIndices.push(index)
        }
      })

      return {
        column,
        count: outlierIndices.length,
        indices: outlierIndices,
      }
    } catch (error) {
      console.error(`Error calculating outliers for column ${column}:`, error)
      return { column, count: 0, indices: [] }
    }
  })

  // 16 & 17. Pivot/summary by category & Numeric vs category bar charts
  const pivotData: PivotData[] = []

  if (categoricalColumns.length > 0 && numericColumns.length > 0) {
    categoricalColumns.forEach((catColumn) => {
      numericColumns.forEach((numColumn) => {
        try {
          const categories = [...new Set(data.map((row) => String(row[catColumn] || "")).filter((v) => v !== ""))]
          const values: number[] = []

          categories.forEach((category) => {
            const filteredData = data.filter((row) => String(row[catColumn] || "") === category)
            const numericValues = filteredData.map((row) => Number(row[numColumn])).filter((v) => !isNaN(v))

            const mean = numericValues.length > 0 ? jStat.mean(numericValues) : 0
            values.push(mean)
          })

          if (categories.length > 0) {
            pivotData.push({
              categoryColumn: catColumn,
              valueColumn: numColumn,
              categories,
              values,
            })
          }
        } catch (error) {
          console.error(`Error creating pivot data for ${catColumn} and ${numColumn}:`, error)
        }
      })
    })
  }

  // 18. Unique value count per column
  const uniqueCounts = columns.map((column) => ({
    column,
    count: getUniqueValues(data, column).length,
  }))

  // 19. Memory usage per column
  const memoryUsage = columns.map((column) => ({
    column,
    bytes: calculateMemoryUsage(data, column),
  }))

  // 20. Duplicate-row detection
  const duplicateRows = findDuplicateRows(data)

  // Create summary
  const summary: DataSummary = {
    fileName,
    rowCount,
    columnCount,
    missingValues,
    duplicateRows,
    columns: columnInfo,
    previewData: data.slice(0, 10), // First 10 rows for preview
  }

  console.log("Analysis complete")

  return {
    summary,
    correlations,
    distributions,
    boxPlots,
    skewKurtosis,
    valueCounts,
    timeSeries,
    outliers,
    pivotData,
    uniqueCounts,
    memoryUsage,
  }
}
