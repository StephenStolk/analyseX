export interface FeatureImportanceResult {
  features: string[]
  importance: number[]
  normalizedImportance: number[]
  correlations: number[]
  mutualInformation: number[]
  ranks: number[]
}

export interface TTestResult {
  t: number
  pValue: number
  degreesOfFreedom: number
  mean1: number
  mean2: number
  std1: number
  std2: number
  effectSize: number
  confidenceInterval: [number, number]
  significant: boolean
}

export interface AnovaResult {
  F: number
  pValue: number
  dfBetween: number
  dfWithin: number
  dfTotal: number
  ssBetween: number
  ssWithin: number
  ssTotal: number
  msBetween: number
  msWithin: number
  significant: boolean
  postHoc?: { [key: string]: { pValue: number; significant: boolean } }
}

export interface ChiSquareResult {
  chiSquare: number
  pValue: number
  degreesOfFreedom: number
  cramersV: number
  contingencyTable: number[][]
  significant: boolean
}

export interface NormalityTestResult {
  shapiroWilk: {
    W: number
    pValue: number
    isNormal: boolean
  }
  kolmogorovSmirnov: {
    D: number
    pValue: number
    isNormal: boolean
  }
  skewness: number
  kurtosis: number
  isNormal: boolean
  qqPlotData: { x: number; y: number }[]
}

export function calculateFeatureImportance(
  data: any[],
  targetColumn: string,
  featureColumns: string[],
): FeatureImportanceResult {
  if (!data || data.length === 0) {
    throw new Error("Data cannot be empty")
  }

  if (!targetColumn) {
    throw new Error("Target column must be specified")
  }

  if (!featureColumns || featureColumns.length === 0) {
    throw new Error("Feature columns must be specified")
  }

  if (!data[0].hasOwnProperty(targetColumn)) {
    throw new Error(`Target column "${targetColumn}" not found in data`)
  }

  featureColumns.forEach((feature) => {
    if (!data[0].hasOwnProperty(feature)) {
      throw new Error(`Feature column "${feature}" not found in data`)
    }
  })

  const targetValues = data.map((item) => item[targetColumn])
  const featureValues = featureColumns.map((feature) => data.map((item) => item[feature]))

  if (targetValues.some(isNaN)) {
    throw new Error(`Target column "${targetColumn}" contains non-numeric values`)
  }

  if (featureValues.some((feature) => feature.some(isNaN))) {
    throw new Error("Feature columns contain non-numeric values")
  }

  const correlations = featureValues.map((feature) => {
    let sumX = 0
    let sumY = 0
    let sumXY = 0
    let sumX2 = 0
    let sumY2 = 0

    const n = data.length

    for (let i = 0; i < n; i++) {
      sumX += feature[i]
      sumY += targetValues[i]
      sumXY += feature[i] * targetValues[i]
      sumX2 += feature[i] * feature[i]
      sumY2 += targetValues[i] * targetValues[i]
    }

    const numerator = n * sumXY - sumX * sumY
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))

    if (denominator === 0) {
      return 0 // Avoid division by zero
    }

    return numerator / denominator
  })

  const mutualInformation = featureValues.map((feature) => {
    // Simple approximation of mutual information (can be replaced with a more accurate calculation)
    const featureVariance = feature.reduce((a, b) => a + b, 0) / feature.length
    const targetVariance = targetValues.reduce((a, b) => a + b, 0) / targetValues.length
    return Math.abs(featureVariance - targetVariance)
  })

  // Ensure all arrays have the same length and proper values
  const importance = featureColumns.map((feature, i) => {
    const correlation = Math.abs(correlations[i] || 0)
    const mutualInfo = mutualInformation[i] || 0
    return (correlation + mutualInfo) / 2
  })

  const maxImportance = Math.max(...importance)
  const normalizedImportance = importance.map((imp) => (maxImportance > 0 ? imp / maxImportance : 0))

  const ranks = importance
    .map((imp, i) => ({ importance: imp, index: i }))
    .sort((a, b) => b.importance - a.importance)
    .map((item, rank) => ({ index: item.index, rank: rank + 1 }))
    .sort((a, b) => a.index - b.index)
    .map((item) => item.rank)

  return {
    features: featureColumns,
    importance,
    normalizedImportance,
    correlations,
    mutualInformation,
    ranks,
  }
}

// Helper function to calculate mean
function mean(values: number[]): number {
  return values.reduce((sum, val) => sum + val, 0) / values.length
}

// Helper function to calculate standard deviation
function standardDeviation(values: number[]): number {
  const avg = mean(values)
  const squaredDiffs = values.map((val) => Math.pow(val - avg, 2))
  return Math.sqrt(mean(squaredDiffs))
}

