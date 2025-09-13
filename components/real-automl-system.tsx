"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import {
  Brain,
  Play,
  Download,
  CheckCircle,
  TrendingUp,
  Target,
  Zap,
  Settings,
  BarChart3,
  FileCode,
} from "lucide-react"
import { runRealAutoML, type RealAutoMLResult } from "@/lib/real-automl-engine"
import { toast } from "@/components/ui/use-toast"

interface TrainingProgress {
  currentAlgorithm: string
  progress: number
  stage: string
  timeElapsed: number
  estimatedTimeRemaining: number
}

export function RealAutoMLSystem() {
  const [data, setData] = useState<any[]>([])
  const [columns, setColumns] = useState<string[]>([])
  const [numericColumns, setNumericColumns] = useState<string[]>([])
  const [targetColumn, setTargetColumn] = useState<string>("")
  const [featureColumns, setFeatureColumns] = useState<string[]>([])
  const [testSize, setTestSize] = useState<number>(0.2)
  const [isTraining, setIsTraining] = useState(false)
  const [trainingProgress, setTrainingProgress] = useState<TrainingProgress | null>(null)
  const [automlResults, setAutomlResults] = useState<RealAutoMLResult | null>(null)
  const [activeTab, setActiveTab] = useState("setup")

  useEffect(() => {
    // Load data from session storage
    const resultsString = sessionStorage.getItem("analysisResults")
    if (resultsString) {
      try {
        const results = JSON.parse(resultsString)
        const loadedData = results.data || results.previewData || results.rawData || []

        if (loadedData.length > 0) {
          setData(loadedData)
          const allColumns = Object.keys(loadedData[0])
          setColumns(allColumns)

          // Detect numeric columns
          const numeric = allColumns.filter((col) => {
            const values = loadedData.slice(0, 100).map((row: any) => row[col])
            const numericValues = values.filter((val: any) => val !== null && val !== undefined && !isNaN(Number(val)))
            return numericValues.length > values.length * 0.7
          })
          setNumericColumns(numeric)

          console.log("AutoML Data loaded:", loadedData.length, "rows")
          console.log("Numeric columns:", numeric)
        }
      } catch (error) {
        console.error("Error loading data for AutoML:", error)
      }
    }
  }, [])

  const handleStartTraining = async () => {
    if (!targetColumn || featureColumns.length === 0) {
      toast({
        title: "Configuration Required",
        description: "Please select target column and feature columns",
        variant: "destructive",
      })
      return
    }

    setIsTraining(true)
    setActiveTab("training")

    try {
      // Simulate training progress
      const algorithms = ["Linear Regression", "Logistic Regression", "Random Forest", "Decision Tree", "SVM"]
      const currentProgress = 0
      const startTime = Date.now()

      for (let i = 0; i < algorithms.length; i++) {
        const algorithm = algorithms[i]

        // Update progress for each algorithm
        for (let stage = 0; stage < 4; stage++) {
          const stages = ["Preprocessing", "Training", "Validation", "Evaluation"]
          const stageProgress = ((i * 4 + stage + 1) / (algorithms.length * 4)) * 100

          setTrainingProgress({
            currentAlgorithm: algorithm,
            progress: stageProgress,
            stage: stages[stage],
            timeElapsed: Date.now() - startTime,
            estimatedTimeRemaining: ((Date.now() - startTime) / stageProgress) * (100 - stageProgress),
          })

          // Simulate processing time
          await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 1200))
        }
      }

      // Run actual AutoML
      console.log("Starting real AutoML training...")
      const results = await runRealAutoML(data, targetColumn, featureColumns, {
        testSize,
        crossValidationFolds: 5,
        randomState: 42,
        timeLimit: 300,
      })

      setAutomlResults(results)
      setActiveTab("results")

      toast({
        title: "Training Complete!",
        description: `Best model: ${results.bestModel.algorithm} with ${(results.bestModel.validationScore * 100).toFixed(1)}% accuracy`,
      })
    } catch (error) {
      console.error("AutoML training error:", error)
      toast({
        title: "Training Failed",
        description: error instanceof Error ? error.message : "An error occurred during training",
        variant: "destructive",
      })
    } finally {
      setIsTraining(false)
      setTrainingProgress(null)
    }
  }

  const handleDownloadModel = (format: "json" | "javascript") => {
    if (!automlResults) return

    const content =
      format === "json" ? automlResults.modelExports.bestModelJSON : automlResults.modelExports.bestModelCode

    const blob = new Blob([content], { type: format === "json" ? "application/json" : "text/javascript" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `automl_model.${format === "json" ? "json" : "js"}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Model Downloaded",
      description: `Model exported as ${format.toUpperCase()} file`,
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
          <Brain className="h-6 w-6 text-purple-600" />
          Real AutoML System
        </h2>
        <p className="text-muted-foreground">
          Production-ready machine learning with real algorithms and cross-validation
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="setup" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Setup
          </TabsTrigger>
          <TabsTrigger value="training" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Training
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Results
          </TabsTrigger>
          <TabsTrigger value="export" className="flex items-center gap-2">
            <FileCode className="h-4 w-4" />
            Export
          </TabsTrigger>
        </TabsList>

        {/* Setup Tab */}
        <TabsContent value="setup" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Model Configuration
                </CardTitle>
                <CardDescription>Configure your machine learning model</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Target Column (What to predict)</label>
                  <Select value={targetColumn} onValueChange={setTargetColumn}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select target column..." />
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
                  <label className="text-sm font-medium mb-2 block">Feature Columns (Input variables)</label>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                    {columns
                      .filter((col) => col !== targetColumn)
                      .map((col) => (
                        <label key={col} className="flex items-center space-x-2 text-sm">
                          <input
                            type="checkbox"
                            checked={featureColumns.includes(col)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFeatureColumns([...featureColumns, col])
                              } else {
                                setFeatureColumns(featureColumns.filter((f) => f !== col))
                              }
                            }}
                            className="rounded"
                          />
                          <span>{col}</span>
                        </label>
                      ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Test Size: {(testSize * 100).toFixed(0)}%</label>
                  <input
                    type="range"
                    min="0.1"
                    max="0.4"
                    step="0.05"
                    value={testSize}
                    onChange={(e) => setTestSize(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>10%</span>
                    <span>40%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Dataset Overview
                </CardTitle>
                <CardDescription>Summary of your data for training</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-2xl font-bold">{data.length.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Total Rows</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{columns.length}</div>
                    <div className="text-sm text-muted-foreground">Total Columns</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{numericColumns.length}</div>
                    <div className="text-sm text-muted-foreground">Numeric Columns</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{featureColumns.length}</div>
                    <div className="text-sm text-muted-foreground">Selected Features</div>
                  </div>
                </div>

                {targetColumn && featureColumns.length > 0 && (
                  <div className="mt-4">
                    <Button onClick={handleStartTraining} disabled={isTraining} className="w-full gap-2" size="lg">
                      <Play className="h-4 w-4" />
                      Start AutoML Training
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Training Tab */}
        <TabsContent value="training" className="space-y-6">
          {trainingProgress && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 animate-pulse text-blue-600" />
                  Training in Progress
                </CardTitle>
                <CardDescription>
                  Training {trainingProgress.currentAlgorithm} - {trainingProgress.stage}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Overall Progress</span>
                    <span>{trainingProgress.progress.toFixed(1)}%</span>
                  </div>
                  <Progress value={trainingProgress.progress} className="h-2" />
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Time Elapsed:</span>
                    <span className="ml-2 font-medium">{Math.floor(trainingProgress.timeElapsed / 1000)}s</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Est. Remaining:</span>
                    <span className="ml-2 font-medium">
                      {Math.floor(trainingProgress.estimatedTimeRemaining / 1000)}s
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm font-medium text-blue-900">
                    Currently training: {trainingProgress.currentAlgorithm}
                  </div>
                  <div className="text-sm text-blue-700">Stage: {trainingProgress.stage}</div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-6">
          {automlResults && (
            <>
              {/* Best Model Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Best Model: {automlResults.bestModel.algorithm}
                  </CardTitle>
                  <CardDescription>
                    Validation Score: {(automlResults.bestModel.validationScore * 100).toFixed(2)}%
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-2xl font-bold">
                        {(automlResults.bestModel.validationScore * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Validation Score</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {(automlResults.bestModel.crossValidationMean * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">CV Score</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{automlResults.bestModel.trainingTime}ms</div>
                      <div className="text-sm text-muted-foreground">Training Time</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{automlResults.datasetInfo.trainSamples}</div>
                      <div className="text-sm text-muted-foreground">Training Samples</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Model Leaderboard */}
              <Card>
                <CardHeader>
                  <CardTitle>Model Leaderboard</CardTitle>
                  <CardDescription>Performance comparison of all trained models</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rank</TableHead>
                        <TableHead>Algorithm</TableHead>
                        <TableHead>Validation Score</TableHead>
                        <TableHead>CV Mean</TableHead>
                        <TableHead>CV Std</TableHead>
                        <TableHead>Training Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {automlResults.leaderboard.map((model, index) => (
                        <TableRow key={model.algorithm}>
                          <TableCell>
                            <Badge variant={index === 0 ? "default" : "secondary"}>#{index + 1}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">{model.algorithm}</TableCell>
                          <TableCell>{(model.validationScore * 100).toFixed(2)}%</TableCell>
                          <TableCell>{(model.crossValidationMean * 100).toFixed(2)}%</TableCell>
                          <TableCell>{(model.crossValidationStd * 100).toFixed(2)}%</TableCell>
                          <TableCell>{model.trainingTime}ms</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Feature Importance */}
              <Card>
                <CardHeader>
                  <CardTitle>Feature Importance</CardTitle>
                  <CardDescription>Most important features for prediction</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={automlResults.featureAnalysis.topFeatures.slice(0, 10)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="importance" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle>Recommendations</CardTitle>
                  <CardDescription>Suggestions for improving your model</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {automlResults.recommendations.map((rec, index) => (
                      <div key={index} className="flex items-start gap-2 p-2 bg-muted/50 rounded">
                        <TrendingUp className="h-4 w-4 mt-0.5 text-blue-600" />
                        <span className="text-sm">{rec}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Export Tab */}
        <TabsContent value="export" className="space-y-6">
          {automlResults && (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Export Model
                  </CardTitle>
                  <CardDescription>Download your trained model for deployment</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={() => handleDownloadModel("javascript")} className="w-full gap-2" variant="outline">
                    <FileCode className="h-4 w-4" />
                    Download as JavaScript
                  </Button>
                  <Button onClick={() => handleDownloadModel("json")} className="w-full gap-2" variant="outline">
                    <Download className="h-4 w-4" />
                    Download as JSON
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Model Summary</CardTitle>
                  <CardDescription>Key information about your trained model</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Algorithm:</span>
                    <span className="text-sm font-medium">{automlResults.bestModel.algorithm}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Problem Type:</span>
                    <span className="text-sm font-medium">{automlResults.bestModel.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Features:</span>
                    <span className="text-sm font-medium">{automlResults.featureAnalysis.featureNames.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Training Time:</span>
                    <span className="text-sm font-medium">{automlResults.totalTrainingTime}ms</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default RealAutoMLSystem
