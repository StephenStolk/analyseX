import jStat from "jstat"

export interface ColumnImpactResult {
  column: string
  score: number
  rank: number
  explanation: string
}

export interface TimeSeriesDecomposition {
  dates: string[]
  original: number[]
  trend: number[]
  seasonal: number[]
  residual: number[]
  explanation: string
}

export interface PCAResult {
  components: number[][]
  explainedVariance: number[]
  varianceExplained: number[] // Alias for backward compatibility
  cumulativeVariance: number[]
  screeData: { component: number; variance: number }[]
  transformedData: number[][]
  featureImportance: { feature: string; importance: number }[]
  eigenvalues: number[]
  explanation: string
}

export interface ClusteringResult {
  clusters: number[]
  centroids: number[][]
  inertia: number
  optimalK: number
  clusterData: { x: number; y: number; cluster: number }[]
  silhouetteScore: number
  clusterSizes: number[]
  withinClusterSS: number[]
  clusterStats: { cluster: number; size: number; centroid: number[] }[]
  explanation: string
}

// Calculate mutual information for feature importance
export function calculateColumnImpact(
  data: any[],
  targetColumn: string,
  featureColumns: string[],
): ColumnImpactResult[] {
  const results: ColumnImpactResult[] = []

  const targetValues = data.map((row) => Number(row[targetColumn])).filter((val) => !isNaN(val))

  featureColumns.forEach((column) => {
    if (column === targetColumn) return

    const featureValues = data.map((row) => Number(row[column])).filter((val) => !isNaN(val))

    if (featureValues.length < 3 || targetValues.length < 3) {
      results.push({
        column,
        score: 0,
        rank: 0,
        explanation: "Not enough data for analysis",
      })
      return
    }

    // Calculate correlation as a proxy for mutual information
    try {
      const correlation = jStat.corrcoeff(featureValues, targetValues)
      const score = Math.abs(correlation) || 0

      let explanation = ""
      if (score > 0.7) {
        explanation = `Very strong relationship with ${targetColumn}. Changes in ${column} strongly predict changes in ${targetColumn}.`
      } else if (score > 0.5) {
        explanation = `Moderate relationship with ${targetColumn}. ${column} is a good predictor but other factors also matter.`
      } else if (score > 0.3) {
        explanation = `Weak relationship with ${targetColumn}. ${column} has some influence but limited predictive power.`
      } else {
        explanation = `Very weak relationship with ${targetColumn}. ${column} doesn't seem to influence ${targetColumn} much.`
      }

      results.push({
        column,
        score,
        rank: 0, // Will be set after sorting
        explanation,
      })
    } catch (error) {
      results.push({
        column,
        score: 0,
        rank: 0,
        explanation: "Could not calculate relationship",
      })
    }
  })

  // Sort by score and assign ranks
  results.sort((a, b) => b.score - a.score)
  results.forEach((result, index) => {
    result.rank = index + 1
  })

  return results
}

