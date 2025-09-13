import { isMissingValue, detectColumnType, calculateSkewness, getMode, cleanNumericValue } from "./data-cleaning-utils" // Import from new utility file

export interface MissingValueDetail {
  column: string
  count: number
  method: "mean" | "median" | "mode"
  fillValue: any
  explanation: string
}

export interface OutlierDetail {
  column: string
  count: number
  bounds: {
    lower: number
    upper: number
  }
  explanation: string
}

export interface UnifiedProcessingResult {
  processedData: any[]
  totalMissingFilled: number
  totalOutliersFixed: number
  missingValueDetails: MissingValueDetail[]
  outlierDetails: OutlierDetail[]
}

// Fill missing values for a column (used internally by unifiedDataProcessor)
function fillMissingValuesForColumn(data: any[], columnName: string): MissingValueDetail {
  const columnType = detectColumnType(data, columnName)

  // Count missing values
  const missingCount = data.filter((row) => isMissingValue(row[columnName])).length

  if (missingCount === 0) {
    return {
      column: columnName,
      count: 0,
      method: "mean",
      fillValue: null,
      explanation: "No missing values found in this column",
    }
  }

  let fillValue: any
  let method: "mean" | "median" | "mode"
  let explanation: string

  if (columnType === "numeric") {
    // Get non-missing numeric values
    const numericValues = data
      .map((row) => row[columnName])
      .filter((val) => !isMissingValue(val))
      .map((val) => cleanNumericValue(val))
      .filter((val) => val !== null) as number[]

    if (numericValues.length === 0) {
      fillValue = 0
      method = "mean"
      explanation = "No valid numeric values found, filled with 0"
    } else {
      const skewness = calculateSkewness(numericValues)

      if (Math.abs(skewness) <= 0.5) {
        // Data is symmetric, use mean
        fillValue = numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length
        method = "mean"
        explanation = `Data is symmetric (skewness: ${skewness.toFixed(2)}), used mean value ${fillValue.toFixed(2)}`
      } else {
        // Data is skewed, use median
        const sorted = [...numericValues].sort((a, b) => a - b)
        fillValue = sorted[Math.floor(sorted.length / 2)]
        method = "median"
        explanation = `Data is ${skewness > 0 ? "right" : "left"}-skewed (skewness: ${skewness.toFixed(2)}), used median value ${fillValue.toFixed(2)}`
      }
    }
  } else {
    // Categorical data - use mode
    const nonMissingValues = data.map((row) => row[columnName]).filter((val) => !isMissingValue(val))

    fillValue = getMode(nonMissingValues) || "Unknown"
    method = "mode"
    explanation = `Used most frequent value "${fillValue}" for categorical data`
  }

  // Actually fill the missing values
  let actuallyFilled = 0
  data.forEach((row) => {
    if (isMissingValue(row[columnName])) {
      row[columnName] = fillValue
      actuallyFilled++
    }
  })

  return {
    column: columnName,
    count: actuallyFilled,
    method,
    fillValue,
    explanation,
  }
}

// Detect and fix outliers for numeric columns (used internally by unifiedDataProcessor)
function fixOutliersForColumn(data: any[], columnName: string): OutlierDetail {
  const columnType = detectColumnType(data, columnName)

  if (columnType !== "numeric") {
    return {
      column: columnName,
      count: 0,
      bounds: { lower: 0, upper: 0 },
      explanation: "No outlier correction applied to categorical data",
    }
  }

  // Get numeric values (after missing value filling)
  const numericValues = data.map((row) => cleanNumericValue(row[columnName])).filter((val) => val !== null) as number[]

  if (numericValues.length < 4) {
    return {
      column: columnName,
      count: 0,
      bounds: { lower: 0, upper: 0 },
      explanation: "Not enough data points for outlier detection",
    }
  }

  // Calculate IQR bounds
  const sorted = [...numericValues].sort((a, b) => a - b)
  const q1 = sorted[Math.floor(sorted.length * 0.25)]
  const q3 = sorted[Math.floor(sorted.length * 0.75)]
  const iqr = q3 - q1
  const lowerBound = q1 - 1.5 * iqr
  const upperBound = q3 + 1.5 * iqr
  const median = sorted[Math.floor(sorted.length / 2)]

  // Fix outliers
  let outliersFixed = 0
  data.forEach((row) => {
    const value = cleanNumericValue(row[columnName])
    if (value !== null && (value < lowerBound || value > upperBound)) {
      row[columnName] = median
      outliersFixed++
    }
  })

  return {
    column: columnName,
    count: outliersFixed,
    bounds: { lower: lowerBound, upper: upperBound },
    explanation: `Fixed ${outliersFixed} outliers outside range [${lowerBound.toFixed(2)}, ${upperBound.toFixed(2)}] by replacing with median ${median.toFixed(2)}`,
  }
}

// Main unified data processor
export function unifiedDataProcessor(rawData: any[]): UnifiedProcessingResult {
  console.log("🚀 Starting unified data processing...")
  console.log("📊 Input data:", rawData.length, "rows")

  // Create a deep copy to avoid modifying original data
  const processedData = JSON.parse(JSON.stringify(rawData))

  // Get all column names
  const columns = Object.keys(processedData[0] || {})
  console.log("📋 Processing columns:", columns)

  const missingValueDetails: MissingValueDetail[] = []
  const outlierDetails: OutlierDetail[] = []

  // Process each column
  columns.forEach((columnName) => {
    console.log(`🔍 Processing column: ${columnName}`)

    // Step 1: Fill missing values
    const missingResult = fillMissingValuesForColumn(processedData, columnName)
    missingValueDetails.push(missingResult)

    // Step 2: Fix outliers (only for numeric columns)
    const outlierResult = fixOutliersForColumn(processedData, columnName)
    outlierDetails.push(outlierResult)

    console.log(`✅ Column ${columnName}: ${missingResult.count} missing filled, ${outlierResult.count} outliers fixed`)
  })

  const totalMissingFilled = missingValueDetails.reduce((sum, detail) => sum + detail.count, 0)
  const totalOutliersFixed = outlierDetails.reduce((sum, detail) => sum + detail.count, 0)

  console.log(
    `🎉 Processing complete: ${totalMissingFilled} missing values filled, ${totalOutliersFixed} outliers fixed`,
  )

  return {
    processedData,
    totalMissingFilled,
    totalOutliersFixed,
    missingValueDetails: missingValueDetails.filter((detail) => detail.count > 0),
    outlierDetails: outlierDetails.filter((detail) => detail.count > 0),
  }
}
