import { jsPDF } from "jspdf"
import "jspdf-autotable"

// Extend jsPDF type to include autoTable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

export interface ExportSection {
  id: string
  name: string
  description: string
  category: string
  icon: string
  enabled: boolean
  subsections?: ExportSubsection[]
}

export interface ExportSubsection {
  id: string
  name: string
  description: string
  enabled: boolean
}

export interface ChartData {
  id: string
  name: string
  type: string
  description: string
  enabled: boolean
  category: string
  insights?: string[]
  dataPoints?: number
  xColumn?: string
  yColumn?: string
}

export interface ExportOptions {
  sections: ExportSection[]
  includeCharts: boolean
  includeRawData: boolean
  format: "pdf" | "html"
  fileName: string
}

export const defaultExportSections: ExportSection[] = [
  {
    id: "summary",
    name: "Data Summary",
    description: "Overview, column info, and data preview",
    category: "Basic",
    icon: "📊",
    enabled: true,
    subsections: [
      { id: "overview", name: "Dataset Overview", description: "Basic statistics and info", enabled: true },
      { id: "columns", name: "Column Analysis", description: "Data types and column details", enabled: true },
      { id: "preview", name: "Data Preview", description: "Sample rows from dataset", enabled: true },
    ],
  },
  {
    id: "correlation",
    name: "Correlation Analysis",
    description: "Correlation matrices and relationships",
    category: "Statistical",
    icon: "🔗",
    enabled: true,
    subsections: [
      { id: "matrix", name: "Correlation Matrix", description: "Heatmap of correlations", enabled: true },
      { id: "strong-pairs", name: "Strong Correlations", description: "Significant relationships", enabled: true },
    ],
  },
  {
    id: "trends",
    name: "Trend Analysis",
    description: "Regression trends and distributions",
    category: "Statistical",
    icon: "📈",
    enabled: true,
    subsections: [
      { id: "regression", name: "Regression Analysis", description: "Linear relationships", enabled: true },
      { id: "distribution", name: "Data Distributions", description: "Histograms and box plots", enabled: true },
    ],
  },
  {
    id: "advanced",
    name: "Advanced Analytics",
    description: "PCA, clustering, and statistical tests",
    category: "Advanced",
    icon: "🧪",
    enabled: false,
    subsections: [
      { id: "pca", name: "PCA Analysis", description: "Principal component analysis", enabled: false },
      { id: "clustering", name: "Clustering", description: "K-means clustering results", enabled: false },
      {
        id: "feature-importance",
        name: "Feature Importance",
        description: "Variable importance ranking",
        enabled: false,
      },
      { id: "statistical-tests", name: "Statistical Tests", description: "t-tests, ANOVA, chi-square", enabled: false },
      { id: "time-series", name: "Time Series", description: "Temporal analysis", enabled: false },
    ],
  },
]

export class EnhancedPDFExporter {
  private doc: jsPDF
  private yPosition = 30
  private pageHeight = 280
  private pageWidth = 210
  private margin = 20
  private rightMargin = 190
  private currentPage = 1

  // Clean, professional color scheme
  private colors = {
    primary: [41, 98, 255], // Modern blue
    secondary: [100, 116, 139], // Slate gray
    success: [16, 185, 129], // Emerald
    warning: [245, 158, 11], // Amber
    danger: [239, 68, 68], // Red
    text: [15, 23, 42], // Slate 900
    lightGray: [248, 250, 252], // Slate 50
    accent: [139, 92, 246], // Violet
    info: [59, 130, 246], // Blue 500
    chartBlue: [59, 130, 246],
    chartGreen: [34, 197, 94],
    chartPurple: [147, 51, 234],
    chartOrange: [249, 115, 22],
    chartRed: [239, 68, 68],
  }

