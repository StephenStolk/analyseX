"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  Menu,
  X,
  BarChart3,
  LineChart,
  ScatterChart,
  PieChart,
  Calculator,
  FileText,
  TrendingUp,
  GitCompare,
  MessageSquare,
  Sparkles,
  Save,
  Maximize2,
  Minimize2,
} from "lucide-react"
import { DashboardModule } from "./dashboard-module"
import { ModuleConfigDialog } from "./module-config-dialog"
import { AIAssistantPanel } from "./ai-assistant-panel"
import type { DashboardModuleType, ModuleTemplate } from "@/lib/dashboard-types"
import { generateVisualization, performStatisticalTest } from "@/lib/statistical-engine"

interface CustomizableDashboardProps {
  data: any[]
  numericColumns: string[]
  categoricalColumns: string[]
  onClose?: () => void
}

const MODULE_TEMPLATES: ModuleTemplate[] = [
  // Statistical Analyses
  {
    id: "t-test",
    title: "T-Test",
    description: "Compare averages between two groups",
    category: "Statistical Analyses",
    icon: Calculator,
    type: "t-test",
    requiredColumns: { numeric: 1, categorical: 1 },
  },
  {
    id: "chi-square",
    title: "Chi-Square Test",
    description: "Test independence between categorical variables",
    category: "Statistical Analyses",
    icon: Calculator,
    type: "chi-square",
    requiredColumns: { categorical: 2 },
  },
  {
    id: "anova",
    title: "ANOVA",
    description: "Compare means across multiple groups",
    category: "Statistical Analyses",
    icon: Calculator,
    type: "anova",
    requiredColumns: { numeric: 1, categorical: 1 },
  },
  {
    id: "correlation",
    title: "Correlation Analysis",
    description: "Measure relationship between two variables",
    category: "Statistical Analyses",
    icon: Calculator,
    type: "correlation",
    requiredColumns: { numeric: 2 },
  },
  // Visualizations
  {
    id: "line-chart",
    title: "Line Chart",
    description: "Show trends over time or continuous data",
    category: "Visualizations",
    icon: LineChart,
    type: "line-chart",
    requiredColumns: { numeric: 2 },
  },
  {
    id: "bar-chart",
    title: "Bar Chart",
    description: "Compare values across categories",
    category: "Visualizations",
    icon: BarChart3,
    type: "bar-chart",
    requiredColumns: { numeric: 1, categorical: 1 },
  },
  {
    id: "scatter-plot",
    title: "Scatter Plot",
    description: "Explore relationships between two variables",
    category: "Visualizations",
    icon: ScatterChart,
    type: "scatter-plot",
    requiredColumns: { numeric: 2 },
  },
  {
    id: "pie-chart",
    title: "Pie Chart",
    description: "Show proportions of a whole",
    category: "Visualizations",
    icon: PieChart,
    type: "pie-chart",
    requiredColumns: { categorical: 1 },
  },
  // Comparisons
  {
    id: "two-column-comparison",
    title: "Two-Column Comparison",
    description: "Side-by-side comparison of two metrics",
    category: "Comparisons",
    icon: GitCompare,
    type: "comparison",
    requiredColumns: { numeric: 2 },
  },
  {
    id: "multi-series-overlay",
    title: "Multi-Series Overlay",
    description: "Overlay multiple data series on one chart",
    category: "Comparisons",
    icon: TrendingUp,
    type: "multi-series",
    requiredColumns: { numeric: 2 },
  },
  // Text/Annotations
  {
    id: "text-annotation",
    title: "Text Annotation",
    description: "Add custom notes and explanations",
    category: "Text/Annotations",
    icon: FileText,
    type: "text-annotation",
    requiredColumns: {},
  },
  {
    id: "title-block",
    title: "Title Block",
    description: "Add section titles and headers",
    category: "Text/Annotations",
    icon: MessageSquare,
    type: "title-block",
    requiredColumns: {},
  },
]

