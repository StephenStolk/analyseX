"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
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
} from "lucide-react"
import {
  defaultExportSections,
  EnhancedPDFExporter,
  type ExportSection,
  type ExportOptions,
} from "@/lib/enhanced-pdf-export-utils"
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

interface ExportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  analysisResults: any
  advancedResults: any
  customCharts: any[]
}

export function ExportModal({ open, onOpenChange, analysisResults, advancedResults, customCharts }: ExportModalProps) {
  const [sections, setSections] = useState<ExportSection[]>(defaultExportSections)
  const [chartOptions, setChartOptions] = useState<ChartOption[]>([])
  const [fileName, setFileName] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [activeTab, setActiveTab] = useState("sections")

  useEffect(() => {
    if (analysisResults?.fileName) {
      const baseName = analysisResults.fileName.split(".")[0]
      setFileName(`${baseName}_enhanced_analysis_report`)
    }

    // Initialize available charts based on analysis results
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
      analysisResults.histograms.slice(0, 6).forEach((hist: any, index: number) => {
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
      analysisResults.regressionModels.slice(0, 4).forEach((model: any, index: number) => {
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
      analysisResults.numericColumns.slice(0, 4).forEach((column: string, index: number) => {
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
  }, [analysisResults, advancedResults, customCharts])

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
    let pages = 2 // Cover + TOC
    sections.forEach((section) => {
      if (section.enabled) {
        pages += section.id === "summary" ? 2 : section.id === "advanced" ? 3 : 1
        if (section.subsections) {
          pages += section.subsections.filter((s) => s.enabled).length * 0.5
        }
      }
    })
    // Add pages for charts (roughly 1.5 charts per page with insights)
    pages += Math.ceil(getSelectedChartsCount() / 1.5)
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
      const exporter = new EnhancedPDFExporter()

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 6, 90))
      }, 400)

      await exporter.generatePDF(analysisResults, advancedResults, selectedCharts, exportOptions)

      clearInterval(progressInterval)
      setProgress(100)

      // Small delay to show completion
      setTimeout(() => {
        exporter.save(`${fileName}.pdf`)

        toast({
          title: "Export Complete!",
          description: `Your enhanced analysis report has been downloaded as ${fileName}.pdf`,
        })

        setIsGenerating(false)
        setProgress(0)
        onOpenChange(false)
      }, 500)
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-[95vh] flex flex-col p-0">
        {/* Fixed Header */}
        <div className="p-6 pb-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-2xl">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              Export Enhanced Analysis Report
            </DialogTitle>
            <DialogDescription className="text-base mt-2">
              Create a comprehensive PDF report with real data visualizations and enhanced formatting.
              <div className="flex gap-6 mt-2 text-sm">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <strong>{getEstimatedPages()}</strong> estimated pages
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <strong>{getSelectedCount()}</strong> sections selected
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <strong>{getSelectedChartsCount()}</strong> charts selected
                </span>
              </div>
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Tabs and Content - Scrollable */}
        <div className="flex-1 flex flex-col min-h-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="px-6 pt-4 bg-white border-b">
              <TabsList className="grid w-full grid-cols-4 h-12">
                <TabsTrigger value="sections" className="text-sm font-medium">
                  📊 Analysis Sections
                </TabsTrigger>
                <TabsTrigger value="charts" className="text-sm font-medium">
                  📈 Charts & Graphs
                </TabsTrigger>
                <TabsTrigger value="settings" className="text-sm font-medium">
                  ⚙️ Settings
                </TabsTrigger>
                <TabsTrigger value="preview" className="text-sm font-medium">
                  👁️ Preview
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 min-h-0 px-6 py-4">
              <TabsContent value="sections" className="h-full mt-0">
                <div className="flex flex-col h-full">
                  <div className="flex gap-2 mb-6 flex-wrap p-4 bg-gray-50 rounded-lg">
                    <Button variant="default" size="sm" onClick={() => handleSelectAll()}>
                      ✅ Select All
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDeselectAll}>
                      ❌ Deselect All
                    </Button>
                    <Separator orientation="vertical" className="h-6" />
                    {categories.map((category) => (
                      <Button key={category} variant="outline" size="sm" onClick={() => handleSelectAll(category)}>
                        📋 {category}
                      </Button>
                    ))}
                  </div>

                  <ScrollArea className="flex-1">
                    <div className="space-y-4 pr-4 pb-4">
                      {sections.map((section, index) => (
                        <Card
                          key={section.id}
                          className={`border-2 transition-all ${section.enabled ? "border-blue-200 bg-blue-50/30" : "border-gray-200"}`}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
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
                                      <div className="flex items-center gap-2">
                                        {index + 1}. {section.name}
                                        <Badge variant="secondary" className="text-xs">
                                          {section.category}
                                        </Badge>
                                      </div>
                                    </div>
                                  </CardTitle>
                                  <CardDescription className="mt-2 text-sm">{section.description}</CardDescription>
                                </div>
                              </div>
                            </div>
                          </CardHeader>

                          {section.subsections && section.enabled && (
                            <CardContent className="pt-0">
                              <div className="ml-9 space-y-3 p-4 bg-white rounded-lg border">
                                <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                  <Info className="h-4 w-4" />
                                  Subsections:
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {section.subsections.map((subsection) => (
                                    <div
                                      key={subsection.id}
                                      className="flex items-start gap-3 p-3 rounded-lg border bg-gray-50"
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
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </TabsContent>

              <TabsContent value="charts" className="h-full mt-0">
                <div className="flex flex-col h-full">
                  <div className="flex gap-2 mb-6 flex-wrap p-4 bg-gray-50 rounded-lg">
                    <Button variant="default" size="sm" onClick={() => handleSelectAllCharts()}>
                      📊 Select All Charts
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDeselectAllCharts}>
                      🚫 Deselect All
                    </Button>
                    <Separator orientation="vertical" className="h-6" />
                    {chartCategories.map((category) => (
                      <Button
                        key={category}
                        variant="outline"
                        size="sm"
                        onClick={() => handleSelectAllCharts(category)}
                      >
                        📈 {category}
                      </Button>
                    ))}
                  </div>

                  <ScrollArea className="flex-1">
                    <div className="space-y-8 pr-4 pb-4">
                      {chartCategories.map((category) => (
                        <div key={category} className="space-y-4">
                          <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-gray-100 to-gray-50 rounded-lg">
                            <BarChart3 className="h-6 w-6 text-blue-600" />
                            <h3 className="text-xl font-bold text-gray-800">{category} Charts</h3>
                            <Badge variant="outline" className="ml-auto">
                              {chartOptions.filter((c) => c.category === category).length} available
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {chartOptions
                              .filter((chart) => chart.category === category)
                              .map((chart) => (
                                <Card
                                  key={chart.id}
                                  className={`border-2 cursor-pointer transition-all hover:shadow-md ${
                                    chart.enabled
                                      ? "border-blue-300 bg-blue-50 shadow-sm"
                                      : "border-gray-200 hover:border-gray-300"
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
                                        <div className="flex items-center gap-3 mb-2">
                                          <chart.icon className="h-5 w-5 text-blue-600" />
                                          <h4 className="font-semibold text-gray-800">{chart.name}</h4>
                                          <Badge variant="secondary" className="text-xs">
                                            {chart.type}
                                          </Badge>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-3">{chart.description}</p>

                                        {chart.insights && (
                                          <div className="space-y-1">
                                            <p className="text-xs font-medium text-gray-700">Key Insights:</p>
                                            {chart.insights.slice(0, 2).map((insight, idx) => (
                                              <p key={idx} className="text-xs text-gray-600 flex items-center gap-1">
                                                <span className="w-1 h-1 bg-blue-400 rounded-full"></span>
                                                {insight}
                                              </p>
                                            ))}
                                            {chart.dataPoints && (
                                              <p className="text-xs text-gray-500 mt-2">
                                                📊 {chart.dataPoints} data points
                                              </p>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                          </div>
                        </div>
                      ))}

                      {chartOptions.length === 0 && (
                        <Alert className="border-amber-200 bg-amber-50">
                          <AlertCircle className="h-4 w-4 text-amber-600" />
                          <AlertDescription className="text-amber-800">
                            No charts are available for export. Please create some visualizations first in the analysis
                            tabs.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </TabsContent>

              <TabsContent value="settings" className="h-full mt-0">
                <ScrollArea className="h-full">
                  <div className="space-y-6 pr-4 pb-4">
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
                          <div className="grid grid-cols-1 gap-4">
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
                      </CardContent>
                    </Card>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="preview" className="h-full mt-0">
                <ScrollArea className="h-full">
                  <div className="space-y-6 pr-4 pb-4">
                    <Card className="border-2">
                      <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
                        <CardTitle className="flex items-center gap-2">
                          <Eye className="h-5 w-5" />
                          Export Preview
                        </CardTitle>
                        <CardDescription>Preview of what will be included in your PDF report</CardDescription>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="space-y-6">
                          <div className="grid grid-cols-3 gap-4">
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
                          </div>

                          <Separator />

                          <div className="space-y-4">
                            <h4 className="font-semibold text-lg flex items-center gap-2">✅ Included Sections:</h4>
                            <div className="grid grid-cols-1 gap-3">
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

                          <Separator />

                          <div className="space-y-4">
                            <h4 className="font-semibold text-lg flex items-center gap-2">📊 Included Charts:</h4>
                            <div className="grid grid-cols-1 gap-3">
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

                          {sections.filter((s) => !s.enabled).length > 0 && (
                            <>
                              <Separator />
                              <div className="space-y-4">
                                <h4 className="font-semibold text-lg text-muted-foreground flex items-center gap-2">
                                  ❌ Excluded Sections:
                                </h4>
                                <div className="grid grid-cols-1 gap-3">
                                  {sections
                                    .filter((s) => !s.enabled)
                                    .map((section) => (
                                      <div
                                        key={section.id}
                                        className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200"
                                      >
                                        <EyeOff className="h-5 w-5 text-gray-400" />
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
                  </div>
                </ScrollArea>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Fixed Footer */}
        <div className="border-t bg-white p-6">
          {isGenerating && (
            <div className="space-y-3 mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <span className="text-sm font-medium">
                  🔄 Generating enhanced PDF report with real data visualizations...
                </span>
              </div>
              <Progress value={progress} className="w-full h-2" />
              <p className="text-xs text-blue-700">
                {progress < 15 && "📋 Preparing sections and structure..."}
                {progress >= 15 && progress < 30 && "📊 Processing data and statistics..."}
                {progress >= 30 && progress < 50 && "📈 Generating real charts and visualizations..."}
                {progress >= 50 && progress < 70 && "💡 Adding insights and interpretations..."}
                {progress >= 70 && progress < 90 && "🎨 Formatting and styling PDF..."}
                {progress >= 90 && "✅ Finalizing enhanced report..."}
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
                onClick={() => onOpenChange(false)}
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
                className="min-w-[160px] h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />🚀 Export Enhanced PDF
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
      </DialogContent>
    </Dialog>
  )
}