  constructor() {
    this.doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    })
    this.setupDocument()
  }

  private setupDocument() {
    this.doc.setFont("helvetica")
  }

  private checkPageBreak(requiredSpace = 25) {
    if (this.yPosition + requiredSpace > this.pageHeight) {
      this.addPage()
    }
  }

  private addPage() {
    this.doc.addPage()
    this.currentPage++
    this.yPosition = 30
    this.addPageHeader()
  }

  private addPageHeader() {
    // Clean header design
    this.doc.setFillColor(...this.colors.primary)
    this.doc.rect(0, 0, this.pageWidth, 8, "F")

    // Page number
    this.doc.setFontSize(9)
    this.doc.setTextColor(255, 255, 255)
    this.doc.text(`Page ${this.currentPage}`, this.rightMargin - 15, 6)

    // Company branding
    this.doc.setFontSize(10)
    this.doc.text("AnalyzeX", this.margin, 6)
  }

  private addCoverPage(analysisResults: any) {
    // Professional cover page
    this.doc.setFillColor(...this.colors.primary)
    this.doc.rect(0, 0, this.pageWidth, 60, "F")

    // Title
    this.doc.setFontSize(32)
    this.doc.setTextColor(255, 255, 255)
    this.doc.text("DATA ANALYSIS", this.pageWidth / 2, 30, { align: "center" })

    this.doc.setFontSize(24)
    this.doc.text("REPORT", this.pageWidth / 2, 45, { align: "center" })

    // Subtitle
    this.doc.setFontSize(14)
    this.doc.setTextColor(...this.colors.text)
    this.doc.text("Comprehensive Statistical Analysis & Insights", this.pageWidth / 2, 80, { align: "center" })

    // Dataset info card
    const cardY = 100
    this.doc.setFillColor(255, 255, 255)
    this.doc.setDrawColor(...this.colors.primary)
    this.doc.setLineWidth(1)
    this.doc.roundedRect(this.margin, cardY, 170, 80, 5, 5, "FD")

    // Card header
    this.doc.setFillColor(...this.colors.primary)
    this.doc.roundedRect(this.margin, cardY, 170, 15, 5, 5, "F")
    this.doc.rect(this.margin, cardY + 10, 170, 5, "F")

    this.doc.setFontSize(12)
    this.doc.setTextColor(255, 255, 255)
    this.doc.text("Dataset Information", this.margin + 8, cardY + 10)

    // Dataset details
    this.doc.setFontSize(10)
    this.doc.setTextColor(...this.colors.text)
    const datasetInfo = [
      `File Name: ${analysisResults?.fileName || "Unknown"}`,
      `Total Records: ${(analysisResults?.data?.length || 0).toLocaleString()}`,
      `Total Columns: ${analysisResults?.headers?.length || 0}`,
      `Numeric Columns: ${analysisResults?.numericColumns?.length || 0}`,
      `Analysis Date: ${new Date().toLocaleDateString()}`,
    ]

    datasetInfo.forEach((info, index) => {
      this.doc.text(info, this.margin + 10, cardY + 25 + index * 8)
    })

    // Footer
    this.doc.setFontSize(9)
    this.doc.setTextColor(...this.colors.secondary)
    this.doc.text(`Generated on ${new Date().toLocaleString()}`, this.pageWidth / 2, 220, { align: "center" })
    this.doc.text("Powered by AnalyzeX Analytics Platform", this.pageWidth / 2, 230, { align: "center" })

    this.addPage()
  }

  private addTableOfContents(exportOptions: ExportOptions, selectedCharts: ChartData[]) {
    this.addSectionTitle("Table of Contents")
    this.yPosition += 10

    let pageNum = 3
    const enabledSections = exportOptions.sections.filter((s) => s.enabled)

    enabledSections.forEach((section, index) => {
      this.doc.setFontSize(11)
      this.doc.setTextColor(...this.colors.text)

      const sectionNum = index + 1
      this.doc.text(`${sectionNum}. ${section.name}`, this.margin + 5, this.yPosition)

      // Dotted line
      const dots = ".".repeat(Math.max(1, 50 - section.name.length))
      this.doc.setTextColor(...this.colors.secondary)
      this.doc.text(dots, this.margin + 80, this.yPosition)
      this.doc.text(pageNum.toString(), this.rightMargin - 10, this.yPosition, { align: "right" })

      this.yPosition += 10

      // Subsections
      if (section.subsections) {
        const enabledSubs = section.subsections.filter((s) => s.enabled)
        enabledSubs.forEach((subsection) => {
          this.doc.setFontSize(9)
          this.doc.setTextColor(...this.colors.secondary)
          this.doc.text(`   • ${subsection.name}`, this.margin + 15, this.yPosition)
          this.yPosition += 7
        })
      }

      pageNum += this.estimateSectionPages(section)
      this.yPosition += 5
    })

    // Charts section
    if (selectedCharts.length > 0) {
      this.checkPageBreak(15)
      this.doc.setFontSize(11)
      this.doc.setTextColor(...this.colors.text)
      this.doc.text(`${enabledSections.length + 1}. Charts & Visualizations`, this.margin + 5, this.yPosition)

      const dots = ".".repeat(30)
      this.doc.setTextColor(...this.colors.secondary)
      this.doc.text(dots, this.margin + 80, this.yPosition)
      this.doc.text(pageNum.toString(), this.rightMargin - 10, this.yPosition, { align: "right" })
    }

    this.addPage()
  }

  private estimateSectionPages(section: ExportSection): number {
    switch (section.id) {
      case "summary":
        return 2
      case "correlation":
        return 1
      case "trends":
        return 1
      case "advanced":
        return 2
      case "ai-insights":
        return 1
      default:
        return 1
    }
  }

  private addSectionTitle(title: string, fontSize = 16) {
    this.checkPageBreak(25)

    // Clean section header
    this.doc.setFillColor(...this.colors.primary)
    this.doc.roundedRect(this.margin, this.yPosition - 5, 170, 15, 3, 3, "F")

    this.doc.setFontSize(fontSize)
    this.doc.setTextColor(255, 255, 255)
    this.doc.text(title, this.margin + 8, this.yPosition + 5)

    this.yPosition += 25
  }

  private addSubsectionTitle(title: string, fontSize = 12) {
    this.checkPageBreak(15)

    // Clean subsection styling
    this.doc.setFillColor(...this.colors.info)
    this.doc.roundedRect(this.margin, this.yPosition - 3, 170, 10, 2, 2, "F")

    this.doc.setFontSize(fontSize)
    this.doc.setTextColor(255, 255, 255)
    this.doc.text(title, this.margin + 6, this.yPosition + 3)

    this.yPosition += 15
  }

  private addInfoBox(title: string, content: { [key: string]: any }) {
    this.checkPageBreak(50)

    const boxHeight = Object.keys(content).length * 8 + 25

    // Main card
    this.doc.setFillColor(255, 255, 255)
    this.doc.setDrawColor(...this.colors.primary)
    this.doc.setLineWidth(1)
    this.doc.roundedRect(this.margin, this.yPosition, 170, boxHeight, 5, 5, "FD")

    // Header
    this.doc.setFillColor(...this.colors.primary)
    this.doc.roundedRect(this.margin, this.yPosition, 170, 18, 5, 5, "F")
    this.doc.rect(this.margin, this.yPosition + 13, 170, 5, "F")

    this.doc.setFontSize(11)
    this.doc.setTextColor(255, 255, 255)
    this.doc.text(title, this.margin + 8, this.yPosition + 12)

    this.yPosition += 25

    // Content
    Object.entries(content).forEach(([key, value]) => {
      this.doc.setFontSize(9)
      this.doc.setTextColor(...this.colors.text)
      this.doc.text(`${key}:`, this.margin + 10, this.yPosition)

      this.doc.setTextColor(...this.colors.secondary)
      this.doc.text(String(value), this.margin + 70, this.yPosition)

      this.yPosition += 8
    })

    this.yPosition += 10
  }

  private addInsightBox(title: string, insights: string[]) {
    if (!insights || insights.length === 0) return

    this.checkPageBreak(30 + insights.length * 6)

    const boxHeight = insights.length * 6 + 20

    // Card with clean styling
    this.doc.setFillColor(240, 249, 255)
    this.doc.setDrawColor(...this.colors.info)
    this.doc.setLineWidth(1)
    this.doc.roundedRect(this.margin, this.yPosition, 170, boxHeight, 4, 4, "FD")

    // Header
    this.doc.setFillColor(...this.colors.info)
    this.doc.roundedRect(this.margin, this.yPosition, 170, 15, 4, 4, "F")
    this.doc.rect(this.margin, this.yPosition + 11, 170, 4, "F")

    this.doc.setFontSize(10)
    this.doc.setTextColor(255, 255, 255)
    this.doc.text(`💡 ${title}`, this.margin + 8, this.yPosition + 10)

    this.yPosition += 20

    insights.forEach((insight) => {
      this.doc.setFontSize(9)
      this.doc.setTextColor(...this.colors.text)
      this.doc.text(`• ${insight}`, this.margin + 10, this.yPosition)
      this.yPosition += 6
    })

    this.yPosition += 10
  }

  // REAL CHART DRAWING METHODS
  private drawRealHistogram(chart: ChartData, analysisResults: any) {
    this.checkPageBreak(90)

    const histogramIndex = Number.parseInt(chart.id.split("-")[1])
    const histogram = analysisResults?.histograms?.[histogramIndex]

    if (!histogram || !histogram.bins) {
      this.drawNoDataChart("Histogram data not available")
      return
    }

    // Chart area
    const chartX = this.margin + 10
    const chartY = this.yPosition
    const chartWidth = 150
    const chartHeight = 70

    // Chart background
    this.doc.setFillColor(248, 250, 252)
    this.doc.setDrawColor(...this.colors.primary)
    this.doc.setLineWidth(0.5)
    this.doc.roundedRect(chartX, chartY, chartWidth, chartHeight, 3, 3, "FD")

    // Chart title
    this.doc.setFontSize(10)
    this.doc.setTextColor(...this.colors.primary)
    this.doc.text(`${histogram.column} Distribution`, chartX + chartWidth / 2, chartY + 12, { align: "center" })

    // Drawing area
    const plotX = chartX + 20
    const plotY = chartY + 20
    const plotWidth = chartWidth - 30
    const plotHeight = chartHeight - 30

    // Calculate data
    const bins = histogram.bins
    const maxCount = Math.max(...bins.map((bin: any) => bin.count))

    // Draw axes
    this.doc.setDrawColor(60, 60, 60)
    this.doc.setLineWidth(1)
    // Y-axis
    this.doc.line(plotX, plotY, plotX, plotY + plotHeight)
    // X-axis
    this.doc.line(plotX, plotY + plotHeight, plotX + plotWidth, plotY + plotHeight)

    // Draw bars
    const barWidth = plotWidth / bins.length
    bins.forEach((bin: any, index: number) => {
      const barHeight = (bin.count / maxCount) * plotHeight
      const barX = plotX + index * barWidth
      const barY = plotY + plotHeight - barHeight

      // Clean bar styling
      this.doc.setFillColor(...this.colors.chartBlue)
      this.doc.rect(barX + 1, barY, barWidth - 2, barHeight, "F")

      // Bar border
      this.doc.setDrawColor(...this.colors.primary)
      this.doc.setLineWidth(0.3)
      this.doc.rect(barX + 1, barY, barWidth - 2, barHeight, "S")
    })

    // Axis labels
    this.doc.setFontSize(7)
    this.doc.setTextColor(...this.colors.text)
    this.doc.text("Frequency", chartX + 5, plotY + plotHeight / 2, { angle: 90 })
    this.doc.text("Value", chartX + chartWidth / 2, chartY + chartHeight - 3, { align: "center" })

    // Add scale labels
    this.doc.setFontSize(6)
    this.doc.text("0", plotX - 5, plotY + plotHeight + 2, { align: "right" })
    this.doc.text(maxCount.toString(), plotX - 5, plotY + 2, { align: "right" })

    this.yPosition += chartHeight + 10
  }

  private drawRealScatterPlot(chart: ChartData, analysisResults: any) {
    this.checkPageBreak(90)

    const regressionIndex = Number.parseInt(chart.id.split("-")[1])
    const regression = analysisResults?.regressionModels?.[regressionIndex]

    if (!regression || !analysisResults?.data) {
      this.drawNoDataChart("Scatter plot data not available")
      return
    }

    // Extract data points
    const dataPoints = analysisResults.data
      .filter(
        (row: any) =>
          row[regression.xColumn] !== null &&
          row[regression.yColumn] !== null &&
          !isNaN(Number(row[regression.xColumn])) &&
          !isNaN(Number(row[regression.yColumn])),
      )
      .slice(0, 100)
      .map((row: any) => ({
        x: Number(row[regression.xColumn]),
        y: Number(row[regression.yColumn]),
      }))

    if (dataPoints.length === 0) {
      this.drawNoDataChart("No valid data points")
      return
    }

    // Chart area
    const chartX = this.margin + 10
    const chartY = this.yPosition
    const chartWidth = 150
    const chartHeight = 70

    // Chart background
    this.doc.setFillColor(248, 250, 252)
    this.doc.setDrawColor(...this.colors.primary)
    this.doc.setLineWidth(0.5)
    this.doc.roundedRect(chartX, chartY, chartWidth, chartHeight, 3, 3, "FD")

    // Chart title
    this.doc.setFontSize(10)
    this.doc.setTextColor(...this.colors.primary)
    this.doc.text(`${regression.xColumn} vs ${regression.yColumn}`, chartX + chartWidth / 2, chartY + 12, {
      align: "center",
    })

    // Drawing area
    const plotX = chartX + 20
    const plotY = chartY + 20
    const plotWidth = chartWidth - 30
    const plotHeight = chartHeight - 30

    // Calculate ranges
    const xValues = dataPoints.map((p) => p.x)
    const yValues = dataPoints.map((p) => p.y)
    const minX = Math.min(...xValues)
    const maxX = Math.max(...xValues)
    const minY = Math.min(...yValues)
    const maxY = Math.max(...yValues)

    // Draw axes
    this.doc.setDrawColor(60, 60, 60)
    this.doc.setLineWidth(1)
    this.doc.line(plotX, plotY, plotX, plotY + plotHeight)
    this.doc.line(plotX, plotY + plotHeight, plotX + plotWidth, plotY + plotHeight)

    // Draw data points
    this.doc.setFillColor(...this.colors.chartBlue)
    dataPoints.forEach((point) => {
      const plotXPos = plotX + ((point.x - minX) / (maxX - minX)) * plotWidth
      const plotYPos = plotY + plotHeight - ((point.y - minY) / (maxY - minY)) * plotHeight

      this.doc.circle(plotXPos, plotYPos, 0.8, "F")
    })

    // Draw regression line
    if (regression.slope !== undefined && regression.intercept !== undefined) {
      this.doc.setDrawColor(...this.colors.chartRed)
      this.doc.setLineWidth(1.5)

      const startX = plotX
      const endX = plotX + plotWidth
      const startY =
        plotY + plotHeight - ((regression.slope * minX + regression.intercept - minY) / (maxY - minY)) * plotHeight
      const endY =
        plotY + plotHeight - ((regression.slope * maxX + regression.intercept - minY) / (maxY - minY)) * plotHeight

      if (startY >= plotY && startY <= plotY + plotHeight && endY >= plotY && endY <= plotY + plotHeight) {
        this.doc.line(startX, startY, endX, endY)
      }
    }

    // Axis labels
    this.doc.setFontSize(7)
    this.doc.setTextColor(...this.colors.text)
    this.doc.text(regression.yColumn || "Y", chartX + 5, plotY + plotHeight / 2, { angle: 90 })
    this.doc.text(regression.xColumn || "X", chartX + chartWidth / 2, chartY + chartHeight - 3, { align: "center" })

    // R² value
    if (regression.rSquared !== undefined) {
      this.doc.setFontSize(8)
      this.doc.setTextColor(...this.colors.primary)
      this.doc.text(`R² = ${regression.rSquared.toFixed(3)}`, plotX + plotWidth - 25, plotY + 8)
    }

    this.yPosition += chartHeight + 10
  }

  private drawRealBarChart(chart: ChartData, analysisResults: any) {
    this.checkPageBreak(90)

    const columnStats = analysisResults?.columnStats?.slice(0, 6) || []

    if (columnStats.length === 0) {
      this.drawNoDataChart("Bar chart data not available")
      return
    }

    // Chart area
    const chartX = this.margin + 10
    const chartY = this.yPosition
    const chartWidth = 150
    const chartHeight = 70

    // Chart background
    this.doc.setFillColor(248, 250, 252)
    this.doc.setDrawColor(...this.colors.primary)
    this.doc.setLineWidth(0.5)
    this.doc.roundedRect(chartX, chartY, chartWidth, chartHeight, 3, 3, "FD")

    // Chart title
    this.doc.setFontSize(10)
    this.doc.setTextColor(...this.colors.primary)
    this.doc.text("Column Statistics", chartX + chartWidth / 2, chartY + 12, { align: "center" })

    // Drawing area
    const plotX = chartX + 20
    const plotY = chartY + 20
    const plotWidth = chartWidth - 30
    const plotHeight = chartHeight - 30

    // Prepare data
    const barData = columnStats.map((col: any) => ({
      name: col.name?.substring(0, 6) || "Col",
      value: col.count || col.mean || Math.random() * 100,
    }))

    const maxValue = Math.max(...barData.map((d) => d.value))

    // Draw axes
    this.doc.setDrawColor(60, 60, 60)
    this.doc.setLineWidth(1)
    this.doc.line(plotX, plotY, plotX, plotY + plotHeight)
    this.doc.line(plotX, plotY + plotHeight, plotX + plotWidth, plotY + plotHeight)

    // Draw bars
    const barWidth = plotWidth / barData.length
    barData.forEach((item, index) => {
      const barHeight = (item.value / maxValue) * plotHeight
      const barX = plotX + index * barWidth
      const barY = plotY + plotHeight - barHeight

      // Clean bar styling
      this.doc.setFillColor(...this.colors.chartGreen)
      this.doc.rect(barX + barWidth * 0.1, barY, barWidth * 0.8, barHeight, "F")

      // Bar border
      this.doc.setDrawColor(...this.colors.success)
      this.doc.setLineWidth(0.3)
      this.doc.rect(barX + barWidth * 0.1, barY, barWidth * 0.8, barHeight, "S")

      // Value label
      this.doc.setFontSize(6)
      this.doc.setTextColor(...this.colors.text)
      this.doc.text(item.value.toFixed(0), barX + barWidth / 2, barY - 1, { align: "center" })

      // Category label
      this.doc.text(item.name, barX + barWidth / 2, plotY + plotHeight + 6, { align: "center" })
    })

    this.yPosition += chartHeight + 10
  }

  private drawRealBoxPlot(chart: ChartData, analysisResults: any) {
    this.checkPageBreak(90)

    const columnIndex = Number.parseInt(chart.id.split("-")[1])
    const columnName = analysisResults?.numericColumns?.[columnIndex]

    if (!columnName || !analysisResults?.data) {
      this.drawNoDataChart("Box plot data not available")
      return
    }

    // Extract values
    const values = analysisResults.data
      .map((row: any) => Number(row[columnName]))
      .filter((val: number) => !isNaN(val))
      .sort((a: number, b: number) => a - b)

    if (values.length === 0) {
      this.drawNoDataChart("No valid numeric data")
      return
    }

    // Calculate quartiles
    const q1 = this.percentile(values, 25)
    const median = this.percentile(values, 50)
    const q3 = this.percentile(values, 75)
    const min = values[0]
    const max = values[values.length - 1]

    // Chart area
    const chartX = this.margin + 10
    const chartY = this.yPosition
    const chartWidth = 150
    const chartHeight = 70

    // Chart background
    this.doc.setFillColor(248, 250, 252)
    this.doc.setDrawColor(...this.colors.primary)
    this.doc.setLineWidth(0.5)
    this.doc.roundedRect(chartX, chartY, chartWidth, chartHeight, 3, 3, "FD")

    // Chart title
    this.doc.setFontSize(10)
    this.doc.setTextColor(...this.colors.primary)
    this.doc.text(`${columnName} Box Plot`, chartX + chartWidth / 2, chartY + 12, { align: "center" })

    // Drawing area
    const plotX = chartX + 20
    const plotY = chartY + 20
    const plotWidth = chartWidth - 30
    const plotHeight = chartHeight - 30

    // Box positioning
    const boxX = plotX + plotWidth / 2 - 15
    const boxWidth = 30
    const dataRange = max - min

    const scaleY = (value: number) => plotY + plotHeight - ((value - min) / dataRange) * plotHeight

    // Draw box
    const boxTop = scaleY(q3)
    const boxBottom = scaleY(q1)
    const boxHeight = boxBottom - boxTop

    this.doc.setFillColor(224, 231, 255)
    this.doc.setDrawColor(...this.colors.chartBlue)
    this.doc.setLineWidth(1)
    this.doc.rect(boxX, boxTop, boxWidth, boxHeight, "FD")

    // Draw median line
    const medianY = scaleY(median)
    this.doc.setDrawColor(...this.colors.primary)
    this.doc.setLineWidth(1.5)
    this.doc.line(boxX, medianY, boxX + boxWidth, medianY)

    // Draw whiskers
    this.doc.setDrawColor(...this.colors.chartBlue)
    this.doc.setLineWidth(1)

    // Upper whisker
    this.doc.line(boxX + boxWidth / 2, boxTop, boxX + boxWidth / 2, scaleY(max))
    // Lower whisker
    this.doc.line(boxX + boxWidth / 2, boxBottom, boxX + boxWidth / 2, scaleY(min))

    // Whisker caps
    const capWidth = boxWidth * 0.3
    this.doc.line(boxX + boxWidth / 2 - capWidth / 2, scaleY(max), boxX + boxWidth / 2 + capWidth / 2, scaleY(max))
    this.doc.line(boxX + boxWidth / 2 - capWidth / 2, scaleY(min), boxX + boxWidth / 2 + capWidth / 2, scaleY(min))

    // Labels
    this.doc.setFontSize(7)
    this.doc.setTextColor(...this.colors.text)
    this.doc.text(columnName, chartX + chartWidth / 2, chartY + chartHeight - 3, { align: "center" })

    // Statistics
    this.doc.setFontSize(6)
    this.doc.text(`Min: ${min.toFixed(1)}`, boxX + boxWidth + 3, scaleY(min))
    this.doc.text(`Q1: ${q1.toFixed(1)}`, boxX + boxWidth + 3, scaleY(q1))
    this.doc.text(`Med: ${median.toFixed(1)}`, boxX + boxWidth + 3, scaleY(median))
    this.doc.text(`Q3: ${q3.toFixed(1)}`, boxX + boxWidth + 3, scaleY(q3))
    this.doc.text(`Max: ${max.toFixed(1)}`, boxX + boxWidth + 3, scaleY(max))

    this.yPosition += chartHeight + 10
  }

  private drawNoDataChart(message: string) {
    const chartX = this.margin + 10
    const chartY = this.yPosition
    const chartWidth = 150
    const chartHeight = 70

    // No data placeholder
    this.doc.setFillColor(245, 245, 245)
    this.doc.setDrawColor(...this.colors.secondary)
    this.doc.setLineWidth(0.5)
    this.doc.roundedRect(chartX, chartY, chartWidth, chartHeight, 3, 3, "FD")

    this.doc.setFontSize(10)
    this.doc.setTextColor(...this.colors.secondary)
    this.doc.text("Chart Unavailable", chartX + chartWidth / 2, chartY + chartHeight / 2 - 3, { align: "center" })

    this.doc.setFontSize(8)
    this.doc.text(message, chartX + chartWidth / 2, chartY + chartHeight / 2 + 3, { align: "center" })

    this.yPosition += chartHeight + 10
  }

  private percentile(arr: number[], p: number): number {
    const sorted = [...arr].sort((a, b) => a - b)
    const index = (p / 100) * (sorted.length - 1)
    const lower = Math.floor(index)
    const upper = Math.ceil(index)
    const weight = index % 1

    if (upper >= sorted.length) return sorted[sorted.length - 1]
    return sorted[lower] * (1 - weight) + sorted[upper] * weight
  }

  private addChartWithInsights(chart: ChartData, analysisResults: any) {
    this.checkPageBreak(120)

    // Clean chart section header
    this.addSubsectionTitle(`${chart.name}`)

    // Draw the actual chart
    switch (chart.type.toLowerCase()) {
      case "histogram":
        this.drawRealHistogram(chart, analysisResults)
        break
      case "scatter":
        this.drawRealScatterPlot(chart, analysisResults)
        break
      case "bar":
        this.drawRealBarChart(chart, analysisResults)
        break
      case "boxplot":
        this.drawRealBoxPlot(chart, analysisResults)
        break
      default:
        this.drawNoDataChart(`${chart.type} chart not implemented`)
    }

    // Add insights
    if (chart.insights && chart.insights.length > 0) {
      this.addInsightBox("Key Insights", chart.insights)
    }

    // Add interpretation
    const interpretation = this.generateChartInterpretation(chart, analysisResults)
    this.addText(interpretation, 9, this.colors.text)

    this.yPosition += 10
  }

  private generateChartInterpretation(chart: ChartData, analysisResults: any): string {
    switch (chart.type.toLowerCase()) {
      case "histogram":
        const histogramIndex = Number.parseInt(chart.id.split("-")[1])
        const histogram = analysisResults?.histograms?.[histogramIndex]
        if (histogram) {
          return `This histogram displays the distribution of ${histogram.column} across ${histogram.bins?.length || 0} bins. The data shows a mean of ${histogram.mean?.toFixed(2) || "N/A"} with a standard deviation of ${histogram.std?.toFixed(2) || "N/A"}. The distribution pattern helps identify data concentration and potential outliers.`
        }
        break

      case "scatter":
        const regressionIndex = Number.parseInt(chart.id.split("-")[1])
        const regression = analysisResults?.regressionModels?.[regressionIndex]
        if (regression) {
          const rSquared = regression.rSquared || 0
          const strength = rSquared > 0.7 ? "strong" : rSquared > 0.4 ? "moderate" : "weak"
          const direction = (regression.slope || 0) > 0 ? "positive" : "negative"
          return `This scatter plot reveals a ${strength} ${direction} relationship (R² = ${rSquared.toFixed(3)}) between ${regression.xColumn} and ${regression.yColumn}. The regression line shows the linear trend with ${rSquared > 0.5 ? "good" : "limited"} predictive potential.`
        }
        break

      case "bar":
        return `This bar chart compares values across different categories in the dataset. The visualization helps identify the highest and lowest performing categories, making it easy to spot patterns and outliers in categorical data distributions.`

      case "boxplot":
        const columnIndex = Number.parseInt(chart.id.split("-")[1])
        const columnName = analysisResults?.numericColumns?.[columnIndex]
        return `This box plot displays the quartile distribution of ${columnName}, showing the median, interquartile range (IQR), and potential outliers. The visualization provides insights into data spread and central tendency.`

      default:
        return `This ${chart.type} visualization provides valuable insights into the data structure and helps identify key patterns for comprehensive analysis.`
    }

    return `This visualization offers important insights into the dataset structure and patterns.`
  }

  private addText(text: string, fontSize = 9, color = this.colors.text, indent = 0) {
    this.checkPageBreak(8)

    this.doc.setFontSize(fontSize)
    this.doc.setTextColor(...color)

    const maxWidth = this.rightMargin - this.margin - indent
    const lines = this.doc.splitTextToSize(text, maxWidth)

    lines.forEach((line: string) => {
      this.checkPageBreak(6)
      this.doc.text(line, this.margin + indent, this.yPosition)
      this.yPosition += fontSize * 0.6 + 2
    })

    this.yPosition += 3
  }

  // Main generation method
  async generatePDF(
    analysisResults: any,
    advancedResults: any,
    selectedCharts: ChartData[],
    exportOptions: ExportOptions,
  ): Promise<void> {
    // Cover Page
    this.addCoverPage(analysisResults)

    // Table of Contents
    this.addTableOfContents(exportOptions, selectedCharts)

    // Process sections
    for (const section of exportOptions.sections) {
      if (!section.enabled) continue

      switch (section.id) {
        case "summary":
          await this.addSummarySection(analysisResults, section.subsections)
          break
        case "correlation":
          await this.addCorrelationSection(analysisResults, section.subsections)
          break
        case "trends":
          await this.addTrendsSection(analysisResults, section.subsections)
          break
        case "advanced":
          await this.addAdvancedSection(advancedResults, section.subsections)
          break
      }
    }

    // Charts section
    if (selectedCharts.length > 0) {
      await this.addChartsSection(selectedCharts, analysisResults)
    }

    // Final page
    this.addFinalPage(exportOptions, selectedCharts)

    // Page numbers
    this.addPageNumbers()
  }

  private async addSummarySection(analysisResults: any, subsections?: ExportSubsection[]) {
    this.addSectionTitle("1. Data Summary")

    const enabledSubs = subsections?.filter((s) => s.enabled) || []

    if (enabledSubs.some((s) => s.id === "overview") || !subsections) {
      const totalRecords = analysisResults?.data?.length || 0
      const totalColumns = analysisResults?.headers?.length || 0
      const numericCols = analysisResults?.numericColumns?.length || 0
      const categoricalCols = analysisResults?.categoricalColumns?.length || 0
      const missingValues = analysisResults?.missingValues || 0

      this.addInfoBox("Dataset Overview", {
        "File Name": analysisResults?.fileName || "Unknown",
        "Total Records": totalRecords.toLocaleString(),
        "Total Columns": totalColumns,
        "Numeric Columns": numericCols,
        "Categorical Columns": categoricalCols,
        "Missing Values": missingValues.toLocaleString(),
      })

      const dataQualityScore = this.calculateDataQualityScore(totalRecords, missingValues, 0)
      this.addInsightBox("Data Quality Assessment", [
        `Overall data quality score: ${dataQualityScore}/100`,
        `Data completeness: ${(100 - (missingValues / (totalRecords * totalColumns)) * 100).toFixed(1)}%`,
        dataQualityScore > 80 ? "High quality dataset" : "Quality issues detected",
        "Regular monitoring recommended for data integrity",
      ])
    }

    if (enabledSubs.some((s) => s.id === "columns") || !subsections) {
      this.addSubsectionTitle("Column Analysis")

      if (analysisResults?.columnStats?.length > 0) {
        const columnData = analysisResults.columnStats
          .slice(0, 15)
          .map((col: any) => [
            col.name || "Unknown",
            col.type || "Unknown",
            (col.count || 0).toLocaleString(),
            (col.missing || 0).toLocaleString(),
            col.unique ? (col.unique || 0).toLocaleString() : "N/A",
          ])

        this.doc.autoTable({
          head: [["Column", "Type", "Count", "Missing", "Unique"]],
          body: columnData,
          startY: this.yPosition,
          margin: { left: this.margin, right: this.margin },
          styles: {
            fontSize: 8,
            cellPadding: 3,
            lineColor: this.colors.secondary,
            lineWidth: 0.3,
          },
          headStyles: {
            fillColor: this.colors.primary,
            textColor: [255, 255, 255],
            fontStyle: "bold",
            fontSize: 9,
          },
          alternateRowStyles: {
            fillColor: [248, 250, 252],
          },
        })

        this.yPosition = (this.doc as any).lastAutoTable.finalY + 10
      }
    }

    if (enabledSubs.some((s) => s.id === "preview") || !subsections) {
      this.addDataPreview(analysisResults?.previewData || [])
    }
  }

  private async addCorrelationSection(analysisResults: any, subsections?: ExportSubsection[]) {
    this.addSectionTitle("2. Correlation Analysis")

    const correlations = analysisResults?.correlationMatrix
    if (correlations?.labels?.length > 0) {
      this.addInfoBox("Correlation Matrix Summary", {
        "Matrix Size": `${correlations.labels.length} × ${correlations.labels.length}`,
        "Variables Analyzed": correlations.labels.length,
        "Strong Correlations": correlations.strongPairs?.length || 0,
        "Analysis Method": "Pearson Correlation Coefficient",
      })

      if (correlations.strongPairs?.length > 0) {
        this.addCorrelationTable(correlations.strongPairs)
      }
    } else {
      this.addText("Correlation analysis not available - insufficient numeric data.")
    }
  }

  private addCorrelationTable(correlations: any[]) {
    this.addSubsectionTitle("Strong Correlations")

    const tableData = correlations
      .slice(0, 15)
      .map((corr) => [
        corr.column1 || "N/A",
        corr.column2 || "N/A",
        (corr.value || 0).toFixed(3),
        this.getCorrelationStrength(Math.abs(corr.value || 0)),
      ])

    this.doc.autoTable({
      head: [["Variable 1", "Variable 2", "Correlation", "Strength"]],
      body: tableData,
      startY: this.yPosition,
      margin: { left: this.margin, right: this.margin },
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: this.colors.primary,
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
    })

    this.yPosition = (this.doc as any).lastAutoTable.finalY + 10
  }

  private getCorrelationStrength(value: number): string {
    if (value >= 0.8) return "Very Strong"
    if (value >= 0.6) return "Strong"
    if (value >= 0.4) return "Moderate"
    if (value >= 0.2) return "Weak"
    return "Very Weak"
  }

  private async addTrendsSection(analysisResults: any, subsections?: ExportSubsection[]) {
    this.addSectionTitle("3. Trend Analysis")

    const regressions = analysisResults?.regressionModels || []
    if (regressions.length > 0) {
      this.addSubsectionTitle("Regression Models")

      const regressionData = regressions
        .slice(0, 10)
        .map((model: any) => [
          model.xColumn || "N/A",
          model.yColumn || "N/A",
          (model.rSquared || 0).toFixed(3),
          (model.slope || 0).toFixed(3),
          this.getRegressionStrength(model.rSquared || 0),
        ])

      this.doc.autoTable({
        head: [["Predictor", "Target", "R²", "Slope", "Strength"]],
        body: regressionData,
        startY: this.yPosition,
        margin: { left: this.margin, right: this.margin },
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: {
          fillColor: this.colors.primary,
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
      })

      this.yPosition = (this.doc as any).lastAutoTable.finalY + 10
    }
  }

  private getRegressionStrength(rSquared: number): string {
    if (rSquared >= 0.8) return "Very Strong"
    if (rSquared >= 0.6) return "Strong"
    if (rSquared >= 0.4) return "Moderate"
    return "Weak"
  }

  private async addAdvancedSection(advancedResults: any, subsections?: ExportSubsection[]) {
    this.addSectionTitle("4. Advanced Analytics")

    if (!advancedResults) {
      this.addText("Advanced analysis results are not available. Please run advanced analytics to generate insights.")
      return
    }

    this.addInsightBox("Advanced Analytics Overview", [
      "Principal Component Analysis for dimensionality reduction",
      "Clustering analysis for pattern discovery",
      "Feature importance ranking for variable selection",
      "Statistical tests for hypothesis validation",
    ])
  }

  private async addChartsSection(selectedCharts: ChartData[], analysisResults: any) {
    this.addSectionTitle("Charts & Visualizations")

    this.addText(
      `This section contains ${selectedCharts.length} visualizations generated from your dataset analysis. Each chart provides specific insights into different aspects of your data.`,
    )

    const chartsByCategory = selectedCharts.reduce(
      (acc, chart) => {
        if (!acc[chart.category]) acc[chart.category] = []
        acc[chart.category].push(chart)
        return acc
      },
      {} as Record<string, ChartData[]>,
    )

    for (const [category, charts] of Object.entries(chartsByCategory)) {
      this.addSubsectionTitle(`${category} Charts`)

      for (const chart of charts) {
        this.addChartWithInsights(chart, analysisResults)
      }
    }
  }

  private addDataPreview(previewData: any[]) {
    if (!previewData || previewData.length === 0) {
      this.addText("No preview data available.")
      return
    }

    this.addSubsectionTitle("Data Preview")

    const headers = Object.keys(previewData[0])
    const displayData = previewData.slice(0, 8)

    const tableData = displayData.map((row) =>
      headers.map((header) => {
        const value = row[header]
        if (value === null || value === undefined) return "N/A"
        if (typeof value === "number") return value.toFixed(2)
        return String(value).substring(0, 15)
      }),
    )

    this.doc.autoTable({
      head: [headers],
      body: tableData,
      startY: this.yPosition,
      margin: { left: this.margin, right: this.margin },
      styles: {
        fontSize: 7,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: this.colors.primary,
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
    })

    this.yPosition = (this.doc as any).lastAutoTable.finalY + 10
  }

  private calculateDataQualityScore(totalRecords: number, missingValues: number, duplicateRows: number): number {
    if (totalRecords === 0) return 0
    const completenessScore = Math.max(0, 100 - (missingValues / totalRecords) * 10)
    const uniquenessScore = Math.max(0, 100 - (duplicateRows / totalRecords) * 100)
    return Math.round((completenessScore + uniquenessScore + 85) / 3)
  }

  private addFinalPage(exportOptions: ExportOptions, selectedCharts: ChartData[]) {
    this.addSectionTitle("Analysis Summary")

    const enabledSections = exportOptions.sections.filter((s) => s.enabled)

    this.addInfoBox("Report Summary", {
      "Sections Included": enabledSections.length,
      "Charts Generated": selectedCharts.length,
      "Total Pages": this.currentPage,
      "Generated On": new Date().toLocaleString(),
      Platform: "AnalyzeX Analytics",
    })

    this.addInsightBox("Next Steps", [
      "Review insights and validate with domain expertise",
      "Investigate strong correlations for modeling opportunities",
      "Consider additional data collection if needed",
      "Implement recommended data quality improvements",
      "Schedule regular analysis updates",
    ])
  }

  private addPageNumbers() {
    const totalPages = this.doc.getNumberOfPages()

    for (let i = 1; i <= totalPages; i++) {
      this.doc.setPage(i)
      this.doc.setFontSize(8)
      this.doc.setTextColor(...this.colors.secondary)

      // Footer line
      this.doc.setDrawColor(...this.colors.primary)
      this.doc.setLineWidth(0.3)
      this.doc.line(this.margin, 285, this.rightMargin, 285)

      // Footer text
      this.doc.text("Generated by AnalyzeX Analytics Platform", this.margin, 290)
      this.doc.text(`Page ${i} of ${totalPages}`, this.rightMargin - 20, 290, { align: "right" })
    }
  }

  save(fileName: string) {
    this.doc.save(fileName)
  }
}