export function CustomizableDashboard({
  data,
  numericColumns,
  categoricalColumns,
  onClose,
}: CustomizableDashboardProps) {
  const [modules, setModules] = useState<DashboardModuleType[]>([])
  const [isMenuOpen, setIsMenuOpen] = useState(true)
  const [isAIOpen, setIsAIOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<ModuleTemplate | null>(null)
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date>(new Date())

  // Auto-save functionality
  useEffect(() => {
    const interval = setInterval(() => {
      if (modules.length > 0) {
        localStorage.setItem("dashboard-modules", JSON.stringify(modules))
        setLastSaved(new Date())
      }
    }, 30000) // Save every 30 seconds

    return () => clearInterval(interval)
  }, [modules])

  // Load saved modules on mount
  useEffect(() => {
    const saved = localStorage.getItem("dashboard-modules")
    if (saved) {
      try {
        setModules(JSON.parse(saved))
      } catch (error) {
        console.error("Failed to load saved modules:", error)
      }
    }
  }, [])

  const handleAddModule = useCallback((template: ModuleTemplate) => {
    setSelectedTemplate(template)
    setIsConfigDialogOpen(true)
  }, [])

  const handleModuleConfigured = useCallback(
    async (template: ModuleTemplate, columns: string[], parameters: Record<string, any>) => {
      const newModule: DashboardModuleType = {
        id: `${template.type}-${Date.now()}`,
        type: template.type,
        title: template.title,
        position: { x: 50 + modules.length * 20, y: 50 + modules.length * 20 },
        size: { width: 400, height: 300 },
        columns,
        parameters,
        result: null,
      }

      setModules((prev) => [...prev, newModule])
      setIsConfigDialogOpen(false)
      setSelectedTemplate(null)

      // Execute the module
      try {
        let result
        if (template.category === "Statistical Analyses") {
          result = await performStatisticalTest(template.type, data, columns, parameters)
        } else if (template.category === "Visualizations") {
          result = await generateVisualization(template.type, data, columns, parameters)
        } else if (template.category === "Text/Annotations") {
          result = {
            type: "text" as const,
            content: parameters.content || "Add your text here...",
          }
        } else {
          result = {
            type: "text" as const,
            content: "Module type not implemented yet",
          }
        }

        setModules((prev) => prev.map((module) => (module.id === newModule.id ? { ...module, result } : module)))
      } catch (error) {
        console.error("Error executing module:", error)
        setModules((prev) =>
          prev.map((module) =>
            module.id === newModule.id
              ? {
                  ...module,
                  result: {
                    type: "text",
                    content: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
                  },
                }
              : module,
          ),
        )
      }
    },
    [data, modules.length],
  )

  const handleDeleteModule = useCallback((id: string) => {
    setModules((prev) => prev.filter((module) => module.id !== id))
  }, [])

  const handleResizeModule = useCallback((id: string, size: { width: number; height: number }) => {
    setModules((prev) => prev.map((module) => (module.id === id ? { ...module, size } : module)))
  }, [])

  const handleMoveModule = useCallback((id: string, position: { x: number; y: number }) => {
    setModules((prev) => prev.map((module) => (module.id === id ? { ...module, position } : module)))
  }, [])

  const handleSaveManually = () => {
    localStorage.setItem("dashboard-modules", JSON.stringify(modules))
    setLastSaved(new Date())
  }

  const groupedTemplates = MODULE_TEMPLATES.reduce(
    (acc, template) => {
      if (!acc[template.category]) {
        acc[template.category] = []
      }
      acc[template.category].push(template)
      return acc
    },
    {} as Record<string, ModuleTemplate[]>,
  )

  return (
    <div className={`relative ${isFullscreen ? "fixed inset-0 z-50 bg-background" : "h-screen"}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-4">
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <Menu className="h-4 w-4" />
                <span className="ml-2">Modules</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <div className="py-4">
                <h3 className="text-lg font-semibold mb-4">Analysis Modules</h3>
                <ScrollArea className="h-[calc(100vh-120px)]">
                  <div className="space-y-6">
                    {Object.entries(groupedTemplates).map(([category, templates]) => (
                      <div key={category}>
                        <h4 className="font-medium text-sm text-muted-foreground mb-3">{category}</h4>
                        <div className="space-y-2">
                          {templates.map((template) => {
                            const IconComponent = template.icon
                            return (
                              <Card
                                key={template.id}
                                className="cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => handleAddModule(template)}
                              >
                                <CardContent className="p-3">
                                  <div className="flex items-start gap-3">
                                    <IconComponent className="h-5 w-5 text-primary mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                      <h5 className="font-medium text-sm">{template.title}</h5>
                                      <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">Custom Visualization Dashboard</h1>
            <Badge variant="outline">{modules.length} modules</Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleSaveManually}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          <span className="text-xs text-muted-foreground">Last saved: {lastSaved.toLocaleTimeString()}</span>

          <Separator orientation="vertical" className="h-6" />

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAIOpen(!isAIOpen)}
            className={isAIOpen ? "bg-primary text-primary-foreground" : ""}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            AI Assistant
          </Button>

          <Button variant="outline" size="sm" onClick={() => setIsFullscreen(!isFullscreen)}>
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>

          {onClose && (
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex h-[calc(100%-73px)]">
        {/* Main Dashboard Area */}
        <div className="flex-1 relative overflow-hidden bg-muted/20">
          {modules.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">Start Building Your Dashboard</h3>
                <p className="text-muted-foreground mb-4">
                  Drag modules from the left panel to create your custom analysis dashboard
                </p>
                <Button onClick={() => setIsMenuOpen(true)}>
                  <Menu className="h-4 w-4 mr-2" />
                  Open Module Panel
                </Button>
              </div>
            </div>
          ) : (
            <div className="relative w-full h-full">
              {modules.map((module) => (
                <DashboardModule
                  key={module.id}
                  module={module}
                  onDelete={handleDeleteModule}
                  onResize={handleResizeModule}
                  onMove={handleMoveModule}
                />
              ))}
            </div>
          )}
        </div>

        {/* AI Assistant Panel */}
        {isAIOpen && (
          <div className="w-80 border-l bg-background">
            <AIAssistantPanel modules={modules} data={data} onClose={() => setIsAIOpen(false)} />
          </div>
        )}
      </div>

      {/* Module Configuration Dialog */}
      {selectedTemplate && (
        <ModuleConfigDialog
          open={isConfigDialogOpen}
          onOpenChange={setIsConfigDialogOpen}
          template={selectedTemplate}
          numericColumns={numericColumns}
          categoricalColumns={categoricalColumns}
          onConfigured={handleModuleConfigured}
        />
      )}
    </div>
  )
}