// Simple time series decomposition
export function decomposeTimeSeries(
  data: any[],
  dateColumn: string,
  valueColumn: string,
): TimeSeriesDecomposition | null {
  try {
    // Filter and sort data by date
    const validData = data
      .filter((row) => row[dateColumn] && row[valueColumn] && !isNaN(Number(row[valueColumn])))
      .map((row) => ({
        date: new Date(row[dateColumn]),
        value: Number(row[valueColumn]),
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime())

    if (validData.length < 12) {
      return null // Need at least 12 points for meaningful decomposition
    }

    const dates = validData.map((d) => d.date.toISOString().split("T")[0])
    const values = validData.map((d) => d.value)

    // Simple trend calculation using moving average
    const windowSize = Math.min(12, Math.floor(values.length / 4))
    const trend: number[] = []

    for (let i = 0; i < values.length; i++) {
      const start = Math.max(0, i - Math.floor(windowSize / 2))
      const end = Math.min(values.length, i + Math.floor(windowSize / 2) + 1)
      const window = values.slice(start, end)
      const avg = window.reduce((sum, val) => sum + val, 0) / window.length
      trend.push(avg)
    }

    // Calculate seasonal component (simplified)
    const detrended = values.map((val, i) => val - trend[i])
    const seasonal: number[] = new Array(values.length).fill(0)

    // Simple seasonal pattern detection
    if (values.length >= 12) {
      const seasonalPeriod = 12 // Assume monthly seasonality
      for (let i = 0; i < values.length; i++) {
        const seasonIndex = i % seasonalPeriod
        const seasonalValues = detrended.filter((_, idx) => idx % seasonalPeriod === seasonIndex)
        seasonal[i] = seasonalValues.reduce((sum, val) => sum + val, 0) / seasonalValues.length
      }
    }

    // Calculate residual
    const residual = values.map((val, i) => val - trend[i] - seasonal[i])

    return {
      dates,
      original: values,
      trend,
      seasonal,
      residual,
      explanation: `Your data shows a ${trend[trend.length - 1] > trend[0] ? "rising" : "declining"} trend over time. ${seasonal.some((s) => Math.abs(s) > 0.1) ? "There are seasonal patterns that repeat regularly." : "No clear seasonal patterns detected."} This decomposition helps you understand the underlying patterns in your time-based data.`,
    }
  } catch (error) {
    console.error("Error in time series decomposition:", error)
    return null
  }
}

// Improved PCA implementation with proper feature importance calculation
export function performPCA(data: any[], numericColumns: string[]): PCAResult | null {
  try {
    if (numericColumns.length < 2) return null

    // Prepare data matrix
    const matrix: number[][] = []
    data.forEach((row) => {
      const rowData: number[] = []
      let hasAllValues = true

      numericColumns.forEach((col) => {
        const val = Number(row[col])
        if (isNaN(val)) {
          hasAllValues = false
        }
        rowData.push(val || 0)
      })

      if (hasAllValues) {
        matrix.push(rowData)
      }
    })

    if (matrix.length < 3) return null

    // Standardize data
    const means = numericColumns.map((_, colIdx) => {
      const sum = matrix.reduce((s, row) => s + row[colIdx], 0)
      return sum / matrix.length
    })

    const stds = numericColumns.map((_, colIdx) => {
      const variance = matrix.reduce((s, row) => s + Math.pow(row[colIdx] - means[colIdx], 2), 0) / matrix.length
      return Math.sqrt(variance)
    })

    const standardized = matrix.map((row) =>
      row.map((val, colIdx) => (stds[colIdx] > 0 ? (val - means[colIdx]) / stds[colIdx] : 0)),
    )

    // Calculate covariance matrix
    const numFeatures = numericColumns.length
    const covMatrix: number[][] = Array(numFeatures)
      .fill(0)
      .map(() => Array(numFeatures).fill(0))

    for (let i = 0; i < numFeatures; i++) {
      for (let j = 0; j < numFeatures; j++) {
        let covariance = 0
        for (let k = 0; k < standardized.length; k++) {
          covariance += standardized[k][i] * standardized[k][j]
        }
        covMatrix[i][j] = covariance / (standardized.length - 1)
      }
    }

    // Simple eigenvalue/eigenvector approximation using power iteration
    const components: number[][] = []
    const eigenvalues: number[] = []
    const explainedVariance: number[] = []

    // Calculate first few principal components
    const numComponents = Math.min(numFeatures, 4)

    for (let comp = 0; comp < numComponents; comp++) {
      // Initialize random vector
      let eigenvector = Array(numFeatures)
        .fill(0)
        .map(() => Math.random() - 0.5)

      // Power iteration to find dominant eigenvector
      for (let iter = 0; iter < 50; iter++) {
        // Multiply by covariance matrix
        const newVector = Array(numFeatures).fill(0)
        for (let i = 0; i < numFeatures; i++) {
          for (let j = 0; j < numFeatures; j++) {
            newVector[i] += covMatrix[i][j] * eigenvector[j]
          }
        }

        // Normalize
        const norm = Math.sqrt(newVector.reduce((sum, val) => sum + val * val, 0))
        if (norm > 0) {
          eigenvector = newVector.map((val) => val / norm)
        }
      }

      // Calculate eigenvalue
      let eigenvalue = 0
      for (let i = 0; i < numFeatures; i++) {
        for (let j = 0; j < numFeatures; j++) {
          eigenvalue += eigenvector[i] * covMatrix[i][j] * eigenvector[j]
        }
      }

      components.push([...eigenvector])
      eigenvalues.push(Math.max(0, eigenvalue))

      // Deflate covariance matrix for next component
      for (let i = 0; i < numFeatures; i++) {
        for (let j = 0; j < numFeatures; j++) {
          covMatrix[i][j] -= eigenvalue * eigenvector[i] * eigenvector[j]
        }
      }
    }

    // Calculate explained variance
    const totalVariance = eigenvalues.reduce((sum, val) => sum + val, 0)
    const normalizedVariance = eigenvalues.map((val) => (totalVariance > 0 ? (val / totalVariance) * 100 : 0))

    const cumulativeVariance = normalizedVariance.reduce((acc: number[], curr, idx) => {
      acc.push(idx === 0 ? curr : acc[idx - 1] + curr)
      return acc
    }, [])

    const screeData = normalizedVariance.map((variance, idx) => ({
      component: idx + 1,
      variance,
    }))

    // Transform data to PC space
    const transformedData = standardized.map((row) => {
      const transformed: number[] = []
      for (let comp = 0; comp < components.length; comp++) {
        const pcValue = row.reduce((sum, val, idx) => sum + val * components[comp][idx], 0)
        transformed.push(pcValue)
      }
      return transformed
    })

    // Calculate proper feature importance (loadings)
    const featureImportance = numericColumns
      .map((feature, idx) => {
        // Calculate the loading as the correlation between original feature and principal components
        let importance = 0

        // Use the first two components for importance calculation
        for (let comp = 0; comp < Math.min(2, components.length); comp++) {
          const loading = components[comp][idx] * Math.sqrt(eigenvalues[comp])
          importance += Math.abs(loading) * (normalizedVariance[comp] / 100)
        }

        return {
          feature,
          importance: Math.max(0.001, importance), // Ensure minimum visibility
        }
      })
      .sort((a, b) => b.importance - a.importance)

    // Normalize feature importance to 0-1 scale for better visualization
    const maxImportance = Math.max(...featureImportance.map((f) => f.importance))
    if (maxImportance > 0) {
      featureImportance.forEach((f) => {
        f.importance = f.importance / maxImportance
      })
    }

    return {
      components,
      explainedVariance: normalizedVariance,
      varianceExplained: normalizedVariance,
      cumulativeVariance,
      screeData,
      transformedData,
      featureImportance,
      eigenvalues,
      explanation: `PCA helps reduce the complexity of your data while keeping the most important information. The first component explains ${normalizedVariance[0]?.toFixed(1)}% of the variation in your data. The feature importance shows how much each original variable contributes to the principal components.`,
    }
  } catch (error) {
    console.error("Error in PCA:", error)
    return null
  }
}

// Simple K-means clustering
export function performClustering(data: any[], numericColumns: string[]): ClusteringResult | null {
  try {
    if (numericColumns.length < 2) return null

    // Prepare data
    const points: number[][] = []
    data.forEach((row) => {
      const point: number[] = []
      let hasAllValues = true

      numericColumns.slice(0, 2).forEach((col) => {
        // Use first 2 numeric columns
        const val = Number(row[col])
        if (isNaN(val)) {
          hasAllValues = false
        }
        point.push(val || 0)
      })

      if (hasAllValues) {
        points.push(point)
      }
    })

    if (points.length < 6) return null

    // Find optimal k using elbow method (simplified)
    const maxK = Math.min(6, Math.floor(points.length / 2))
    let optimalK = 3
    let bestInertia = Number.POSITIVE_INFINITY
    const withinClusterSS: number[] = []

    for (let k = 2; k <= maxK; k++) {
      const result = simpleKMeans(points, k)
      withinClusterSS.push(result.inertia)
      if (result.inertia < bestInertia) {
        bestInertia = result.inertia
        optimalK = k
      }
    }

    // Perform final clustering
    const finalResult = simpleKMeans(points, optimalK)

    // Calculate cluster sizes
    const clusterSizes: number[] = new Array(optimalK).fill(0)
    finalResult.clusters.forEach((cluster) => {
      clusterSizes[cluster]++
    })

    // Calculate silhouette score (simplified)
    let silhouetteScore = 0
    if (points.length > 1 && optimalK > 1) {
      let totalSilhouette = 0
      let validPoints = 0

      for (let i = 0; i < points.length; i++) {
        const pointCluster = finalResult.clusters[i]

        // Calculate average distance to points in same cluster (a)
        const sameClusterPoints = points.filter((_, idx) => finalResult.clusters[idx] === pointCluster && idx !== i)
        let a = 0
        if (sameClusterPoints.length > 0) {
          a =
            sameClusterPoints.reduce((sum, point) => sum + euclideanDistance(points[i], point), 0) /
            sameClusterPoints.length
        }

        // Calculate minimum average distance to points in other clusters (b)
        let b = Number.POSITIVE_INFINITY
        for (let cluster = 0; cluster < optimalK; cluster++) {
          if (cluster !== pointCluster) {
            const otherClusterPoints = points.filter((_, idx) => finalResult.clusters[idx] === cluster)
            if (otherClusterPoints.length > 0) {
              const avgDistance =
                otherClusterPoints.reduce((sum, point) => sum + euclideanDistance(points[i], point), 0) /
                otherClusterPoints.length
              b = Math.min(b, avgDistance)
            }
          }
        }

        // Calculate silhouette for this point
        if (b !== Number.POSITIVE_INFINITY && (a > 0 || b > 0)) {
          const silhouette = (b - a) / Math.max(a, b)
          totalSilhouette += silhouette
          validPoints++
        }
      }

      silhouetteScore = validPoints > 0 ? totalSilhouette / validPoints : 0
    }

    // Create cluster statistics
    const clusterStats = Array.from({ length: optimalK }, (_, i) => ({
      cluster: i,
      size: clusterSizes[i],
      centroid: finalResult.centroids[i] || [0, 0],
    }))

    const clusterData = points.map((point, idx) => ({
      x: point[0],
      y: point[1],
      cluster: finalResult.clusters[idx],
    }))

    return {
      clusters: finalResult.clusters,
      centroids: finalResult.centroids,
      inertia: finalResult.inertia,
      optimalK,
      clusterData,
      silhouetteScore,
      clusterSizes,
      withinClusterSS,
      clusterStats,
      explanation: `Your data naturally groups into ${optimalK} clusters. This is like sorting items into ${optimalK} different categories based on their similarities. Each cluster represents a group of data points that are more similar to each other than to points in other clusters.`,
    }
  } catch (error) {
    console.error("Error in clustering:", error)
    return null
  }
}

// Simple K-means implementation
function simpleKMeans(points: number[][], k: number): { clusters: number[]; centroids: number[][]; inertia: number } {
  const dimensions = points[0].length

  // Initialize centroids randomly
  const centroids: number[][] = []
  for (let i = 0; i < k; i++) {
    const centroid: number[] = []
    for (let d = 0; d < dimensions; d++) {
      const values = points.map((p) => p[d])
      const min = Math.min(...values)
      const max = Math.max(...values)
      centroid.push(min + Math.random() * (max - min))
    }
    centroids.push(centroid)
  }

  const clusters: number[] = new Array(points.length).fill(0)
  let changed = true
  let iterations = 0

  while (changed && iterations < 100) {
    changed = false
    iterations++

    // Assign points to nearest centroid
    for (let i = 0; i < points.length; i++) {
      let minDistance = Number.POSITIVE_INFINITY
      let nearestCluster = 0

      for (let c = 0; c < k; c++) {
        const distance = euclideanDistance(points[i], centroids[c])
        if (distance < minDistance) {
          minDistance = distance
          nearestCluster = c
        }
      }

      if (clusters[i] !== nearestCluster) {
        clusters[i] = nearestCluster
        changed = true
      }
    }

    // Update centroids
    for (let c = 0; c < k; c++) {
      const clusterPoints = points.filter((_, idx) => clusters[idx] === c)
      if (clusterPoints.length > 0) {
        for (let d = 0; d < dimensions; d++) {
          centroids[c][d] = clusterPoints.reduce((sum, point) => sum + point[d], 0) / clusterPoints.length
        }
      }
    }
  }

  // Calculate inertia
  let inertia = 0
  for (let i = 0; i < points.length; i++) {
    const distance = euclideanDistance(points[i], centroids[clusters[i]])
    inertia += distance * distance
  }

  return { clusters, centroids, inertia }
}

function euclideanDistance(point1: number[], point2: number[]): number {
  return Math.sqrt(point1.reduce((sum, val, idx) => sum + Math.pow(val - point2[idx], 2), 0))
}