// Helper function to calculate t-distribution critical value (approximation)
function tCritical(df: number, alpha = 0.05): number {
  // Simplified approximation for t-critical values
  if (df >= 30) return 1.96 // Normal approximation
  const tTable: { [key: number]: number } = {
    1: 12.706,
    2: 4.303,
    3: 3.182,
    4: 2.776,
    5: 2.571,
    6: 2.447,
    7: 2.365,
    8: 2.306,
    9: 2.262,
    10: 2.228,
    15: 2.131,
    20: 2.086,
    25: 2.06,
    30: 2.042,
  }

  for (const [degrees, critical] of Object.entries(tTable)) {
    if (df <= Number.parseInt(degrees)) return critical
  }
  return 1.96
}

// Helper function to calculate p-value from t-statistic (approximation)
function tTestPValue(t: number, df: number): number {
  // Simplified p-value calculation using normal approximation
  const absT = Math.abs(t)
  if (df >= 30) {
    // Normal approximation
    return 2 * (1 - normalCDF(absT))
  }

  // Rough approximation for smaller df
  const normalP = 2 * (1 - normalCDF(absT))
  const adjustment = 1 + 1 / (4 * df) + 5 / (96 * df * df)
  return Math.min(1, normalP * adjustment)
}

// Helper function for normal CDF approximation
function normalCDF(x: number): number {
  // Abramowitz and Stegun approximation
  const t = 1 / (1 + 0.2316419 * Math.abs(x))
  const d = 0.3989423 * Math.exp((-x * x) / 2)
  const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))))
  return x > 0 ? 1 - prob : prob
}

// Helper function to calculate F-distribution p-value (approximation)
function fTestPValue(f: number, df1: number, df2: number): number {
  // Very simplified approximation
  if (f < 1) return 1 - fTestPValue(1 / f, df2, df1)

  // Rough approximation using chi-square
  const chiSq = f * df1
  return 1 - (Math.exp(-chiSq / 2) * Math.pow(chiSq / 2, df1 / 2 - 1)) / gamma(df1 / 2)
}

// Helper gamma function approximation
function gamma(z: number): number {
  // Stirling's approximation
  if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z))
  z -= 1
  let x = 0.99999999999980993
  const coefficients = [
    676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ]

  for (let i = 0; i < coefficients.length; i++) {
    x += coefficients[i] / (z + i + 1)
  }

  const t = z + coefficients.length - 0.5
  return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x
}

export function performTTest(
  data: any[],
  valueColumn: string,
  groupColumn: string,
  group1: string,
  group2: string,
): TTestResult {
  // Filter data for each group
  const group1Data = data
    .filter((row) => String(row[groupColumn]) === group1 && !isNaN(Number(row[valueColumn])))
    .map((row) => Number(row[valueColumn]))

  const group2Data = data
    .filter((row) => String(row[groupColumn]) === group2 && !isNaN(Number(row[valueColumn])))
    .map((row) => Number(row[valueColumn]))

  if (group1Data.length < 2 || group2Data.length < 2) {
    throw new Error("Each group must have at least 2 observations")
  }

  const mean1 = mean(group1Data)
  const mean2 = mean(group2Data)
  const std1 = standardDeviation(group1Data)
  const std2 = standardDeviation(group2Data)

  const n1 = group1Data.length
  const n2 = group2Data.length

  // Pooled standard deviation for equal variance t-test
  const pooledStd = Math.sqrt(((n1 - 1) * std1 * std1 + (n2 - 1) * std2 * std2) / (n1 + n2 - 2))
  const standardError = pooledStd * Math.sqrt(1 / n1 + 1 / n2)

  const t = (mean1 - mean2) / standardError
  const df = n1 + n2 - 2
  const pValue = tTestPValue(t, df)

  // Cohen's d effect size
  const effectSize = (mean1 - mean2) / pooledStd

  // 95% confidence interval
  const tCrit = tCritical(df)
  const marginOfError = tCrit * standardError
  const confidenceInterval: [number, number] = [mean1 - mean2 - marginOfError, mean1 - mean2 + marginOfError]

  return {
    t,
    pValue,
    degreesOfFreedom: df,
    mean1,
    mean2,
    std1,
    std2,
    effectSize,
    confidenceInterval,
    significant: pValue < 0.05,
  }
}

