export interface RealProcessingResult {
  originalData: any[]
  processedData: any[]
  missingValuesFilled: {
    column: string
    count: number
    method: string
    fillValue: any
    explanation: string
  }[]
  outliersFixed: {
    column: string
    count: number
    method: string
    bounds: { lower: number; upper: number }
    explanation: string
  }[]
  totalMissingFilled: number
  totalOutliersFixed: number
}

export function realDataProcessor(data: any[]): RealProcessingResult {
  console.log("🚀 Starting REAL data processing...")
  console.log("📊 Input data:", data.length, "rows")

  if (!data || data.length === 0) {
    throw new Error("No data provided for processing")
  }

  // Create deep copy to avoid modifying original
  const processedData = JSON.parse(JSON.stringify(data))
  const missingValuesFilled: RealProcessingResult["missingValuesFilled"] = []
  const outliersFixed: RealProcessingResult["outliersFixed"] = []

  // Get all column names from first row
  const columns = Object.keys(data[0])
  console.log("📋 Processing columns:", columns)

  for (const column of columns) {
    console.log(`\n🔍 Analyzing column: ${column}`)

    // Get all values for this column
    const allValues = data.map((row) => row[column])
    console.log(`📈 Total values in ${column}:`, allValues.length)

    // Count missing values (null, undefined, empty string, "null", "undefined")
    const missingIndices: number[] = []
    allValues.forEach((value, index) => {
      if (
        value === null ||
        value === undefined ||
        value === "" ||
        value === "null" ||
        value === "undefined" ||
        (typeof value === "string" && value.trim() === "")
      ) {
        missingIndices.push(index)
      }
    })

    console.log(`❌ Missing values in ${column}:`, missingIndices.length)

    if (missingIndices.length > 0) {
      // Get non-missing values
      const validValues = allValues.filter((_, index) => !missingIndices.includes(index))
      console.log(`✅ Valid values in ${column}:`, validValues.length)

      // Determine if column is numeric
      const numericValues = validValues.map((v) => Number(v)).filter((v) => !isNaN(v) && isFinite(v))

      const isNumeric = numericValues.length > validValues.length * 0.7
      console.log(`🔢 Is ${column} numeric?`, isNumeric, `(${numericValues.length}/${validValues.length})`)

      let fillValue: any
      let method: string
      let explanation: string

      if (isNumeric && numericValues.length > 0) {
        // Calculate statistics for numeric data
        const sorted = [...numericValues].sort((a, b) => a - b)
        const mean = numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length
        const median = sorted[Math.floor(sorted.length / 2)]

        // Calculate skewness to decide between mean and median
        const variance = numericValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / numericValues.length
        const stdDev = Math.sqrt(variance)
        const skewness =
          stdDev > 0
            ? numericValues.reduce((sum, val) => sum + Math.pow((val - mean) / stdDev, 3), 0) / numericValues.length
            : 0

        if (Math.abs(skewness) <= 0.5) {
          fillValue = Number(mean.toFixed(2))
          method = "mean"
          explanation = `Used mean (${fillValue}) because data is symmetric (skewness: ${skewness.toFixed(2)})`
        } else {
          fillValue = median
          method = "median"
          explanation = `Used median (${fillValue}) because data is skewed (skewness: ${skewness.toFixed(2)})`
        }

        console.log(`📊 ${column} stats: mean=${mean.toFixed(2)}, median=${median}, skewness=${skewness.toFixed(2)}`)
      } else {
        // For categorical data, use mode (most frequent value)
        const valueCounts = new Map<string, number>()
        validValues.forEach((val) => {
          const strVal = String(val)
          valueCounts.set(strVal, (valueCounts.get(strVal) || 0) + 1)
        })

        let mode = ""
        let maxCount = 0
        for (const [value, count] of valueCounts.entries()) {
          if (count > maxCount) {
            maxCount = count
            mode = value
          }
        }

        fillValue = mode
        method = "mode"
        explanation = `Used mode ("${fillValue}") - most frequent value in categorical data`
        console.log(`📊 ${column} mode: "${fillValue}" (appears ${maxCount} times)`)
      }

      // Actually fill the missing values
      let actuallyFilled = 0
      missingIndices.forEach((index) => {
        processedData[index][column] = fillValue
        actuallyFilled++
      })

      missingValuesFilled.push({
        column,
        count: actuallyFilled,
        method,
        fillValue,
        explanation,
      })

      console.log(`✅ Filled ${actuallyFilled} missing values in ${column} with ${method}: ${fillValue}`)
    }

    // Handle outliers for numeric columns
    if (missingIndices.length === 0 || missingIndices.length < allValues.length) {
      const numericValues = processedData.map((row) => Number(row[column])).filter((v) => !isNaN(v) && isFinite(v))

      if (numericValues.length > 4) {
        console.log(`🎯 Checking outliers in ${column}...`)

        // Calculate IQR
        const sorted = [...numericValues].sort((a, b) => a - b)
        const q1 = sorted[Math.floor(sorted.length * 0.25)]
        const q3 = sorted[Math.floor(sorted.length * 0.75)]
        const iqr = q3 - q1
        const lowerBound = q1 - 1.5 * iqr
        const upperBound = q3 + 1.5 * iqr
        const median = sorted[Math.floor(sorted.length / 2)]

        console.log(`📊 ${column} IQR bounds: [${lowerBound.toFixed(2)}, ${upperBound.toFixed(2)}]`)

        // Find and fix outliers
        let outliersCount = 0
        processedData.forEach((row) => {
          const value = Number(row[column])
          if (!isNaN(value) && (value < lowerBound || value > upperBound)) {
            row[column] = median
            outliersCount++
          }
        })

        if (outliersCount > 0) {
          outliersFixed.push({
            column,
            count: outliersCount,
            method: "IQR",
            bounds: { lower: lowerBound, upper: upperBound },
            explanation: `Replaced ${outliersCount} outliers with median (${median.toFixed(2)})`,
          })

          console.log(`🎯 Fixed ${outliersCount} outliers in ${column}`)
        }
      }
    }
  }

  const totalMissingFilled = missingValuesFilled.reduce((sum, item) => sum + item.count, 0)
  const totalOutliersFixed = outliersFixed.reduce((sum, item) => sum + item.count, 0)

  console.log(`\n🎉 REAL Processing Complete!`)
  console.log(`📊 Total missing values filled: ${totalMissingFilled}`)
  console.log(`🎯 Total outliers fixed: ${totalOutliersFixed}`)

  return {
    originalData: data,
    processedData,
    missingValuesFilled,
    outliersFixed,
    totalMissingFilled,
    totalOutliersFixed,
  }
}
