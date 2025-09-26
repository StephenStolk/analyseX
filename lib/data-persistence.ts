export interface AnalysisHistoryItem {
  summary: null
  id: string
  fileName: string
  timestamp: number
  analysisResults: any
  aiInsights?: any
  customCharts?: any[]
  chatMessages?: any[]
  dashboardContent?: {
    aiInsights: never[]
    aiDashboard?: any
    correlationMatrix?: any
    trendAnalysis?: any
    customCharts?: any[]
    reports?: any
    generatedAt: number
  }
  isSaved?: boolean
  metadata: {
    fileSize?: number
    rowCount: number
    columnCount: number
    analysisType: string[]
  }
}

export interface PersistenceConfig {
  expirationDays: number
  maxHistoryItems: number
  storageType: "localStorage" | "sessionStorage"
}

class DataPersistenceManager {
  private config: PersistenceConfig = {
    expirationDays: 5,
    maxHistoryItems: 50,
    storageType: "localStorage",
  }

  private getStorage() {
    return this.config.storageType === "localStorage" ? localStorage : sessionStorage
  }

  // Generate unique ID for analysis session
  generateAnalysisId(): string {
    return `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Save analysis results to history
  saveAnalysisToHistory(
    fileName: string,
    analysisResults: any,
    options: {
      aiInsights?: any
      customCharts?: any[]
      chatMessages?: any[]
      fileSize?: number
      analysisType?: string[]
      dashboardContent?: any
      isSaved?: boolean
    } = {},
  ): string {
    const storage = this.getStorage()
    const analysisId = this.generateAnalysisId()

    const historyItem: AnalysisHistoryItem = {
      id: analysisId,
      fileName,
      timestamp: Date.now(),
      analysisResults,
      aiInsights: options.aiInsights,
      customCharts: options.customCharts || [],
      chatMessages: options.chatMessages || [],
      dashboardContent: options.dashboardContent,
      isSaved: options.isSaved || false,
      metadata: {
        fileSize: options.fileSize,
        rowCount: analysisResults?.rowCount || 0,
        columnCount: analysisResults?.columnCount || 0,
        analysisType: options.analysisType || ["basic"],
      },
    }

    if (options.isSaved) {
      const history = this.getAnalysisHistory()
      history.unshift(historyItem)

      if (history.length > this.config.maxHistoryItems) {
        history.splice(this.config.maxHistoryItems)
      }

      storage.setItem("analysisHistory", JSON.stringify(history))
    }

    // Always save current session data for persistence across pages
    this.saveCurrentSession(analysisId, historyItem)

    return analysisId
  }

  // Get all analysis history
  getAnalysisHistory(): AnalysisHistoryItem[] {
    const storage = this.getStorage()
    const historyJson = storage.getItem("analysisHistory")

    if (!historyJson) return []

    try {
      const history: AnalysisHistoryItem[] = JSON.parse(historyJson)

      // Filter out expired items and only return saved analyses
      const now = Date.now()
      const expirationTime = this.config.expirationDays * 24 * 60 * 60 * 1000

      const validHistory = history.filter((item) => now - item.timestamp < expirationTime && item.isSaved)

      if (validHistory.length !== history.length) {
        storage.setItem("analysisHistory", JSON.stringify(validHistory))
      }

      return validHistory
    } catch (error) {
      console.error("Error parsing analysis history:", error)
      return []
    }
  }

  // Get specific analysis by ID
  getAnalysisById(id: string): AnalysisHistoryItem | null {
    const history = this.getAnalysisHistory()
    return history.find((item) => item.id === id) || null
  }

  // Save current session data (for page navigation persistence)
  saveCurrentSession(analysisId: string, data: Partial<AnalysisHistoryItem>) {
    const storage = this.getStorage()

    const sessionData = {
      currentAnalysisId: analysisId,
      timestamp: Date.now(),
      ...data,
    }

    storage.setItem("currentAnalysisSession", JSON.stringify(sessionData))
  }

  // Get current session data
  getCurrentSession(): any {
    const storage = this.getStorage()
    const sessionJson = storage.getItem("currentAnalysisSession")

    if (!sessionJson) return null

    try {
      const session = JSON.parse(sessionJson)

      // Check if session is expired
      const now = Date.now()
      const sessionAge = now - session.timestamp
      const maxSessionAge = 24 * 60 * 60 * 1000 // 24 hours

      if (sessionAge > maxSessionAge) {
        storage.removeItem("currentAnalysisSession")
        return null
      }

      return session
    } catch (error) {
      console.error("Error parsing current session:", error)
      return null
    }
  }

  // Update existing analysis (for AI insights, charts, etc.)
  updateAnalysis(id: string, updates: Partial<AnalysisHistoryItem>) {
    const storage = this.getStorage()
    const history = this.getAnalysisHistory()

    const index = history.findIndex((item) => item.id === id)
    if (index === -1) return false

    // Merge updates
    history[index] = { ...history[index], ...updates }

    // Save updated history
    storage.setItem("analysisHistory", JSON.stringify(history))

    // Update current session if it's the same analysis
    const currentSession = this.getCurrentSession()
    if (currentSession?.currentAnalysisId === id) {
      this.saveCurrentSession(id, history[index])
    }

    return true
  }

  // Delete specific analysis
  deleteAnalysis(id: string): boolean {
    const storage = this.getStorage()
    const history = this.getAnalysisHistory()

    const filteredHistory = history.filter((item) => item.id !== id)

    if (filteredHistory.length === history.length) return false

    storage.setItem("analysisHistory", JSON.stringify(filteredHistory))

    // Clear current session if it's the deleted analysis
    const currentSession = this.getCurrentSession()
    if (currentSession?.currentAnalysisId === id) {
      storage.removeItem("currentAnalysisSession")
    }

    return true
  }

  // Clear all history
  clearAllHistory() {
    const storage = this.getStorage()
    storage.removeItem("analysisHistory")
    storage.removeItem("currentAnalysisSession")
  }

  // Get storage usage info
  getStorageInfo() {
    const storage = this.getStorage()
    const history = this.getAnalysisHistory()

    let totalSize = 0
    try {
      const historyJson = storage.getItem("analysisHistory") || ""
      const sessionJson = storage.getItem("currentAnalysisSession") || ""
      totalSize = (historyJson.length + sessionJson.length) * 2 // rough estimate in bytes
    } catch (error) {
      console.error("Error calculating storage size:", error)
    }

    return {
      itemCount: history.length,
      estimatedSize: totalSize,
      oldestItem: history.length > 0 ? new Date(Math.min(...history.map((h) => h.timestamp))) : null,
      newestItem: history.length > 0 ? new Date(Math.max(...history.map((h) => h.timestamp))) : null,
    }
  }

  // Migrate session storage to localStorage (for persistence upgrade)
  migrateToLocalStorage() {
    if (this.config.storageType === "localStorage") return

    const sessionHistory = sessionStorage.getItem("analysisHistory")
    const sessionCurrent = sessionStorage.getItem("currentAnalysisSession")

    if (sessionHistory) {
      localStorage.setItem("analysisHistory", sessionHistory)
      sessionStorage.removeItem("analysisHistory")
    }

    if (sessionCurrent) {
      localStorage.setItem("currentAnalysisSession", sessionCurrent)
      sessionStorage.removeItem("currentAnalysisSession")
    }

    this.config.storageType = "localStorage"
  }

  // Save dashboard content to current session
  saveDashboardContent(content: any) {
    const currentSession = this.getCurrentSession()
    if (currentSession) {
      const updatedContent = {
        ...currentSession.dashboardContent,
        ...content,
        generatedAt: Date.now(),
      }

      this.saveCurrentSession(currentSession.currentAnalysisId, {
        ...currentSession,
        dashboardContent: updatedContent,
      })

      return true
    }
    return false
  }

  // Mark analysis as saved
  markAnalysisAsSaved(id?: string): boolean {
    const analysisId = id || this.getCurrentSession()?.currentAnalysisId
    if (!analysisId) return false

    const currentSession = this.getCurrentSession()
    if (currentSession && currentSession.currentAnalysisId === analysisId) {
      // Update current session
      const updatedSession = { ...currentSession, isSaved: true }
      this.saveCurrentSession(analysisId, updatedSession)

      // Add to history
      const history = this.getAnalysisHistory()
      const existingIndex = history.findIndex((item) => item.id === analysisId)

      if (existingIndex === -1) {
        // Add new item to history
        history.unshift(updatedSession as AnalysisHistoryItem)

        if (history.length > this.config.maxHistoryItems) {
          history.splice(this.config.maxHistoryItems)
        }

        const storage = this.getStorage()
        storage.setItem("analysisHistory", JSON.stringify(history))
      }

      return true
    }

    return false
  }
}

// Export singleton instance
export const dataPersistence = new DataPersistenceManager()

// Utility functions for easy access
export const saveAnalysis = (fileName: string, results: any, options?: any) =>
  dataPersistence.saveAnalysisToHistory(fileName, results, options)

export const getAnalysisHistory = () => dataPersistence.getAnalysisHistory()

export const getCurrentAnalysis = () => dataPersistence.getCurrentSession()

export const updateCurrentAnalysis = (updates: any) => {
  const current = dataPersistence.getCurrentSession()
  if (current?.currentAnalysisId) {
    return dataPersistence.updateAnalysis(current.currentAnalysisId, updates)
  }
  return false
}

export const saveDashboardContent = (content: any) => dataPersistence.saveDashboardContent(content)

export const markAsSaved = (id?: string) => dataPersistence.markAnalysisAsSaved(id)

// Helper function to get analysis results consistently
export const getAnalysisResults = () => {
  // First try to get from current session (persistence system)
  const currentSession = dataPersistence.getCurrentSession()
  if (currentSession?.analysisResults) {
    return currentSession.analysisResults
  }

  // Fallback to direct sessionStorage for backward compatibility
  const resultsString = sessionStorage.getItem("analysisResults")
  if (resultsString) {
    try {
      return JSON.parse(resultsString)
    } catch (error) {
      console.error("Error parsing analysis results from sessionStorage:", error)
      return null
    }
  }

  return null
}

// Helper to initialize analysis session from sessionStorage
export const initializeAnalysisSession = (fileName: string, analysisResults: any, options: any = {}) => {
  const analysisId = dataPersistence.saveAnalysisToHistory(fileName, analysisResults, {
    ...options,
    isSaved: false, // Don't save to history yet, just create session
  })

  return analysisId
}

// Helper to check if analysis session exists
export const hasActiveAnalysisSession = () => {
  const currentSession = dataPersistence.getCurrentSession()
  const sessionStorageResults = sessionStorage.getItem("analysisResults")

  return !!(currentSession?.analysisResults || sessionStorageResults)
}

// Auto-cleanup on app load
if (typeof window !== "undefined") {
  // Clean expired items on app load
  setTimeout(() => {
    dataPersistence.getAnalysisHistory() // This will auto-clean expired items
  }, 1000)
}
