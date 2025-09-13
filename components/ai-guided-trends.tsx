"use client"

import type React from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import {
  Brain,
  TrendingUp,
  BarChart3,
  Lightbulb,
  ArrowRight,
  Sparkles,
  MessageCircle,
  Send,
  User,
  Bot,
  Database,
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface AIGuidedTrendsProps {
  data: any[]
  numericColumns: string[]
  categoricalColumns: string[]
  dateColumns: string[]
}

interface QuestionnaireStep {
  id: string
  question: string
  description: string
  options: { value: string; label: string; description: string }[]
  icon: React.ReactNode
}

interface AnalysisResult {
  method: string
  explanation: string
  insights: string[]
  recommendations: string[]
  chartType: string
  columns: string[]
}

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export function AIGuidedTrends({ data, numericColumns, categoricalColumns, dateColumns }: AIGuidedTrendsProps) {
  console.log("[v0] AIGuidedTrends received data:", {
    dataLength: data.length,
    numericColumnsLength: numericColumns.length,
    categoricalColumnsLength: categoricalColumns.length,
    dateColumnsLength: dateColumns.length,
    firstFewRows: data.slice(0, 3),
    lastFewRows: data.slice(-3),
  })

  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])
  const [customQuestion, setCustomQuestion] = useState("")
  const [showChat, setShowChat] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [currentMessage, setCurrentMessage] = useState("")
  const [isSendingMessage, setIsSendingMessage] = useState(false)

  const questionnaire: QuestionnaireStep[] = [
    {
      id: "goal",
      question: "What would you like to discover about your data?",
      description: "Tell us your main business question in simple terms",
      icon: <TrendingUp className="h-5 w-5" />,
      options: [
        {
          value: "profit_drivers",
          label: "What drives my profits/sales?",
          description: "Find which factors most influence your key business metrics",
        },
        {
          value: "seasonal_patterns",
          label: "Are there seasonal patterns?",
          description: "Discover if your data shows recurring time-based trends",
        },
        {
          value: "hidden_patterns",
          label: "Find hidden patterns across products/categories",
          description: "Uncover groupings and relationships you might not see",
        },
        {
          value: "compare_groups",
          label: "Compare different categories or groups",
          description: "See if there are significant differences between segments",
        },
        {
          value: "predict_future",
          label: "Predict future trends",
          description: "Forecast what might happen based on historical patterns",
        },
        {
          value: "custom",
          label: "I have a specific question",
          description: "Ask your own business question in plain language",
        },
      ],
    },
    {
      id: "focus",
      question: "Which data should we focus on?",
      description: "Select the columns that are most important for your analysis",
      icon: <BarChart3 className="h-5 w-5" />,
      options: [], // Will be populated dynamically based on data
    },
    {
      id: "detail_level",
      question: "How detailed should the analysis be?",
      description: "Choose the depth of analysis that matches your needs",
      icon: <Brain className="h-5 w-5" />,
      options: [
        {
          value: "simple",
          label: "Keep it simple",
          description: "Quick insights with easy-to-understand explanations",
        },
        {
          value: "detailed",
          label: "Give me details",
          description: "Comprehensive analysis with statistical explanations",
        },
        {
          value: "actionable",
          label: "Focus on actions",
          description: "Practical recommendations I can implement",
        },
      ],
    },
  ]

  const handleAnswerChange = (stepId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [stepId]: value }))
  }

  const handleNext = () => {
    if (currentStep < questionnaire.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      performAIAnalysis()
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const mapAnswersToMethod = (answers: Record<string, string>) => {
    const goal = answers.goal

    switch (goal) {
      case "profit_drivers":
        return {
          method: "regression_feature_importance",
          description:
            "We'll use Regression Analysis combined with Feature Importance to identify what drives your key metrics.",
          chartType: "scatter_regression",
          needsTarget: true,
        }
      case "seasonal_patterns":
        return {
          method: "time_series",
          description: "We'll perform Time Series Analysis to detect seasonal patterns and trends over time.",
          chartType: "line_time_series",
          needsDateColumn: true,
        }
      case "hidden_patterns":
        return {
          method: "pca_clustering",
          description:
            "We'll use Principal Component Analysis (PCA) and Clustering to find hidden patterns and groupings.",
          chartType: "scatter_clusters",
          needsMultipleNumeric: true,
        }
      case "compare_groups":
        return {
          method: "statistical_tests",
          description:
            "We'll run Statistical Tests (ANOVA/Chi-Square) to compare groups and find significant differences.",
          chartType: "box_plot_comparison",
          needsCategorical: true,
        }
      case "predict_future":
        return {
          method: "time_series_forecast",
          description: "We'll create forecasting models to predict future trends based on your historical data.",
          chartType: "line_forecast",
          needsDateColumn: true,
        }
      case "custom":
        return {
          method: "ai_interpretation",
          description: "We'll analyze your custom question and recommend the best statistical approach.",
          chartType: "mixed",
          needsAI: true,
        }
      default:
        return {
          method: "exploratory",
          description: "We'll perform exploratory data analysis to uncover general insights.",
          chartType: "mixed",
          needsGeneral: true,
        }
    }
  }

  const performAIAnalysis = async () => {
    setIsAnalyzing(true)

    try {
      const methodInfo = mapAnswersToMethod(answers)

      console.log("[v0] About to send to API:", {
        dataLength: data.length,
        selectedColumnsLength: selectedColumns.length,
        actualDataSample: data.slice(0, 2),
        dataSummaryTotalRows: data.length,
      })

      const dataSummary = {
        totalRows: data.length,
        numericColumns: numericColumns,
        categoricalColumns: categoricalColumns,
        dateColumns: dateColumns,
        selectedColumns: selectedColumns,
        sampleData: data.slice(0, 3),
      }

      const prompt = `You are a senior data analyst providing intelligent business insights based on REAL statistical calculations performed on a ${data.length}-row dataset.

ANALYSIS CONTEXT:
- User's Goal: ${questionnaire[0].options.find((opt) => opt.value === answers.goal)?.label}
- Analysis Method: ${methodInfo.description}
- Detail Level: ${answers.detail_level}
- Dataset Size: ${data.length} rows (confirmed actual count)
- Numeric columns: ${numericColumns.join(", ")}
- Selected columns: ${selectedColumns.join(", ")}

${answers.goal === "custom" ? `Custom Question: ${customQuestion}` : ""}

RESPONSE FORMAT REQUIREMENTS:
1. Use numbered sections with clear headers (1. Header Name, 2. Header Name, etc.)
2. Provide specific numerical insights based on actual calculations
3. Include statistical measures (means, medians, correlations, trends) with exact values
4. Explain business implications of mathematical findings
5. Use **bold** for key metrics and important terms
6. Keep explanations business-friendly but mathematically grounded

MATHEMATICAL FOCUS:
- Reference actual calculated statistics (not hypothetical examples)
- Explain what the numbers mean for business decisions
- Identify patterns, trends, and anomalies in the data
- Provide confidence levels and statistical significance where relevant
- Suggest actionable insights based on mathematical evidence

The backend has performed real statistical analysis on your data. Interpret these results with business intelligence.`

      const response = await fetch("/api/ai-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          dataSummary,
          answers,
          customQuestion,
          actualData: data, // Pass actual data for backend analysis
        }),
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      const aiResponse = await response.json()
      const aiContent = aiResponse.choices[0]?.message?.content || "Analysis completed successfully."

      const result: AnalysisResult = {
        method: methodInfo.method,
        explanation: aiContent,
        insights: [
          `Analysis performed on ${data.length} actual data rows`,
          `${aiResponse.metadata?.hasRealResults ? "Real statistical calculations completed" : "Methodology explanation provided"}`,
          `Analysis type: ${aiResponse.intent?.analysisType || methodInfo.method}`,
        ],
        recommendations: [
          "Review the detailed analysis results",
          "Consider running additional analyses on related data",
          "Use insights to inform business decisions",
        ],
        chartType: methodInfo.chartType,
        columns: selectedColumns,
      }

      setAnalysisResult(result)

      toast({
        title: "AI Analysis Complete",
        description: `Analysis completed on ${data.length} rows with ${aiResponse.metadata?.hasRealResults ? "real calculations" : "methodology guidance"}!`,
      })
    } catch (error) {
      console.error("AI Analysis error:", error)
      toast({
        title: "Analysis Error",
        description: "There was an issue with the AI analysis. Please try again.",
        variant: "destructive",
      })

      const methodInfo = mapAnswersToMethod(answers)
      const fallbackResult: AnalysisResult = {
        method: methodInfo.method,
        explanation: `Based on your goal to "${questionnaire[0].options.find((opt) => opt.value === answers.goal)?.label}", we recommend ${methodInfo.description}`,
        insights: [
          "Your data contains patterns that can be analyzed using statistical methods",
          "The recommended approach will help answer your business question",
          "Results will be presented in easy-to-understand language",
        ],
        recommendations: [
          "Proceed with the recommended statistical analysis",
          "Focus on the most relevant data columns",
          "Interpret results in the context of your business goals",
        ],
        chartType: methodInfo.chartType,
        columns: selectedColumns,
      }
      setAnalysisResult(fallbackResult)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const resetQuestionnaire = () => {
    setCurrentStep(0)
    setAnswers({})
    setAnalysisResult(null)
    setSelectedColumns([])
    setCustomQuestion("")
    setShowChat(false)
    setChatMessages([])
    setCurrentMessage("")
  }

  const sendFollowUpMessage = async () => {
    if (!currentMessage.trim() || isSendingMessage) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: currentMessage.trim(),
      timestamp: new Date(),
    }

    setChatMessages((prev) => [...prev, userMessage])
    setCurrentMessage("")
    setIsSendingMessage(true)

    try {
      const context = `
Previous Analysis Context:
- Dataset: ${data.length} rows (actual count)
- User's Goal: ${questionnaire[0].options.find((opt) => opt.value === answers.goal)?.label}
- Analysis Method: ${analysisResult?.method}
- Columns analyzed: ${selectedColumns.join(", ")}
- Data types: Numeric (${numericColumns.join(", ")}), Categorical (${categoricalColumns.join(", ")})

Previous Analysis Results:
${analysisResult?.explanation}

Chat History:
${chatMessages.map((msg) => `${msg.role}: ${msg.content}`).join("\n")}

Current Follow-up Question: ${currentMessage.trim()}

Provide a helpful, conversational response that builds on the previous analysis. Reference specific data characteristics when relevant.`

      const response = await fetch("/api/ai-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: context,
          isFollowUp: true,
          dataSummary: {
            totalRows: data.length,
            numericColumns,
            categoricalColumns,
            dateColumns,
            selectedColumns,
          },
          actualData: data, // Include actual data for follow-up context
        }),
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      const aiResponse = await response.json()
      const aiContent =
        aiResponse.choices[0]?.message?.content || "I understand your question. Let me help clarify that for you."

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiContent,
        timestamp: new Date(),
      }

      setChatMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Follow-up message error:", error)
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I apologize, but I'm having trouble processing your question right now. Could you try rephrasing it?",
        timestamp: new Date(),
      }
      setChatMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsSendingMessage(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendFollowUpMessage()
    }
  }

  const formatAIResponse = (content: string) => {
    return (
      <div className="prose prose-gray dark:prose-invert max-w-none">
        <div className="space-y-4">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => (
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">{children}</h1>
              ),
            h2: ({ children }) => (
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{children}</h3>
            ),
            p: ({ children }) => <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">{children}</p>,
            ul: ({ children }) => <ul className="space-y-2 mb-4">{children}</ul>,
            li: ({ children }) => (
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">{children}</span>
              </li>
            ),
            strong: ({ children }) => (
              <strong className="font-semibold text-gray-900 dark:text-gray-100">{children}</strong>
            ),
            code: ({ children }) => (
              <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm font-mono">{children}</code>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-primary pl-4 italic text-gray-600 dark:text-gray-400">
                {children}
              </blockquote>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
        </div>
      </div>
    )
  }

  const formatChatMessage = (content: string) => {
    return (
      <div className="prose prose-sm prose-gray dark:prose-invert max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ children }) => <p className="text-sm leading-relaxed mb-2 last:mb-0">{children}</p>,
            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
            ul: ({ children }) => <ul className="space-y-1 mb-2">{children}</ul>,
            li: ({ children }) => (
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>{children}</span>
              </li>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    )
  }

  if (analysisResult) {
    return (
      <div className="space-y-6">
        <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 dark:border-green-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
              <Sparkles className="h-5 w-5" />
              AI Analysis Complete
            </CardTitle>
            <CardDescription className="text-green-700 dark:text-green-300 flex items-center gap-2">
              <Database className="h-4 w-4" />
              Analysis performed on {data.length} actual data rows
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-lg border p-6">
              <div className="space-y-6">{formatAIResponse(analysisResult.explanation)}</div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-3 flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Key Insights
                </h3>
                <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                  {analysisResult.insights.map((insight, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800">
                <h3 className="font-semibold text-purple-800 dark:text-purple-200 mb-3 flex items-center gap-2">
                  <ArrowRight className="h-5 w-5" />
                  Recommendations
                </h3>
                <ul className="space-y-2 text-sm text-purple-700 dark:text-purple-300">
                  {analysisResult.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button onClick={resetQuestionnaire} variant="outline" className="flex items-center gap-2 bg-transparent">
                <Brain className="h-4 w-4" />
                Ask Another Question
              </Button>
              <Button
                onClick={() => setShowChat(!showChat)}
                variant={showChat ? "secondary" : "default"}
                className="flex items-center gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                {showChat ? "Hide Chat" : "Continue Chat"}
              </Button>
              <Button
                onClick={() => {
                  toast({
                    title: "Real Analysis Available",
                    description: `Switch to other tabs to see detailed statistical results from your ${data.length} rows`,
                  })
                }}
                variant="outline"
                className="flex items-center gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                View Detailed Analysis
              </Button>
            </div>
          </CardContent>
        </Card>

        {showChat && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Follow-up Questions
              </CardTitle>
              <CardDescription>Ask me anything about your analysis results or explore deeper insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="max-h-96 overflow-y-auto space-y-4 p-4 bg-muted/30 rounded-lg">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Start a conversation! Ask me anything about your analysis.</p>
                      <p className="text-sm mt-1">
                        For example: "What does this mean for my business?" or "How can I improve these results?"
                      </p>
                    </div>
                  ) : (
                    chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`flex gap-2 max-w-[80%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                              message.role === "user"
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary text-secondary-foreground"
                            }`}
                          >
                            {message.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                          </div>
                          <div
                            className={`rounded-lg p-3 ${
                              message.role === "user" ? "bg-primary text-primary-foreground" : "bg-background border"
                            }`}
                          >
                            <div className="text-sm">{formatChatMessage(message.content)}</div>
                            <p className={`text-xs mt-1 opacity-70`}>{message.timestamp.toLocaleTimeString()}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  {isSendingMessage && (
                    <div className="flex gap-3 justify-start">
                      <div className="flex gap-2 max-w-[80%]">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-secondary text-secondary-foreground">
                          <Bot className="h-4 w-4" />
                        </div>
                        <div className="rounded-lg p-3 bg-background border">
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                            <span className="text-sm text-muted-foreground">Thinking...</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="Ask a follow-up question..."
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={isSendingMessage}
                    className="flex-1"
                  />
                  <Button
                    onClick={sendFollowUpMessage}
                    disabled={!currentMessage.trim() || isSendingMessage}
                    size="icon"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  if (isAnalyzing) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold mb-2">AI is analyzing your data...</h3>
            <p className="text-muted-foreground">This may take a few moments</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const currentQuestion = questionnaire[currentStep]
  const isLastStep = currentStep === questionnaire.length - 1
  const canProceed = answers[currentQuestion.id] || (currentQuestion.id === "focus" && selectedColumns.length > 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">AI-Guided Trends Analysis</h2>
        </div>
        <Badge variant="outline">
          Step {currentStep + 1} of {questionnaire.length}
        </Badge>
      </div>

      <div className="flex gap-2 mb-6">
        {questionnaire.map((_, index) => (
          <div key={index} className={`h-2 flex-1 rounded-full ${index <= currentStep ? "bg-primary" : "bg-muted"}`} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {currentQuestion.icon}
            {currentQuestion.question}
          </CardTitle>
          <CardDescription>{currentQuestion.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentQuestion.id === "focus" ? (
            <div className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <h4 className="font-medium mb-2">Numeric Columns (for calculations)</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {numericColumns.map((col) => (
                      <label key={col} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedColumns.includes(col)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedColumns((prev) => [...prev, col])
                            } else {
                              setSelectedColumns((prev) => prev.filter((c) => c !== col))
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{col}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {categoricalColumns.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Category Columns (for grouping)</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {categoricalColumns.map((col) => (
                        <label key={col} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedColumns.includes(col)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedColumns((prev) => [...prev, col])
                              } else {
                                setSelectedColumns((prev) => prev.filter((c) => c !== col))
                              }
                            }}
                            className="rounded"
                          />
                          <span className="text-sm">{col}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {dateColumns.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Date Columns (for time analysis)</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {dateColumns.map((col) => (
                        <label key={col} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedColumns.includes(col)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedColumns((prev) => [...prev, col])
                              } else {
                                setSelectedColumns((prev) => prev.filter((c) => c !== col))
                              }
                            }}
                            className="rounded"
                          />
                          <span className="text-sm">{col}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Alert>
                <AlertDescription>
                  Selected {selectedColumns.length} columns. Choose the data that's most relevant to your business
                  question.
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <RadioGroup
              value={answers[currentQuestion.id] || ""}
              onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
            >
              {currentQuestion.options.map((option) => (
                <div key={option.value} className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50">
                  <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor={option.value} className="font-medium cursor-pointer">
                      {option.label}
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          )}

          {answers.goal === "custom" && currentStep === 0 && (
            <div className="mt-4">
              <Label htmlFor="custom-question" className="text-sm font-medium">
                What specific question do you have about your data?
              </Label>
              <Textarea
                id="custom-question"
                placeholder="e.g., Which products are most profitable in different seasons?"
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
                className="mt-2"
              />
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={handleBack} disabled={currentStep === 0}>
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={!canProceed || (answers.goal === "custom" && currentStep === 0 && !customQuestion.trim())}
            >
              {isLastStep ? "Analyze My Data" : "Next"}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
