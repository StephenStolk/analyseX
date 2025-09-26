"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
  Download,
  RefreshCw,
  Sparkles,
  BarChart3,
  Target,
  MessageCircle,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Info,
  Brain,
  EyeOff,
} from "lucide-react"
import { dataPersistence, getCurrentAnalysis } from "@/lib/data-persistence"
import { formatDistanceToNow } from "date-fns"

interface DashboardVersion {
  id: string
  timestamp: number
  content: any
  fileName: string
  version: number
  aiInsights?: any[]
  customCharts?: any[]
}

interface DashboardVersionViewerProps {
  fileName: string
  onLoadVersion?: (content: any) => void
  showByDefault?: boolean
}

export function DashboardVersionViewer({
  fileName,
  onLoadVersion,
  showByDefault = false,
}: DashboardVersionViewerProps) {
  const [versions, setVersions] = useState<DashboardVersion[]>([])
  const [currentVersionIndex, setCurrentVersionIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isVisible, setIsVisible] = useState(showByDefault)

  useEffect(() => {
    loadDashboardVersions()
  }, [fileName])

  const loadDashboardVersions = () => {
    setIsLoading(true)

    const currentSession = getCurrentAnalysis()
    const currentDashboard = currentSession?.dashboardContent?.aiDashboard
    const currentInsights = currentSession?.dashboardContent?.aiInsights
    const currentCharts = currentSession?.dashboardContent?.customCharts

    // Pull saved analyses with dashboards for the same file, newest first
    const saved = dataPersistence
      .getAnalysisHistory()
      .filter((item) => item.fileName === fileName && item.dashboardContent?.aiDashboard)
      .sort((a, b) => b.timestamp - a.timestamp)

    const dashboardVersions = saved.map((item, idx) => ({
      id: item.id,
      timestamp: item.timestamp,
      content: item.dashboardContent!.aiDashboard,
      aiInsights: item.dashboardContent!.aiInsights || [],
      customCharts: item.dashboardContent!.customCharts || [],
      fileName: item.fileName,
      // saved versions start at 1, 2, 3 ... (0 reserved for current/unsaved)
      version: idx + 1,
    }))

    // Add current session as version 0 if it exists and is different than latest saved content
    if (currentDashboard && currentSession) {
      const isDifferentFromSaved = !dashboardVersions.some(
        (v) => JSON.stringify(v.content) === JSON.stringify(currentDashboard),
      )
      if (isDifferentFromSaved) {
        dashboardVersions.unshift({
          id: currentSession.currentAnalysisId || "current",
          timestamp: currentSession.timestamp || Date.now(),
          content: currentDashboard,
          aiInsights: currentInsights || [],
          customCharts: currentCharts || [],
          fileName,
          version: 0,
        })
      }
    }

    setVersions(dashboardVersions)
    setCurrentVersionIndex(0)
    setIsLoading(false)
  }

  const goToPreviousVersion = () => {
    setCurrentVersionIndex((prev) => Math.max(0, prev - 1))
  }

  const goToNextVersion = () => {
    setCurrentVersionIndex((prev) => Math.min(versions.length - 1, prev + 1))
  }

  const handleLoadVersion = (version: DashboardVersion) => {
    if (onLoadVersion) {
      onLoadVersion({
        aiDashboard: version.content,
        aiInsights: version.aiInsights || [],
        customCharts: version.customCharts || [],
      })
    }
  }

  const handleDeleteVersion = (versionId: string) => {
    if (versionId !== "current") {
      dataPersistence.deleteAnalysis(versionId)
      loadDashboardVersions()
    }
  }

  const exportVersion = (version: DashboardVersion) => {
    const exportData = {
      dashboard: version.content,
      aiInsights: version.aiInsights,
      customCharts: version.customCharts,
      metadata: {
        fileName: version.fileName,
        version: version.version,
        timestamp: version.timestamp,
      },
    }
    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `dashboard-${fileName}-v${version.version}-${new Date(version.timestamp).toISOString().split("T")[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <Card className="border-blue-200 bg-blue-50/30">
        <CardContent className="py-6">
          <div className="flex items-center gap-3">
            <Brain className="h-5 w-5 animate-pulse text-blue-600" />
            <span className="text-sm text-blue-700">Loading dashboard versions...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (versions.length === 0) {
    return (
      <Card className="border-gray-200 bg-gray-50/30">
        <CardContent className="py-8 text-center">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-600 mb-2">No dashboard versions found</p>
          <p className="text-xs text-gray-500">Generate your first dashboard to see it here</p>
        </CardContent>
      </Card>
    )
  }

  const currentVersion = versions[currentVersionIndex]

  return (
    <div className="space-y-4">
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg text-purple-900">
                {isVisible ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                Previously Generated Dashboards
              </CardTitle>
              <CardDescription className="text-purple-700">
                {versions.length} version{versions.length !== 1 ? "s" : ""} available for {fileName}
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center space-x-2">
                <Switch id="show-previous" checked={isVisible} onCheckedChange={setIsVisible} />
                <Label htmlFor="show-previous" className="text-sm text-purple-700">
                  Show Previous
                </Label>
              </div>
              <Button variant="outline" size="sm" onClick={loadDashboardVersions} className="gap-2 bg-transparent">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>

        {isVisible && (
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={goToPreviousVersion} disabled={currentVersionIndex === 0}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="text-center">
                  <Badge variant={currentVersion.version === 0 ? "default" : "secondary"} className="mb-1">
                    {currentVersion.version === 0 ? "Current" : `Version ${currentVersion.version}`}
                  </Badge>
                  <p className="text-xs text-gray-600">
                    {formatDistanceToNow(new Date(currentVersion.timestamp), { addSuffix: true })}
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextVersion}
                  disabled={currentVersionIndex === versions.length - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                {currentVersion.version !== 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleLoadVersion(currentVersion)}
                    className="gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Load Analysis
                  </Button>
                )}

                <Button variant="outline" size="sm" onClick={() => exportVersion(currentVersion)} className="gap-2">
                  <Download className="h-4 w-4" />
                  Export
                </Button>

                {currentVersion.version !== 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteVersion(currentVersion.id)}
                    className="gap-2 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Dashboard Content Display */}
      {isVisible && currentVersion.content && (
        <DashboardContentRenderer
          dashboard={currentVersion.content}
          aiInsights={currentVersion.aiInsights}
          customCharts={currentVersion.customCharts}
        />
      )}
    </div>
  )
}

export function DashboardContentRenderer({
  dashboard,
  aiInsights = [],
  customCharts = [],
}: {
  dashboard: any
  aiInsights?: any[]
  customCharts?: any[]
}) {
  const formatValue = (value: any): string => {
    if (typeof value === "number") {
      if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
      if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
      return value.toFixed(2)
    }
    return String(value)
  }

  const getIconComponent = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      Target,
      BarChart3,
      Brain,
      Info,
      MessageCircle,
      Sparkles,
      ArrowUpRight,
      ArrowDownRight,
      Minus,
    }
    return iconMap[iconName] || Target
  }

  return (
    <div className="space-y-6">
      {/* Executive Summary */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-3 text-lg text-blue-900">
            <Sparkles className="h-5 w-5" />
            Executive Summary
            <Badge variant="secondary" className="text-sm px-3 py-1">
              {dashboard.domainContext?.type?.toUpperCase() || "DATA"} ANALYSIS
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-blue-800 leading-relaxed">{dashboard.summary}</p>
        </CardContent>
      </Card>

      {/* KPI Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Target className="h-5 w-5" />
            Key Performance Indicators
          </h2>
        </div>
        <div className="grid grid-cols-6 gap-4">
          {dashboard.kpis?.map((kpi: any) => {
            const IconComponent = typeof kpi.icon === "string" ? getIconComponent(kpi.icon) : Target
            const TrendIcon =
              kpi.changeType === "increase" ? ArrowUpRight : kpi.changeType === "decrease" ? ArrowDownRight : Minus

            return (
              <Card key={kpi.id} className="relative overflow-hidden shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className="p-2 rounded-lg"
                      style={{
                        backgroundColor: `${kpi.color || "#3b82f6"}15`,
                        color: kpi.color || "#3b82f6",
                      }}
                    >
                      <IconComponent className="h-4 w-4" />
                    </div>
                    {kpi.change && (
                      <Badge
                        variant={
                          kpi.changeType === "increase"
                            ? "default"
                            : kpi.changeType === "decrease"
                              ? "destructive"
                              : "secondary"
                        }
                        className="text-xs h-6 px-2"
                      >
                        <TrendIcon className="h-3 w-3 mr-1" />
                        {Math.abs(kpi.change).toFixed(1)}%
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">{kpi.title}</p>
                    <p className="text-xl font-bold text-gray-900">{kpi.value}</p>
                    <p className="text-xs text-gray-500">{kpi.description}</p>
                  </div>
                </CardContent>
              </Card>
            )
          }) || []}
        </div>
      </div>

      {/* AI Insights */}
      {aiInsights.length > 0 && (
        <Card className="shadow-sm border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-lg text-purple-900">
              <MessageCircle className="h-5 w-5" />
              AI Insights
              <Badge variant="outline" className="ml-auto text-sm">
                {aiInsights.length} Insights
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-4">
              {aiInsights.slice(0, 4).map((insight: any, index: number) => (
                <div key={index} className="p-4 border rounded-lg bg-white shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                      <Info className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-gray-900 mb-1">{insight.title || insight.insight}</h4>
                      <p className="text-sm text-gray-700 mb-2">{insight.description || insight.explanation}</p>
                      {insight.confidence && (
                        <Badge variant="secondary" className="text-xs">
                          {insight.confidence}% confident
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dashboard Insights Summary */}
      <Card className="shadow-sm border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-lg text-purple-900">
            <MessageCircle className="h-5 w-5" />
            Dashboard Insights Summary
            <Badge variant="outline" className="ml-auto text-sm">
              {dashboard.insights?.length || 0} Insights
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-4">
            {dashboard.insights?.slice(0, 4).map((insight: any) => (
              <div key={insight.id} className="p-4 border rounded-lg bg-white shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                    <Info className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm text-gray-900 mb-1">{insight.title}</h4>
                    <p className="text-sm text-gray-700 mb-2">{insight.description}</p>
                    <Badge variant="secondary" className="text-xs">
                      {insight.confidence}% confident
                    </Badge>
                  </div>
                </div>
              </div>
            )) || []}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
