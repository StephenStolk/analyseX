"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { X, Send, FileText, BarChart3, Lightbulb, TrendingUp, Target, MessageSquare, Copy, Check } from "lucide-react"
import type { DashboardModuleType } from "@/lib/dashboard-types"

interface AIAssistantPanelProps {
  modules: DashboardModuleType[]
  data: any[]
  onClose: () => void
}

interface ChatMessage {
  id: string
  type: "user" | "assistant"
  content: string
  timestamp: Date
}

const QUICK_ACTIONS = [
  {
    id: "summarize",
    title: "Summarize Dashboard",
    description: "Generate executive summary",
    icon: FileText,
  },
  {
    id: "explain",
    title: "Explain Charts",
    description: "Simple explanations of each visualization",
    icon: BarChart3,
  },
  {
    id: "ppt",
    title: "Generate PPT Content",
    description: "Create presentation slides",
    icon: FileText,
  },
  {
    id: "suggest",
    title: "Suggest Analyses",
    description: "Recommend additional insights",
    icon: Lightbulb,
  },
  {
    id: "kpis",
    title: "Highlight KPIs",
    description: "Identify key performance indicators",
    icon: Target,
  },
  {
    id: "recommendations",
    title: "Actionable Recommendations",
    description: "Suggest next steps and actions",
    icon: TrendingUp,
  },
]