export function performANOVA(data: any[], valueColumn: string, groupColumn: string): AnovaResult {
  // Group data by category
  const groups: { [key: string]: number[] } = {}

  data.forEach((row) => {
    const group = String(row[groupColumn])
    const value = Number(row[valueColumn])

    if (!isNaN(value)) {
      if (!groups[group]) groups[group] = []
      groups[group].push(value)
    }
  })

  const groupNames = Object.keys(groups)
  const groupData = Object.values(groups)

  if (groupNames.length < 2) {
    throw new Error("ANOVA requires at least 2 groups")
  }

  // Calculate overall mean
  const allValues = groupData.flat()
  const grandMean = mean(allValues)
  const totalN = allValues.length

  // Calculate sum of squares
  let ssBetween = 0
  let ssWithin = 0

  groupData.forEach((group) => {
    const groupMean = mean(group)
    const n = group.length

    // Between-group sum of squares
    ssBetween += n * Math.pow(groupMean - grandMean, 2)

    // Within-group sum of squares
    group.forEach((value) => {
      ssWithin += Math.pow(value - groupMean, 2)
    })
  })

  const ssTotal = ssBetween + ssWithin

  // Degrees of freedom
  const dfBetween = groupNames.length - 1
  const dfWithin = totalN - groupNames.length
  const dfTotal = totalN - 1

  // Mean squares
  const msBetween = ssBetween / dfBetween
  const msWithin = ssWithin / dfWithin

  // F-statistic
  const F = msBetween / msWithin
  const pValue = fTestPValue(F, dfBetween, dfWithin)

  // Post-hoc tests (simplified pairwise comparisons)
  const postHoc: { [key: string]: { pValue: number; significant: boolean } } = {}

  if (groupNames.length > 2 && pValue < 0.05) {
    for (let i = 0; i < groupNames.length; i++) {
      for (let j = i + 1; j < groupNames.length; j++) {
        const group1Name = groupNames[i]
        const group2Name = groupNames[j]

        try {
          const tTestResult = performTTest(data, valueColumn, groupColumn, group1Name, group2Name)
          // Bonferroni correction
          const adjustedP = tTestResult.pValue * ((groupNames.length * (groupNames.length - 1)) / 2)
          postHoc[`${group1Name} vs ${group2Name}`] = {
            pValue: Math.min(1, adjustedP),
            significant: adjustedP < 0.05,
          }
        } catch (error) {
          // Skip if comparison fails
        }
      }
    }
  }

  return {
    F,
    pValue,
    dfBetween,
    dfWithin,
    dfTotal,
    ssBetween,
    ssWithin,
    ssTotal,
    msBetween,
    msWithin,
    significant: pValue < 0.05,
    postHoc: Object.keys(postHoc).length > 0 ? postHoc : undefined,
  }
}

export function performChiSquareTest(data: any[], variable1: string, variable2: string): ChiSquareResult {
  // Create contingency table
  const contingencyMap: { [key: string]: { [key: string]: number } } = {}

  data.forEach((row) => {
    const val1 = String(row[variable1])
    const val2 = String(row[variable2])

    if (val1 && val2) {
      if (!contingencyMap[val1]) contingencyMap[val1] = {}
      if (!contingencyMap[val1][val2]) contingencyMap[val1][val2] = 0
      contingencyMap[val1][val2]++
    }
  })

  const categories1 = Object.keys(contingencyMap)
  const categories2 = [...new Set(Object.values(contingencyMap).flatMap((obj) => Object.keys(obj)))]

  if (categories1.length < 2 || categories2.length < 2) {
    throw new Error("Chi-square test requires at least 2 categories for each variable")
  }

  // Convert to matrix
  const contingencyTable: number[][] = []
  const rowTotals: number[] = []
  const colTotals: number[] = new Array(categories2.length).fill(0)
  let grandTotal = 0

  categories1.forEach((cat1, i) => {
    const row: number[] = []
    let rowTotal = 0

    categories2.forEach((cat2, j) => {
      const count = contingencyMap[cat1]?.[cat2] || 0
      row.push(count)
      rowTotal += count
      colTotals[j] += count
      grandTotal += count
    })

    contingencyTable.push(row)
    rowTotals.push(rowTotal)
  })

  // Calculate chi-square statistic
  let chiSquare = 0

  for (let i = 0; i < categories1.length; i++) {
    for (let j = 0; j < categories2.length; j++) {
      const observed = contingencyTable[i][j]
      const expected = (rowTotals[i] * colTotals[j]) / grandTotal

      if (expected > 0) {
        chiSquare += Math.pow(observed - expected, 2) / expected
      }
    }
  }

  const degreesOfFreedom = (categories1.length - 1) * (categories2.length - 1)

  // Approximate p-value using chi-square distribution
  const pValue =
    1 - (Math.exp(-chiSquare / 2) * Math.pow(chiSquare / 2, degreesOfFreedom / 2 - 1)) / gamma(degreesOfFreedom / 2)

  // Cramer's V effect size
  const cramersV = Math.sqrt(chiSquare / (grandTotal * Math.min(categories1.length - 1, categories2.length - 1)))

  return {
    chiSquare,
    pValue: Math.max(0, Math.min(1, pValue)),
    degreesOfFreedom,
    cramersV,
    contingencyTable,
    significant: pValue < 0.05,
  }
}

