/**
 * Statistical utility functions for data analysis
 */

/**
 * Calculate the volatility (coefficient of variation) of a dataset
 * @param values Array of numeric values
 * @returns Volatility as a percentage
 */
export function calculateVolatility(values: number[]): number {
  if (values.length < 2) return 0

  const mean = values.reduce((sum, val) => sum + val, 0) / values.length
  if (mean === 0) return 0

  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (values.length - 1)
  const standardDeviation = Math.sqrt(variance)

  // Return coefficient of variation as percentage
  return (standardDeviation / Math.abs(mean)) * 100
}

/**
 * Calculate the standard deviation of a dataset
 * @param values Array of numeric values
 * @returns Standard deviation
 */
export function calculateStandardDeviation(values: number[]): number {
  if (values.length < 2) return 0

  const mean = values.reduce((sum, val) => sum + val, 0) / values.length
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (values.length - 1)

  return Math.sqrt(variance)
}

/**
 * Calculate the variance of a dataset
 * @param values Array of numeric values
 * @returns Variance
 */
export function calculateVariance(values: number[]): number {
  if (values.length < 2) return 0

  const mean = values.reduce((sum, val) => sum + val, 0) / values.length
  return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (values.length - 1)
}

/**
 * Calculate the correlation coefficient between two datasets
 * @param x First dataset
 * @param y Second dataset
 * @returns Correlation coefficient (-1 to 1)
 */
export function calculateCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 2) return 0

  const n = x.length
  const sumX = x.reduce((sum, val) => sum + val, 0)
  const sumY = y.reduce((sum, val) => sum + val, 0)
  const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0)
  const sumXX = x.reduce((sum, val) => sum + val * val, 0)
  const sumYY = y.reduce((sum, val) => sum + val * val, 0)

  const numerator = n * sumXY - sumX * sumY
  const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY))

  return denominator === 0 ? 0 : numerator / denominator
}

/**
 * Calculate the median of a dataset
 * @param values Array of numeric values
 * @returns Median value
 */
export function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0

  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)

  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

/**
 * Calculate the mode of a dataset
 * @param values Array of numeric values
 * @returns Mode value (most frequent)
 */
export function calculateMode(values: number[]): number {
  if (values.length === 0) return 0

  const frequency: { [key: number]: number } = {}
  let maxFreq = 0
  let mode = values[0]

  values.forEach((val) => {
    frequency[val] = (frequency[val] || 0) + 1
    if (frequency[val] > maxFreq) {
      maxFreq = frequency[val]
      mode = val
    }
  })

  return mode
}

/**
 * Calculate quartiles of a dataset
 * @param values Array of numeric values
 * @returns Object with q1, q2 (median), q3 values
 */
export function calculateQuartiles(values: number[]): { q1: number; q2: number; q3: number } {
  if (values.length === 0) return { q1: 0, q2: 0, q3: 0 }

  const sorted = [...values].sort((a, b) => a - b)
  const n = sorted.length

  const q2 = calculateMedian(sorted)

  const lowerHalf = sorted.slice(0, Math.floor(n / 2))
  const upperHalf = sorted.slice(Math.ceil(n / 2))

  const q1 = calculateMedian(lowerHalf)
  const q3 = calculateMedian(upperHalf)

  return { q1, q2, q3 }
}

/**
 * Calculate skewness of a dataset
 * @param values Array of numeric values
 * @returns Skewness value
 */
export function calculateSkewness(values: number[]): number {
  if (values.length < 3) return 0

  const n = values.length
  const mean = values.reduce((sum, val) => sum + val, 0) / n
  const stdDev = calculateStandardDeviation(values)

  if (stdDev === 0) return 0

  const skewness = values.reduce((sum, val) => {
    return sum + Math.pow((val - mean) / stdDev, 3)
  }, 0)

  return (n / ((n - 1) * (n - 2))) * skewness
}

/**
 * Calculate kurtosis of a dataset
 * @param values Array of numeric values
 * @returns Kurtosis value
 */
export function calculateKurtosis(values: number[]): number {
  if (values.length < 4) return 0

  const n = values.length
  const mean = values.reduce((sum, val) => sum + val, 0) / n
  const stdDev = calculateStandardDeviation(values)

  if (stdDev === 0) return 0

  const kurtosis = values.reduce((sum, val) => {
    return sum + Math.pow((val - mean) / stdDev, 4)
  }, 0)

  return ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * kurtosis - (3 * Math.pow(n - 1, 2)) / ((n - 2) * (n - 3))
}

/**
 * Detect outliers using the IQR method
 * @param values Array of numeric values
 * @returns Array of outlier values
 */
export function detectOutliers(values: number[]): number[] {
  if (values.length < 4) return []

  const { q1, q3 } = calculateQuartiles(values)
  const iqr = q3 - q1
  const lowerBound = q1 - 1.5 * iqr
  const upperBound = q3 + 1.5 * iqr

  return values.filter((val) => val < lowerBound || val > upperBound)
}

/**
 * Calculate z-scores for a dataset
 * @param values Array of numeric values
 * @returns Array of z-scores
 */
export function calculateZScores(values: number[]): number[] {
  if (values.length < 2) return values.map(() => 0)

  const mean = values.reduce((sum, val) => sum + val, 0) / values.length
  const stdDev = calculateStandardDeviation(values)

  if (stdDev === 0) return values.map(() => 0)

  return values.map((val) => (val - mean) / stdDev)
}

/**
 * Calculate moving average
 * @param values Array of numeric values
 * @param window Window size for moving average
 * @returns Array of moving averages
 */
export function calculateMovingAverage(values: number[], window: number): number[] {
  if (window <= 0 || window > values.length) return values

  const result: number[] = []

  for (let i = 0; i <= values.length - window; i++) {
    const windowValues = values.slice(i, i + window)
    const average = windowValues.reduce((sum, val) => sum + val, 0) / window
    result.push(average)
  }

  return result
}
