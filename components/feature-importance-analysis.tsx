"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Target, Download, Info, Lightbulb } from "lucide-react"
import { calculateFeatureImportance } from "@/lib/advanced-statistics"
import type { FeatureImportanceResult } from "@/lib/advanced-statistics"

interface FeatureImportanceAnalysisProps {
  data: any[]
  numericColumns: string[]
  onError: (error: string | null) => void
}

export function FeatureImportanceAnalysis({ data, numericColumns, onError }: FeatureImportanceAnalysisProps) {
  const [result, setResult] = useState<FeatureImportanceResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [targetColumn, setTargetColumn] = useState<string>("")
  const [featureColumns, setFeatureColumns] = useState<string[]>([])

  useEffect(() => {
    if (numericColumns.length >= 2) {
      setTargetColumn(numericColumns[0])
      setFeatureColumns(numericColumns.slice(1))
    }
  }, [numericColumns])

  const performAnalysis = async () => {
    if (!targetColumn || featureColumns.length === 0) {
      onError("Please select a target column and at least one feature column")
      return
    }

    setIsLoading(true)
    onError(null)

    try {
      const analysisResult = calculateFeatureImportance(data, targetColumn, featureColumns)
      setResult(analysisResult)
    } catch (error) {
      console.error("Feature importance analysis error:", error)
      onError(`Feature importance analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsLoading(false)
    }
  }

  const downloadResults = () => {
    if (!result) return

    const results = {
      analysis: "Feature Importance Analysis",
      timestamp: new Date().toISOString(),
      targetColumn: targetColumn,
      featureColumns: featureColumns,
      importance: result.features.map((feature, i) => ({
        feature,
        importance: result.importance[i],
        normalizedImportance: result.normalizedImportance[i],
        rank: result.ranks[i],
        correlation: result.correlations[i],
      })),
    }

    const blob = new Blob([JSON.stringify(results, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "feature_importance_analysis.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  const toggleFeature = (feature: string) => {
    setFeatureColumns((prev) => (prev.includes(feature) ? prev.filter((f) => f !== feature) : [...prev, feature]))
  }

  if (numericColumns.length < 2) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Feature importance analysis requires at least 2 numeric columns (1 target + 1 feature). Your dataset has{" "}
          {numericColumns.length} numeric column(s).
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-orange-600" />
          <h3 className="text-lg font-semibold">Feature Importance Analysis</h3>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={performAnalysis}
            disabled={isLoading || !targetColumn || featureColumns.length === 0}
          >
            {isLoading ? "Analyzing..." : "Calculate Importance"}
          </Button>
          {result && (
            <Button variant="outline" size="sm" onClick={downloadResults}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          )}
        </div>
      </div>

      {/* Theory Section */}
      <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
            <Lightbulb className="h-4 w-4" />
            What is Feature Importance?
          </CardTitle>
        </CardHeader>
        <CardContent className="text-orange-700 dark:text-orange-300">
          <p className="mb-3">
            <strong>Feature Importance</strong> ranks input features by their contribution to predicting a target
            variable. It combines correlation analysis with mutual information to identify the most predictive features.
          </p>
          <p className="mb-3">
            <strong>Mathematical Foundation:</strong> Uses Pearson correlation coefficients and mutual information
            I(X;Y) = ∑∑ p(x,y) log(p(x,y)/(p(x)p(y))) to measure feature-target relationships.
          </p>
          <p>
            <strong>Why it matters:</strong> Identifying important features helps build simpler, more interpretable, and
            performant models while reducing overfitting and computational costs.
          </p>
        </CardContent>
      </Card>

      {/* Column Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Target and Features</CardTitle>
          <CardDescription>Choose the target variable and feature columns for importance analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Target Column (what you want to predict)</label>
              <Select value={targetColumn} onValueChange={setTargetColumn}>
                <SelectTrigger>
                  <SelectValue placeholder="Select target column" />
                </SelectTrigger>
                <SelectContent>
                  {numericColumns.map((col) => (
                    <SelectItem key={col} value={col}>
                      {col}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Feature Columns (predictors)</label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 p-3 border rounded-lg">
                {numericColumns
                  .filter((col) => col !== targetColumn)
                  .map((feature) => (
                    <label key={feature} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={featureColumns.includes(feature)}
                        onChange={() => toggleFeature(feature)}
                        className="rounded"
                      />
                      <span className="text-sm">{feature}</span>
                    </label>
                  ))}
              </div>
              <p className="text-sm text-muted-foreground mt-2">Selected: {featureColumns.length} features</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
              <p>Calculating feature importance...</p>
            </div>
          </CardContent>
        </Card>
      ) : result ? (
        <div className="grid gap-6">
          {/* Feature Importance Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Feature Importance Ranking</CardTitle>
              <CardDescription>Features ranked by their predictive power for {targetColumn}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={result.features
                    .map((feature, i) => ({
                      feature: feature,
                      importance: result.normalizedImportance[i] * 100, // Convert to percentage
                      rank: result.ranks[i],
                    }))
                    .sort((a, b) => b.importance - a.importance)}
                  layout="horizontal"
                  margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="feature" type="category" width={100} />
                  <Tooltip formatter={(value: any) => [`${value.toFixed(1)}%`, "Importance"]} />
                  <Bar dataKey="importance" fill="#f97316" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Detailed Rankings Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Feature Rankings</CardTitle>
              <CardDescription>Complete breakdown of feature importance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Rank</th>
                      <th className="text-left p-2">Feature</th>
                      <th className="text-left p-2">Importance</th>
                      <th className="text-left p-2">Correlation</th>
                      <th className="text-left p-2">Mutual Info</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.features
                      .map((feature, i) => ({
                        feature,
                        rank: result.ranks[i],
                        importance: result.normalizedImportance[i],
                        correlation: result.correlations[i],
                        mutualInfo: result.mutualInformation?.[i] || 0,
                      }))
                      .sort((a, b) => a.rank - b.rank)
                      .map((row, i) => (
                        <tr key={row.feature} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="p-2">
                            <span
                              className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white ${
                                row.rank === 1
                                  ? "bg-yellow-500"
                                  : row.rank === 2
                                    ? "bg-gray-400"
                                    : row.rank === 3
                                      ? "bg-orange-600"
                                      : "bg-gray-300"
                              }`}
                            >
                              {row.rank}
                            </span>
                          </td>
                          <td className="p-2 font-medium">{row.feature}</td>
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-orange-500 h-2 rounded-full"
                                  style={{ width: `${Math.min(row.importance * 100, 100)}%` }}
                                ></div>
                              </div>
                              <span className="text-sm">{(row.importance * 100).toFixed(1)}%</span>
                            </div>
                          </td>
                          <td className="p-2">{Math.abs(row.correlation).toFixed(3)}</td>
                          <td className="p-2">{row.mutualInfo.toFixed(3)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Interpretation */}
          <Card className="border-emerald-200 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-800">
            <CardHeader>
              <CardTitle className="text-emerald-800 dark:text-emerald-200">Analysis Interpretation</CardTitle>
            </CardHeader>
            <CardContent className="text-emerald-700 dark:text-emerald-300">
              <div className="space-y-3">
                <p>
                  <strong>Most Important Feature:</strong> {result.features[result.ranks.indexOf(1)]} is the strongest
                  predictor of {targetColumn} with{" "}
                  {(result.normalizedImportance[result.ranks.indexOf(1)] * 100).toFixed(1)}% importance.
                </p>
                <p>
                  <strong>Top 3 Features:</strong>{" "}
                  {[1, 2, 3]
                    .map((rank) => {
                      const index = result.ranks.indexOf(rank)
                      return index !== -1 ? result.features[index] : null
                    })
                    .filter(Boolean)
                    .join(", ")}{" "}
                  account for most of the predictive power.
                </p>
                <p>
                  <strong>Feature Distribution:</strong>{" "}
                  {result.normalizedImportance.filter((imp) => imp > 0.5).length > 0
                    ? `${result.normalizedImportance.filter((imp) => imp > 0.5).length} feature(s) show high importance (>50%).`
                    : "No single feature dominates - prediction likely requires multiple features."}
                </p>
                <p>
                  <strong>Model Building Recommendation:</strong>{" "}
                  {result.normalizedImportance.filter((imp) => imp > 0.3).length <= 5
                    ? "Focus on the top features for a simpler, more interpretable model."
                    : "Consider feature selection techniques to reduce dimensionality while maintaining predictive power."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              Select target and feature columns, then click "Calculate Importance"
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
