"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
} from "recharts"
import { Brain, Download, Info, Lightbulb } from "lucide-react"
import { performPCA } from "@/lib/advanced-analysis-utils"
import type { PCAResult } from "@/lib/advanced-analysis-utils"

interface PCAAnalysisProps {
  data: any[]
  numericColumns: string[]
  onError: (error: string | null) => void
}

export function PCAAnalysis({ data, numericColumns, onError }: PCAAnalysisProps) {
  const [pcaResult, setPcaResult] = useState<PCAResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (numericColumns.length >= 2 && data.length > 0) {
      performAnalysis()
    }
  }, [data, numericColumns])

  const performAnalysis = async () => {
    if (numericColumns.length < 2) {
      onError("PCA requires at least 2 numeric columns")
      return
    }

    setIsLoading(true)
    onError(null)

    try {
      const result = performPCA(data, numericColumns)
      console.log("PCA Result:", result)
      console.log("Feature Importance:", result?.featureImportance)
      setPcaResult(result)
    } catch (error) {
      console.error("PCA analysis error:", error)
      onError(`PCA analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsLoading(false)
    }
  }

  const downloadResults = () => {
    if (!pcaResult) return

    const results = {
      analysis: "Principal Component Analysis",
      timestamp: new Date().toISOString(),
      explainedVariance: pcaResult.explainedVariance,
      cumulativeVariance: pcaResult.cumulativeVariance,
      featureImportance: pcaResult.featureImportance,
      eigenvalues: pcaResult.eigenvalues,
    }

    const blob = new Blob([JSON.stringify(results, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "pca_analysis.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  if (numericColumns.length < 2) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          PCA requires at least 2 numeric columns. Your dataset has {numericColumns.length} numeric column(s).
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Principal Component Analysis (PCA)</h3>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={performAnalysis} disabled={isLoading}>
            {isLoading ? "Analyzing..." : "Refresh Analysis"}
          </Button>
          {pcaResult && (
            <Button variant="outline" size="sm" onClick={downloadResults}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          )}
        </div>
      </div>

      {/* Theory Section */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
            <Lightbulb className="h-4 w-4" />
            What is PCA?
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700 dark:text-blue-300">
          <p className="mb-3">
            <strong>Principal Component Analysis (PCA)</strong> is a dimensionality reduction technique that transforms
            high-dimensional data into a lower-dimensional space while preserving as much variance as possible.
          </p>
          <p className="mb-3">
            <strong>Mathematical Foundation:</strong> PCA uses eigendecomposition of the covariance matrix to find
            principal components - linear combinations of original features that capture maximum variance.
          </p>
          <p>
            <strong>Why it matters:</strong> PCA helps reduce complexity while retaining most information. It's useful
            when you have too many features and want to compress data for visualization or modeling.
          </p>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Performing PCA analysis...</p>
            </div>
          </CardContent>
        </Card>
      ) : pcaResult ? (
        <div className="grid gap-6">
          {/* Explained Variance */}
          <Card>
            <CardHeader>
              <CardTitle>Explained Variance</CardTitle>
              <CardDescription>How much variance each principal component explains</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Scree Plot</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart
                      data={pcaResult.explainedVariance.map((variance, i) => ({
                        component: `PC${i + 1}`,
                        variance: Number(variance.toFixed(1)),
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="component" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value}%`, "Explained Variance"]} />
                      <Bar dataKey="variance" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Cumulative Variance</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart
                      data={pcaResult.cumulativeVariance.map((variance, i) => ({
                        component: `PC${i + 1}`,
                        cumulative: Number(variance.toFixed(1)),
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="component" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value}%`, "Cumulative Variance"]} />
                      <Line type="monotone" dataKey="cumulative" stroke="#3b82f6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                {pcaResult.explainedVariance.slice(0, 4).map((variance, i) => (
                  <div key={i} className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-lg font-bold text-blue-600">PC{i + 1}</div>
                    <div className="text-sm text-muted-foreground">{variance.toFixed(1)}%</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* PCA Scatter Plot */}
          <Card>
            <CardHeader>
              <CardTitle>Principal Components Visualization</CardTitle>
              <CardDescription>Data projected onto the first two principal components</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    dataKey="x"
                    name="PC1"
                    label={{ value: `PC1 (${pcaResult.explainedVariance[0]?.toFixed(1)}%)`, position: "bottom" }}
                  />
                  <YAxis
                    type="number"
                    dataKey="y"
                    name="PC2"
                    label={{
                      value: `PC2 (${pcaResult.explainedVariance[1]?.toFixed(1)}%)`,
                      angle: -90,
                      position: "left",
                    }}
                  />
                  <Tooltip
                    cursor={{ strokeDasharray: "3 3" }}
                    formatter={(value: any, name: string) => [value.toFixed(3), name]}
                  />
                  <Scatter
                    name="Data Points"
                    data={pcaResult.transformedData.map((point, i) => ({
                      x: Number(point[0]) || 0,
                      y: Number(point[1]) || 0,
                      index: i,
                    }))}
                    fill="#3b82f6"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Feature Importance - Fixed */}
          <Card>
            <CardHeader>
              <CardTitle>Feature Importance in Principal Components</CardTitle>
              <CardDescription>How much each original feature contributes to the principal components</CardDescription>
            </CardHeader>
            <CardContent>
              {pcaResult.featureImportance && pcaResult.featureImportance.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={pcaResult.featureImportance.map((item) => ({
                      feature: item.feature,
                      importance: Number((item.importance * 100).toFixed(2)), // Convert to percentage and ensure it's a number
                    }))}
                    layout="horizontal"
                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis dataKey="feature" type="category" width={80} />
                    <Tooltip formatter={(value: any) => [`${value}%`, "Importance"]} />
                    <Bar dataKey="importance" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No feature importance data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Interpretation */}
          <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
            <CardHeader>
              <CardTitle className="text-green-800 dark:text-green-200">Analysis Interpretation</CardTitle>
            </CardHeader>
            <CardContent className="text-green-700 dark:text-green-300">
              <div className="space-y-3">
                <p>
                  <strong>Dimensionality Reduction:</strong> Your {numericColumns.length} features have been reduced to{" "}
                  {pcaResult.explainedVariance.length} principal components.
                </p>
                <p>
                  <strong>Variance Explained:</strong> The first two components explain{" "}
                  {(pcaResult.cumulativeVariance[1] || pcaResult.explainedVariance[0] || 0).toFixed(1)}% of the total
                  variance in your data.
                </p>
                <p>
                  <strong>Key Insight:</strong>{" "}
                  {pcaResult.cumulativeVariance[1] > 80
                    ? "The first two components capture most of your data's variance, suggesting effective dimensionality reduction."
                    : pcaResult.cumulativeVariance[1] > 60
                      ? "The first two components capture a good portion of variance. Consider using more components for better representation."
                      : "Your data has high dimensionality. More components may be needed to capture sufficient variance."}
                </p>
                <p>
                  <strong>Most Important Features:</strong>{" "}
                  {pcaResult.featureImportance
                    .slice(0, 3)
                    .map((f) => f.feature)
                    .join(", ")}{" "}
                  contribute most to the principal components.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Click "Refresh Analysis" to perform PCA</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Also export as default for compatibility
export default PCAAnalysis
