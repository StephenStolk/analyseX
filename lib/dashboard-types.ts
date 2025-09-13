export interface ModuleTemplate {
  id: string
  title: string
  description: string
  category: string
  icon: any
  type: string
  requiredColumns: {
    numeric?: number
    categorical?: number
  }
}

export interface DashboardModuleType {
  id: string
  type: string
  title: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  columns: string[]
  parameters: Record<string, any>
  result: ModuleResult | null
}

export interface ModuleResult {
  type: "chart" | "statistical" | "text" | "table"
  data?: any[]
  statistics?: Record<string, number>
  interpretation?: string
  content?: string
  chartType?: string
}

export interface ChatMessage {
  id: string
  type: "user" | "assistant"
  content: string
  timestamp: Date
}
