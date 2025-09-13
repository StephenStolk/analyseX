export interface AnalysisRequest {
  data: any
  options?: {
    detailed?: boolean
  }
}

export interface AnalysisResponse {
  insights: Array<{
    category?: string
    title: string
    description: string
  }>
  forecast: {
    growth: string
    seasonal: string
    data: any
  }
  recommendations: Array<{
    title: string
    description: string
    priority: "high" | "medium" | "low"
  }>
}

// Adding DashboardContext type
export interface DashboardContext {
  fileName: string
  rowCount: number
  columnCount: number
  missingValuesCount: number
  targetColumn: string
  activeColumns: { name: string; type: "numeric" | "categorical" | "text" | "date" }[]
  numericColumns: { name: string; type: "numeric" | "categorical" | "text" | "date" }[]
  categoricalColumns: { name: string; type: "numeric" | "categorical" | "text" | "date" }[]
  textColumns: { name: string; type: "numeric" | "categorical" | "text" | "date" }[]
  dateColumns: { name: string; type: "numeric" | "categorical" | "text" | "date" }[]
  columnStats: {
    [key: string]: { mean: number; stdDev: number; min: number; max: number; values: number[] }
  }
  regressionModels: {
    [key: string]: { slope: number; intercept: number; rSquared: number }
  }
  kpiMetrics: {
    title: string
    value: string | number
    change?: number
    changeType?: "increase" | "decrease" | "neutral"
    icon: any
    color: string
    trend?: number[]
  }[]
  // Add any other relevant summary data
  summary: {
    rowCount: number
    columnCount: number
    missingValues: number
    duplicateRows: number
    columns: {
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
    }[]
  }
  correlations: {
    labels: string[]
    strongPairs: { col1: string; col2: string; correlation: number }[]
  }
  distributions: any[] // Histograms
  keyStats: {
    outlierCounts: { column: string; outliers: number }[]
    regressionModels: {
      xColumn: string
      yColumn: string
      rSquared: number
      slope: number
      intercept: number
    }[]
  }
}

export interface ChatMessage {
  role: "user" | "assistant"
  content: string
}
