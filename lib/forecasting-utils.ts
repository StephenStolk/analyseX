/**
 * Mathematical forecasting utilities for time series analysis
 */

export interface ForecastResult {
  method: string
  predictions: number[]
  dates: string[]
  mae: number
  rmse: number
  mape: number
  description: string
}

export interface TimeSeriesData {
  dates: string[]
  values: number[]
}

/**
 * Linear Regression Forecast
 */
export function linearRegressionForecast(data: TimeSeriesData, periods = 12): ForecastResult {
  const { dates, values } = data
  const n = values.length

  // Convert dates to numeric values (days from start)
  const x = Array.from({ length: n }, (_, i) => i)
  const y = values

  // Calculate linear regression coefficients
  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = y.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  // Generate predictions
  const predictions: number[] = []
  const futureDates: string[] = []

  for (let i = 0; i < periods; i++) {
    const futureX = n + i
    const prediction = slope * futureX + intercept
    predictions.push(Math.max(0, prediction)) // Ensure non-negative

    // Generate future dates
    const lastDate = new Date(dates[dates.length - 1])
    const futureDate = new Date(lastDate)
    futureDate.setMonth(futureDate.getMonth() + i + 1)
    futureDates.push(futureDate.toISOString().split("T")[0])
  }

  // Calculate error metrics on historical data
  const historicalPredictions = x.map((xi) => slope * xi + intercept)
  const mae = calculateMAE(values, historicalPredictions)
  const rmse = calculateRMSE(values, historicalPredictions)
  const mape = calculateMAPE(values, historicalPredictions)

  return {
    method: "Linear Regression",
    predictions,
    dates: futureDates,
    mae,
    rmse,
    mape,
    description: `Linear trend-based forecast showing ${slope > 0 ? "increasing" : "decreasing"} pattern`,
  }
}

/**
 * Simple Moving Average Forecast
 */
export function movingAverageForecast(data: TimeSeriesData, windowSize = 3, periods = 12): ForecastResult {
  const { dates, values } = data

  // Calculate moving averages
  const movingAverages: number[] = []
  for (let i = windowSize - 1; i < values.length; i++) {
    const windowValues = values.slice(i - windowSize + 1, i + 1)
    const average = windowValues.reduce((a, b) => a + b, 0) / windowSize
    movingAverages.push(average)
  }

  // Use last moving average as prediction base
  const lastMA = movingAverages[movingAverages.length - 1]
  const predictions = Array(periods).fill(lastMA)

  // Generate future dates
  const futureDates: string[] = []
  for (let i = 0; i < periods; i++) {
    const lastDate = new Date(dates[dates.length - 1])
    const futureDate = new Date(lastDate)
    futureDate.setMonth(futureDate.getMonth() + i + 1)
    futureDates.push(futureDate.toISOString().split("T")[0])
  }

  // Calculate error metrics
  const alignedValues = values.slice(windowSize - 1)
  const mae = calculateMAE(alignedValues, movingAverages)
  const rmse = calculateRMSE(alignedValues, movingAverages)
  const mape = calculateMAPE(alignedValues, movingAverages)

  return {
    method: `Moving Average (${windowSize}-period)`,
    predictions,
    dates: futureDates,
    mae,
    rmse,
    mape,
    description: `Simple moving average using last ${windowSize} periods for stable prediction`,
  }
}

/**
 * Exponential Smoothing Forecast
 */
export function exponentialSmoothingForecast(data: TimeSeriesData, alpha = 0.3, periods = 12): ForecastResult {
  const { dates, values } = data

  // Calculate exponential smoothing
  const smoothed: number[] = [values[0]]

  for (let i = 1; i < values.length; i++) {
    const smoothedValue = alpha * values[i] + (1 - alpha) * smoothed[i - 1]
    smoothed.push(smoothedValue)
  }

  // Use last smoothed value for predictions
  const lastSmoothed = smoothed[smoothed.length - 1]
  const predictions = Array(periods).fill(lastSmoothed)

  // Generate future dates
  const futureDates: string[] = []
  for (let i = 0; i < periods; i++) {
    const lastDate = new Date(dates[dates.length - 1])
    const futureDate = new Date(lastDate)
    futureDate.setMonth(futureDate.getMonth() + i + 1)
    futureDates.push(futureDate.toISOString().split("T")[0])
  }

  // Calculate error metrics
  const mae = calculateMAE(values, smoothed)
  const rmse = calculateRMSE(values, smoothed)
  const mape = calculateMAPE(values, smoothed)

  return {
    method: `Exponential Smoothing (α=${alpha})`,
    predictions,
    dates: futureDates,
    mae,
    rmse,
    mape,
    description: `Exponential smoothing with alpha=${alpha}, giving more weight to recent observations`,
  }
}

/**
 * Holt-Winters Triple Exponential Smoothing
 */
