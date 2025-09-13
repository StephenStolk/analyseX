/**
 * Core statistical functions for data analysis
 */

/**
 * Calculate basic statistics for a numeric array
 */
export function calculateStatistics(values: number[]): ColumnStatistics {
  if (values.length === 0) {
    return { mean: 0, median: 0, stdDev: 0, min: 0, max: 0, q1: 0, q3: 0 }
  }

  const sorted = [...values].sort((a, b) => a - b)
  const n = values.length

  const sum = values.reduce((acc, val) => acc + val, 0)
  const mean = sum / n

  let median: number
  if (n % 2 === 0) {
    median = (sorted[n / 2 - 1] + sorted[n / 2]) / 2
  } else {
    median = sorted[Math.floor(n / 2)]
  }

  const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n
  const stdDev = Math.sqrt(variance)

  const min = sorted[0]
  const max = sorted[n - 1]

  const { q1, q3 } = calculateQuantiles(sorted)

  return { mean, median, stdDev, min, max, q1, q3 }
}

export interface ColumnStatistics {
  mean: number
  median: number
  stdDev: number
  min: number
  max: number
  q1: number
  q3: number
}

export function calculateQuantiles(sortedValues: number[]): { q1: number; q3: number } {
  const n = sortedValues.length
  const q1Index = (n + 1) * 0.25 - 1
  const q3Index = (n + 1) * 0.75 - 1

  const interpolate = (arr: number[], index: number) => {
    const lower = Math.floor(index)
    const upper = Math.ceil(index)
    if (lower === upper) return arr[lower]
    return arr[lower] * (upper - index) + arr[upper] * (index - lower)
  }

  const q1 = interpolate(sortedValues, q1Index)
  const q3 = interpolate(sortedValues, q3Index)

  return { q1, q3 }
}

/**
 * Calculate correlation coefficient between two numeric arrays
 */
export function calculateCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length)
  if (n < 2) return 0

  const meanX = x.slice(0, n).reduce((sum, val) => sum + val, 0) / n
  const meanY = y.slice(0, n).reduce((sum, val) => sum + val, 0) / n

  let numerator = 0
  let sumSqX = 0
  let sumSqY = 0

  for (let i = 0; i < n; i++) {
    const deltaX = x[i] - meanX
    const deltaY = y[i] - meanY
    numerator += deltaX * deltaY
    sumSqX += deltaX * deltaX
    sumSqY += deltaY * deltaY
  }

  const denominator = Math.sqrt(sumSqX * sumSqY)

  return denominator === 0 ? 0 : numerator / denominator
}

/**
 * Calculate correlation matrix for multiple numeric columns
 */
export function calculateCorrelationMatrix(data: any[], numericColumns: string[]): number[][] {
  const matrix: number[][] = []

  for (const col1 of numericColumns) {
    const row: number[] = []

    for (const col2 of numericColumns) {
      if (col1 === col2) {
        row.push(1) // Perfect correlation with itself
      } else {
        const values1 = data.map((d) => Number(d[col1])).filter((v) => !isNaN(v))
        const values2 = data.map((d) => Number(d[col2])).filter((v) => !isNaN(v))

        // Create paired values (remove pairs with missing values)
        const pairedValues: [number, number][] = []
        for (let i = 0; i < data.length; i++) {
          const val1 = Number(data[i][col1])
          const val2 = Number(data[i][col2])
          if (!isNaN(val1) && !isNaN(val2)) {
            pairedValues.push([val1, val2])
          }
        }

        const x = pairedValues.map((pair) => pair[0])
        const y = pairedValues.map((pair) => pair[1])

        const correlation = calculateCorrelation(x, y)
        row.push(isNaN(correlation) ? 0 : correlation)
      }
    }

    matrix.push(row)
  }

  return matrix
}

/**
 * Calculate histogram data for a numeric array
 */
export function calculateHistogram(values: number[], bins = 10) {
  if (values.length === 0) {
    return {
      bins: Array(bins + 1).fill(0),
      frequencies: Array(bins).fill(0),
    }
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

/**
 * Detect outliers using the IQR method
 */
export function detectOutliers(values: number[]): number[] {
  if (values.length < 4) return []

  const stats = calculateStatistics(values)
  const lowerBound = stats.q1 - 1.5 * (stats.q3 - stats.q1)
  const upperBound = stats.q3 + 1.5 * (stats.q3 - stats.q1)

  return values.filter((v) => v < lowerBound || v > upperBound)
}

/**
 * Calculate skewness of a distribution
 */
export function calculateSkewness(values: number[]): number {
  if (values.length < 3) return 0

  const stats = calculateStatistics(values)
  const n = values.length

  let sumCubedDeviations = 0
  for (const value of values) {
    sumCubedDeviations += Math.pow(value - stats.mean, 3)
  }

  return (n / ((n - 1) * (n - 2))) * (sumCubedDeviations / Math.pow(stats.stdDev, 3))
}

/**
 * Calculate kurtosis of a distribution
 */
export function calculateKurtosis(values: number[]): number {
  if (values.length < 4) return 0

  const stats = calculateStatistics(values)
  const n = values.length

  let sumQuarticDeviations = 0
  for (const value of values) {
    sumQuarticDeviations += Math.pow(value - stats.mean, 4)
  }

  const a = (n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))
  const b = sumQuarticDeviations / Math.pow(stats.stdDev, 4)
  const c = (3 * Math.pow(n - 1, 2)) / ((n - 2) * (n - 3))

  return a * b - c
}

/**
 * Calculate autocorrelation for time series data
 */
export function calculateAutocorrelation(values: number[], lag = 1): number {
  if (values.length <= lag) return 0

  const n = values.length
  const mean = values.reduce((acc, val) => acc + val, 0) / n

  let numerator = 0
  let denominator = 0

  for (let i = 0; i < n - lag; i++) {
    numerator += (values[i] - mean) * (values[i + lag] - mean)
  }

  for (let i = 0; i < n; i++) {
    denominator += Math.pow(values[i] - mean, 2)
  }

  return denominator !== 0 ? numerator / denominator : 0
}

/**
 * Calculate autocorrelation function (ACF) for multiple lags
 */
export function calculateACF(values: number[], maxLag = 20): number[] {
  const result: number[] = []

  for (let lag = 0; lag <= maxLag; lag++) {
    result.push(calculateAutocorrelation(values, lag))
  }

  return result
}

/**
 * Perform simple linear regression
 */
export function linearRegression(x: number[], y: number[]) {
  if (x.length !== y.length || x.length < 2) {
    return { slope: 0, intercept: 0, rSquared: 0 }
  }

  const n = x.length

  // Calculate means
  const xMean = x.reduce((acc, val) => acc + val, 0) / n
  const yMean = y.reduce((acc, val) => acc + val, 0) / n

  // Calculate slope and intercept
  let numerator = 0
  let denominator = 0

  for (let i = 0; i < n; i++) {
    numerator += (x[i] - xMean) * (y[i] - yMean)
    denominator += Math.pow(x[i] - xMean, 2)
  }

  const slope = denominator !== 0 ? numerator / denominator : 0
  const intercept = yMean - slope * xMean

  // Calculate R-squared
  let totalSS = 0
  let residualSS = 0

  for (let i = 0; i < n; i++) {
    const predicted = slope * x[i] + intercept
    totalSS += Math.pow(y[i] - yMean, 2)
    residualSS += Math.pow(y[i] - predicted, 2)
  }

  const rSquared = totalSS !== 0 ? 1 - residualSS / totalSS : 0

  return { slope, intercept, rSquared }
}
