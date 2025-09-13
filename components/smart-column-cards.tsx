"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Info } from "lucide-react"
import { getColumnType } from "@/lib/data-processing-utils"

interface SmartColumnCardProps {
  columnName: string
  data: any[]
  onRecommendationApply?: (columnName: string, recommendation: string) => void
}

export function SmartColumnCard({ columnName, data, onRecommendationApply }: SmartColumnCardProps) {
  const [columnStats, setColumnStats] = useState<any>(null)
  const [recommendation, setRecommendation] = useState<string>("")

  useEffect(() => {
    if (!data || data.length === 0) return

    const columnType = getColumnType(data, columnName)
    const values = data.map((row) => row[columnName])
    const nonNullValues = values.filter((v) => v !== null && v !== undefined && v !== "")
    const nullCount = values.length - nonNullValues.length
    const nullPercentage = (nullCount / values.length) * 100
    const uniqueCount = new Set(nonNullValues).size

    let stats: any = {
      type: columnType,
      nullPercentage,
      uniqueCount,
      totalCount: values.length,
      nonNullCount: nonNullValues.length,
    }

    if (columnType === "Number") {
      const numericValues = nonNullValues.map((v) => Number(v)).filter((v) => !isNaN(v))

      if (numericValues.length > 0) {
        const sorted = [...numericValues].sort((a, b) => a - b)
        const mean = numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length
        const median = sorted[Math.floor(sorted.length / 2)]

        // Calculate standard deviation
        const variance = numericValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / numericValues.length
        const stdDev = Math.sqrt(variance)

        // Calculate skewness
        let skewness = 0
        if (numericValues.length >= 3 && stdDev > 0) {
          skewness =
            numericValues.reduce((sum, val) => sum + Math.pow((val - mean) / stdDev, 3), 0) / numericValues.length
        }

        // Detect outliers using IQR
        const q1 = sorted[Math.floor(sorted.length * 0.25)]
        const q3 = sorted[Math.floor(sorted.length * 0.75)]
        const iqr = q3 - q1
        const lowerBound = q1 - 1.5 * iqr
        const upperBound = q3 + 1.5 * iqr
        const outliers = numericValues.filter((v) => v < lowerBound || v > upperBound)

        stats = {
          ...stats,
          mean,
          median,
          stdDev,
          skewness,
          min: Math.min(...numericValues),
          max: Math.max(...numericValues),
          outlierCount: outliers.length,
          outlierPercentage: (outliers.length / numericValues.length) * 100,
        }

        // Generate recommendation
        let rec = ""
        if (nullPercentage > 20) {
          if (Math.abs(skewness) <= 0.5) {
            rec = `Fill ${nullCount} missing values with mean (${mean.toFixed(2)}) - data is symmetric`
          } else {
            rec = `Fill ${nullCount} missing values with median (${median.toFixed(2)}) - data is skewed`
          }
        } else if (outliers.length > 0) {
          rec = `Consider handling ${outliers.length} outliers (${((outliers.length / numericValues.length) * 100).toFixed(1)}% of data)`
        } else {
          rec = "Column looks good - no major issues detected"
        }
        setRecommendation(rec)
      }
    } else if (columnType === "String") {
      // Categorical analysis
      const valueCounts = new Map()
      nonNullValues.forEach((value) => {
        const strValue = String(value)
        valueCounts.set(strValue, (valueCounts.get(strValue) || 0) + 1)
      })

      const sortedCounts = [...valueCounts.entries()].sort((a, b) => b[1] - a[1])
      const mode = sortedCounts[0]?.[0]
      const modeCount = sortedCounts[0]?.[1] || 0
      const modePercentage = (modeCount / nonNullValues.length) * 100

      stats = {
        ...stats,
        mode,
        modeCount,
        modePercentage,
        topCategories: sortedCounts.slice(0, 5).map(([value, count]) => ({
          value,
          count,
          percentage: (count / nonNullValues.length) * 100,
        })),
      }

      // Generate recommendation
      let rec = ""
      if (nullPercentage > 20) {
        rec = `Fill ${nullCount} missing values with mode ("${mode}") - most common category`
      } else if (uniqueCount === nonNullValues.length) {
        rec = "All values are unique - consider if this should be an identifier column"
      } else if (uniqueCount < 5 && nonNullValues.length > 50) {
        rec = "Low cardinality - good for categorical analysis"
      } else {
        rec = "Column looks good for categorical analysis"
      }
      setRecommendation(rec)
    }

    setColumnStats(stats)
  }, [data, columnName])

  if (!columnStats) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getSkewnessDescription = (skewness: number) => {
    if (Math.abs(skewness) < 0.5) return "Symmetric"
    if (skewness > 0.5) return "Right-skewed"
    return "Left-skewed"
  }

  const getSkewnessIcon = (skewness: number) => {
    if (Math.abs(skewness) < 0.5) return <CheckCircle className="h-4 w-4 text-green-500" />
    if (skewness > 0.5) return <TrendingUp className="h-4 w-4 text-blue-500" />
    return <TrendingDown className="h-4 w-4 text-orange-500" />
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{columnName}</CardTitle>
          <Badge variant="outline">{columnStats.type}</Badge>
        </div>
        <CardDescription>
          {columnStats.nonNullCount.toLocaleString()} values • {columnStats.uniqueCount.toLocaleString()} unique
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Missing Values Indicator */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Missing Values</span>
            <span className="font-medium">
              {columnStats.nullPercentage.toFixed(1)}%
              {columnStats.nullPercentage > 20 && <AlertTriangle className="h-3 w-3 text-yellow-500 inline ml-1" />}
            </span>
          </div>
          <Progress value={100 - columnStats.nullPercentage} className="h-2" />
        </div>

        {/* Type-specific stats */}
        {columnStats.type === "Number" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Mean</div>
                <div className="font-medium">{columnStats.mean?.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Median</div>
                <div className="font-medium">{columnStats.median?.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Std Dev</div>
                <div className="font-medium">{columnStats.stdDev?.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Range</div>
                <div className="font-medium">
                  {columnStats.min?.toFixed(1)} - {columnStats.max?.toFixed(1)}
                </div>
              </div>
            </div>

            {/* Skewness indicator */}
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
              <div className="flex items-center gap-2">
                {getSkewnessIcon(columnStats.skewness)}
                <span className="text-sm font-medium">Distribution</span>
              </div>
              <span className="text-sm">{getSkewnessDescription(columnStats.skewness)}</span>
            </div>

            {/* Outliers */}
            {columnStats.outlierCount > 0 && (
              <div className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-950 rounded border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium">Outliers</span>
                </div>
                <span className="text-sm">
                  {columnStats.outlierCount} ({columnStats.outlierPercentage.toFixed(1)}%)
                </span>
              </div>
            )}
          </div>
        )}

        {columnStats.type === "String" && columnStats.topCategories && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Top Categories</div>
            <div className="space-y-1">
              {columnStats.topCategories.slice(0, 3).map((cat: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="truncate max-w-[120px]" title={cat.value}>
                    {cat.value}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{cat.count}</span>
                    <div className="w-12 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${cat.percentage}%` }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendation */}
        <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">Recommendation</div>
              <p className="text-xs text-blue-700 dark:text-blue-300">{recommendation}</p>
              {onRecommendationApply && recommendation.includes("Fill") && (
                <Button
                  size="sm"
                  className="mt-2 h-6 text-xs"
                  onClick={() => onRecommendationApply(columnName, recommendation)}
                >
                  Apply Fix
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function SmartColumnCards() {
  const [results, setResults] = useState<any>(null)
  const [selectedColumn, setSelectedColumn] = useState<string>("")

  useEffect(() => {
    const resultsString = typeof window !== "undefined" ? sessionStorage.getItem("analysisResults") : null
    if (resultsString) {
      const parsedResults = JSON.parse(resultsString)
      setResults(parsedResults)
      if (parsedResults.columnStats && parsedResults.columnStats.length > 0) {
        setSelectedColumn(parsedResults.columnStats[0].name)
      }
    }
  }, [])

  if (!results) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Smart Column Analysis</CardTitle>
          <CardDescription>No data available</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Smart Column Analysis</CardTitle>
          <CardDescription>Detailed analysis and recommendations for each column</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {results.columnStats?.map((column: any) => (
              <SmartColumnCard
                key={column.name}
                columnName={column.name}
                data={results.data || results.previewData || []}
                onRecommendationApply={(columnName, recommendation) => {
                  console.log(`Apply recommendation for ${columnName}: ${recommendation}`)
                  // This would trigger the data processing
                }}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
