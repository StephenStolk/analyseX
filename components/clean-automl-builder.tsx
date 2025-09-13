"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Brain,
  Play,
  BarChart3,
  Target,
  Zap,
  CheckCircle,
  TrendingUp,
  Settings,
  TestTube,
  ChevronDown,
  ChevronUp,
  FileText,
  Code,
  Database,
  Sparkles,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  trainRealAutoMLModel,
  makeRealPrediction,
  exportRealModel,
  type RealTrainedModel,
} from "@/lib/real-automl-engine"

export function CleanAutoMLBuilder() {
  const [analysisResults, setAnalysisResults] = useState<any>(null)
  const [selectedTarget, setSelectedTarget] = useState<string>("")
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])
  const [isTraining, setIsTraining] = useState(false)
  const [trainingProgress, setTrainingProgress] = useState(0)
  const [trainedModel, setTrainedModel] = useState<RealTrainedModel | null>(null)
  const [predictionInputs, setPredictionInputs] = useState<Record<string, number>>({})
  const [predictionResult, setPredictionResult] = useState<number | string | null>(null)
  const [isPredicting, setIsPredicting] = useState(false)
  const [availableColumns, setAvailableColumns] = useState<string[]>([])
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    setup: true,
    performance: false,
    features: false,
    testing: false,
  })

  useEffect(() => {
    const resultsString = sessionStorage.getItem("analysisResults")
    if (resultsString) {
      try {
        const results = JSON.parse(resultsString)
        setAnalysisResults(results)
        const columns = results.columnStats?.map((col: any) => col.name) || []
        setAvailableColumns(columns)

        const numericColumns =
          results.columnStats?.filter((col: any) => col.type === "Number")?.map((col: any) => col.name) || []
        setSelectedFeatures(numericColumns.slice(0, -1))
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

    const progressInterval = setInterval(() => {
      setTrainingProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + Math.random() * 15
      })
    }, 300)

    try {
      const data = analysisResults.previewData || []
      const model = await trainRealAutoMLModel(data, selectedTarget, selectedFeatures)

      setTrainedModel(model)
      setTrainingProgress(100)

      setExpandedSections((prev) => ({
        ...prev,
        setup: false,
        performance: true,
      }))

      const defaultInputs: Record<string, number> = {}
      selectedFeatures.forEach((feature) => {
        const columnStats = analysisResults.columnStats?.find((col: any) => col.name === feature)
        defaultInputs[feature] = columnStats?.mean || columnStats?.median || 0
      })
      setPredictionInputs(defaultInputs)

      toast({
        title: "Model Trained Successfully!",
        description: `${model.algorithm} achieved ${model.type === "classification" ? `${((model.metrics.accuracy || 0) * 100).toFixed(1)}% accuracy` : `R² score of ${(model.metrics.r2 || 0).toFixed(3)}`}`,
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
      const result = makeRealPrediction(trainedModel, predictionInputs)
      setPredictionResult(result)

      toast({
        title: "Prediction Complete",
        description: `Predicted: ${result}`,
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

  const handleDownloadModel = (format: "json" | "csv" | "python") => {
    if (!trainedModel) return

    const modelData = exportRealModel(trainedModel, format)
    const blob = new Blob([modelData], {
      type: format === "json" ? "application/json" : format === "csv" ? "text/csv" : "text/plain",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${trainedModel.name.replace(/\s+/g, "_").toLowerCase()}_model.${format}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Model Downloaded",
      description: `Your trained model has been exported as ${format.toUpperCase()}.`,
    })
  }

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
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
            <CardDescription>Build and test real machine learning models automatically</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Model Setup Section */}
            <Collapsible open={expandedSections.setup} onOpenChange={() => toggleSection("setup")}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                  <div className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Model Configuration</h3>
                  </div>
                  {expandedSections.setup ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 mt-4">
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
                        <p className="text-sm">
                          <strong>Problem Type:</strong>{" "}
                          <Badge variant="outline">
                            {(() => {
                              const targetValues =
                                analysisResults.previewData?.map((row: any) => row[selectedTarget]) || []
                              const uniqueTargets = [...new Set(targetValues)]
                              return uniqueTargets.length <= 10 ||
                                targetValues.some((val: any) => typeof val === "string")
                                ? "Classification"
                                : "Regression"
                            })()}
                          </Badge>
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

                {isTraining ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <h4 className="text-lg font-semibold mb-2">Training Your Model</h4>
                      <p className="text-muted-foreground mb-4">
                        Training real machine learning algorithms on your data
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
                          <Database className="h-5 w-5 text-primary" />
                        </div>
                        <p className="text-sm">Preprocessing Data</p>
                        {trainingProgress > 20 && <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />}
                      </div>
                      <div className="space-y-2">
                        <div className="rounded-full bg-primary/10 p-3 mx-auto w-fit">
                          <Zap className="h-5 w-5 text-primary" />
                        </div>
                        <p className="text-sm">Training Algorithm</p>
                        {trainingProgress > 60 && <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />}
                      </div>
                      <div className="space-y-2">
                        <div className="rounded-full bg-primary/10 p-3 mx-auto w-fit">
                          <Target className="h-5 w-5 text-primary" />
                        </div>
                        <p className="text-sm">Evaluating Model</p>
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
                      Train Real Model
                    </Button>
                    <p className="text-sm text-muted-foreground mt-2">
                      This will train actual machine learning algorithms on your data
                    </p>
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>

            {trainedModel && (
              <>
                <Separator />

                {/* Performance Section */}
                <Collapsible open={expandedSections.performance} onOpenChange={() => toggleSection("performance")}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-green-600" />
                        <h3 className="text-lg font-semibold">Model Performance</h3>
                        <Badge variant="outline">{trainedModel.algorithm}</Badge>
                      </div>
                      {expandedSections.performance ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 mt-4">
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
                                {(trainedModel.metrics.trainingTime / 1000).toFixed(1)}s
                              </p>
                              <p className="text-sm text-muted-foreground">Training Time</p>
                            </CardContent>
                          </Card>
                        </>
                      )}
                    </div>

                    <div className="flex gap-4 justify-center">
                      <Button
                        onClick={() => handleDownloadModel("json")}
                        variant="outline"
                        className="rounded-full gap-2"
                      >
                        <FileText className="h-4 w-4" />
                        JSON
                      </Button>
                      <Button
                        onClick={() => handleDownloadModel("csv")}
                        variant="outline"
                        className="rounded-full gap-2"
                      >
                        <Database className="h-4 w-4" />
                        CSV
                      </Button>
                      <Button
                        onClick={() => handleDownloadModel("python")}
                        variant="outline"
                        className="rounded-full gap-2"
                      >
                        <Code className="h-4 w-4" />
                        Python
                      </Button>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <Separator />

                {/* Feature Importance Section */}
                <Collapsible open={expandedSections.features} onOpenChange={() => toggleSection("features")}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-purple-600" />
                        <h3 className="text-lg font-semibold">Feature Importance</h3>
                      </div>
                      {expandedSections.features ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-3 mt-4">
                    {trainedModel.featureImportances.slice(0, 5).map((fi, index) => (
                      <div key={fi.feature} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{fi.feature}</span>
                          <span className="text-sm text-muted-foreground">{(fi.importance * 100).toFixed(1)}%</span>
                        </div>
                        <Progress value={fi.importance * 100} className="h-2" />
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>

                <Separator />

                {/* Live Testing Section */}
                <Collapsible open={expandedSections.testing} onOpenChange={() => toggleSection("testing")}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                      <div className="flex items-center gap-2">
                        <TestTube className="h-5 w-5 text-blue-600" />
                        <h3 className="text-lg font-semibold">Live Testing</h3>
                      </div>
                      {expandedSections.testing ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-6 mt-4">
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

                    <div className="text-center space-y-4">
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
                        Make Real Prediction
                      </Button>

                      {predictionResult !== null && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-6 py-3"
                        >
                          <span className="text-xl font-bold text-primary">
                            Prediction:{" "}
                            {typeof predictionResult === "number" ? predictionResult.toFixed(2) : predictionResult}
                          </span>
                        </motion.div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