export function holtWintersForecast(data: TimeSeriesData, periods = 12): ForecastResult {
  const { dates, values } = data
  const seasonLength = 12 // Assume monthly seasonality

  if (values.length < seasonLength * 2) {
    // Fallback to exponential smoothing if insufficient data
    return exponentialSmoothingForecast(data, 0.3, periods)
  }

  // Initialize parameters
  const alpha = 0.3 // Level smoothing
  const beta = 0.1 // Trend smoothing
  const gamma = 0.1 // Seasonal smoothing

  // Initialize level, trend, and seasonal components
  let level = values.slice(0, seasonLength).reduce((a, b) => a + b, 0) / seasonLength
  let trend = 0

  // Calculate initial seasonal indices
  const seasonal: number[] = []
  for (let i = 0; i < seasonLength; i++) {
    const seasonalSum = values.filter((_, idx) => idx % seasonLength === i).reduce((a, b) => a + b, 0)
    const seasonalCount = values.filter((_, idx) => idx % seasonLength === i).length
    seasonal[i] = seasonalCount > 0 ? seasonalSum / seasonalCount / level : 1
  }

  // Apply Holt-Winters method
  const forecasts: number[] = []

  for (let i = 0; i < values.length; i++) {
    const seasonalIndex = seasonal[i % seasonLength]

    if (i === 0) {
      forecasts.push(level * seasonalIndex)
      continue
    }

    // Update level
    const newLevel = alpha * (values[i] / seasonalIndex) + (1 - alpha) * (level + trend)

    // Update trend
    const newTrend = beta * (newLevel - level) + (1 - beta) * trend

    // Update seasonal
    seasonal[i % seasonLength] = gamma * (values[i] / newLevel) + (1 - gamma) * seasonalIndex

    // Forecast
    forecasts.push((level + trend) * seasonalIndex)

    level = newLevel
    trend = newTrend
  }

  // Generate future predictions
  const predictions: number[] = []
  const futureDates: string[] = []

  for (let i = 0; i < periods; i++) {
    const seasonalIndex = seasonal[i % seasonLength]
    const prediction = Math.max(0, (level + (i + 1) * trend) * seasonalIndex)
    predictions.push(prediction)

    const lastDate = new Date(dates[dates.length - 1])
    const futureDate = new Date(lastDate)
    futureDate.setMonth(futureDate.getMonth() + i + 1)
    futureDates.push(futureDate.toISOString().split("T")[0])
  }

  // Calculate error metrics
  const mae = calculateMAE(values, forecasts)
  const rmse = calculateRMSE(values, forecasts)
  const mape = calculateMAPE(values, forecasts)

  return {
    method: "Holt-Winters Triple Exponential",
    predictions,
    dates: futureDates,
    mae,
    rmse,
    mape,
    description: "Advanced method capturing trend and seasonal patterns for comprehensive forecasting",
  }
}

/**
 * Calculate Mean Absolute Error
 */
function calculateMAE(actual: number[], predicted: number[]): number {
  const errors = actual.map((a, i) => Math.abs(a - predicted[i]))
  return errors.reduce((a, b) => a + b, 0) / errors.length
}

/**
 * Calculate Root Mean Squared Error
 */
function calculateRMSE(actual: number[], predicted: number[]): number {
  const squaredErrors = actual.map((a, i) => Math.pow(a - predicted[i], 2))
  const mse = squaredErrors.reduce((a, b) => a + b, 0) / squaredErrors.length
  return Math.sqrt(mse)
}

/**
 * Calculate Mean Absolute Percentage Error
 */
function calculateMAPE(actual: number[], predicted: number[]): number {
  const percentageErrors = actual.map((a, i) => {
    if (a === 0) return 0
    return Math.abs((a - predicted[i]) / a) * 100
  })
  return percentageErrors.reduce((a, b) => a + b, 0) / percentageErrors.length
}

/**
 * Detect time series columns in dataset
 */
export function detectTimeSeriesColumns(data: any[]): string[] {
  if (!data || data.length === 0) return []

  const columns = Object.keys(data[0])
  const timeColumns: string[] = []

  for (const column of columns) {
    // Check if column contains date-like values
    const sampleValues = data.slice(0, 10).map((row) => row[column])
    const dateCount = sampleValues.filter((value) => {
      if (!value) return false
      const dateValue = new Date(value)
      return !isNaN(dateValue.getTime()) && value.toString().match(/\d{4}/)
    }).length

    if (dateCount >= sampleValues.length * 0.7) {
      timeColumns.push(column)
    }
  }

  return timeColumns
}

/**
 * Prepare time series data from dataset
 */
export function prepareTimeSeriesData(data: any[], dateColumn: string, valueColumn: string): TimeSeriesData | null {
  try {
    const filteredData = data
      .filter((row) => row[dateColumn] && row[valueColumn] !== null && row[valueColumn] !== undefined)
      .map((row) => ({
        date: new Date(row[dateColumn]).toISOString().split("T")[0],
        value: Number(row[valueColumn]),
      }))
      .filter((item) => !isNaN(item.value))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    if (filteredData.length < 3) return null

    return {
      dates: filteredData.map((item) => item.date),
      values: filteredData.map((item) => item.value),
    }
  } catch (error) {
    console.error("Error preparing time series data:", error)
    return null
  }
}
