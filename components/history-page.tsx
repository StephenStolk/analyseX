"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Download,
  FileText,
  Calendar,
  BarChart3,
  Trash2,
  Search,
  Eye,
  RefreshCw,
  Database,
  Clock,
  TrendingUp,
} from "lucide-react"
import { dataPersistence, type AnalysisHistoryItem } from "@/lib/data-persistence"
import { formatDistanceToNow } from "date-fns"
import { toast } from "@/hooks/use-toast"
import { AnalysisViewerModal } from "./analysis-viewer-modal"

export function HistoryPage() {
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([])
  const [filteredHistory, setFilteredHistory] = useState<AnalysisHistoryItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFilter, setSelectedFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [storageInfo, setStorageInfo] = useState<any>(null)
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisHistoryItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  // Load history on component mount
  useEffect(() => {
    loadHistory()
  }, [])

  // Filter history based on search and filter criteria
  useEffect(() => {
    let filtered = history

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.metadata.analysisType.some((type) => type.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    // Apply category filter
    if (selectedFilter !== "all") {
      filtered = filtered.filter((item) => {
        switch (selectedFilter) {
          case "recent":
            return Date.now() - item.timestamp < 24 * 60 * 60 * 1000 // Last 24 hours
          case "ai":
            return item.aiInsights || (item.chatMessages && item.chatMessages?.length > 0)
          case "charts":
            return item.customCharts && item.customCharts.length > 0
          case "dashboard":
            return item.dashboardContent && item.dashboardContent.aiDashboard
          case "large":
            return item.metadata.rowCount > 1000
          default:
            return true
        }
      })
    }

    setFilteredHistory(filtered)
  }, [history, searchTerm, selectedFilter])

  const loadHistory = () => {
    setIsLoading(true)
    try {
      const historyData = dataPersistence.getAnalysisHistory()
      const storageData = dataPersistence.getStorageInfo()

      setHistory(historyData)
      setStorageInfo(storageData)
    } catch (error) {
      console.error("Error loading history:", error)
      toast({
        title: "Error",
        description: "Failed to load analysis history",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAnalysis = (id: string) => {
    if (confirm("Are you sure you want to delete this analysis?")) {
      const success = dataPersistence.deleteAnalysis(id)
      if (success) {
        loadHistory()
        toast({
          title: "Success",
          description: "Analysis deleted successfully",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to delete analysis",
          variant: "destructive",
        })
      }
    }
  }

  const handleViewAnalysis = (item: AnalysisHistoryItem) => {
    setSelectedAnalysis(item)
    setIsModalOpen(true)
  }

  const handleClearAllHistory = () => {
    if (confirm("Are you sure you want to clear all analysis history? This action cannot be undone.")) {
      dataPersistence.clearAllHistory()
      loadHistory()
      toast({
        title: "Success",
        description: "All analysis history cleared",
      })
    }
  }

  const handleExportToPDF = async () => {
    try {
      // Dynamic import to avoid SSR issues
      const html2pdf = (await import("html2pdf.js")).default

      const element = printRef.current
      if (!element) return

      const opt = {
        margin: 1,
        filename: `analysis-history-${new Date().toISOString().split("T")[0]}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
      }

      await html2pdf().set(opt).from(element).save()

      toast({
        title: "Success",
        description: "History exported to PDF successfully",
      })
    } catch (error) {
      console.error("Error exporting to PDF:", error)
      toast({
        title: "Error",
        description: "Failed to export to PDF",
        variant: "destructive",
      })
    }
  }

  const handleExportToJSON = () => {
    try {
      const exportData = {
        exportDate: new Date().toISOString(),
        totalAnalyses: history.length,
        storageInfo,
        analyses: history.map((item) => ({
          id: item.id,
          fileName: item.fileName,
          timestamp: item.timestamp,
          metadata: item.metadata,
          hasAiInsights: !!item.aiInsights,
          customChartsCount: item.customCharts?.length || 0,
          chatMessagesCount: item.chatMessages?.length || 0,
          // Include basic summary data but not full datasets for privacy/size
          summary: item.summary || null,
        })),
      }

      const dataStr = JSON.stringify(exportData, null, 2)
      const dataBlob = new Blob([dataStr], { type: "application/json" })

      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement("a")
      link.href = url
      link.download = `analysis-history-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: "Success",
        description: "History exported to JSON successfully",
      })
    } catch (error) {
      console.error("Error exporting to JSON:", error)
      toast({
        title: "Error",
        description: "Failed to export to JSON",
        variant: "destructive",
      })
    }
  }

  const getAnalysisTypeColor = (types: string[]) => {
    if (types.includes("ai")) return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
    if (types.includes("advanced")) return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
    if (types.includes("correlation")) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Loading analysis history...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analysis History</h1>
          <p className="text-muted-foreground mt-1">View and manage your saved data analysis sessions</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadHistory} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleExportToJSON} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
          <Button onClick={handleExportToPDF} size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Storage Info */}
      {storageInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Database className="h-5 w-5" />
              Storage Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Saved Analyses</p>
                <p className="font-semibold">{storageInfo.itemCount}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Storage Used</p>
                <p className="font-semibold">{(storageInfo.estimatedSize / 1024).toFixed(1)} KB</p>
              </div>
              <div>
                <p className="text-muted-foreground">Oldest Analysis</p>
                <p className="font-semibold">
                  {storageInfo.oldestItem ? formatDistanceToNow(storageInfo.oldestItem, { addSuffix: true }) : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Data Retention</p>
                <p className="font-semibold">5 days</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by filename or analysis type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={selectedFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedFilter("all")}
              >
                All
              </Button>
              <Button
                variant={selectedFilter === "recent" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedFilter("recent")}
              >
                Recent
              </Button>
              <Button
                variant={selectedFilter === "ai" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedFilter("ai")}
              >
                AI Analysis
              </Button>
              <Button
                variant={selectedFilter === "charts" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedFilter("charts")}
              >
                With Charts
              </Button>
              <Button
                variant={selectedFilter === "dashboard" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedFilter("dashboard")}
              >
                Dashboards
              </Button>
              <Button
                variant={selectedFilter === "large" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedFilter("large")}
              >
                Large Datasets
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* History List */}
      <div className="space-y-4">
        {filteredHistory.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Saved Analyses</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || selectedFilter !== "all"
                    ? "No analyses match your current filters"
                    : "Save your analyses to see them here. Use the 'Save Analysis' button in the analysis page."}
                </p>
                {(searchTerm || selectedFilter !== "all") && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("")
                      setSelectedFilter("all")
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredHistory.map((item) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {item.fileName}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Database className="h-4 w-4" />
                        {item.metadata.rowCount.toLocaleString()} rows × {item.metadata.columnCount} columns
                      </span>
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleViewAnalysis(item)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteAnalysis(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Analysis Types */}
                  <div className="flex flex-wrap gap-2">
                    {item.metadata.analysisType.map((type) => (
                      <Badge key={type} className={getAnalysisTypeColor(item.metadata.analysisType)}>
                        {type}
                      </Badge>
                    ))}
                  </div>

                  {/* Features */}
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    {item.aiInsights && (
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" />
                        AI Insights
                      </span>
                    )}
                    {item.customCharts && item.customCharts.length > 0 && (
                      <span className="flex items-center gap-1">
                        <BarChart3 className="h-4 w-4" />
                        {item.customCharts.length} Custom Charts
                      </span>
                    )}
                    {item.dashboardContent && item.dashboardContent.aiDashboard && (
                      <span className="flex items-center gap-1">
                        <Database className="h-4 w-4" />
                        AI Dashboard
                      </span>
                    )}
                    {item.chatMessages && item.chatMessages.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {item.chatMessages.length} Chat Messages
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Clear All Button */}
      {history.length > 0 && (
        <div className="flex justify-center pt-4">
          <Button variant="destructive" onClick={handleClearAllHistory}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All History
          </Button>
        </div>
      )}

      {/* Analysis Viewer Modal */}
      <AnalysisViewerModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedAnalysis(null)
        }}
        analysis={selectedAnalysis}
      />

      {/* Hidden PDF Export Content */}
      <div ref={printRef} className="hidden print:block">
        <div className="p-8 bg-white text-black">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">AnalyzeX - Analysis History Report</h1>
            <p className="text-gray-600">Generated on {new Date().toLocaleDateString()}</p>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Summary</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Total Saved Analyses:</strong> {history.length}
              </div>
              <div>
                <strong>Date Range:</strong>{" "}
                {storageInfo?.oldestItem
                  ? `${storageInfo.oldestItem.toLocaleDateString()} - ${new Date().toLocaleDateString()}`
                  : "N/A"}
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Analysis Details</h2>
            {filteredHistory.map((item, index) => (
              <div key={item.id} className="mb-6 pb-4 border-b border-gray-200">
                <h3 className="font-semibold text-lg">
                  {index + 1}. {item.fileName}
                </h3>
                <div className="mt-2 text-sm space-y-1">
                  <p>
                    <strong>Date:</strong> {new Date(item.timestamp).toLocaleString()}
                  </p>
                  <p>
                    <strong>Dataset Size:</strong> {item.metadata.rowCount.toLocaleString()} rows ×{" "}
                    {item.metadata.columnCount} columns
                  </p>
                  <p>
                    <strong>Analysis Types:</strong> {item.metadata.analysisType.join(", ")}
                  </p>
                  {item.aiInsights && (
                    <p>
                      <strong>AI Insights:</strong> Available
                    </p>
                  )}
                  {item.customCharts && item.customCharts.length > 0 && (
                    <p>
                      <strong>Custom Charts:</strong> {item.customCharts.length} charts created
                    </p>
                  )}
                  {item.dashboardContent && item.dashboardContent.aiDashboard && (
                    <p>
                      <strong>AI Dashboard:</strong> Available
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
