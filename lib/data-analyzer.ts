import { parseDataFile } from "./excel-parser"
import * as Stats from "./statistics"

export interface ColumnStats {
  name: string
  type: string
  count: number
  missing: number
  unique: number
  min?: number
  max?: number
  mean?: number
  median?: number
  stdDev?: number
  skewness?: number
  kurtosis?: number
}

export interface CorrelationMatrix {
  labels: string[]
  matrix: number[][]
  strongPairs: {
    column1: string
    column2: string
    value: number
  }[]
}

export interface HistogramData {
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

export interface TimeSeriesData {
  column: string
  timeColumn: string
  times: string[]
  values: number[]
  trend: "increasing" | "decreasing" | "stable"
  seasonality: "high" | "medium" | "low" | "none"
  autocorrelation: number[]
}

export interface RegressionModel {
  xColumn: string
  yColumn: string
  slope: number
  intercept: number
  rSquared: number
  predictions: { x: number; y: number }[]
}

export interface AnalysisResults {
  fileName: string
  rowCount: number
  columnCount: number
  missingValues: number
  duplicateRows: number
  columnStats: ColumnStats[]
  correlationMatrix: CorrelationMatrix
  histograms: HistogramData[]
  boxPlots: BoxPlotData[]
  timeSeries: TimeSeriesData[]
  regressionModels: RegressionModel[]
  previewData: any[]
  rawData?: any[] // Full dataset for analysis
  rows?: any[] // Alternative property name for compatibility
}

export async function analyzeFile(file: File): Promise<AnalysisResults> {
  console.log(`Starting analysis of ${file.name}`)

  try {
    // Parse the file
    const parsedData = await parseDataFile(file)
    console.log(`Successfully parsed ${parsedData.rows.length} rows with ${parsedData.headers.length} columns`)

    // Calculate basic statistics for each column
    const columnStats: ColumnStats[] = []
    let totalMissing = 0

    for (const header of parsedData.headers) {
      const values = parsedData.rows.map((row) => row[header])
      const nonNullValues = values.filter((v) => v !== null && v !== undefined && v !== "")
      const uniqueValues = [...new Set(nonNullValues)]
      const missing = parsedData.rows.length - nonNullValues.length
      totalMissing += missing

      const stats: ColumnStats = {
        name: header,
        type: parsedData.numericColumns.includes(header)
          ? "Number"
          : parsedData.dateColumns.includes(header)
            ? "Date"
            : "String",
        count: nonNullValues.length,
        missing,
        unique: uniqueValues.length,
      }

      // Calculate numeric statistics if applicable
      if (parsedData.numericColumns.includes(header)) {
        const numericValues = nonNullValues.map((v) => Number(v)).filter((v) => !isNaN(v))

        if (numericValues.length > 0) {
          const columnStats = Stats.calculateStatistics(numericValues)
          stats.min = columnStats.min
          stats.max = columnStats.max
          stats.mean = columnStats.mean
          stats.median = columnStats.median
          stats.stdDev = columnStats.stdDev

          if (numericValues.length >= 3) {
            stats.skewness = Stats.calculateSkewness(numericValues)
          }

          if (numericValues.length >= 4) {
            stats.kurtosis = Stats.calculateKurtosis(numericValues)
          }
        }
      }

      columnStats.push(stats)
    }

    // Calculate correlation matrix
    let correlationMatrix: CorrelationMatrix = {
      labels: [],
      matrix: [],
      strongPairs: [],
    }

    if (parsedData.numericColumns.length >= 2) {
      try {
        const matrix = Stats.calculateCorrelationMatrix(parsedData.rows, parsedData.numericColumns)

        // Find strong correlations
        const strongPairs = []
        for (let i = 0; i < parsedData.numericColumns.length; i++) {
          for (let j = i + 1; j < parsedData.numericColumns.length; j++) {
            const value = matrix[i][j]
            if (Math.abs(value) > 0.5) {
              strongPairs.push({
                column1: parsedData.numericColumns[i],
                column2: parsedData.numericColumns[j],
                value,
              })
            }
          }
        }

        correlationMatrix = {
          labels: parsedData.numericColumns,
          matrix,
          strongPairs: strongPairs.sort((a, b) => Math.abs(b.value) - Math.abs(a.value)),
        }

        console.log(`Calculated correlation matrix ${matrix.length}x${matrix[0]?.length || 0}`)
        console.log(`Found ${strongPairs.length} strong correlations`)
      } catch (error) {
        console.error("Error calculating correlation matrix:", error)
        correlationMatrix = {
          labels: parsedData.numericColumns,
          matrix: Array(parsedData.numericColumns.length).fill(Array(parsedData.numericColumns.length).fill(0)),
          strongPairs: [],
        }
      }
    } else {
      console.log("Not enough numeric columns for correlation analysis")
    }

    // Calculate histograms
    const histograms: HistogramData[] = []

    for (const column of parsedData.numericColumns) {
      try {
        const values = parsedData.rows.map((row) => Number(row[column])).filter((v) => !isNaN(v))

        if (values.length > 0) {
          const { bins, frequencies } = Stats.calculateHistogram(values)
          histograms.push({
            column,
            bins,
            frequencies,
            min: Math.min(...values),
            max: Math.max(...values),
          })
        }
      } catch (error) {
        console.error(`Error calculating histogram for column ${column}:`, error)
      }
    }

    console.log(`Generated ${histograms.length} histograms`)

    // Calculate box plots
    const boxPlots: BoxPlotData[] = []

    for (const column of parsedData.numericColumns) {
      try {
        const values = parsedData.rows.map((row) => Number(row[column])).filter((v) => !isNaN(v))

        if (values.length > 0) {
          const stats = Stats.calculateStatistics(values)
          const outliers = Stats.detectOutliers(values)

          boxPlots.push({
            column,
            min: stats.min,
            q1: stats.q1,
            median: stats.median,
            q3: stats.q3,
            max: stats.max,
            outliers,
          })
        }
      } catch (error) {
        console.error(`Error calculating box plot for column ${column}:`, error)
      }
    }

    console.log(`Generated ${boxPlots.length} box plots`)

    // Time series analysis
    const timeSeries: TimeSeriesData[] = []

    if (parsedData.dateColumns.length > 0) {
      const timeColumn = parsedData.dateColumns[0]

      for (const valueColumn of parsedData.numericColumns) {
        try {
          // Extract time series data
          const timeSeriesData = parsedData.rows
            .filter(
              (row) =>
                row[timeColumn] !== null &&
                row[timeColumn] !== undefined &&
                row[valueColumn] !== null &&
                row[valueColumn] !== undefined &&
                !isNaN(Number(row[valueColumn])),
            )
            .map((row) => ({
              time: new Date(row[timeColumn]),
              value: Number(row[valueColumn]),
            }))
            .sort((a, b) => a.time.getTime() - b.time.getTime())

          if (timeSeriesData.length >= 3) {
            const times = timeSeriesData.map((d) => d.time.toISOString().split("T")[0])
            const values = timeSeriesData.map((d) => d.value)

            // Calculate trend
            const firstValue = values[0]
            const lastValue = values[values.length - 1]
            const trend =
              lastValue > firstValue * 1.05 ? "increasing" : lastValue < firstValue * 0.95 ? "decreasing" : "stable"

            // Calculate autocorrelation
            const autocorrelation = Stats.calculateACF(values, Math.min(10, Math.floor(values.length / 2)))

            // Detect seasonality
            const maxAcf = Math.max(...autocorrelation.slice(1))
            const seasonality = maxAcf > 0.7 ? "high" : maxAcf > 0.4 ? "medium" : maxAcf > 0.2 ? "low" : "none"

            timeSeries.push({
              column: valueColumn,
              timeColumn,
              times,
              values,
              trend,
              seasonality,
              autocorrelation,
            })
          }
        } catch (error) {
          console.error(`Error calculating time series for column ${valueColumn}:`, error)
        }
      }
    }

    console.log(`Generated ${timeSeries.length} time series analyses`)

    // Regression models
    const regressionModels: RegressionModel[] = []

    if (parsedData.numericColumns.length >= 2) {
      // Create regression models for pairs of numeric columns
      for (let i = 0; i < parsedData.numericColumns.length; i++) {
        for (let j = i + 1; j < parsedData.numericColumns.length; j++) {
          try {
            const xColumn = parsedData.numericColumns[i]
            const yColumn = parsedData.numericColumns[j]

            // Extract paired values
            const pairedData = parsedData.rows
              .filter(
                (row) =>
                  row[xColumn] !== null &&
                  row[xColumn] !== undefined &&
                  row[yColumn] !== null &&
                  row[yColumn] !== undefined &&
                  !isNaN(Number(row[xColumn])) &&
                  !isNaN(Number(row[yColumn])),
              )
              .map((row) => ({
                x: Number(row[xColumn]),
                y: Number(row[yColumn]),
              }))

            if (pairedData.length >= 3) {
              const x = pairedData.map((d) => d.x)
              const y = pairedData.map((d) => d.y)

              const { slope, intercept, rSquared } = Stats.linearRegression(x, y)

              // Only include models with reasonable fit
              if (rSquared > 0.3) {
                // Generate predictions
                const predictions = pairedData.map((d) => ({
                  x: d.x,
                  y: slope * d.x + intercept,
                }))

                regressionModels.push({
                  xColumn,
                  yColumn,
                  slope,
                  intercept,
                  rSquared,
                  predictions,
                })
              }
            }
          } catch (error) {
            console.error(
              `Error calculating regression model for columns ${parsedData.numericColumns[i]} and ${parsedData.numericColumns[j]}:`,
              error,
            )
          }
        }
      }
    }

    console.log(`Generated ${regressionModels.length} regression models`)

    // Count duplicate rows
    const stringifiedRows = parsedData.rows.map((row) => JSON.stringify(row))
    const uniqueRows = new Set(stringifiedRows)
    const duplicateRows = parsedData.rows.length - uniqueRows.size

    // Prepare final results
    const results: AnalysisResults = {
      fileName: file.name,
      rowCount: parsedData.rows.length,
      columnCount: parsedData.headers.length,
      missingValues: totalMissing,
      duplicateRows,
      columnStats,
      correlationMatrix,
      histograms,
      boxPlots,
      timeSeries,
      regressionModels,
      previewData: parsedData.rows.slice(0, 10), // First 10 rows for preview
      rawData: parsedData.rows, // Full dataset for analysis
      rows: parsedData.rows, // Alternative property name for compatibility
    }

    console.log("Analysis complete")
    return results
  } catch (error) {
    console.error("Error analyzing file:", error)
    throw error
  }
}
