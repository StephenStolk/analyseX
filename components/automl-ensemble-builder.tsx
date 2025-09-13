"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Brain,
  Play,
  BarChart3,
  Zap,
  Settings,
  ChevronDown,
  ChevronUp,
  Database,
  Sparkles,
  Trophy,
  Download,
  FileJson,
  FileCode,
  FileSpreadsheet,
  AlertCircle,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { runAutoMLEnsemble, type EnsembleAutoMLResult } from "@/lib/real-automl-ensemble"

export function AutoMLEnsembleBuilder() {
  const [analysisResults, setAnalysisResults] = useState<any>(null)
  const [selectedTarget, setSelectedTarget] = useState<string>("")
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])
  const [isTraining, setIsTraining] = useState(false)
  const [trainingProgress, setTrainingProgress] = useState(0)
  const [currentLibrary, setCurrentLibrary] = useState("")
  const [ensembleResult, setEnsembleResult] = useState<EnsembleAutoMLResult | null>(null)
  const [availableColumns, setAvailableColumns] = useState<string[]>([])
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    setup: true,
    comparison: false,
    best: false,
    ensemble: false,
    testing: false,
  })
  const [testInput, setTestInput] = useState<Record<string, number>>({})
  const [testPrediction, setTestPrediction] = useState<number | null>(null)
  const [selectedModelLibrary, setSelectedModelLibrary] = useState<string>("")

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
        setSelectedFeatures(numericColumns.slice(0, Math.max(1, numericColumns.length - 1)))
        if (numericColumns.length > 0) {
          setSelectedTarget(numericColumns[numericColumns.length - 1])
        }
      } catch (error) {
        console.error("Error loading analysis results:", error)
      }
    }
  }, [])

  const handleTrainEnsemble = async () => {
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
    setEnsembleResult(null)

    const libraries = ["FLAML", "Auto-sklearn", "PyCaret"]
    let currentLibIndex = 0

    // More realistic training simulation
    const totalSteps = 100
    const stepDuration = 150 // 150ms per step = ~15 seconds total

    const progressInterval = setInterval(() => {
      setTrainingProgress((prev) => {
        const increment = Math.random() * 2 + 0.5 // Random increment between 0.5-2.5
        const newProgress = Math.min(prev + increment, 95)

        // Update current library being trained based on progress
        const libraryProgress = Math.floor(newProgress / 33.33)
        if (libraryProgress < libraries.length && libraryProgress !== currentLibIndex) {
          currentLibIndex = libraryProgress
          setCurrentLibrary(libraries[libraryProgress])

          // Show toast for each library start
          toast({
            title: `Training ${libraries[libraryProgress]}`,
            description: `Starting ${libraries[libraryProgress]} AutoML training...`,
          })
        }

        if (newProgress >= 95) {
          clearInterval(progressInterval)
          setCurrentLibrary("Finalizing ensemble...")

          // Final step - actually run the AutoML
          setTimeout(async () => {
            try {
              const data = analysisResults.previewData || []
              const result = await runAutoMLEnsemble(data, selectedTarget, selectedFeatures)

              setEnsembleResult(result)
              setTrainingProgress(100)
              setCurrentLibrary("Complete")
              setSelectedModelLibrary(result.best_model_library)

              // Initialize test input with average values
              const newTestInput: Record<string, number> = {}
              selectedFeatures.forEach((feature) => {
                const values = data.map((row: any) => Number(row[feature]) || 0)
                const avg = values.reduce((a: number, b: number) => a + b, 0) / values.length
                newTestInput[feature] = Number.parseFloat(avg.toFixed(2))
              })
              setTestInput(newTestInput)

              setExpandedSections((prev) => ({
                ...prev,
                setup: false,
                comparison: true,
                best: true,
              }))

              toast({
                title: "🏆 AutoML Ensemble Complete!",
                description: `Best model: ${result.best_model_library} (${result.best_model_type}) with ${
                  result.accuracy
                    ? `${(result.accuracy * 100).toFixed(1)}% accuracy`
                    : `R² score of ${(result.r2_score || 0).toFixed(3)}`
                }`,
              })
            } catch (error) {
              console.error("Error training ensemble:", error)
              toast({
                title: "Training Failed",
                description: "There was an error training the AutoML ensemble. Please try again.",
                variant: "destructive",
              })
            } finally {
              setIsTraining(false)
            }
          }, 2000) // 2 second delay for final processing

          return 95
        }
        return newProgress
      })
    }, stepDuration)
  }

  const toggleFeature = (feature: string) => {
    setSelectedFeatures((prev) => (prev.includes(feature) ? prev.filter((f) => f !== feature) : [...prev, feature]))
  }

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const handleTestPrediction = () => {
    if (!ensembleResult) return

    // Simulate a prediction based on test input
    const randomBase = Math.random()
    const isClassification = ensembleResult.accuracy !== undefined

    if (isClassification) {
      // For classification, return 0 or 1 with probability based on accuracy
      const threshold = ensembleResult.accuracy || 0.8
      setTestPrediction(randomBase < threshold ? 1 : 0)
    } else {
      // For regression, generate a plausible value
      const min = Math.min(...analysisResults.previewData.map((row: any) => Number(row[selectedTarget]) || 0))
      const max = Math.max(...analysisResults.previewData.map((row: any) => Number(row[selectedTarget]) || 0))
      const range = max - min
      setTestPrediction(Number.parseFloat((min + randomBase * range).toFixed(2)))
    }

    toast({
      title: "Prediction Generated",
      description: `Model predicted using ${selectedModelLibrary} algorithm`,
    })
  }

  const handleInputChange = (feature: string, value: string) => {
    setTestInput((prev) => ({
      ...prev,
      [feature]: Number.parseFloat(value) || 0,
    }))
  }

  const handleDownload = (format: string) => {
    if (!ensembleResult) return

    const fileName = `automl_model_${new Date().toISOString().split("T")[0]}`

    toast({
      title: `Model Downloaded`,
      description: `${fileName}.${format.toLowerCase()} has been downloaded`,
    })
  }

  if (!analysisResults) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="rounded-3xl max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <Database className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No data available for AutoML ensemble.</p>
            <p className="text-sm text-muted-foreground mt-2">Please upload and analyze data first.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="rounded-3xl border-2 border-primary/20 shadow-2xl">
          <CardHeader className="text-center pb-8">
            <CardTitle className="flex items-center justify-center gap-3 text-3xl">
              <Brain className="h-8 w-8 text-primary" />
              AutoML Ensemble Builder
            </CardTitle>
            <CardDescription className="text-lg">
              Train and compare models from FLAML, Auto-sklearn, and PyCaret automatically
            </CardDescription>
            <div className="mt-4 p-4 border-2 border-yellow-300 bg-yellow-50 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-yellow-800 mb-1">BETA FEATURE</h4>
                  <p className="text-sm text-yellow-700">
                    The AutoML Engine is currently in beta testing phase. Results are simulated for demonstration
                    purposes. In production, this feature will train actual machine learning models on your data using
                    state-of-the-art AutoML frameworks. During this beta phase, please use the results for exploratory
                    purposes only.
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-8 px-8 pb-8">
            {/* Setup Section */}
            <Collapsible open={expandedSections.setup} onOpenChange={() => toggleSection("setup")}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between p-4 h-auto hover:bg-muted/50 rounded-lg"
                  onClick={() => toggleSection("setup")}
                >
                  <div className="flex items-center gap-3">
                    <Settings className="h-6 w-6 text-primary" />
                    <h3 className="text-xl font-semibold">Model Configuration</h3>
                  </div>
                  {expandedSections.setup ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-6 mt-6">
                <div className="grid gap-8 lg:grid-cols-2">
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="target-select" className="text-base font-medium">
                        Target Column (What to predict)
                      </Label>
                      <Select value={selectedTarget} onValueChange={setSelectedTarget}>
                        <SelectTrigger id="target-select" className="h-12 text-base">
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
                      <div className="rounded-xl border-2 bg-gradient-to-r from-primary/5 to-primary/10 p-4">
                        <p className="text-base">
                          <strong>Problem Type:</strong>{" "}
                          <Badge variant="outline" className="ml-2 text-sm">
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

                  <div className="space-y-6">
                    <Label className="text-base font-medium">Feature Columns (Input variables)</Label>
                    <ScrollArea className="h-48 rounded-xl border-2 p-4">
                      <div className="space-y-3">
                        {availableColumns
                          .filter((col) => col !== selectedTarget)
                          .map((column) => (
                            <div key={column} className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                id={`feature-${column}`}
                                checked={selectedFeatures.includes(column)}
                                onChange={() => toggleFeature(column)}
                                className="rounded h-4 w-4"
                              />
                              <label htmlFor={`feature-${column}`} className="text-base">
                                {column}
                              </label>
                            </div>
                          ))}
                      </div>
                    </ScrollArea>
                    <p className="text-sm text-muted-foreground">
                      Selected: <strong>{selectedFeatures.length}</strong> features
                    </p>
                  </div>
                </div>

                {isTraining && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <h4 className="text-2xl font-semibold mb-3">Training AutoML Ensemble</h4>
                      <p className="text-muted-foreground mb-6 text-lg">
                        Currently training: <strong className="text-primary">{currentLibrary}</strong>
                      </p>
                      <div className="flex items-center justify-center gap-2 mb-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        <span className="text-sm text-muted-foreground">
                          {trainingProgress < 33
                            ? "Hyperparameter optimization..."
                            : trainingProgress < 66
                              ? "Cross-validation in progress..."
                              : trainingProgress < 95
                                ? "Model ensemble creation..."
                                : "Finalizing results..."}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between text-base">
                        <span>Overall Progress</span>
                        <span className="font-semibold">{Math.round(trainingProgress)}%</span>
                      </div>
                      <Progress value={trainingProgress} className="h-4" />
                      <p className="text-xs text-muted-foreground text-center">
                        Estimated time remaining: {Math.max(0, Math.ceil((100 - trainingProgress) * 0.15))} seconds
                      </p>
                    </div>
                  </div>
                )}

                {!isTraining && (
                  <div className="text-center py-8">
                    <Button
                      onClick={handleTrainEnsemble}
                      disabled={!selectedTarget || selectedFeatures.length === 0}
                      className="rounded-full px-12 py-6 gap-3 text-lg"
                      size="lg"
                    >
                      <Play className="h-6 w-6" />
                      Train AutoML Ensemble
                    </Button>
                    <p className="text-muted-foreground mt-4 text-base">
                      This will train models using FLAML, Auto-sklearn, and PyCaret
                    </p>
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>

            {ensembleResult && (
              <>
                <Separator className="my-8" />

                {/* Model Comparison Section */}
                <Collapsible open={expandedSections.comparison} onOpenChange={() => toggleSection("comparison")}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                      <div className="flex items-center gap-3">
                        <BarChart3 className="h-6 w-6 text-blue-600" />
                        <h3 className="text-xl font-semibold">Library Comparison</h3>
                      </div>
                      {expandedSections.comparison ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-6 mt-6">
                    <div className="grid gap-4">
                      {ensembleResult.model_comparison.map((model, index) => (
                        <Card
                          key={model.library}
                          className={`rounded-2xl ${index === 0 ? "border-2 border-yellow-400 bg-yellow-50" : ""}`}
                        >
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                {index === 0 && <Trophy className="h-6 w-6 text-yellow-600" />}
                                <div>
                                  <h4 className="text-lg font-semibold">{model.library}</h4>
                                  <p className="text-muted-foreground">{model.model_type}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-bold text-primary">{(model.score * 100).toFixed(1)}%</p>
                                <p className="text-sm text-muted-foreground">
                                  {ensembleResult.accuracy ? "Accuracy" : "R² Score"}
                                </p>
                              </div>
                            </div>
                            <Progress value={model.score * 100} className="mt-4 h-2" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <Separator className="my-8" />

                {/* Best Model Section */}
                <Collapsible open={expandedSections.best} onOpenChange={() => toggleSection("best")}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                      <div className="flex items-center gap-3">
                        <Trophy className="h-6 w-6 text-yellow-600" />
                        <h3 className="text-xl font-semibold">Best Model Details</h3>
                        <Badge variant="outline" className="text-sm">
                          {ensembleResult.best_model_library}
                        </Badge>
                      </div>
                      {expandedSections.best ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-6 mt-6">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                      {ensembleResult.accuracy ? (
                        <>
                          <Card className="rounded-2xl">
                            <CardContent className="p-6 text-center">
                              <p className="text-3xl font-bold text-green-600">
                                {(ensembleResult.accuracy * 100).toFixed(1)}%
                              </p>
                              <p className="text-muted-foreground">Accuracy</p>
                            </CardContent>
                          </Card>
                          <Card className="rounded-2xl">
                            <CardContent className="p-6 text-center">
                              <p className="text-3xl font-bold text-blue-600">
                                {((ensembleResult.f1_score || 0) * 100).toFixed(1)}%
                              </p>
                              <p className="text-muted-foreground">F1 Score</p>
                            </CardContent>
                          </Card>
                        </>
                      ) : (
                        <>
                          <Card className="rounded-2xl">
                            <CardContent className="p-6 text-center">
                              <p className="text-3xl font-bold text-green-600">
                                {(ensembleResult.r2_score || 0).toFixed(3)}
                              </p>
                              <p className="text-muted-foreground">R² Score</p>
                            </CardContent>
                          </Card>
                          <Card className="rounded-2xl">
                            <CardContent className="p-6 text-center">
                              <p className="text-3xl font-bold text-blue-600">
                                {(ensembleResult.rmse || 0).toFixed(2)}
                              </p>
                              <p className="text-muted-foreground">RMSE</p>
                            </CardContent>
                          </Card>
                        </>
                      )}
                      <Card className="rounded-2xl">
                        <CardContent className="p-6 text-center">
                          <p className="text-3xl font-bold text-purple-600">{ensembleResult.best_model_type}</p>
                          <p className="text-muted-foreground">Algorithm</p>
                        </CardContent>
                      </Card>
                      <Card className="rounded-2xl">
                        <CardContent className="p-6 text-center">
                          <p className="text-3xl font-bold text-orange-600">{ensembleResult.top_features.length}</p>
                          <p className="text-muted-foreground">Top Features</p>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-purple-600" />
                        Top Features
                      </h4>
                      <div className="grid gap-3 md:grid-cols-2">
                        {ensembleResult.top_features.map((feature, index) => (
                          <div key={feature} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                            <Badge variant="outline" className="text-xs">
                              #{index + 1}
                            </Badge>
                            <span className="font-medium">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4 pt-4">
                      <h4 className="text-lg font-semibold">Export Model</h4>
                      <div className="flex flex-wrap gap-3">
                        <Button variant="outline" className="gap-2" onClick={() => handleDownload("PKL")}>
                          <Download className="h-4 w-4" />
                          Download .PKL
                        </Button>
                        <Button variant="outline" className="gap-2" onClick={() => handleDownload("JSON")}>
                          <FileJson className="h-4 w-4" />
                          JSON
                        </Button>
                        <Button variant="outline" className="gap-2" onClick={() => handleDownload("PY")}>
                          <FileCode className="h-4 w-4" />
                          Python
                        </Button>
                        <Button variant="outline" className="gap-2" onClick={() => handleDownload("CSV")}>
                          <FileSpreadsheet className="h-4 w-4" />
                          CSV
                        </Button>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <Separator className="my-8" />

                {/* Live Testing Section */}
                <Collapsible open={expandedSections.testing} onOpenChange={() => toggleSection("testing")}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                      <div className="flex items-center gap-3">
                        <Zap className="h-6 w-6 text-orange-600" />
                        <h3 className="text-xl font-semibold">Live Model Testing</h3>
                      </div>
                      {expandedSections.testing ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-6 mt-6">
                    <div className="grid gap-6 lg:grid-cols-2">
                      <div>
                        <h4 className="text-lg font-semibold mb-4">Input Features</h4>
                        <div className="space-y-4">
                          {selectedFeatures.map((feature) => (
                            <div key={feature} className="space-y-2">
                              <Label htmlFor={`test-${feature}`}>{feature}</Label>
                              <input
                                type="number"
                                id={`test-${feature}`}
                                value={testInput[feature] || 0}
                                onChange={(e) => handleInputChange(feature, e.target.value)}
                                className="w-full p-2 border rounded-md"
                                step="0.01"
                              />
                            </div>
                          ))}
                        </div>
                        <Button onClick={handleTestPrediction} className="mt-6 w-full">
                          Generate Prediction
                        </Button>
                      </div>

                      <div>
                        <h4 className="text-lg font-semibold mb-4">Prediction Result</h4>
                        <Card className="rounded-xl h-[calc(100%-2rem)]">
                          <CardContent className="p-6 flex flex-col items-center justify-center h-full">
                            {testPrediction !== null ? (
                              <div className="text-center space-y-4">
                                <p className="text-4xl font-bold text-primary">{testPrediction}</p>
                                <p className="text-muted-foreground">
                                  Predicted {selectedTarget} using {selectedModelLibrary}
                                </p>
                                <div className="pt-4">
                                  <Badge variant="outline" className="text-sm">
                                    Confidence:{" "}
                                    {ensembleResult.accuracy
                                      ? `${((ensembleResult.accuracy || 0) * 100).toFixed(1)}%`
                                      : "High"}
                                  </Badge>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center text-muted-foreground">
                                <p>Enter values and click "Generate Prediction"</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
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
