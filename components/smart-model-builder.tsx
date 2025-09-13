"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Brain,
  Download,
  Play,
  BarChart3,
  Target,
  Zap,
  CheckCircle,
  TrendingUp,
  Settings,
  TestTube,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import {
  trainAutoMLModel,
  makePrediction,
  exportModel,
  determineProblemType,
  type TrainedModel,
  type PredictionResult,
} from "@/lib/automl-engine"

export function SmartModelBuilder() {
  const [analysisResults, setAnalysisResults] = useState<any>(null)
  const [selectedTarget, setSelectedTarget] = useState<string>("")
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])
  const [isTraining, setIsTraining] = useState(false)
  const [trainingProgress, setTrainingProgress] = useState(0)
  const [trainedModel, setTrainedModel] = useState<TrainedModel | null>(null)
  const [predictionInputs, setPredictionInputs] = useState<Record<string, number>>({})
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null)
  const [isPredicting, setIsPredicting] = useState(false)
  const [availableColumns, setAvailableColumns] = useState<string[]>([])

  useEffect(() => {
    // Load analysis results
    const resultsString = sessionStorage.getItem("analysisResults")
    if (resultsString) {
      try {
        const results = JSON.parse(resultsString)
        setAnalysisResults(results)

        // Get available columns for model building
        const columns = results.columnStats?.map((col: any) => col.name) || []
        setAvailableColumns(columns)

        // Auto-select numeric columns as features
        const numericColumns =
          results.columnStats?.filter((col: any) => col.type === "Number")?.map((col: any) => col.name) || []
        setSelectedFeatures(numericColumns.slice(0, -1)) // All but last as features

        // Auto-select last numeric column as target if available
        if (numericColumns.length > 0) {
          setSelectedTarget(numericColumns[numericColumns.length - 1])
        }
      } catch (error) {
        console.error("Error loading analysis results:", error)
      }
    }
  }, [])

  const handleTrainModel = async () => {
    if (!selectedTarget || selectedFeatures.length === 0) {
      toast({
        title: "Selection Required",
        description: "Please select a target column and at least one feature.",
        variant: "destructive",
      })
      return
    }

    setIsTraining(true)
    setTrainingProgress(0)

    // Simulate training progress
    const progressInterval = setInterval(() => {
      setTrainingProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + Math.random() * 15
      })
    }, 500)

    try {
      // Get the actual data for training
      const data = analysisResults.previewData || []
      const problemType = determineProblemType(data, selectedTarget)

      console.log(`Training ${problemType} model for target: ${selectedTarget}`)
      console.log(`Using features: ${selectedFeatures.join(", ")}`)

      const model = await trainAutoMLModel(data, selectedTarget, selectedFeatures, problemType)

      setTrainedModel(model)
      setTrainingProgress(100)

      // Initialize prediction inputs with default values
      const defaultInputs: Record<string, number> = {}
      selectedFeatures.forEach((feature) => {
        const columnStats = analysisResults.columnStats?.find((col: any) => col.name === feature)
        defaultInputs[feature] = columnStats?.mean || columnStats?.median || 0
      })
      setPredictionInputs(defaultInputs)

      toast({
        title: "Model Trained Successfully!",
        description: `${model.algorithm} model achieved ${model.type === "classification" ? `${((model.metrics.accuracy || 0) * 100).toFixed(1)}% accuracy` : `R² score of ${(model.metrics.r2 || 0).toFixed(3)}`}`,
      })
    } catch (error) {
      console.error("Error training model:", error)
      toast({
        title: "Training Failed",
        description: "There was an error training the model. Please try again.",
        variant: "destructive",
      })
    } finally {
      clearInterval(progressInterval)
      setIsTraining(false)
    }
  }

  const handleMakePrediction = async () => {
    if (!trainedModel) return

    setIsPredicting(true)
    try {
      const result = await makePrediction(trainedModel, predictionInputs)
      setPredictionResult(result)

      toast({
        title: "Prediction Complete",
        description: `Predicted: ${result.prediction} (${(result.confidence * 100).toFixed(1)}% confidence)`,
      })
    } catch (error) {
      console.error("Error making prediction:", error)
      toast({
        title: "Prediction Failed",
        description: "There was an error making the prediction.",
        variant: "destructive",
      })
    } finally {
      setIsPredicting(false)
    }
  }

  const handleDownloadModel = () => {
    if (!trainedModel) return

    const modelData = exportModel(trainedModel)
    const blob = new Blob([modelData], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${trainedModel.name.replace(/\s+/g, "_").toLowerCase()}_model.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Model Downloaded",
      description: "Your trained model has been exported as a JSON file.",
    })
  }

  const toggleFeature = (feature: string) => {
    setSelectedFeatures((prev) => (prev.includes(feature) ? prev.filter((f) => f !== feature) : [...prev, feature]))
  }

  if (!analysisResults) {
    return (
      <Card className="rounded-3xl">
        <CardContent className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">No data available for model building.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="rounded-3xl border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" />
              Smart Model Builder (AutoML)
            </CardTitle>
            <CardDescription>Build and test machine learning models automatically - no coding required</CardDescription>
          </CardHeader>
          <CardContent>
            {!trainedModel ? (
              <div className="space-y-6">
                {/* Model Configuration */}
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="target-select">Target Column (What to predict)</Label>
                      <Select value={selectedTarget} onValueChange={setSelectedTarget}>
                        <SelectTrigger id="target-select">
                          <SelectValue placeholder="Select target column" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableColumns.map((column) => (
                            <SelectItem key={column} value={column}>
                              {column}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedTarget && (
                      <div className="rounded-lg border bg-muted/30 p-3">
                        <p className="text-sm text-muted-foreground">
                          <strong>Problem Type:</strong>{" "}
                          {determineProblemType(analysisResults.previewData || [], selectedTarget)}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <Label>Feature Columns (Input variables)</Label>
                    <ScrollArea className="h-32 rounded-lg border p-3">
                      <div className="space-y-2">
                        {availableColumns
                          .filter((col) => col !== selectedTarget)
                          .map((column) => (
                            <div key={column} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`feature-${column}`}
                                checked={selectedFeatures.includes(column)}
                                onChange={() => toggleFeature(column)}
                                className="rounded"
                              />
                              <label htmlFor={`feature-${column}`} className="text-sm">
                                {column}
                              </label>
                            </div>
                          ))}
                      </div>
                    </ScrollArea>
                    <p className="text-xs text-muted-foreground">Selected: {selectedFeatures.length} features</p>
                  </div>
                </div>

                {/* Training Section */}
                {isTraining ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold mb-2">Training Your Model</h3>
                      <p className="text-muted-foreground mb-4">
                        Our AutoML system is testing multiple algorithms to find the best one for your data
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Training Progress</span>
                        <span>{Math.round(trainingProgress)}%</span>
                      </div>
                      <Progress value={trainingProgress} className="h-3" />
                    </div>

                    <div className="grid gap-4 md:grid-cols-3 text-center">
                      <div className="space-y-2">
                        <div className="rounded-full bg-primary/10 p-3 mx-auto w-fit">
                          <Settings className="h-5 w-5 text-primary" />
                        </div>
                        <p className="text-sm">Preprocessing Data</p>
                        {trainingProgress > 20 && <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />}
                      </div>
                      <div className="space-y-2">
                        <div className="rounded-full bg-primary/10 p-3 mx-auto w-fit">
                          <Zap className="h-5 w-5 text-primary" />
                        </div>
                        <p className="text-sm">Testing Algorithms</p>
                        {trainingProgress > 60 && <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />}
                      </div>
                      <div className="space-y-2">
                        <div className="rounded-full bg-primary/10 p-3 mx-auto w-fit">
                          <Target className="h-5 w-5 text-primary" />
                        </div>
                        <p className="text-sm">Optimizing Model</p>
                        {trainingProgress > 85 && <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <Button
                      onClick={handleTrainModel}
                      disabled={!selectedTarget || selectedFeatures.length === 0}
                      className="rounded-full px-8 gap-2"
                      size="lg"
                    >
                      <Play className="h-5 w-5" />
                      Train My Model
                    </Button>
                    <p className="text-sm text-muted-foreground mt-2">
                      This will automatically test multiple algorithms and select the best one
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* Model Results */
              <Tabs defaultValue="performance" className="w-full">
                <TabsList className="grid w-full grid-cols-3 rounded-full">
                  <TabsTrigger value="performance" className="rounded-full">
                    Performance
                  </TabsTrigger>
                  <TabsTrigger value="details" className="rounded-full">
                    Model Details
                  </TabsTrigger>
                  <TabsTrigger value="predict" className="rounded-full">
                    Live Testing
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="performance" className="mt-6 space-y-6">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold mb-2">{trainedModel.algorithm} Model</h3>
                    <Badge variant="outline" className="mb-4">
                      {trainedModel.type === "classification" ? "Classification" : "Regression"} Model
                    </Badge>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {trainedModel.type === "classification" ? (
                      <>
                        <Card>
                          <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold text-green-600">
                              {((trainedModel.metrics.accuracy || 0) * 100).toFixed(1)}%
                            </p>
                            <p className="text-sm text-muted-foreground">Accuracy</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold text-blue-600">
                              {((trainedModel.metrics.precision || 0) * 100).toFixed(1)}%
                            </p>
                            <p className="text-sm text-muted-foreground">Precision</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold text-purple-600">
                              {((trainedModel.metrics.recall || 0) * 100).toFixed(1)}%
                            </p>
                            <p className="text-sm text-muted-foreground">Recall</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold text-orange-600">
                              {((trainedModel.metrics.f1Score || 0) * 100).toFixed(1)}%
                            </p>
                            <p className="text-sm text-muted-foreground">F1 Score</p>
                          </CardContent>
                        </Card>
                      </>
                    ) : (
                      <>
                        <Card>
                          <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold text-green-600">
                              {(trainedModel.metrics.r2 || 0).toFixed(3)}
                            </p>
                            <p className="text-sm text-muted-foreground">R² Score</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold text-blue-600">
                              {(trainedModel.metrics.rmse || 0).toFixed(2)}
                            </p>
                            <p className="text-sm text-muted-foreground">RMSE</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold text-purple-600">
                              {(trainedModel.metrics.mae || 0).toFixed(2)}
                            </p>
                            <p className="text-sm text-muted-foreground">MAE</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold text-orange-600">
                              {(trainedModel.crossValidationScore * 100).toFixed(1)}%
                            </p>
                            <p className="text-sm text-muted-foreground">CV Score</p>
                          </CardContent>
                        </Card>
                      </>
                    )}
                  </div>

                  {/* Feature Importance */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Feature Importance
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {trainedModel.featureImportances.slice(0, 5).map((fi, index) => (
                          <div key={fi.feature} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">{fi.feature}</span>
                              <span className="text-sm text-muted-foreground">{(fi.importance * 100).toFixed(1)}%</span>
                            </div>
                            <Progress value={fi.importance * 100} className="h-2" />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex gap-4 justify-center">
                    <Button onClick={handleDownloadModel} variant="outline" className="rounded-full gap-2">
                      <Download className="h-4 w-4" />
                      Download Model
                    </Button>
                    <Button onClick={() => setTrainedModel(null)} variant="outline" className="rounded-full">
                      Train New Model
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="details" className="mt-6 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Model Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground leading-relaxed">{trainedModel.modelSummary}</p>
                    </CardContent>
                  </Card>

                  <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle>Training Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Algorithm:</span>
                          <span className="font-medium">{trainedModel.algorithm}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Training Time:</span>
                          <span className="font-medium">{(trainedModel.trainingTime / 1000).toFixed(1)}s</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Data Size:</span>
                          <span className="font-medium">{trainedModel.dataSize} samples</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Features:</span>
                          <span className="font-medium">{trainedModel.features.length}</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Hyperparameters</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-32">
                          <div className="space-y-2">
                            {Object.entries(trainedModel.hyperparameters).map(([key, value]) => (
                              <div key={key} className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{key}:</span>
                                <span className="font-mono">{String(value)}</span>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="predict" className="mt-6 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TestTube className="h-5 w-5" />
                        Live Prediction Testing
                      </CardTitle>
                      <CardDescription>Enter values for each feature to see what the model predicts</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {trainedModel.features.map((feature) => (
                          <div key={feature} className="space-y-2">
                            <Label htmlFor={`input-${feature}`}>{feature}</Label>
                            <Input
                              id={`input-${feature}`}
                              type="number"
                              step="any"
                              value={predictionInputs[feature] || ""}
                              onChange={(e) =>
                                setPredictionInputs((prev) => ({
                                  ...prev,
                                  [feature]: Number.parseFloat(e.target.value) || 0,
                                }))
                              }
                              placeholder="Enter value"
                            />
                          </div>
                        ))}
                      </div>

                      <div className="text-center">
                        <Button
                          onClick={handleMakePrediction}
                          disabled={isPredicting}
                          className="rounded-full px-8 gap-2"
                        >
                          {isPredicting ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                          ) : (
                            <TrendingUp className="h-4 w-4" />
                          )}
                          Make Prediction
                        </Button>
                      </div>

                      {predictionResult && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-4"
                        >
                          <Separator />

                          <div className="text-center">
                            <h4 className="text-lg font-semibold mb-2">Prediction Result</h4>
                            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-6 py-3">
                              <span className="text-2xl font-bold text-primary">
                                {typeof predictionResult.prediction === "number"
                                  ? predictionResult.prediction.toFixed(2)
                                  : predictionResult.prediction}
                              </span>
                              <Badge variant="secondary">
                                {(predictionResult.confidence * 100).toFixed(1)}% confidence
                              </Badge>
                            </div>
                          </div>

                          <Card>
                            <CardContent className="p-4">
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {predictionResult.explanation}
                              </p>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader>
                              <CardTitle className="text-base">Feature Contributions</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                {predictionResult.featureContributions.slice(0, 5).map((fc, index) => (
                                  <div key={fc.feature} className="flex justify-between items-center">
                                    <span className="text-sm">{fc.feature}</span>
                                    <div className="flex items-center gap-2">
                                      <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                                        <div
                                          className="h-full bg-primary rounded-full"
                                          style={{ width: `${Math.abs(fc.contribution) * 100}%` }}
                                        />
                                      </div>
                                      <span className="text-xs text-muted-foreground w-12 text-right">
                                        {(fc.contribution * 100).toFixed(1)}%
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
