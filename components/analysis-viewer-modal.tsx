"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileText, Database, BarChart3, TrendingUp, Download, Eye, MessageSquare, X } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import type { AnalysisHistoryItem } from "@/lib/data-persistence"
import { toast } from "@/hooks/use-toast"
import { DashboardContentRenderer } from "./dashboard-version-viewer"

interface AnalysisViewerModalProps {
  isOpen: boolean
  onClose: () => void
  analysis: AnalysisHistoryItem | null
}

export function AnalysisViewerModal({ isOpen, onClose, analysis }: AnalysisViewerModalProps) {
  const [selectedTab, setSelectedTab] = useState("overview")

  if (!analysis) return null

  const handleLoadAnalysis = () => {
    try {
      // Load the analysis data back into sessionStorage
      if (analysis.analysisResults) {
        sessionStorage.setItem("analysisResults", JSON.stringify(analysis.analysisResults))
      }

      // Load AI insights if available
      if (analysis.aiInsights) {
        sessionStorage.setItem("correlationAiInsights", analysis.aiInsights)
      }

      // Load custom charts if available
      if (analysis.customCharts) {
        sessionStorage.setItem("customCharts", JSON.stringify(analysis.customCharts))
      }

      // Load chat messages if available
      if (analysis.chatMessages) {
        sessionStorage.setItem("chatMessages", JSON.stringify(analysis.chatMessages))
      }

      toast({
        title: "Analysis Loaded",
        description:
          "The analysis has been loaded into your current session. You can now view all the charts and insights.",
      })

      onClose()
    } catch (error) {
      console.error("Error loading analysis:", error)
      toast({
        title: "Error",
        description: "Failed to load the analysis. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleExportAnalysis = async () => {
    try {
      const exportData = {
        fileName: analysis.fileName,
        timestamp: analysis.timestamp,
        metadata: analysis.metadata,
        analysisResults: analysis.analysisResults,
        aiInsights: analysis.aiInsights,
        customCharts: analysis.customCharts,
        chatMessages: analysis.chatMessages,
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      })

      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${analysis.fileName}-analysis-${new Date(analysis.timestamp).toISOString().split("T")[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Export Complete",
        description: "Analysis exported successfully as JSON file.",
      })
    } catch (error) {
      console.error("Error exporting analysis:", error)
      toast({
        title: "Error",
        description: "Failed to export analysis. Please try again.",
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6" />
              <div>
                <DialogTitle className="text-xl">{analysis.fileName}</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Analyzed {formatDistanceToNow(new Date(analysis.timestamp), { addSuffix: true })}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleLoadAnalysis} size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Load Analysis
              </Button>
              <Button onClick={handleExportAnalysis} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button onClick={onClose} variant="ghost" size="sm">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="insights">AI Insights</TabsTrigger>
            <TabsTrigger value="charts">Charts</TabsTrigger>
            <TabsTrigger value="chat">Chat History</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[60vh] mt-4">
            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Dataset Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Rows</p>
                      <p className="font-semibold">{analysis.metadata.rowCount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Columns</p>
                      <p className="font-semibold">{analysis.metadata.columnCount}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">File Size</p>
                      <p className="font-semibold">{analysis.metadata.fileSize}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Analysis Date</p>
                      <p className="font-semibold">{new Date(analysis.timestamp).toLocaleDateString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Analysis Types</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {analysis.metadata.analysisType.map((type) => (
                      <Badge key={type} className={getAnalysisTypeColor(analysis.metadata.analysisType)}>
                        {type}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysis.aiInsights && (
                      <div className="flex items-center gap-2 text-sm">
                        <TrendingUp className="h-4 w-4 text-purple-600" />
                        <span>AI-powered business insights available</span>
                      </div>
                    )}
                    {analysis.customCharts && analysis.customCharts.length > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <BarChart3 className="h-4 w-4 text-blue-600" />
                        <span>{analysis.customCharts.length} custom charts created</span>
                      </div>
                    )}
                    {analysis.chatMessages && analysis.chatMessages.length > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <MessageSquare className="h-4 w-4 text-green-600" />
                        <span>{analysis.chatMessages.length} chat interactions</span>
                      </div>
                    )}
                    {analysis.analysisResults?.correlationMatrix && (
                      <div className="flex items-center gap-2 text-sm">
                        <Database className="h-4 w-4 text-orange-600" />
                        <span>
                          Correlation analysis with {analysis.analysisResults.correlationMatrix.labels?.length || 0}{" "}
                          variables
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="dashboard" className="space-y-4">
              {analysis.dashboardContent?.aiDashboard ? (
                <DashboardContentRenderer
                  dashboard={analysis.dashboardContent.aiDashboard}
                  aiInsights={analysis.dashboardContent.aiInsights || []}
                  customCharts={analysis.dashboardContent.customCharts || analysis.customCharts || []}
                />
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Dashboard Saved</h3>
                      <p className="text-muted-foreground">Save a generated dashboard to view it here.</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="insights" className="space-y-4">
              {analysis.dashboardContent?.aiInsights?.length ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      AI-Generated Insights
                    </CardTitle>
                    <CardDescription>Business insights and recommendations based on your data analysis</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      {analysis.dashboardContent.aiInsights.map((i: any, idx: number) => (
                        <div key={idx} className="p-4 border rounded-lg bg-background">
                          <p className="font-medium">{i.title || "Insight"}</p>
                          <p className="text-sm text-muted-foreground">{i.description || i.explanation}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : analysis.aiInsights ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      AI-Generated Insights
                    </CardTitle>
                    <CardDescription>Business insights and recommendations based on your data analysis</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                        {typeof analysis.aiInsights === "string"
                          ? analysis.aiInsights
                          : JSON.stringify(analysis.aiInsights, null, 2)}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No AI Insights</h3>
                      <p className="text-muted-foreground">This analysis doesn't contain AI-generated insights.</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="charts" className="space-y-4">
              {analysis.customCharts && analysis.customCharts.length > 0 ? (
                <div className="space-y-4">
                  {analysis.customCharts.map((chart, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <BarChart3 className="h-5 w-5" />
                          Chart {index + 1}: {chart.type}
                        </CardTitle>
                        <CardDescription>{chart.title || `Custom ${chart.type} chart`}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm text-muted-foreground">
                          <p>
                            <strong>Type:</strong> {chart.type}
                          </p>
                          {chart.xColumn && (
                            <p>
                              <strong>X-Axis:</strong> {chart.xColumn}
                            </p>
                          )}
                          {chart.yColumn && (
                            <p>
                              <strong>Y-Axis:</strong> {chart.yColumn}
                            </p>
                          )}
                          {chart.groupBy && (
                            <p>
                              <strong>Group By:</strong> {chart.groupBy}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Custom Charts</h3>
                      <p className="text-muted-foreground">This analysis doesn't contain custom charts.</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="chat" className="space-y-4">
              {analysis.chatMessages && analysis.chatMessages.length > 0 ? (
                <div className="space-y-4">
                  {analysis.chatMessages.map((message, index) => (
                    <Card key={index}>
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-2 h-2 rounded-full mt-2 ${
                              message.role === "user" ? "bg-blue-500" : "bg-green-500"
                            }`}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium capitalize">{message.role}</span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(message.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            <div className="text-sm leading-relaxed">{message.content}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Chat History</h3>
                      <p className="text-muted-foreground">This analysis doesn't contain chat interactions.</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
