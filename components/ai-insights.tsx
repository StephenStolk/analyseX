"use client"
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  BrainCircuit,
  LineChart,
  Lightbulb,
  AlertCircle,
  RefreshCw,
  Send,
  Bot,
  User,
  Eraser,
  Minimize2,
  X,
} from "lucide-react"
import { analyzeDataWithAI, checkApiKeyAvailable, askFollowUpQuestion, analyzeDashboardWithAI } from "@/lib/actions"
import type { AnalysisResponse, ChatMessage, DashboardContext } from "@/lib/api-types"
import { toast } from "@/components/ui/use-toast"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface AiInsightsProps {
  initialPromptType?: "general_analysis" | "dashboard_understanding"
  dashboardContext?: DashboardContext
  isOpen?: boolean
  onClose?: () => void
}

const MarkdownComponents = {
  h1: ({ node, ...props }: { node?: any; [key: string]: any }) => <h1 className="text-sm font-bold mt-2 mb-1" {...props} />,
  h2: ({ node, ...props }: { node?: any; [key: string]: any }) => <h2 className="text-sm font-bold mt-2 mb-1" {...props} />,
  h3: ({ node, ...props }: { node?: any; [key: string]: any }) => <h3 className="text-xs font-semibold mt-1 mb-1" {...props} />,
  h4: ({ node, ...props }: { node?: any; [key: string]: any }) => <h4 className="text-xs font-semibold mt-1 mb-1" {...props} />,
  h5: ({ node, ...props }: { node?: any; [key: string]: any }) => <h5 className="text-xs font-semibold mt-1 mb-1" {...props} />,
  h6: ({ node, ...props }: { node?: any; [key: string]: any }) => <h6 className="text-xs font-semibold mt-1 mb-1" {...props} />,
  p: ({ node, ...props }: { node?: any; [key: string]: any }) => <p className="mb-1 leading-tight text-xs text-muted-foreground" {...props} />,
  ul: ({ node, ...props }: { node?: any; [key: string]: any }) => (
    <ul className="list-disc list-inside mb-1 space-y-0.5 text-xs text-muted-foreground" {...props} />
  ),
  ol: ({ node, ...props }: { node?: any; [key: string]: any }) => (
    <ol className="list-decimal list-inside mb-1 space-y-0.5 text-xs text-muted-foreground" {...props} />
  ),
  li: ({ node, ...props }: { node?: any; [key: string]: any }) => <li className="mb-0.5 text-xs" {...props} />,
  table: ({ node, ...props }: { node?: any; [key: string]: any }) => (
    <div className="w-full overflow-x-auto my-2">
      <table className="w-full text-xs border-collapse" {...props} />
    </div>
  ),
  thead: ({ node, ...props }: { node?: any; [key: string]: any }) => <thead className="[&_tr]:border-b bg-muted/50" {...props} />,
  tbody: ({ node, ...props }: { node?: any; [key: string]: any }) => <tbody className="[&_tr:last-child]:border-0" {...props} />,
  tr: ({ node, ...props }: { node?: any; [key: string]: any }) => <tr className="border-b transition-colors hover:bg-muted/50" {...props} />,
  th: ({ node, ...props }: { node?: any; [key: string]: any }) => (
    <th className="h-8 px-2 text-left align-middle font-medium text-xs text-muted-foreground" {...props} />
  ),
  td: ({ node, ...props }: { node?: any; [key: string]: any }) => <td className="p-2 align-middle text-xs" {...props} />,
  pre: ({ node, ...props }: { node?: any; [key: string]: any }) => (
    <pre className="bg-gray-800 text-white p-2 rounded-md overflow-x-auto my-2 text-xs" {...props} />
  ),
  code: ({ node, inline, ...props }: { node?: any; inline?: boolean; [key: string]: any }) => (
    <code
      className={inline ? "bg-muted px-1 py-0.5 rounded-sm font-mono text-xs" : "block font-mono text-xs"}
      {...props}
    />
  ),
  blockquote: ({ node, ...props }: { node?: any; [key: string]: any }) => (
    <blockquote className="mt-2 border-l-2 pl-2 italic text-xs text-muted-foreground" {...props} />
  ),
}

