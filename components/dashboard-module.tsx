"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Trash2,
  MoreHorizontal,
  GripHorizontal,
  BarChart3,
  LineChart,
  ScatterChart,
  PieChart,
  Calculator,
  FileText,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  ScatterChart as RechartsScatterChart,
  Scatter,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"
import type { DashboardModuleType } from "@/lib/dashboard-types"

interface DashboardModuleProps {
  module: DashboardModuleType
  onDelete: (id: string) => void
  onResize: (id: string, size: { width: number; height: number }) => void
  onMove: (id: string, position: { x: number; y: number }) => void
}

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
]

export function DashboardModule({ module, onDelete, onResize, onMove }: DashboardModuleProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 })
  const moduleRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = (e: React.MouseEvent, action: "drag" | "resize") => {
    e.preventDefault()

    if (action === "drag") {
      setIsDragging(true)
      setDragStart({
        x: e.clientX - module.position.x,
        y: e.clientY - module.position.y,
      })
    } else if (action === "resize") {
      setIsResizing(true)
      setResizeStart({
        x: e.clientX,
        y: e.clientY,
        width: module.size.width,
        height: module.size.height,
      })
    }
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newPosition = {
          x: Math.max(0, e.clientX - dragStart.x),
          y: Math.max(0, e.clientY - dragStart.y),
        }
        onMove(module.id, newPosition)
      } else if (isResizing) {
        const newSize = {
          width: Math.max(200, resizeStart.width + (e.clientX - resizeStart.x)),
          height: Math.max(150, resizeStart.height + (e.clientY - resizeStart.y)),
        }
        onResize(module.id, newSize)
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setIsResizing(false)
    }

    if (isDragging || isResizing) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, isResizing, dragStart, resizeStart, module.id, onMove, onResize])

  const renderModuleContent = () => {
    if (!module.result) {
      return (
        <div className="flex items-center justify-center h-32 text-muted-foreground">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm">Processing...</p>
          </div>
        </div>
      )
    }

    switch (module.result.type) {
      case "chart":
        return renderChart()
      case "statistical":
        return renderStatisticalResult()
      case "text":
        return renderTextContent()
      case "table":
        return renderTable()
      default:
        return (
          <div className="p-4 text-center text-muted-foreground">
            <p>Module content will appear here</p>
          </div>
        )
    }
  }

  const renderChart = () => {
    if (!module.result?.data) return null

    const chartData = module.result.data
    const chartType = module.result.chartType || module.type

    switch (chartType) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={module.size.height - 120}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="x" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="y" fill={CHART_COLORS[0]} />
            </BarChart>
          </ResponsiveContainer>
        )

      case "line":
        return (
          <ResponsiveContainer width="100%" height={module.size.height - 120}>
            <RechartsLineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="x" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="y" stroke={CHART_COLORS[0]} strokeWidth={2} />
            </RechartsLineChart>
          </ResponsiveContainer>
        )

      case "scatter":
        return (
          <ResponsiveContainer width="100%" height={module.size.height - 120}>
            <RechartsScatterChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="x" />
              <YAxis dataKey="y" />
              <Tooltip />
              <Legend />
              <Scatter data={chartData} fill={CHART_COLORS[0]} />
            </RechartsScatterChart>
          </ResponsiveContainer>
        )

      case "pie":
        return (
          <ResponsiveContainer width="100%" height={module.size.height - 120}>
            <RechartsPieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill={CHART_COLORS[0]}
                dataKey="value"
              >
                {chartData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </RechartsPieChart>
          </ResponsiveContainer>
        )

      default:
        return <div className="p-4 text-center">Chart type not supported</div>
    }
  }

  const renderStatisticalResult = () => {
    const result = module.result

    return (
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(result.statistics || {}).map(([key, value]) => (
            <div key={key} className="text-center">
              <div className="text-2xl font-bold text-primary">
                {typeof value === "number" ? value.toFixed(4) : value}
              </div>
              <div className="text-sm text-muted-foreground capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</div>
            </div>
          ))}
        </div>

        {result.interpretation && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2">Interpretation</h4>
            <p className="text-sm text-muted-foreground">{result.interpretation}</p>
          </div>
        )}
      </div>
    )
  }

  const renderTextContent = () => {
    return (
      <div className="p-4">
        <div className="prose prose-sm max-w-none">{module.result.content}</div>
      </div>
    )
  }

  const renderTable = () => {
    const data = module.result.data
    if (!data || !Array.isArray(data) || data.length === 0) return null

    const headers = Object.keys(data[0])

    return (
      <div className="p-4">
        <div className="overflow-auto max-h-64">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                {headers.map((header) => (
                  <th key={header} className="text-left p-2 font-medium">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.slice(0, 10).map((row, index) => (
                <tr key={index} className="border-b">
                  {headers.map((header) => (
                    <td key={header} className="p-2">
                      {typeof row[header] === "number" ? row[header].toFixed(2) : row[header]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const getModuleIcon = () => {
    switch (module.type) {
      case "bar-chart":
        return BarChart3
      case "line-chart":
        return LineChart
      case "scatter-plot":
        return ScatterChart
      case "pie-chart":
        return PieChart
      case "t-test":
      case "chi-square":
      case "anova":
      case "correlation":
        return Calculator
      case "text-annotation":
      case "title-block":
        return FileText
      default:
        return BarChart3
    }
  }

  const ModuleIcon = getModuleIcon()

  return (
    <Card
      ref={moduleRef}
      className={`absolute border-2 ${isDragging ? "border-primary shadow-lg" : "border-border"} ${isResizing ? "border-blue-500" : ""}`}
      style={{
        left: module.position.x,
        top: module.position.y,
        width: module.size.width,
        height: module.size.height,
        cursor: isDragging ? "grabbing" : "default",
      }}
    >
      <CardHeader className="pb-2 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
              onMouseDown={(e) => handleMouseDown(e, "drag")}
            >
              <GripHorizontal className="h-4 w-4 text-muted-foreground" />
            </div>
            <ModuleIcon className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-medium">{module.title}</CardTitle>
          </div>

          <div className="flex items-center gap-1">
            <Badge variant="outline" className="text-xs">
              {module.type}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onDelete(module.id)} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="p-0 overflow-hidden">{renderModuleContent()}</CardContent>

      {/* Resize Handle */}
      <div
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize bg-muted hover:bg-muted-foreground/20 transition-colors"
        onMouseDown={(e) => handleMouseDown(e, "resize")}
      >
        <div className="absolute bottom-1 right-1 w-2 h-2 border-r-2 border-b-2 border-muted-foreground/50"></div>
      </div>
    </Card>
  )
}
