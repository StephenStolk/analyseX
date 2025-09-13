"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  Download,
  FileText,
  Settings,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  BarChart3,
  LineChart,
  PieChart,
  ScatterChart,
  TrendingUp,
  Activity,
  Info,
  ArrowLeft,
  Sparkles,
} from "lucide-react"
import { defaultExportSections, PDFExporter, type ExportSection, type ExportOptions } from "@/lib/pdf-export-utils"
import { toast } from "@/components/ui/use-toast"

interface ChartOption {
  id: string
  name: string
  type: string
  description: string
  icon: any
  enabled: boolean
  category: string
  insights?: string[]
  dataPoints?: number
}

export default function ExportPage() {
  const router = useRouter()
  const [sections, setSections] = useState<ExportSection[]>(defaultExportSections)
  const [chartOptions, setChartOptions] = useState<ChartOption[]>([])
  const [fileName, setFileName] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [activeTab, setActiveTab] = useState("sections")
  const [analysisResults, setAnalysisResults] = useState<any>(null)
  const [advancedResults, setAdvancedResults] = useState<any>(null)
  const [customCharts, setCustomCharts] = useState<any[]>([])

  useEffect(() => {
    // Load analysis results from sessionStorage
    try {
      const resultsString = sessionStorage.getItem("analysisResults")
      const advancedString = sessionStorage.getItem("advancedAnalysisResults")
      const chartsString = sessionStorage.getItem("customCharts")

      if (!resultsString) {
        toast({
          title: "No Analysis Data",
          description: "Please complete an analysis first before exporting.",
          variant: "destructive",
        })
        router.push("/app/analysis")
        return
      }

      const results = JSON.parse(resultsString)
      setAnalysisResults(results)

      if (advancedString) {
        setAdvancedResults(JSON.parse(advancedString))
      }

      if (chartsString) {
        setCustomCharts(JSON.parse(chartsString))
      }

      if (results?.fileName) {
        const baseName = results.fileName.split(".")[0]
        setFileName(`${baseName}_comprehensive_report`)
      }

      // Initialize chart options
      initializeChartOptions(
        results,
        advancedString ? JSON.parse(advancedString) : null,
        chartsString ? JSON.parse(chartsString) : [],
      )
    } catch (error) {
      console.error("Error loading analysis data:", error)
      toast({
        title: "Error Loading Data",
        description: "Failed to load analysis results.",
        variant: "destructive",
      })
      router.push("/app/analysis")
    }
  }, [router])

  const initializeChartOptions = (analysisResults: any, advancedResults: any, customCharts: any[]) => {
    const availableCharts: ChartOption[] = []

    // Correlation charts
    if (analysisResults?.correlationMatrix?.labels?.length > 0) {
      const strongCorrelations = analysisResults.correlationMatrix.strongPairs?.length || 0
      availableCharts.push({
        id: "correlation-heatmap",
        name: "Correlation Heatmap",
        type: "heatmap",
        description: "Visual correlation matrix showing relationships between variables",
        icon: Activity,
        enabled: true,
        category: "Correlation",
        insights: [
          `Found ${strongCorrelations} strong correlations (>0.6)`,
          `Matrix size: ${analysisResults.correlationMatrix.labels.length}×${analysisResults.correlationMatrix.labels.length}`,
          strongCorrelations > 0
            ? "Strong relationships detected between key variables"
            : "No strong correlations found",
        ],
        dataPoints: analysisResults.correlationMatrix.labels.length,
      })
    }

    // Distribution charts
    if (analysisResults?.histograms?.length > 0) {
      analysisResults.histograms.slice(0, 8).forEach((hist: any, index: number) => {
        const isNormal = hist.skewness && Math.abs(hist.skewness) < 0.5
        const hasOutliers = hist.outliers && hist.outliers.length > 0

        availableCharts.push({
          id: `histogram-${index}`,
          name: `${hist.column} Distribution`,
          type: "histogram",
          description: `Distribution analysis of ${hist.column}`,
          icon: BarChart3,
          enabled: true,
          category: "Distributions",
          insights: [
            `Mean: ${hist.mean?.toFixed(2) || "N/A"}, Std Dev: ${hist.std?.toFixed(2) || "N/A"}`,
            `Range: ${hist.min?.toFixed(2) || "N/A"} to ${hist.max?.toFixed(2) || "N/A"}`,
            isNormal ? "Approximately normal distribution" : "Skewed distribution detected",
            hasOutliers ? `${hist.outliers?.length || 0} outliers identified` : "No significant outliers",
          ],
          dataPoints: hist.bins?.length || 0,
        })
      })
    }

    // Regression charts
    if (analysisResults?.regressionModels?.length > 0) {
      analysisResults.regressionModels.slice(0, 6).forEach((model: any, index: number) => {
        const rSquared = model.rSquared || 0
        const strength = rSquared > 0.7 ? "Strong" : rSquared > 0.4 ? "Moderate" : "Weak"

        availableCharts.push({
          id: `regression-${index}`,
          name: `${model.xColumn} vs ${model.yColumn}`,
          type: "scatter",
          description: `Regression analysis: ${model.xColumn} predicting ${model.yColumn}`,
          icon: ScatterChart,
          enabled: true,
          category: "Regression",
          insights: [
            `R² = ${rSquared.toFixed(3)} (${strength} relationship)`,
            `Slope: ${model.slope?.toFixed(3) || "N/A"}`,
            `${strength} linear relationship detected`,
            rSquared > 0.5 ? "Good predictive power" : "Limited predictive power",
          ],
          dataPoints: model.dataPoints || 0,
        })
      })
    }

    // Box plots for numeric columns
    if (analysisResults?.numericColumns?.length > 0) {
      analysisResults.numericColumns.slice(0, 6).forEach((column: string, index: number) => {
        const columnStats = analysisResults.columnStats?.find((stat: any) => stat.name === column)

        availableCharts.push({
          id: `boxplot-${index}`,
          name: `${column} Box Plot`,
          type: "boxplot",
          description: `Quartile analysis and outlier detection for ${column}`,
          icon: LineChart,
          enabled: false,
          category: "Distributions",
          insights: [
            `Median: ${columnStats?.median?.toFixed(2) || "N/A"}`,
            `IQR: ${columnStats?.q1?.toFixed(2) || "N/A"} - ${columnStats?.q3?.toFixed(2) || "N/A"}`,
            "Shows data spread and identifies outliers",
            "Useful for detecting data quality issues",
          ],
          dataPoints: columnStats?.count || 0,
        })
      })
    }

    // Custom charts from user
    if (customCharts?.length > 0) {
      customCharts.forEach((chart: any, index: number) => {
        availableCharts.push({
          id: `custom-${index}`,
          name: chart.title || `Custom Chart ${index + 1}`,
          type: chart.type || "custom",
          description: chart.description || `User-created ${chart.type} visualization`,
          icon: PieChart,
          enabled: true,
          category: "Custom",
          insights: [
            "User-defined visualization",
            `Chart type: ${chart.type || "Unknown"}`,
            "Custom analysis based on specific requirements",
            "Tailored to business needs",
          ],
          dataPoints: chart.data?.length || 0,
        })
      })
    }

    // Advanced analytics charts
    if (advancedResults) {
      availableCharts.push({
        id: "pca-variance",
        name: "PCA Variance Explained",
        type: "line",
        description: "Principal Component Analysis - Variance explanation",
        icon: TrendingUp,
        enabled: false,
        category: "Advanced",
        insights: [
          "Dimensionality reduction analysis",
          "Identifies most important data dimensions",
          "Helps reduce data complexity",
          "Useful for feature selection",
        ],
        dataPoints: analysisResults?.numericColumns?.length || 0,
      })

      availableCharts.push({
        id: "feature-importance",
        name: "Feature Importance",
        type: "bar",
        description: "Variable importance ranking in the dataset",
        icon: BarChart3,
        enabled: false,
        category: "Advanced",
        insights: [
          "Ranks variables by predictive power",
          "Identifies key drivers in the data",
          "Helps focus analysis efforts",
          "Supports feature selection decisions",
        ],
        dataPoints: analysisResults?.headers?.length || 0,
      })
    }

    setChartOptions(availableCharts)
  }

  const handleSectionToggle = (sectionId: string, enabled: boolean) => {
    setSections((prev) => prev.map((section) => (section.id === sectionId ? { ...section, enabled } : section)))
  }

  const handleSubsectionToggle = (sectionId: string, subsectionId: string, enabled: boolean) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              subsections: section.subsections?.map((sub) => (sub.id === subsectionId ? { ...sub, enabled } : sub)),
            }
          : section,
      ),
    )
  }

  const handleChartToggle = (chartId: string, enabled: boolean) => {
    setChartOptions((prev) => prev.map((chart) => (chart.id === chartId ? { ...chart, enabled } : chart)))
  }

  const handleSelectAllCharts = (category?: string) => {
    setChartOptions((prev) =>
      prev.map((chart) => ({
        ...chart,
        enabled: category ? chart.category === category : true,
      })),
    )
  }

  const handleDeselectAllCharts = () => {
    setChartOptions((prev) => prev.map((chart) => ({ ...chart, enabled: false })))
  }

  const handleSelectAll = (category?: string) => {
    setSections((prev) =>
      prev.map((section) => ({
        ...section,
        enabled: category ? section.category === category : true,
        subsections: section.subsections?.map((sub) => ({ ...sub, enabled: true })),
      })),
    )
  }

  const handleDeselectAll = () => {
    setSections((prev) =>
      prev.map((section) => ({
        ...section,
        enabled: false,
        subsections: section.subsections?.map((sub) => ({ ...sub, enabled: false })),
      })),
    )
  }

  const getSelectedCount = () => {
    return sections.filter((s) => s.enabled).length
  }

  const getSelectedChartsCount = () => {
    return chartOptions.filter((c) => c.enabled).length
  }

  const getEstimatedPages = () => {
    let pages = 3 // Cover + TOC + Summary
    sections.forEach((section) => {
      if (section.enabled) {
        pages += section.id === "summary" ? 3 : section.id === "advanced" ? 4 : 2
        if (section.subsections) {
          pages += section.subsections.filter((s) => s.enabled).length * 0.7
        }
      }
    })
    // Add pages for charts (roughly 1.2 charts per page with insights)
    pages += Math.ceil(getSelectedChartsCount() / 1.2)
    return Math.ceil(pages)
  }

  const handleExport = async () => {
    if (!fileName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a file name",
        variant: "destructive",
      })
      return
    }

    if (getSelectedCount() === 0 && getSelectedChartsCount() === 0) {
      toast({
        title: "Error",
        description: "Please select at least one section or chart to export",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    setProgress(0)

    try {
      const exportOptions: ExportOptions = {
        sections,
        includeCharts: true,
        includeRawData: true,
        format: "pdf",
        fileName: fileName.trim(),
      }

      const selectedCharts = chartOptions.filter((c) => c.enabled)
      const exporter = new PDFExporter()

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 5, 90))
      }, 500)

      await exporter.generatePDF(analysisResults, advancedResults, selectedCharts, exportOptions)

      clearInterval(progressInterval)
      setProgress(100)

      // Small delay to show completion
      setTimeout(() => {
        exporter.save(`${fileName}.pdf`)

        toast({
          title: "🎉 Export Complete!",
          description: `Your comprehensive analysis report has been downloaded as ${fileName}.pdf`,
        })

        setIsGenerating(false)
        setProgress(0)
      }, 800)
    } catch (error) {
      console.error("Export error:", error)
      setIsGenerating(false)
      setProgress(0)

      toast({
        title: "Export Failed",
        description: "There was an error generating your report. Please try again.",
        variant: "destructive",
      })
    }
  }

  const categories = [...new Set(sections.map((s) => s.category))]
  const chartCategories = [...new Set(chartOptions.map((c) => c.category))]

  if (!analysisResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading analysis data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Analysis
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Export Analysis Report</h1>
                  <p className="text-sm text-gray-600">Create a comprehensive PDF report with your analysis</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right text-sm">
                <div className="flex items-center gap-4 text-gray-600">
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <strong>{getEstimatedPages()}</strong> pages
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <strong>{getSelectedCount()}</strong> sections
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <strong>{getSelectedChartsCount()}</strong> charts
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-4 h-14 bg-white shadow-sm">
            <TabsTrigger value="sections" className="text-sm font-medium h-12">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Analysis Sections
              </div>
            </TabsTrigger>
            <TabsTrigger value="charts" className="text-sm font-medium h-12">
              <div className="flex items-center gap-2">
                <LineChart className="h-4 w-4" />
                Charts & Graphs
              </div>
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-sm font-medium h-12">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </div>
            </TabsTrigger>
            <TabsTrigger value="preview" className="text-sm font-medium h-12">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Preview
              </div>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sections" className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              {/* Action Bar */}
              <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-2">
                <div className="flex flex-wrap gap-3">
                  <Button onClick={() => handleSelectAll()} className="bg-green-600 hover:bg-green-700">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Select All Sections
                  </Button>
                  <Button variant="outline" onClick={handleDeselectAll}>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Deselect All
                  </Button>
                  <Separator orientation="vertical" className="h-8" />
                  {categories.map((category) => (
                    <Button key={category} variant="outline" onClick={() => handleSelectAll(category)}>
                      <Sparkles className="h-4 w-4 mr-2" />
                      {category}
                    </Button>
                  ))}
                </div>
              </Card>

              {/* Sections Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {sections.map((section, index) => (
                  <motion.div
                    key={section.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Card
                      className={`h-full border-2 transition-all duration-300 ${
                        section.enabled
                          ? "border-blue-300 bg-blue-50/50 shadow-lg"
                          : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                      }`}
                    >
                      <CardHeader className="pb-4">
                        <div className="flex items-start gap-4">
                          <Checkbox
                            checked={section.enabled}
                            onCheckedChange={(checked) => handleSectionToggle(section.id, checked as boolean)}
                            className="mt-1 h-5 w-5"
                          />
                          <div className="flex-1">
                            <CardTitle className="flex items-center gap-3 text-lg">
                              <span className="text-2xl">{section.icon}</span>
                              <div>
                                <div className="flex items-center gap-3">
                                  <span>
                                    {index + 1}. {section.name}
                                  </span>
                                  <Badge variant="secondary" className="text-xs">
                                    {section.category}
                                  </Badge>
                                </div>
                              </div>
                            </CardTitle>
                            <CardDescription className="mt-2 text-sm leading-relaxed">
                              {section.description}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>

                      {section.subsections && section.enabled && (
                        <CardContent className="pt-0">
                          <div className="space-y-3 p-4 bg-white rounded-lg border">
                            <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                              <Info className="h-4 w-4" />
                              Subsections ({section.subsections.length}):
                            </p>
                            <div className="space-y-3">
                              {section.subsections.map((subsection) => (
                                <div
                                  key={subsection.id}
                                  className="flex items-start gap-3 p-3 rounded-lg border bg-gray-50 hover:bg-gray-100 transition-colors"
                                >
                                  <Checkbox
                                    checked={subsection.enabled}
                                    onCheckedChange={(checked) =>
                                      handleSubsectionToggle(section.id, subsection.id, checked as boolean)
                                    }
                                    className="mt-0.5"
                                  />
                                  <div className="flex-1">
                                    <p className="text-sm font-medium">{subsection.name}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{subsection.description}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="charts" className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              {/* Chart Action Bar */}
              <Card className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-2">
                <div className="flex flex-wrap gap-3">
                  <Button onClick={() => handleSelectAllCharts()} className="bg-purple-600 hover:bg-purple-700">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Select All Charts
                  </Button>
                  <Button variant="outline" onClick={handleDeselectAllCharts}>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Deselect All
                  </Button>
                  <Separator orientation="vertical" className="h-8" />
                  {chartCategories.map((category) => (
                    <Button key={category} variant="outline" onClick={() => handleSelectAllCharts(category)}>
                      <BarChart3 className="h-4 w-4 mr-2" />
                      {category}
                    </Button>
                  ))}
                </div>
              </Card>

              {/* Charts by Category */}
              <div className="space-y-8">
                {chartCategories.map((category) => (
                  <motion.div
                    key={category}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-100 to-gray-50 rounded-xl">
                      <BarChart3 className="h-6 w-6 text-blue-600" />
                      <h3 className="text-xl font-bold text-gray-800">{category} Charts</h3>
                      <Badge variant="outline" className="ml-auto">
                        {chartOptions.filter((c) => c.category === category).length} available
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                      {chartOptions
                        .filter((chart) => chart.category === category)
                        .map((chart, index) => (
                          <motion.div
                            key={chart.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                          >
                            <Card
                              className={`h-full border-2 cursor-pointer transition-all duration-300 ${
                                chart.enabled
                                  ? "border-purple-300 bg-purple-50 shadow-lg"
                                  : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                              }`}
                              onClick={() => handleChartToggle(chart.id, !chart.enabled)}
                            >
                              <CardContent className="p-5">
                                <div className="flex items-start gap-4">
                                  <Checkbox
                                    checked={chart.enabled}
                                    onCheckedChange={(checked) => handleChartToggle(chart.id, checked as boolean)}
                                    className="mt-1 h-5 w-5"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                      <chart.icon className="h-5 w-5 text-purple-600" />
                                      <h4 className="font-semibold text-gray-800">{chart.name}</h4>
                                      <Badge variant="secondary" className="text-xs">
                                        {chart.type}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-4">{chart.description}</p>

                                    {chart.insights && (
                                      <div className="space-y-2">
                                        <p className="text-xs font-medium text-gray-700 flex items-center gap-1">
                                          <Sparkles className="h-3 w-3" />
                                          Key Insights:
                                        </p>
                                        {chart.insights.slice(0, 2).map((insight, idx) => (
                                          <p key={idx} className="text-xs text-gray-600 flex items-start gap-2">
                                            <span className="w-1 h-1 bg-purple-400 rounded-full mt-2 flex-shrink-0"></span>
                                            <span>{insight}</span>
                                          </p>
                                        ))}
                                        {chart.dataPoints && (
                                          <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
                                            <BarChart3 className="h-3 w-3" />
                                            {chart.dataPoints} data points
                                          </p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                    </div>
                  </motion.div>
                ))}

                {chartOptions.length === 0 && (
                  <Alert className="border-amber-200 bg-amber-50">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800">
                      No charts are available for export. Please create some visualizations first in the analysis tabs.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-2">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Export Configuration
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 p-6">
                    <div>
                      <Label htmlFor="fileName" className="text-base font-semibold">
                        📄 File Name
                      </Label>
                      <Input
                        id="fileName"
                        value={fileName}
                        onChange={(e) => setFileName(e.target.value)}
                        placeholder="Enter file name (without extension)"
                        className="mt-2 h-12"
                      />
                      <p className="text-sm text-muted-foreground mt-2 p-2 bg-gray-50 rounded">
                        💾 The file will be saved as{" "}
                        <span className="font-mono font-semibold">{fileName || "filename"}.pdf</span>
                      </p>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <Label className="text-base font-semibold">🎛️ Export Options</Label>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 p-3 border rounded-lg">
                          <Checkbox id="includeCharts" defaultChecked />
                          <Label htmlFor="includeCharts" className="text-sm font-medium">
                            📊 Include charts and visualizations (recommended)
                          </Label>
                        </div>
                        <div className="flex items-center gap-3 p-3 border rounded-lg">
                          <Checkbox id="includeRawData" defaultChecked />
                          <Label htmlFor="includeRawData" className="text-sm font-medium">
                            📋 Include raw data samples in tables
                          </Label>
                        </div>
                        <div className="flex items-center gap-3 p-3 border rounded-lg">
                          <Checkbox id="includeInsights" defaultChecked />
                          <Label htmlFor="includeInsights" className="text-sm font-medium">
                            💡 Include AI-generated insights and interpretations
                          </Label>
                        </div>
                        <div className="flex items-center gap-3 p-3 border rounded-lg">
                          <Checkbox id="highQuality" defaultChecked />
                          <Label htmlFor="highQuality" className="text-sm font-medium">
                            ⭐ High-quality rendering (larger file size)
                          </Label>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
                    <CardTitle className="flex items-center gap-2">
                      <Info className="h-5 w-5" />
                      Report Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{getEstimatedPages()}</div>
                          <div className="text-sm text-blue-800">Pages</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">{getSelectedCount()}</div>
                          <div className="text-sm text-green-800">Sections</div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">{getSelectedChartsCount()}</div>
                          <div className="text-sm text-purple-800">Charts</div>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-3">
                        <Label className="text-base font-semibold">🎨 Report Quality</Label>
                        <div className="grid grid-cols-3 gap-3">
                          <Button variant="outline" size="sm" className="h-12 bg-transparent">
                            📄 Standard
                          </Button>
                          <Button variant="default" size="sm" className="h-12">
                            ⭐ High Quality
                          </Button>
                          <Button variant="outline" size="sm" className="h-12 bg-transparent">
                            🖨️ Print Ready
                          </Button>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Dataset Information:</Label>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>📄 File: {analysisResults?.fileName || "Unknown"}</p>
                          <p>📊 Records: {(analysisResults?.data?.length || 0).toLocaleString()}</p>
                          <p>📋 Columns: {analysisResults?.headers?.length || 0}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <Card className="border-2">
                <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Export Preview
                  </CardTitle>
                  <CardDescription>Preview of what will be included in your comprehensive PDF report</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center p-6 bg-blue-50 rounded-xl border-2 border-blue-200">
                        <div className="text-3xl font-bold text-blue-600">{getEstimatedPages()}</div>
                        <div className="text-sm text-blue-800 font-medium">Estimated Pages</div>
                      </div>
                      <div className="text-center p-6 bg-green-50 rounded-xl border-2 border-green-200">
                        <div className="text-3xl font-bold text-green-600">{getSelectedCount()}</div>
                        <div className="text-sm text-green-800 font-medium">Analysis Sections</div>
                      </div>
                      <div className="text-center p-6 bg-purple-50 rounded-xl border-2 border-purple-200">
                        <div className="text-3xl font-bold text-purple-600">{getSelectedChartsCount()}</div>
                        <div className="text-sm text-purple-800 font-medium">Charts & Graphs</div>
                      </div>
                      <div className="text-center p-6 bg-orange-50 rounded-xl border-2 border-orange-200">
                        <div className="text-3xl font-bold text-orange-600">
                          {Math.round((analysisResults?.data?.length || 0) / 1000)}K
                        </div>
                        <div className="text-sm text-orange-800 font-medium">Data Points</div>
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-semibold text-lg flex items-center gap-2">✅ Included Sections:</h4>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {sections
                            .filter((s) => s.enabled)
                            .map((section, index) => (
                              <div
                                key={section.id}
                                className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200"
                              >
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <span className="text-sm font-medium">
                                  {index + 1}. {section.icon} {section.name}
                                </span>
                                {section.subsections && (
                                  <Badge variant="outline" className="ml-auto">
                                    {section.subsections.filter((s) => s.enabled).length} subsections
                                  </Badge>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-semibold text-lg flex items-center gap-2">📊 Included Charts:</h4>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {chartOptions
                            .filter((c) => c.enabled)
                            .map((chart) => (
                              <div
                                key={chart.id}
                                className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg border border-purple-200"
                              >
                                <chart.icon className="h-5 w-5 text-purple-600" />
                                <div className="flex-1">
                                  <span className="text-sm font-medium">{chart.name}</span>
                                  <p className="text-xs text-gray-600">{chart.description}</p>
                                </div>
                                <Badge variant="outline" className="ml-auto">
                                  {chart.category}
                                </Badge>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>

                    {sections.filter((s) => !s.enabled).length > 0 && (
                      <>
                        <Separator />
                        <div className="space-y-4">
                          <h4 className="font-semibold text-lg text-muted-foreground flex items-center gap-2">
                            ❌ Excluded Sections:
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {sections
                              .filter((s) => !s.enabled)
                              .map((section) => (
                                <div
                                  key={section.id}
                                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                                >
                                  <EyeOff className="h-4 w-4 text-gray-400" />
                                  <span className="text-sm text-muted-foreground">
                                    {section.icon} {section.name}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          {isGenerating && (
            <div className="space-y-3 mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <span className="text-sm font-medium">🔄 Generating comprehensive PDF report...</span>
              </div>
              <Progress value={progress} className="w-full h-2" />
              <p className="text-xs text-blue-700">
                {progress < 15 && "📋 Preparing sections and structure..."}
                {progress >= 15 && progress < 30 && "📊 Processing data and statistics..."}
                {progress >= 30 && progress < 50 && "📈 Generating charts and visualizations..."}
                {progress >= 50 && progress < 70 && "💡 Adding insights and interpretations..."}
                {progress >= 70 && progress < 90 && "🎨 Formatting and styling PDF..."}
                {progress >= 90 && "✅ Finalizing report..."}
              </p>
            </div>
          )}

          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground bg-gray-50 px-4 py-2 rounded-lg">
              📊 {getSelectedCount()} sections • 📈 {getSelectedChartsCount()} charts • 📄 ~{getEstimatedPages()} pages
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => router.back()}
                disabled={isGenerating}
                size="lg"
                className="h-12"
              >
                ❌ Cancel
              </Button>
              <Button
                onClick={handleExport}
                disabled={isGenerating || (getSelectedCount() === 0 && getSelectedChartsCount() === 0)}
                size="lg"
                className="min-w-[180px] h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />🚀 Export PDF Report
                  </>
                )}
              </Button>
            </div>
          </div>

          {getSelectedCount() === 0 && getSelectedChartsCount() === 0 && (
            <Alert className="mt-4 border-amber-200 bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                ⚠️ Please select at least one section or chart to export.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      {/* Bottom padding to account for fixed bar */}
      <div className="h-32"></div>
    </div>
  )
}