export function AiInsights({
  initialPromptType = "general_analysis",
  dashboardContext,
  isOpen = false,
  onClose,
}: AiInsightsProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [progress, setProgress] = useState(0)
  const [aiResults, setAiResults] = useState<AnalysisResponse | null>(null)
  const [userConsent, setUserConsent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [apiKeyMissing, setApiKeyMissing] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [userQuestion, setUserQuestion] = useState("")
  const [isAskingQuestion, setIsAskingQuestion] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const [activeTab, setActiveTab] = useState(initialPromptType === "dashboard_understanding" ? "chat" : "insights")
  const [isMinimized, setIsMinimized] = useState(false)

  const CHAT_STORAGE_KEY =
    initialPromptType === "dashboard_understanding" ? "aiDashboardChatMessages" : "aiAnalysisChatMessages"
  const RESULTS_STORAGE_KEY =
    initialPromptType === "dashboard_understanding" ? "aiDashboardResults" : "aiAnalysisResults"

  const initializedRef = useRef(false)

  useEffect(() => {
    const storedAiResults = sessionStorage.getItem(RESULTS_STORAGE_KEY)
    const storedChatMessages = sessionStorage.getItem(CHAT_STORAGE_KEY)

    if (storedAiResults) {
      try {
        setAiResults(JSON.parse(storedAiResults))
        setIsComplete(true)
        if (initialPromptType === "dashboard_understanding") {
          setActiveTab("chat")
        }
      } catch (error) {
        console.error("Error parsing AI results:", error)
      }
    }

    if (storedChatMessages) {
      try {
        setChatMessages(JSON.parse(storedChatMessages))
      } catch (error) {
        console.error("Error parsing chat messages:", error)
      }
    } else {
      if (initialPromptType === "dashboard_understanding") {
        setChatMessages([
          {
            role: "assistant",
            content:
              "Hello! I'm ready to help you understand your dashboard. Click 'Generate Dashboard Insights' to get started, or ask me a specific question.",
          },
        ])
      } else {
        setChatMessages([
          {
            role: "assistant",
            content:
              "I've analyzed your data. You can ask me follow-up questions about specific columns, trends, or predictions.",
          },
        ])
      }
    }

    const checkApiKey = async () => {
      try {
        const isAvailable = await checkApiKeyAvailable()
        setApiKeyMissing(!isAvailable)
      } catch (error) {
        console.error("Error checking API key:", error)
        setApiKeyMissing(true)
      }
    }

    checkApiKey()
  }, [initialPromptType, CHAT_STORAGE_KEY, RESULTS_STORAGE_KEY])

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [chatMessages])

  useEffect(() => {
    sessionStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(chatMessages))
  }, [chatMessages, CHAT_STORAGE_KEY])

  const handleMinimize = () => setIsMinimized(true)
  const handleMaximize = () => setIsMinimized(false)
  const handleClose = () => onClose?.()

  const handleGenerateInsights = async () => {
    setIsGenerating(true)
    setUserConsent(true)
    setError(null)

    let currentProgress = 0
    const interval = setInterval(() => {
      currentProgress += 5
      setProgress(currentProgress)
      if (currentProgress >= 90) {
        clearInterval(interval)
      }
    }, 150)

    try {
      let aiResponse: AnalysisResponse | { answer: string }

      if (initialPromptType === "dashboard_understanding") {
        if (!dashboardContext) {
          throw new Error("Dashboard context is missing for AI analysis.")
        }
        const response = await analyzeDashboardWithAI(dashboardContext)
        aiResponse = {
          insights: [{ title: "Dashboard Summary", description: response.answer }],
          forecast: { growth: "N/A", seasonal: "N/A", data: {} },
          recommendations: [],
        }
        setChatMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: response.answer,
          },
        ])
      } else {
        const resultsString = sessionStorage.getItem("analysisResults")
        if (!resultsString) {
          throw new Error("No analysis results found")
        }
        const results = JSON.parse(resultsString)

        if (!results || typeof results !== "object") {
          throw new Error("Invalid analysis results format")
        }

        const dataSubset = {
          fileName: results.fileName || "unknown_file",
          summary: {
            rowCount: results.rowCount || 0,
            columnCount: results.columnCount || 0,
            missingValues: results.missingValues || 0,
            duplicateRows: results.duplicateRows || 0,
            columns: Array.isArray(results.columnStats)
              ? results.columnStats.map((col: { name: any; type: any; count: any; missing: any; unique: any; min: any; max: any; mean: any; median: any; stdDev: any }) => ({
                  name: col.name || "unnamed",
                  type: col.type || "unknown",
                  count: col.count || 0,
                  missing: col.missing || 0,
                  unique: col.unique || 0,
                  min: col.min,
                  max: col.max,
                  mean: col.mean,
                  median: col.median,
                  stdDev: col.stdDev,
                }))
              : [],
          },
          correlations: results.correlationMatrix
            ? {
                labels: results.correlationMatrix.labels || [],
                strongPairs: results.correlationMatrix.strongPairs || [],
              }
            : { labels: [], strongPairs: [] },
          distributions: Array.isArray(results.histograms) ? results.histograms : [],
          keyStats: {
            outlierCounts: Array.isArray(results.boxPlots)
              ? results.boxPlots.map((o: { column: any; outliers: string | any[] }) => ({
                  column: o.column,
                  outliers: Array.isArray(o.outliers) ? o.outliers.length : 0,
                }))
              : [],
            regressionModels: Array.isArray(results.regressionModels)
              ? results.regressionModels.map((model: { xColumn: any; yColumn: any; rSquared: any; slope: any; intercept: any }) => ({
                  xColumn: model.xColumn,
                  yColumn: model.yColumn,
                  rSquared: model.rSquared,
                  slope: model.slope,
                  intercept: model.intercept,
                }))
              : [],
          },
        }
        aiResponse = await analyzeDataWithAI(
          results.data || [],
          Array.isArray(results.columnStats) ? results.columnStats.map((col: { name: string }) => col.name) : []
        )
        setChatMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "I've analyzed your data. You can ask me follow-up questions about specific columns, trends, or predictions.",
          },
        ])
      }

      setAiResults(aiResponse as AnalysisResponse)
      sessionStorage.setItem(RESULTS_STORAGE_KEY, JSON.stringify(aiResponse))
      setRetryCount(0)
    } catch (error) {
      console.error("Error generating AI insights:", error)
      setError(
        typeof error === "object" && error !== null && "message" in error
          ? String((error as { message?: string }).message)
          : "Failed to generate AI insights"
      )
      setRetryCount((prev) => prev + 1)
      toast({
        title: "AI Analysis Error",
        description:
          typeof error === "object" && error !== null && "message" in error
            ? String((error as { message?: string }).message)
            : "There was a problem generating AI insights. Please try again.",
        variant: "destructive",
      })
    } finally {
      clearInterval(interval)
      setProgress(100)
      setTimeout(() => {
        setIsGenerating(false)
        if (aiResults || retryCount >= 2) {
          setIsComplete(true)
        }
      }, 500)
    }
  }

  const handleSendQuestion = async () => {
    if (!userQuestion.trim()) return

    setChatMessages((prev) => [...prev, { role: "user", content: userQuestion }])
    const question = userQuestion
    setUserQuestion("")
    setIsAskingQuestion(true)

    try {
      const resultsString = sessionStorage.getItem("analysisResults")
      if (!resultsString) {
        throw new Error("Analysis results not found")
      }
      const results = JSON.parse(resultsString)

      const modelToUse = "openai/gpt-oss-20b:free"

      const response = await askFollowUpQuestion({
        question,
        analysisResults: results,
        previousMessages: chatMessages,
        model: modelToUse,
      })

      setChatMessages((prev) => [...prev, { role: "assistant", content: response.answer }])
    } catch (error) {
      console.error("Error asking follow-up question:", error)
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I'm sorry, I couldn't process your question. Please try asking something else.",
        },
      ])
      toast({
        title: "Error",
        description: "Failed to get an answer. Please try a different question.",
        variant: "destructive",
      })
    } finally {
      setIsAskingQuestion(false)
    }
  }

  const handleClearChat = () => {
    sessionStorage.removeItem(CHAT_STORAGE_KEY)
    sessionStorage.removeItem(RESULTS_STORAGE_KEY)
    setChatMessages([])
    setAiResults(null)
    setIsComplete(false)
    setError(null)
    setRetryCount(0)
    initializedRef.current = false
    if (initialPromptType === "dashboard_understanding") {
      setChatMessages([
        {
          role: "assistant",
          content:
            "Hello! I'm ready to help you understand your dashboard. Click 'Generate Dashboard Insights' to get started, or ask me a specific question.",
        },
      ])
    } else {
      setChatMessages([
        {
          role: "assistant",
          content:
            "I've analyzed your data. You can ask me follow-up questions about specific columns, trends, or predictions.",
        },
      ])
    }
  }

  const ChatbotAvatar = ({ isTyping = false }: { isTyping?: boolean }) => (
    <div className="relative">
      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center shadow-sm">
        <Bot className="h-3 w-3 text-white" />
      </div>
      {isTyping && <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>}
    </div>
  )

  const UserAvatar = () => (
    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center shadow-sm">
      <User className="h-3 w-3 text-white" />
    </div>
  )

  if (isMinimized) {
    return (
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={handleMaximize}
          className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <ChatbotAvatar />
        </Button>
      </motion.div>
    )
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="fixed top-4 right-4 w-80 max-h-[calc(100vh-2rem)] bg-white rounded-xl border border-gray-200 shadow-2xl z-50 flex flex-col overflow-hidden"
        >
          <div className="flex items-center justify-between p-3 border-b bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center gap-2">
              <ChatbotAvatar />
              <div>
                <h3 className="font-semibold text-xs text-blue-700">AI Assistant</h3>
                <p className="text-xs text-blue-600">Ready to help! 🤖</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={handleMinimize} className="h-6 w-6 p-0 hover:bg-blue-100">
                <Minimize2 className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleClose} className="h-6 w-6 p-0 hover:bg-red-100">
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full p-3">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-3"
              >
                {isGenerating ? (
                  <Card className="border border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50">
                    <CardHeader className="text-center p-3">
                      <div className="flex justify-center mb-1">
                        <ChatbotAvatar isTyping={true} />
                      </div>
                      <CardTitle className="text-blue-700 text-xs">🤖 AI Assistant is Thinking...</CardTitle>
                      <CardDescription className="text-blue-600 text-xs">Analyzing your data! ✨</CardDescription>
                    </CardHeader>
                    <CardContent className="p-3">
                      <div className="mb-3 space-y-1">
                        <div className="flex justify-between text-xs text-blue-600">
                          <span>AI Analysis</span>
                          <span>{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-1 bg-blue-100" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-start gap-2 p-2 rounded-lg bg-white/50 backdrop-blur-sm">
                          <div className="mt-0.5 rounded-full bg-blue-100 p-1 text-blue-600">
                            <Lightbulb className="h-2 w-2" />
                          </div>
                          <div>
                            <p className="font-medium text-blue-700 text-xs">🔍 Finding Patterns</p>
                            <p className="text-xs text-blue-600">Looking for insights!</p>
                          </div>
                        </div>
                        {progress > 30 && (
                          <div className="flex items-start gap-2 p-2 rounded-lg bg-white/50 backdrop-blur-sm">
                            <div className="mt-0.5 rounded-full bg-purple-100 p-1 text-purple-600">
                              <LineChart className="h-2 w-2" />
                            </div>
                            <div>
                              <p className="font-medium text-purple-700 text-xs">📈 Creating Forecasts</p>
                              <p className="text-xs text-purple-600">Predicting trends!</p>
                            </div>
                          </div>
                        )}
                        {progress > 60 && (
                          <div className="flex items-start gap-2 p-2 rounded-lg bg-white/50 backdrop-blur-sm">
                            <div className="mt-0.5 rounded-full bg-green-100 p-1 text-green-600">
                              <BrainCircuit className="h-2 w-2" />
                            </div>
                            <div>
                              <p className="font-medium text-green-700 text-xs">💡 Final Insights</p>
                              <p className="text-xs text-green-600">Almost done!</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : error && !aiResults ? (
                  <Card className="border border-red-200 bg-gradient-to-br from-red-50 to-orange-50">
                    <CardHeader className="p-3">
                      <div className="flex justify-center mb-1">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-red-400 to-orange-500 flex items-center justify-center shadow-sm">
                          <AlertCircle className="h-3 w-3 text-white" />
                        </div>
                      </div>
                      <CardTitle className="text-red-700 text-center text-xs">😅 Oops! Something went wrong</CardTitle>
                      <CardDescription className="text-red-600 text-center text-xs">Let's try again!</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center space-y-3 p-3 text-center">
                      <p className="text-xs text-red-600">{error}</p>
                      <Button
                        onClick={handleGenerateInsights}
                        size="sm"
                        className="rounded-full px-3 gap-1 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-xs"
                      >
                        <RefreshCw className="h-3 w-3" /> Try Again
                      </Button>
                    </CardContent>
                  </Card>
                ) : !isComplete && initialPromptType === "general_analysis" ? (
                  <Card className="border border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50">
                    <CardHeader className="text-center p-3">
                      <div className="flex justify-center mb-1">
                        <ChatbotAvatar />
                      </div>
                      <CardTitle className="text-blue-700 text-xs">👋 Hi! I'm your AI Assistant</CardTitle>
                      <CardDescription className="text-blue-600 text-xs">
                        Ready to analyze your data! 🚀
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center space-y-3 p-3 text-center">
                      <div className="rounded-full bg-primary/10 p-2 text-primary">
                        <BrainCircuit className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="mb-1 text-xs font-semibold">Ready for AI Analysis</h3>
                        <p className="mb-3 text-xs text-muted-foreground">
                          I can analyze your data to provide insights, forecasts, and recommendations.
                        </p>
                      </div>
                      <Button
                        onClick={handleGenerateInsights}
                        size="sm"
                        className="rounded-full px-4 text-xs"
                        disabled={apiKeyMissing}
                      >
                        Generate AI Insights
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                    <Card className="border border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50">
                      <CardHeader className="text-center p-3">
                        <div className="flex justify-center mb-1">
                          <ChatbotAvatar />
                        </div>
                        <CardTitle className="text-blue-700 text-xs">🎉 Insights Ready!</CardTitle>
                        <CardDescription className="text-blue-600 text-xs">Found exciting patterns! ✨</CardDescription>
                      </CardHeader>
                      <CardContent className="p-3">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                          <TabsList className="grid w-full grid-cols-2 rounded-full bg-white/50 backdrop-blur-sm text-xs h-8">
                            <TabsTrigger
                              value="insights"
                              className="rounded-full data-[state=active]:bg-blue-500 data-[state=active]:text-white text-xs h-6"
                            >
                              💡 Insights
                            </TabsTrigger>
                            <TabsTrigger
                              value="chat"
                              className="rounded-full data-[state=active]:bg-pink-500 data-[state=active]:text-white text-xs h-6"
                            >
                              💬 Chat
                            </TabsTrigger>
                          </TabsList>

                          <TabsContent value="insights" className="mt-3 space-y-2">
                            {(aiResults?.insights && aiResults.insights.length > 0) ||
                            (aiResults?.insights && Array.isArray(aiResults.insights) && aiResults.insights.length > 0) ? (
                              (aiResults?.insights || aiResults?.insights || []).map((insight, i) => (
                                <div key={i} className="rounded-lg border bg-muted/30 p-2">
                                  <h3 className="mb-1 font-semibold text-xs">{insight.title}</h3>
                                  <div className="prose prose-xs max-w-none">
                                    <ReactMarkdown
                                      remarkPlugins={[remarkGfm]}
                                      components={MarkdownComponents}
                                    >
                                      {insight.description}
                                    </ReactMarkdown>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="rounded-lg border bg-muted/30 p-2 text-center">
                                <p className="text-muted-foreground text-xs">No insights available.</p>
                              </div>
                            )}
                          </TabsContent>

                          <TabsContent value="chat" className="mt-3">
                            <div className="space-y-2">
                              <div className="border border-pink-200 rounded-lg bg-white/50 backdrop-blur-sm">
                                <ScrollArea className="h-48 p-2">
                                  {chatMessages.length > 0 ? (
                                    <div className="space-y-2">
                                      {chatMessages.map((message, index) => (
                                        <div
                                          key={index}
                                          className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                                        >
                                          <div
                                            className={`flex items-start gap-2 max-w-[85%] ${
                                              message.role === "user"
                                                ? "bg-gradient-to-r from-green-400 to-blue-500 text-white shadow-sm"
                                                : "bg-white/80 backdrop-blur-sm border border-pink-200 shadow-sm"
                                            } p-2 rounded-lg`}
                                          >
                                            {message.role === "assistant" && <ChatbotAvatar />}
                                            <div className="flex-1">
                                              <div className="prose prose-xs max-w-none">
                                                <ReactMarkdown
                                                  remarkPlugins={[remarkGfm]}
                                                  components={MarkdownComponents}
                                                >
                                                  {message.content}
                                                </ReactMarkdown>
                                              </div>
                                            </div>
                                            {message.role === "user" && <UserAvatar />}
                                          </div>
                                        </div>
                                      ))}
                                      {isAskingQuestion && (
                                        <div className="flex justify-start">
                                          <div className="flex items-start gap-2 bg-white/80 backdrop-blur-sm border border-pink-200 shadow-sm p-2 rounded-lg">
                                            <ChatbotAvatar isTyping={true} />
                                            <div className="flex items-center gap-1">
                                              <div className="flex space-x-1">
                                                <div className="w-1 h-1 bg-pink-400 rounded-full animate-bounce"></div>
                                                <div
                                                  className="w-1 h-1 bg-pink-400 rounded-full animate-bounce"
                                                  style={{ animationDelay: "0.1s" }}
                                                ></div>
                                                <div
                                                  className="w-1 h-1 bg-pink-400 rounded-full animate-bounce"
                                                  style={{ animationDelay: "0.2s" }}
                                                ></div>
                                              </div>
                                              <span className="text-xs text-pink-600">Thinking...</span>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                      <div ref={chatEndRef} />
                                    </div>
                                  ) : (
                                    <div className="h-full flex items-center justify-center">
                                      <div className="text-center">
                                        <ChatbotAvatar />
                                        <p className="text-pink-600 mt-1 text-xs">Ask me about your data!</p>
                                      </div>
                                    </div>
                                  )}
                                </ScrollArea>
                              </div>

                              <div className="flex gap-2">
                                <Textarea
                                  placeholder="Ask me anything..."
                                  value={userQuestion}
                                  onChange={(e) => setUserQuestion(e.target.value)}
                                  className="resize-none border border-pink-200 bg-white/70 backdrop-blur-sm focus:border-pink-400 focus:ring-pink-400 text-xs"
                                  rows={2}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                      e.preventDefault()
                                      handleSendQuestion()
                                    }
                                  }}
                                />
                                <Button
                                  onClick={handleSendQuestion}
                                  disabled={!userQuestion.trim() || isAskingQuestion}
                                  size="sm"
                                  className="flex-shrink-0 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 rounded-full h-8 w-8 p-0"
                                >
                                  {isAskingQuestion ? (
                                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                  ) : (
                                    <Send className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>

                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  onClick={handleClearChat}
                                  size="sm"
                                  className="flex-1 gap-1 text-xs text-pink-600 bg-white/70 backdrop-blur-sm border-pink-200 hover:bg-pink-100 hover:border-pink-300 h-7"
                                >
                                  <Eraser className="h-3 w-3" /> Clear
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 gap-1 bg-white/70 backdrop-blur-sm border-blue-200 hover:bg-blue-100 hover:border-blue-300 text-xs h-7"
                                  onClick={handleGenerateInsights}
                                >
                                  <RefreshCw className="h-3 w-3" /> Regenerate
                                </Button>
                              </div>
                            </div>
                          </TabsContent>
                        </Tabs>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </motion.div>
            </ScrollArea>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
