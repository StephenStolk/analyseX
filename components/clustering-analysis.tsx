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
  LineChart,
  Line,
  BarChart,
  Bar,
} from "recharts"
import { Users, Download, Info, Lightbulb } from "lucide-react"
import { performClustering } from "@/lib/advanced-analysis-utils"
import { getChartInsight } from "@/lib/chart-insights"
import type { ClusteringResult } from "@/lib/advanced-analysis-utils"

interface ClusteringAnalysisProps {
  data: any[]
  numericColumns: string[]
  categoricalColumns: string[]
  onError: (error: string | null) => void
}

const CLUSTER_COLORS = [
  "#3b82f6",
  "#ef4444",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
  "#f97316",
  "#6366f1",
]

export function ClusteringAnalysis({ data, numericColumns, categoricalColumns, onError }: ClusteringAnalysisProps) {
  const [result, setResult] = useState<ClusteringResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])

  useEffect(() => {
    if (numericColumns.length >= 2) {
      setSelectedFeatures(numericColumns.slice(0, Math.min(5, numericColumns.length)))
    }
  }, [numericColumns])

  const performAnalysis = async () => {
    if (selectedFeatures.length < 2) {
      onError("Clustering requires at least 2 numeric features")
      return
    }

    setIsLoading(true)
    onError(null)

    try {
      const analysisResult = performClustering(data, selectedFeatures)
      setResult(analysisResult)
    } catch (error) {
      console.error("Clustering analysis error:", error)
      onError(`Clustering analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsLoading(false)
    }
  }

  const downloadResults = () => {
    if (!result) return

    const results = {
      analysis: "Clustering Analysis",
      timestamp: new Date().toISOString(),
      features: selectedFeatures,
      optimalClusters: result.optimalK,
      silhouetteScore: result.silhouetteScore,
      clusterSizes: result.clusterSizes,
      clusterStats: result.clusterStats,
    }

    const blob = new Blob([JSON.stringify(results, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "clustering_analysis.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  const toggleFeature = (feature: string) => {
    setSelectedFeatures((prev) => (prev.includes(feature) ? prev.filter((f) => f !== feature) : [...prev, feature]))
  }

  if (numericColumns.length < 2) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Clustering analysis requires at least 2 numeric columns. Your dataset has {numericColumns.length} numeric
          column(s).
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold">Clustering Analysis</h3>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={performAnalysis}
            disabled={isLoading || selectedFeatures.length < 2}
          >
            {isLoading ? "Analyzing..." : "Run Clustering"}
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
      <Card className="border-purple-200 bg-purple-50 dark:bg-purple-950 dark:border-purple-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-800 dark:text-purple-200">
            <Lightbulb className="h-4 w-4" />
            What is Clustering Analysis?
          </CardTitle>
        </CardHeader>
        <CardContent className="text-purple-700 dark:text-purple-300">
          <p className="mb-3">
            <strong>Clustering Analysis</strong> groups similar data points using unsupervised learning. K-means
            clustering minimizes Within Cluster Sum of Squares (WCSS) to find optimal groupings.
          </p>
          <p className="mb-3">
            <strong>Mathematical Foundation:</strong> K-means uses iterative optimization to minimize ∑∑||x - μₖ||²
            where x are data points and μₖ are cluster centroids.
          </p>
          <p>
            <strong>Why it matters:</strong> Clustering reveals hidden patterns and natural groupings in data,
            especially useful for customer segmentation, anomaly detection, and market research.
          </p>
        </CardContent>
      </Card>

      {/* Feature Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Features for Clustering</CardTitle>
          <CardDescription>Choose numeric columns to include in the clustering analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {numericColumns.map((feature) => (
              <label key={feature} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedFeatures.includes(feature)}
                  onChange={() => toggleFeature(feature)}
                  className="rounded"
                />
                <span className="text-sm">{feature}</span>
              </label>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-2">Selected: {selectedFeatures.length} features</p>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p>Performing clustering analysis...</p>
            </div>
          </CardContent>
        </Card>
      ) : result ? (
        <div className="grid gap-6">
          {/* Clustering Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Clustering Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-lg font-bold text-purple-600">Clusters</div>
                  <div className="text-sm text-muted-foreground">{result.optimalK}</div>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-lg font-bold text-blue-600">Silhouette</div>
                  <div className="text-sm text-muted-foreground">{result.silhouetteScore.toFixed(3)}</div>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-lg font-bold text-green-600">Features</div>
                  <div className="text-sm text-muted-foreground">{selectedFeatures.length}</div>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-lg font-bold text-orange-600">Data Points</div>
                  <div className="text-sm text-muted-foreground">{result.clusters.length}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cluster Visualization */}
          {selectedFeatures.length >= 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Cluster Visualization</CardTitle>
                <CardDescription>
                  Data points colored by cluster assignment ({selectedFeatures[0]} vs {selectedFeatures[1]})
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      type="number"
                      dataKey="x"
                      name={selectedFeatures[0]}
                      label={{ value: selectedFeatures[0], position: "bottom" }}
                    />
                    <YAxis
                      type="number"
                      dataKey="y"
                      name={selectedFeatures[1]}
                      label={{ value: selectedFeatures[1], angle: -90, position: "left" }}
                    />
                    <Tooltip
                      cursor={{ strokeDasharray: "3 3" }}
                      formatter={(value: any, name: string) => [value.toFixed(3), name]}
                    />
                    {Array.from(new Set(result.clusters)).map((clusterId) => (
                      <Scatter
                        key={clusterId}
                        name={`Cluster ${clusterId + 1}`}
                        data={data
                          .map((row, i) => ({
                            x: Number(row[selectedFeatures[0]]),
                            y: Number(row[selectedFeatures[1]]),
                            cluster: result.clusters[i],
                          }))
                          .filter((point) => point.cluster === clusterId && !isNaN(point.x) && !isNaN(point.y))}
                        fill={CLUSTER_COLORS[clusterId % CLUSTER_COLORS.length]}
                      />
                    ))}
                  </ScatterChart>
                </ResponsiveContainer>

                {/* Chart Insight */}
                {(() => {
                  const insight = getChartInsight("clustering", data, selectedFeatures[0], selectedFeatures[1])
                  return (
                    <Card className="mt-4 border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 dark:bg-gradient-to-r dark:from-emerald-950 dark:to-teal-950 dark:border-emerald-800">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
                          <Lightbulb className="h-4 w-4" />
                          {insight.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-emerald-700 dark:text-emerald-300">
                        <p className="text-sm leading-relaxed">
                          K-means clustering identified {result.optimalK} distinct groups in your data with a silhouette
                          score of {result.silhouetteScore.toFixed(3)}.
                          {result.silhouetteScore > 0.7
                            ? " Excellent cluster separation indicates well-defined, natural groupings in your dataset."
                            : result.silhouetteScore > 0.5
                              ? " Good cluster quality suggests meaningful data segmentation with some overlap between groups."
                              : " Moderate clustering suggests subtle patterns that may require domain expertise to interpret."}
                        </p>
                      </CardContent>
                    </Card>
                  )
                })()}
              </CardContent>
            </Card>
          )}

          {/* Cluster Sizes */}
          <Card>
            <CardHeader>
              <CardTitle>Cluster Distribution</CardTitle>
              <CardDescription>Number of data points in each cluster</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={result.clusterSizes.map((size, i) => ({
                    cluster: `Cluster ${i + 1}`,
                    size: size,
                    percentage: ((size / result.clusters.length) * 100).toFixed(1),
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="cluster" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: any, name: string) => [
                      name === "size" ? `${value} points` : `${value}%`,
                      name === "size" ? "Count" : "Percentage",
                    ]}
                  />
                  <Bar dataKey="size" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>

              {/* Bar Chart Insight */}
              {(() => {
                const clusterData = result.clusterSizes.map((size, i) => ({
                  cluster: `Cluster ${i + 1}`,
                  size: size,
                }))
                const insight = getChartInsight("bar", clusterData, "cluster", "size")
                return (
                  <Card className="mt-4 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 dark:bg-gradient-to-r dark:from-blue-950 dark:to-indigo-950 dark:border-blue-800">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                        <Lightbulb className="h-4 w-4" />
                        {insight.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-blue-700 dark:text-blue-300">
                      <p className="text-sm leading-relaxed">{insight.description}</p>
                    </CardContent>
                  </Card>
                )
              })()}
            </CardContent>
          </Card>

          {/* Elbow Method Visualization */}
          <Card>
            <CardHeader>
              <CardTitle>Elbow Method</CardTitle>
              <CardDescription>Within-cluster sum of squares for different numbers of clusters</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart
                  data={result.withinClusterSS.map((wcss, i) => ({
                    k: i + 2,
                    wcss: wcss,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="k" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => [value.toFixed(2), "WCSS"]} />
                  <Line type="monotone" dataKey="wcss" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>

              {/* Line Chart Insight */}
              {(() => {
                const elbowData = result.withinClusterSS.map((wcss, i) => ({
                  k: i + 2,
                  wcss: wcss,
                }))
                const insight = getChartInsight("line", elbowData, "k", "wcss")
                return (
                  <Card className="mt-4 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 dark:bg-gradient-to-r dark:from-green-950 dark:to-emerald-950 dark:border-green-800">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
                        <Lightbulb className="h-4 w-4" />
                        Elbow Method Insight
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-green-700 dark:text-green-300">
                      <p className="text-sm leading-relaxed">
                        The elbow method shows decreasing within-cluster sum of squares as the number of clusters
                        increases. The optimal number of clusters ({result.optimalK}) is chosen at the "elbow" point
                        where the rate of decrease slows significantly, balancing cluster cohesion with model
                        simplicity.
                      </p>
                    </CardContent>
                  </Card>
                )
              })()}
            </CardContent>
          </Card>

          {/* Interpretation */}
          <Card className="border-indigo-200 bg-indigo-50 dark:bg-indigo-950 dark:border-indigo-800">
            <CardHeader>
              <CardTitle className="text-indigo-800 dark:text-indigo-200">Analysis Interpretation</CardTitle>
            </CardHeader>
            <CardContent className="text-indigo-700 dark:text-indigo-300">
              <div className="space-y-3">
                <p>
                  <strong>Optimal Clusters:</strong> The algorithm identified {result.optimalK} distinct clusters in
                  your data.
                </p>
                <p>
                  <strong>Clustering Quality:</strong>{" "}
                  {result.silhouetteScore > 0.7
                    ? "Excellent clustering quality. Clusters are well-separated and cohesive."
                    : result.silhouetteScore > 0.5
                      ? "Good clustering quality. Clusters are reasonably well-defined."
                      : result.silhouetteScore > 0.25
                        ? "Fair clustering quality. Some overlap between clusters exists."
                        : "Poor clustering quality. Data may not have natural cluster structure."}
                </p>
                <p>
                  <strong>Cluster Balance:</strong>{" "}
                  {Math.max(...result.clusterSizes) / Math.min(...result.clusterSizes) < 3
                    ? "Clusters are well-balanced in size."
                    : "Some clusters are much larger than others, which may indicate outliers or imbalanced groups."}
                </p>
                <p>
                  <strong>Business Insights:</strong>{" "}
                  {result.optimalK <= 5
                    ? "The small number of clusters suggests clear, distinct segments that could be useful for targeted strategies."
                    : "The larger number of clusters indicates complex data structure with many sub-groups."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Select features and click "Run Clustering" to analyze your data</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