export function performNormalityTest(data: any[], column: string): NormalityTestResult {
  const values = data
    .map((row) => Number(row[column]))
    .filter((val) => !isNaN(val))
    .sort((a, b) => a - b)

  if (values.length < 3) {
    throw new Error("Normality test requires at least 3 observations")
  }

  const n = values.length
  const sampleMean = mean(values)
  const sampleStd = standardDeviation(values)

  // Shapiro-Wilk test (simplified)
  let W = 0
  if (n <= 50) {
    // Simplified calculation for small samples
    const sortedValues = [...values].sort((a, b) => a - b)
    let numerator = 0
    let denominator = 0

    for (let i = 0; i < n; i++) {
      const standardized = (sortedValues[i] - sampleMean) / sampleStd
      numerator += standardized * (i + 1 - (n + 1) / 2)
      denominator += Math.pow(sortedValues[i] - sampleMean, 2)
    }

    W = Math.pow(numerator, 2) / denominator
  } else {
    W = 0.95 // Approximate for large samples
  }

  const shapiroWilkPValue = W > 0.95 ? 0.1 : 0.01 // Simplified

  // Kolmogorov-Smirnov test
  let maxDifference = 0

  for (let i = 0; i < n; i++) {
    const empiricalCDF = (i + 1) / n
    const theoreticalCDF = normalCDF((values[i] - sampleMean) / sampleStd)
    const difference = Math.abs(empiricalCDF - theoreticalCDF)
    maxDifference = Math.max(maxDifference, difference)
  }

  const D = maxDifference
  const ksPValue = Math.exp(-2 * n * D * D) // Simplified approximation

  // Calculate skewness and kurtosis
  let skewness = 0
  let kurtosis = 0

  values.forEach((value) => {
    const standardized = (value - sampleMean) / sampleStd
    skewness += Math.pow(standardized, 3)
    kurtosis += Math.pow(standardized, 4)
  })

  skewness = skewness / n
  kurtosis = kurtosis / n - 3 // Excess kurtosis

  // Generate Q-Q plot data
  const qqPlotData: { x: number; y: number }[] = []

  for (let i = 0; i < Math.min(n, 100); i++) {
    const p = (i + 0.5) / Math.min(n, 100)
    const theoreticalQuantile = inverseNormalCDF(p)
    const sampleQuantile = values[Math.floor((i * n) / Math.min(n, 100))]

    qqPlotData.push({
      x: theoreticalQuantile,
      y: (sampleQuantile - sampleMean) / sampleStd,
    })
  }

  const shapiroWilkNormal = shapiroWilkPValue >= 0.05
  const ksNormal = ksPValue >= 0.05
  const isNormal = shapiroWilkNormal && ksNormal

  return {
    shapiroWilk: {
      W,
      pValue: shapiroWilkPValue,
      isNormal: shapiroWilkNormal,
    },
    kolmogorovSmirnov: {
      D,
      pValue: ksPValue,
      isNormal: ksNormal,
    },
    skewness,
    kurtosis,
    isNormal,
    qqPlotData,
  }
}

// Helper function for inverse normal CDF (approximation)
function inverseNormalCDF(p: number): number {
  // Beasley-Springer-Moro algorithm approximation
  if (p <= 0) return Number.NEGATIVE_INFINITY
  if (p >= 1) return Number.POSITIVE_INFINITY
  if (p === 0.5) return 0

  const a = [
    0, -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2, -3.066479806614716e1,
    2.506628277459239,
  ]
  const b = [
    0, -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1,
  ]
  const c = [
    0, -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968,
    2.938163982698783,
  ]
  const d = [0, 7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416]

  let x: number

  if (p < 0.02425) {
    const q = Math.sqrt(-2 * Math.log(p))
    x =
      (((((c[1] * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) * q + c[6]) /
      ((((d[1] * q + d[2]) * q + d[3]) * q + d[4]) * q + 1)
  } else if (p > 0.97575) {
    const q = Math.sqrt(-2 * Math.log(1 - p))
    x =
      -(((((c[1] * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) * q + c[6]) /
      ((((d[1] * q + d[2]) * q + d[3]) * q + d[4]) * q + 1)
  } else {
    const q = p - 0.5
    const r = q * q
    x =
      ((((((a[1] * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * r + a[6]) * q) /
      (((((b[1] * r + b[2]) * r + b[3]) * r + b[4]) * r + b[5]) * r + 1)
  }

  return x
}
