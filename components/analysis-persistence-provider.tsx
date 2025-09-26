"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import {
  getCurrentAnalysis,
  updateCurrentAnalysis,
  saveDashboardContent,
  getAnalysisResults,
  initializeAnalysisSession,
} from "@/lib/data-persistence"

interface AnalysisPersistenceContextType {
  currentAnalysisId: string | null
  analysisResults: any
  dashboardContent: any
  isSaved: boolean
  updateAnalysis: (updates: any) => void
  saveToDashboard: (content: any) => void
  markAsSaved: () => void
}

const AnalysisPersistenceContext = createContext<AnalysisPersistenceContextType | null>(null)

export function AnalysisPersistenceProvider({ children }: { children: React.ReactNode }) {
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null)
  const [analysisResults, setAnalysisResults] = useState<any>(null)
  const [dashboardContent, setDashboardContent] = useState<any>({})
  const [isSaved, setIsSaved] = useState(false)

  useEffect(() => {
    // Initialize analysis session on mount
    const initializeSession = () => {
      const currentSession = getCurrentAnalysis()

      if (currentSession?.analysisResults) {
        setCurrentAnalysisId(currentSession.currentAnalysisId)
        setAnalysisResults(currentSession.analysisResults)
        setDashboardContent(currentSession.dashboardContent || {})
        setIsSaved(currentSession.isSaved || false)
      } else {
        // Try to get from sessionStorage and initialize session
        const results = getAnalysisResults()
        if (results) {
          const analysisId = initializeAnalysisSession(results.fileName, results, {
            analysisType: ["basic"],
            fileSize: results.fileSize,
          })
          setCurrentAnalysisId(analysisId)
          setAnalysisResults(results)
          setDashboardContent({})
          setIsSaved(false)
        }
      }
    }

    initializeSession()
  }, [])

  const updateAnalysis = (updates: any) => {
    if (currentAnalysisId) {
      const success = updateCurrentAnalysis(updates)
      if (success) {
        // Update local state
        if (updates.dashboardContent) {
          setDashboardContent((prev: any) => ({ ...prev, ...updates.dashboardContent }))
        }
      }
    }
  }

  const saveToDashboard = (content: any) => {
    const success = saveDashboardContent(content)
    if (success) {
      setDashboardContent((prev: any) => ({ ...prev, ...content }))
    }
  }

  const markAsSaved = () => {
    // This would be implemented by the parent component
    setIsSaved(true)
  }

  const value = {
    currentAnalysisId,
    analysisResults,
    dashboardContent,
    isSaved,
    updateAnalysis,
    saveToDashboard,
    markAsSaved,
  }

  return <AnalysisPersistenceContext.Provider value={value}>{children}</AnalysisPersistenceContext.Provider>
}

export function useAnalysisPersistence() {
  const context = useContext(AnalysisPersistenceContext)
  if (!context) {
    throw new Error("useAnalysisPersistence must be used within AnalysisPersistenceProvider")
  }
  return context
}
