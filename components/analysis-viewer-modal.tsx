"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { BarChart3, TrendingUp, Activity, Target, FileText, Calendar, Database, X, Download } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { toast } from "@/hooks/use-toast"
import type { AnalysisHistoryItem } from "@/lib/data-persistence"

interface AnalysisViewerModalProps {
  isOpen: boolean
  onClose: () => void
  analysis: AnalysisHistoryItem | null
}

export function AnalysisViewerModal({ isOpen, onClose, analysis }: AnalysisViewerModalProps) {
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    if (isOpen && analysis) {
      setActiveTab("overview")
    }
  }, [isOpen, analysis])

  if (!analysis) return null

  const handleExportToPDF = async () => {
    try {
      const html2pdf = (await import("html2pdf.js")).default

      // Create a temporary element with the analysis content
      const element = document.createElement("div")
      element.innerHTML = `
        <div style="padding: 20px; font-family: Arial, sans-serif;">
          <h1 style="color: #333; margin-bottom: 20px;">${analysis.fileName} - Analysis Report</h1>
          <div style="margin-bottom: 20px;">
            <p><strong>Generated:</strong> ${new Date(analysis.timestamp).toLocaleString()}</p>
            <p><strong>Dataset Size:</strong> ${analysis.metadata.rowCount.toLocaleString()} rows × ${analysis.metadata.columnCount} columns</p>
            <p><strong>Analysis Types:</strong> ${analysis.metadata.analysisType.join(", ")}</p>
          </div>
          ${
            analysis.aiInsights
              ? `
            <div style="margin-bottom: 20px;">
              <h2 style="color: #333;">AI Insights</h2>
              <div style="background: #f5f5f5; padding: 15px; border-radius: 5px;">
                ${JSON.stringify(analysis.aiInsights, null, 2)}
              </div>
            </div>
          `
              : ""
          }
          ${
            analysis.customCharts && analysis.customCharts.length > 0
              ? `
            <div style="margin-bottom: 20px;">
              <h2 style="color: #333;">Custom Charts</h2>
              <p>${analysis.customCharts.length} charts were created for this analysis.</p>
            </div>
          `
              : ""
          }
        </div>
      `

      const opt = {
        margin: 1,
        filename: `${analysis.fileName}-analysis-${new Date().toISOString().split("T")[0]}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
      }

      await html2pdf().set(opt).from(element).save()

      toast({
        title: "Success",
        description: "Analysis exported to PDF successfully",
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

  const stats = {
    totalRecords: analysis.metadata.rowCount,
    totalColumns: analysis.metadata.columnCount,
    hasAIInsights: !!analysis.aiInsights,
    customChartsCount: analysis.customCharts?.length || 0,
    chatMessagesCount: analysis.chatMessages?.length || 0,
  }

  const getAnalysisTypeColor = (types: string[]) => {
    if (types.includes("ai")) return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
    if (types.includes("advanced")) return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
    if (types.includes("correlation")) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <DialogTitle className="text-xl flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {analysis.fileName}
              </DialogTitle>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDistanceToNow(new Date(analysis.timestamp), { addSuffix: true })}
                </span>
                <span className="flex items-center gap-1">
                  <Database className="h-4 w-4" />
                  {analysis.metadata.rowCount.toLocaleString()} rows × {analysis.metadata.columnCount} columns
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleExportToPDF} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
              <Button onClick={onClose} variant="ghost" size="sm">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="px-6 py-2 border-b">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="insights">AI Insights</TabsTrigger>
                <TabsTrigger value="charts">Charts</TabsTrigger>
                <TabsTrigger value="data">Data Preview</TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="flex-1 px-6 py-4">
              <TabsContent value="overview" className="space-y-6 mt-0">
                {/* Analysis Types */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Analysis Types</h3>
                  <div className="flex flex-wrap gap-2">
                    {analysis.metadata.analysisType.map((type) => (
                      <Badge key={type} className={getAnalysisTypeColor(analysis.metadata.analysisType)}>
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Dataset Statistics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 text-blue-600 rounded-md">
                            <BarChart3 className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{stats.totalRecords.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">Total Records</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 text-green-600 rounded-md">
                            <Target className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{stats.totalColumns}</p>
                            <p className="text-xs text-muted-foreground">Total Columns</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-100 text-purple-600 rounded-md">
                            <Activity className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{stats.customChartsCount}</p>
                            <p className="text-xs text-muted-foreground">Custom Charts</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-orange-100 text-orange-600 rounded-md">
                            <TrendingUp className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{stats.hasAIInsights ? "Yes" : "No"}</p>
                            <p className="text-xs text-muted-foreground">AI Insights</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* File Information */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">File Information</h3>
                  <Card>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">File Name</p>
                          <p className="font-medium">{analysis.fileName}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Analysis Date</p>
                          <p className="font-medium">{new Date(analysis.timestamp).toLocaleString()}</p>
                        </div>
                        {analysis.metadata.fileSize && (
                          <div>
                            <p className="text-muted-foreground">File Size</p>
                            <p className="font-medium">{(analysis.metadata.fileSize / 1024).toFixed(1)} KB</p>
                          </div>
                        )}
                        <div>
                          <p className="text-muted-foreground">Dataset Size</p>
                          <p className="font-medium">
                            {analysis.metadata.rowCount.toLocaleString()} rows × {analysis.metadata.columnCount} columns
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="insights" className="space-y-6 mt-0">
                {analysis.aiInsights ? (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">AI-Generated Insights</h3>
                    <Card>
                      <CardContent className="p-6">
                        <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg overflow-auto">
                          {JSON.stringify(analysis.aiInsights, null, 2)}
                        </pre>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No AI Insights Available</h3>
                    <p className="text-muted-foreground">This analysis was performed without AI insights generation.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="charts" className="space-y-6 mt-0">
                {analysis.customCharts && analysis.customCharts.length > 0 ? (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Custom Charts ({analysis.customCharts.length})</h3>
                    <div className="grid gap-4">
                      {analysis.customCharts.map((chart, index) => (
                        <Card key={index}>
                          <CardHeader>
                            <CardTitle className="text-base">Chart {index + 1}</CardTitle>
                            <CardDescription>
                              Type: {chart.type || "Unknown"} | Created:{" "}
                              {new Date(chart.createdAt || analysis.timestamp).toLocaleString()}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <pre className="text-xs bg-muted p-3 rounded overflow-auto">
                              {JSON.stringify(chart, null, 2)}
                            </pre>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Custom Charts</h3>
                    <p className="text-muted-foreground">No custom charts were created for this analysis.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="data" className="space-y-6 mt-0">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Data Preview</h3>
                  {analysis.analysisResults && (
                    <Card>
                      <CardContent className="p-6">
                        <div className="text-sm text-muted-foreground mb-4">
                          Showing preview of the analyzed dataset
                        </div>
                        <div className="bg-muted p-4 rounded-lg overflow-auto max-h-96">
                          <pre className="text-xs">
                            {JSON.stringify(
                              {
                                fileName: analysis.analysisResults.fileName,
                                rowCount: analysis.analysisResults.rowCount,
                                columnCount: analysis.analysisResults.columnCount,
                                columns: analysis.analysisResults.columns,
                                preview: analysis.analysisResults.previewData?.slice(0, 5) || "No preview available",
                              },
                              null,
                              2,
                            )}
                          </pre>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
