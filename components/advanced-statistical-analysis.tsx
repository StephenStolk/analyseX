"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Brain, Activity, BarChart4, LineChart, PieChart } from "lucide-react"
import { PCAAnalysis } from "./pca-analysis"
import { TimeSeriesAnalysis } from "./time-series-analysis"
import { ClusteringAnalysis } from "./clustering-analysis"
import { FeatureImportanceAnalysis } from "./feature-importance-analysis"
import { StatisticalTests } from "./statistical-tests"

interface AdvancedStatisticalAnalysisProps {
  data: any[]
  columns: { name: string; type: string }[]
}

export function AdvancedStatisticalAnalysis({ data, columns }: AdvancedStatisticalAnalysisProps) {
  const [activeTab, setActiveTab] = useState("pca")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const numericColumns = columns.filter((col) => col.type === "Number").map((col) => col.name)

  const dateColumns = columns.filter((col) => col.type === "Date").map((col) => col.name)

  const categoricalColumns = columns.filter((col) => col.type === "String").map((col) => col.name)

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setError(null)
  }

  if (data.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No data available</AlertTitle>
        <AlertDescription>Please upload a dataset to perform advanced statistical analysis.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Advanced Statistical Analysis</h2>
          <p className="text-muted-foreground">Perform advanced statistical analyses on your dataset</p>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          {data.length} rows
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid grid-cols-5 mb-4">
          <TabsTrigger value="pca" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            <span className="hidden sm:inline">PCA</span>
          </TabsTrigger>
          <TabsTrigger value="timeseries" className="flex items-center gap-2">
            <LineChart className="h-4 w-4" />
            <span className="hidden sm:inline">Time Series</span>
          </TabsTrigger>
          <TabsTrigger value="clustering" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            <span className="hidden sm:inline">Clustering</span>
          </TabsTrigger>
          <TabsTrigger value="importance" className="flex items-center gap-2">
            <BarChart4 className="h-4 w-4" />
            <span className="hidden sm:inline">Feature Importance</span>
          </TabsTrigger>
          <TabsTrigger value="tests" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Statistical Tests</span>
          </TabsTrigger>
        </TabsList>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <TabsContent value="pca" className="mt-0">
          <PCAAnalysis data={data} numericColumns={numericColumns} onError={setError} />
        </TabsContent>

        <TabsContent value="timeseries" className="mt-0">
          <TimeSeriesAnalysis
            data={data}
            dateColumns={dateColumns}
            numericColumns={numericColumns}
            onError={setError}
          />
        </TabsContent>

        <TabsContent value="clustering" className="mt-0">
          <ClusteringAnalysis
            data={data}
            numericColumns={numericColumns}
            categoricalColumns={categoricalColumns}
            onError={setError}
          />
        </TabsContent>

        <TabsContent value="importance" className="mt-0">
          <FeatureImportanceAnalysis data={data} numericColumns={numericColumns} onError={setError} />
        </TabsContent>

        <TabsContent value="tests" className="mt-0">
          <StatisticalTests
            data={data}
            numericColumns={numericColumns}
            categoricalColumns={categoricalColumns}
            onError={setError}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
