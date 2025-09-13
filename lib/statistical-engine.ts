import { performTTest, performANOVA, performChiSquareTest } from "@/lib/advanced-statistics"
import { calculateCorrelation } from "@/lib/statistics"
import type { ModuleResult } from "./dashboard-types"

export async function performStatisticalTest(
  testType: string,
  data: any[],
  columns: string[],
  parameters: Record<string, any> = {},
): Promise<ModuleResult> {
  try {
    switch (testType) {
      case "t-test":
        return await performTTestAnalysis(data, columns, parameters)
      case "anova":
        return await performANOVAAnalysis(data, columns, parameters)
      case "chi-square":
        return await performChiSquareAnalysis(data, columns, parameters)
      case "correlation":
        return await performCorrelationAnalysis(data, columns, parameters)
      default:
        throw new Error(`Unknown test type: ${testType}`)
    }
  } catch (error) {
    console.error(`Error performing ${testType}:`, error)
    return {
      type: "text",
      content: `Error performing ${testType}: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}

export async function generateVisualization(
  chartType: string,
  data: any[],
  columns: string[],
  parameters: Record<string, any> = {},
): Promise<ModuleResult> {
  try {
    switch (chartType) {
      case "line-chart":
        return generateLineChart(data, columns, parameters)
      case "bar-chart":
        return generateBarChart(data, columns, parameters)
      case "scatter-plot":
        return generateScatterPlot(data, columns, parameters)
      case "pie-chart":
        return generatePieChart(data, columns, parameters)
      default:
        throw new Error(`Unknown chart type: ${chartType}`)
    }
  } catch (error) {
    console.error(`Error generating ${chartType}:`, error)
    return {
      type: "text",
      content: `Error generating ${chartType}: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}

async function performTTestAnalysis(
  data: any[],
  columns: string[],
  parameters: Record<string, any>,
): Promise<ModuleResult> {
  const [numericColumn, groupColumn] = columns

  if (!numericColumn || !groupColumn) {
    throw new Error("T-test requires one numeric and one categorical column")
  }

  // Group data by categorical column
  const groups = data.reduce(
    (acc, row) => {
      const groupValue = row[groupColumn]
      const numericValue = Number(row[numericColumn])

      if (!isNaN(numericValue) && groupValue !== null && groupValue !== undefined) {
        if (!acc[groupValue]) acc[groupValue] = []
        acc[groupValue].push(numericValue)
      }
      return acc
    },
    {} as Record<string, number[]>,
  )

  const groupNames = Object.keys(groups)
  if (groupNames.length < 2) {
    throw new Error("T-test requires at least 2 groups")
  }

  // Take first two groups for t-test
  const group1 = groups[groupNames[0]]
  const group2 = groups[groupNames[1]]

  const result = performTTest(group1, group2, parameters.alpha || 0.05)

  return {
    type: "statistical",
    statistics: {
      tStatistic: result.tStatistic,
      pValue: result.pValue,
      degreesOfFreedom: result.degreesOfFreedom,
      mean1: result.mean1,
      mean2: result.mean2,
    },
    interpretation: `T-test comparing ${groupNames[0]} (mean: ${result.mean1.toFixed(2)}) vs ${groupNames[1]} (mean: ${result.mean2.toFixed(2)}). ${
      result.pValue < (parameters.alpha || 0.05)
        ? `Significant difference found (p = ${result.pValue.toFixed(4)})`
        : `No significant difference (p = ${result.pValue.toFixed(4)})`
    }`,
  }
}

async function performANOVAAnalysis(
  data: any[],
  columns: string[],
  parameters: Record<string, any>,
): Promise<ModuleResult> {
  const [numericColumn, groupColumn] = columns

  if (!numericColumn || !groupColumn) {
    throw new Error("ANOVA requires one numeric and one categorical column")
  }

  // Group data by categorical column
  const groups = data.reduce(
    (acc, row) => {
      const groupValue = row[groupColumn]
      const numericValue = Number(row[numericColumn])

      if (!isNaN(numericValue) && groupValue !== null && groupValue !== undefined) {
        if (!acc[groupValue]) acc[groupValue] = []
        acc[groupValue].push(numericValue)
      }
      return acc
    },
    {} as Record<string, number[]>,
  )

  const groupArrays = Object.values(groups)
  const groupNames = Object.keys(groups)

  if (groupArrays.length < 2) {
    throw new Error("ANOVA requires at least 2 groups")
  }

  const result = performANOVA(groupArrays, parameters.alpha || 0.05)

  return {
    type: "statistical",
    statistics: {
      fStatistic: result.fStatistic,
      pValue: result.pValue,
      dfBetween: result.dfBetween,
      dfWithin: result.dfWithin,
    },
    interpretation: `ANOVA comparing ${groupNames.length} groups: ${groupNames.join(", ")}. ${
      result.pValue < (parameters.alpha || 0.05)
        ? `Significant differences found between groups (F = ${result.fStatistic.toFixed(2)}, p = ${result.pValue.toFixed(4)})`
        : `No significant differences between groups (F = ${result.fStatistic.toFixed(2)}, p = ${result.pValue.toFixed(4)})`
    }`,
  }
}

async function performChiSquareAnalysis(
  data: any[],
  columns: string[],
  parameters: Record<string, any>,
): Promise<ModuleResult> {
  const [column1, column2] = columns

  if (!column1 || !column2) {
    throw new Error("Chi-square test requires two categorical columns")
  }

  // Create contingency table
  const contingencyTable: Record<string, Record<string, number>> = {}

  data.forEach((row) => {
    const val1 = row[column1]
    const val2 = row[column2]

    if (val1 !== null && val1 !== undefined && val2 !== null && val2 !== undefined) {
      if (!contingencyTable[val1]) contingencyTable[val1] = {}
      if (!contingencyTable[val1][val2]) contingencyTable[val1][val2] = 0
      contingencyTable[val1][val2]++
    }
  })

  const result = performChiSquareTest(contingencyTable, parameters.alpha || 0.05)

  return {
    type: "statistical",
    statistics: {
      chiSquare: result.chiSquare,
      pValue: result.pValue,
      degreesOfFreedom: result.degreesOfFreedom,
    },
    interpretation: `Chi-square test of independence between ${column1} and ${column2}. ${
      result.pValue < (parameters.alpha || 0.05)
        ? `Significant association found (χ² = ${result.chiSquare.toFixed(2)}, p = ${result.pValue.toFixed(4)})`
        : `No significant association (χ² = ${result.chiSquare.toFixed(2)}, p = ${result.pValue.toFixed(4)})`
    }`,
  }
}

async function performCorrelationAnalysis(
  data: any[],
  columns: string[],
  parameters: Record<string, any>,
): Promise<ModuleResult> {
  const [column1, column2] = columns

  if (!column1 || !column2) {
    throw new Error("Correlation requires two numeric columns")
  }

  // Extract numeric values
  const values1: number[] = []
  const values2: number[] = []

  data.forEach((row) => {
    const val1 = Number(row[column1])
    const val2 = Number(row[column2])

    if (!isNaN(val1) && !isNaN(val2)) {
      values1.push(val1)
      values2.push(val2)
    }
  })

  if (values1.length < 2) {
    throw new Error("Insufficient data for correlation analysis")
  }

  const correlation = calculateCorrelation(values1, values2)

  let strength = ""
  if (Math.abs(correlation) > 0.8) strength = "very strong"
  else if (Math.abs(correlation) > 0.6) strength = "strong"
  else if (Math.abs(correlation) > 0.4) strength = "moderate"
  else if (Math.abs(correlation) > 0.2) strength = "weak"
  else strength = "very weak"

  const direction = correlation > 0 ? "positive" : "negative"

  return {
    type: "statistical",
    statistics: {
      correlation: correlation,
      sampleSize: values1.length,
    },
    interpretation: `${strength} ${direction} correlation (r = ${correlation.toFixed(3)}) between ${column1} and ${column2} based on ${values1.length} data points.`,
  }
}

function generateLineChart(data: any[], columns: string[], parameters: Record<string, any>): ModuleResult {
  const [xColumn, yColumn] = columns

  if (!xColumn || !yColumn) {
    throw new Error("Line chart requires two columns")
  }

  const chartData = data
    .filter(
      (row) =>
        row[xColumn] !== null && row[xColumn] !== undefined && row[yColumn] !== null && row[yColumn] !== undefined,
    )
    .map((row) => ({
      x: row[xColumn],
      y: Number(row[yColumn]) || 0,
    }))
    .sort((a, b) => {
      if (typeof a.x === "number" && typeof b.x === "number") {
        return a.x - b.x
      }
      return String(a.x).localeCompare(String(b.x))
    })

  return {
    type: "chart",
    chartType: "line",
    data: chartData,
  }
}

function generateBarChart(data: any[], columns: string[], parameters: Record<string, any>): ModuleResult {
  const [categoryColumn, valueColumn] = columns

  if (!categoryColumn || !valueColumn) {
    throw new Error("Bar chart requires one categorical and one numeric column")
  }

  // Aggregate data by category
  const aggregated: Record<string, number[]> = {}

  data.forEach((row) => {
    const category = row[categoryColumn]
    const value = Number(row[valueColumn])

    if (category !== null && category !== undefined && !isNaN(value)) {
      if (!aggregated[category]) aggregated[category] = []
      aggregated[category].push(value)
    }
  })

  const chartData = Object.entries(aggregated).map(([category, values]) => ({
    x: category,
    y: values.reduce((sum, val) => sum + val, 0) / values.length, // Average
  }))

  return {
    type: "chart",
    chartType: "bar",
    data: chartData,
  }
}

function generateScatterPlot(data: any[], columns: string[], parameters: Record<string, any>): ModuleResult {
  const [xColumn, yColumn] = columns

  if (!xColumn || !yColumn) {
    throw new Error("Scatter plot requires two numeric columns")
  }

  const chartData = data
    .filter((row) => {
      const x = Number(row[xColumn])
      const y = Number(row[yColumn])
      return !isNaN(x) && !isNaN(y)
    })
    .map((row) => ({
      x: Number(row[xColumn]),
      y: Number(row[yColumn]),
    }))

  return {
    type: "chart",
    chartType: "scatter",
    data: chartData,
  }
}

function generatePieChart(data: any[], columns: string[], parameters: Record<string, any>): ModuleResult {
  const [categoryColumn] = columns

  if (!categoryColumn) {
    throw new Error("Pie chart requires one categorical column")
  }

  // Count occurrences
  const counts: Record<string, number> = {}

  data.forEach((row) => {
    const category = row[categoryColumn]
    if (category !== null && category !== undefined) {
      counts[category] = (counts[category] || 0) + 1
    }
  })

  const chartData = Object.entries(counts).map(([name, value]) => ({
    name,
    value,
  }))

  return {
    type: "chart",
    chartType: "pie",
    data: chartData,
  }
}