export function AIAssistantPanel({ modules, data, onClose }: AIAssistantPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Add welcome message
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          type: "assistant",
          content: `Hello! I'm your AI assistant. I can help you analyze your dashboard with ${modules.length} modules and provide insights based on your data. Use the quick actions below or ask me anything!`,
          timestamp: new Date(),
        },
      ])
    }
  }, [modules.length, messages.length])

  const handleQuickAction = async (actionId: string) => {
    setIsLoading(true)

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: "user",
      content: QUICK_ACTIONS.find((a) => a.id === actionId)?.title || actionId,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])

    // Simulate AI response based on dashboard data
    let response = ""

    switch (actionId) {
      case "summarize":
        response = generateDashboardSummary()
        break
      case "explain":
        response = generateChartExplanations()
        break
      case "ppt":
        response = generatePPTContent()
        break
      case "suggest":
        response = generateSuggestions()
        break
      case "kpis":
        response = generateKPIHighlights()
        break
      case "recommendations":
        response = generateRecommendations()
        break
      default:
        response = "I'm working on that feature. Please try another quick action or ask me a specific question!"
    }

    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        type: "assistant",
        content: response,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
      setIsLoading(false)
    }, 1500)
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: "user",
      content: inputValue,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        type: "assistant",
        content:
          "I understand your question. Based on your dashboard data, here's my analysis... (This would be connected to a real AI service in production)",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
      setIsLoading(false)
    }, 1500)
  }

  const handleCopyMessage = async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedMessageId(messageId)
      setTimeout(() => setCopiedMessageId(null), 2000)
    } catch (error) {
      console.error("Failed to copy message:", error)
    }
  }

  const generateDashboardSummary = () => {
    const moduleCount = modules.length
    const completedModules = modules.filter((m) => m.result).length

    return `## Dashboard Summary

**Overview:**
- Total modules: ${moduleCount}
- Completed analyses: ${completedModules}
- Data points analyzed: ${data.length}

**Key Findings:**
${
  modules
    .filter((m) => m.result?.type === "statistical")
    .map((m) => `- ${m.title}: ${m.result?.interpretation || "Analysis completed"}`)
    .join("\n") || "- No statistical analyses completed yet"
}

**Visualizations:**
${
  modules
    .filter((m) => m.result?.type === "chart")
    .map((m) => `- ${m.title}: Shows ${m.type.replace("-", " ")} visualization`)
    .join("\n") || "- No visualizations created yet"
}

This dashboard provides a comprehensive view of your data with both statistical insights and visual representations.`
  }

  const generateChartExplanations = () => {
    const chartModules = modules.filter((m) => m.result?.type === "chart")

    if (chartModules.length === 0) {
      return "No charts have been created yet. Add some visualizations to your dashboard first!"
    }

    return `## Chart Explanations

${chartModules
  .map(
    (module) => `
**${module.title}**
- Type: ${module.type.replace("-", " ").toUpperCase()}
- Purpose: ${getChartPurpose(module.type)}
- Data: Uses columns ${module.columns.join(", ")}
- Insight: ${getChartInsight(module.type)}
`,
  )
  .join("\n")}

These visualizations help you understand different aspects of your data through various chart types.`
  }

  const generatePPTContent = () => {
    return `## PowerPoint Presentation Content

**Slide 1: Dashboard Overview**
- Title: Data Analysis Dashboard
- ${modules.length} analytical modules
- ${data.length} data points analyzed

**Slide 2: Key Statistical Findings**
${
  modules
    .filter((m) => m.result?.type === "statistical")
    .map((m, i) => `- Finding ${i + 1}: ${m.title} - ${m.result?.interpretation?.substring(0, 100)}...`)
    .join("\n") || "- No statistical analyses to present"
}

**Slide 3: Visual Insights**
${
  modules
    .filter((m) => m.result?.type === "chart")
    .map((m, i) => `- Chart ${i + 1}: ${m.title} showing ${m.type.replace("-", " ")} analysis`)
    .join("\n") || "- No visualizations to present"
}

**Slide 4: Recommendations**
- Continue monitoring key metrics
- Consider additional analyses based on findings
- Regular dashboard updates recommended

Copy this content and paste it into your PowerPoint presentation!`
  }

  const generateSuggestions = () => {
    const hasStatistical = modules.some((m) => m.result?.type === "statistical")
    const hasCharts = modules.some((m) => m.result?.type === "chart")

    return `## Suggested Additional Analyses

**Based on your current dashboard:**

${!hasStatistical ? "- Add statistical tests (T-test, ANOVA, Correlation) to validate findings" : ""}
${!hasCharts ? "- Create visualizations to better understand data patterns" : ""}
- Consider time series analysis if you have date/time data
- Add correlation matrix to explore variable relationships
- Include outlier detection analysis
- Create comparison charts between different groups
- Add trend analysis for temporal data

**Advanced suggestions:**
- Regression analysis for predictive insights
- Clustering analysis to identify data segments
- Principal Component Analysis (PCA) for dimensionality reduction

These analyses would provide deeper insights into your data patterns and relationships.`
  }

  const generateKPIHighlights = () => {
    return `## Key Performance Indicators (KPIs)

**Data Quality KPIs:**
- Dataset size: ${data.length} records
- Completeness: ${calculateDataCompleteness()}%
- Analysis coverage: ${modules.filter((m) => m.result).length}/${modules.length} modules completed

**Statistical KPIs:**
${
  modules
    .filter((m) => m.result?.type === "statistical")
    .map((m) => {
      const stats = m.result?.statistics
      if (stats) {
        return `- ${m.title}: ${Object.entries(stats)
          .map(([key, value]) => `${key}: ${typeof value === "number" ? value.toFixed(3) : value}`)
          .join(", ")}`
      }
      return `- ${m.title}: Analysis in progress`
    })
    .join("\n") || "- No statistical KPIs available yet"
}

**Performance Indicators:**
- Dashboard utilization: ${((modules.filter((m) => m.result).length / Math.max(modules.length, 1)) * 100).toFixed(1)}%
- Analysis depth: ${modules.length > 5 ? "Comprehensive" : modules.length > 2 ? "Moderate" : "Basic"}

These KPIs help track the effectiveness and completeness of your data analysis.`
  }

  const generateRecommendations = () => {
    const completedModules = modules.filter((m) => m.result).length

    return `## Actionable Recommendations

**Immediate Actions:**
${completedModules < modules.length ? "- Complete remaining analyses to get full insights" : "- All analyses completed - review findings"}
- Export key findings for stakeholder presentation
- Document methodology and assumptions used

**Data Strategy:**
- Establish regular data collection and analysis cycles
- Create automated reporting for key metrics
- Set up data quality monitoring processes

**Business Impact:**
- Use statistical findings to inform decision-making
- Share visualizations with relevant teams
- Implement changes based on correlation findings

**Next Steps:**
1. Review all completed analyses for actionable insights
2. Prioritize findings based on business impact
3. Create action plans for significant discoveries
4. Schedule follow-up analyses to track changes
5. Consider expanding dataset for more robust conclusions

**Long-term Strategy:**
- Build predictive models based on current findings
- Establish benchmarks for ongoing monitoring
- Create dashboard templates for similar analyses

These recommendations will help you maximize the value of your data analysis efforts.`
  }

  const getChartPurpose = (type: string) => {
    switch (type) {
      case "line-chart":
        return "Show trends and changes over time"
      case "bar-chart":
        return "Compare values across different categories"
      case "scatter-plot":
        return "Explore relationships between two variables"
      case "pie-chart":
        return "Display proportions of a whole"
      default:
        return "Visualize data patterns"
    }
  }

  const getChartInsight = (type: string) => {
    switch (type) {
      case "line-chart":
        return "Reveals temporal patterns and trends"
      case "bar-chart":
        return "Highlights differences between groups"
      case "scatter-plot":
        return "Shows correlation and outliers"
      case "pie-chart":
        return "Emphasizes relative proportions"
      default:
        return "Provides visual data understanding"
    }
  }

  const calculateDataCompleteness = () => {
    if (data.length === 0) return 0
    const totalFields = data.length * Object.keys(data[0] || {}).length
    const filledFields = data.reduce(
      (acc, row) => acc + Object.values(row).filter((val) => val !== null && val !== undefined && val !== "").length,
      0,
    )
    return Math.round((filledFields / totalFields) * 100)
  }

  const completedModules = modules.filter((m) => m.result).length

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">AI Assistant</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-b">
        <h4 className="text-sm font-medium mb-3">Quick Actions</h4>
        <div className="grid grid-cols-2 gap-2">
          {QUICK_ACTIONS.map((action) => {
            const IconComponent = action.icon
            return (
              <Button
                key={action.id}
                variant="outline"
                size="sm"
                className="h-auto p-2 text-left justify-start bg-transparent"
                onClick={() => handleQuickAction(action.id)}
                disabled={isLoading}
              >
                <div className="flex items-start gap-2">
                  <IconComponent className="h-3 w-3 mt-0.5 text-primary" />
                  <div className="min-w-0">
                    <div className="text-xs font-medium">{action.title}</div>
                    <div className="text-xs text-muted-foreground">{action.description}</div>
                  </div>
                </div>
              </Button>
            )
          })}
        </div>
      </div>

      {/* Chat Messages */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] ${message.type === "user" ? "order-2" : "order-1"}`}>
                <Card className={message.type === "user" ? "bg-primary text-primary-foreground" : ""}>
                  <CardContent className="p-3">
                    <div className="prose prose-sm max-w-none">
                      {message.content.split("\n").map((line, i) => (
                        <div key={i}>
                          {line.startsWith("##") ? (
                            <h3 className="text-sm font-semibold mt-2 mb-1">{line.replace("##", "").trim()}</h3>
                          ) : line.startsWith("**") && line.endsWith("**") ? (
                            <p className="font-medium text-sm">{line.replace(/\*\*/g, "")}</p>
                          ) : line.startsWith("-") ? (
                            <p className="text-sm ml-2">{line}</p>
                          ) : (
                            <p className="text-sm">{line}</p>
                          )}
                        </div>
                      ))}
                    </div>
                    {message.type === "assistant" && (
                      <div className="flex justify-end mt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyMessage(message.id, message.content)}
                          className="h-6 px-2"
                        >
                          {copiedMessageId === message.id ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
                <div className="text-xs text-muted-foreground mt-1 px-1">{message.timestamp.toLocaleTimeString()}</div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <span className="text-sm text-muted-foreground">AI is thinking...</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask me about your dashboard..."
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            disabled={isLoading}
          />
          <Button onClick={handleSendMessage} disabled={isLoading || !inputValue.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
