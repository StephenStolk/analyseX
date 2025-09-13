"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  Database,
  TrendingUp,
  AlertCircle,
  Target,
  Zap,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface DataQualityRule {
  id: string
  category: "Completeness" | "Uniqueness" | "Validity" | "Consistency" | "Accuracy"
  title: string
  description: string
  status: "passed" | "warning" | "failed"
  score: number
  details: string
  recommendation: string
}

export function DataRulesSection() {
  const [analysisResults, setAnalysisResults] = useState<any>(null)
  const [qualityRules, setQualityRules] = useState<DataQualityRule[]>([])
  const [overallScore, setOverallScore] = useState(0)

  useEffect(() => {
    const resultsString = sessionStorage.getItem("analysisResults")
    if (resultsString) {
      try {
        const results = JSON.parse(resultsString)
        setAnalysisResults(results)
        generateQualityRules(results)
      } catch (error) {
        console.error("Error loading analysis results:", error)
      }
    }
  }, [])

  const generateQualityRules = (results: any) => {
    const rules: DataQualityRule[] = []
    const data = results.previewData || []
    const columnStats = results.columnStats || []

    // Completeness Rules
    columnStats.forEach((col: any) => {
      const missingCount = data.filter((row: any) => row[col.name] == null || row[col.name] === "").length
      const completeness = ((data.length - missingCount) / data.length) * 100

      rules.push({
        id: `completeness_${col.name}`,
        category: "Completeness",
        title: `${col.name} Completeness`,
        description: `Column ${col.name} has ${completeness.toFixed(1)}% complete data`,
        status: completeness >= 95 ? "passed" : completeness >= 80 ? "warning" : "failed",
        score: completeness,
        details: `${missingCount} missing values out of ${data.length} total records`,
        recommendation:
          completeness < 80
            ? "Consider data imputation or investigate data collection process"
            : completeness < 95
              ? "Review missing data patterns and consider filling gaps"
              : "Excellent data completeness",
      })
    })

    // Uniqueness Rules
    columnStats.forEach((col: any) => {
      const values = data.map((row: any) => row[col.name]).filter((val: any) => val != null)
      const uniqueValues = new Set(values)
      const uniqueness = (uniqueValues.size / values.length) * 100

      if (col.type === "Number" || col.type === "String") {
        rules.push({
          id: `uniqueness_${col.name}`,
          category: "Uniqueness",
          title: `${col.name} Uniqueness`,
          description: `Column ${col.name} has ${uniqueness.toFixed(1)}% unique values`,
          status: uniqueness >= 80 ? "passed" : uniqueness >= 50 ? "warning" : "failed",
          score: uniqueness,
          details: `${uniqueValues.size} unique values out of ${values.length} non-null records`,
          recommendation:
            uniqueness < 50
              ? "High duplication detected - investigate data quality"
              : uniqueness < 80
                ? "Moderate duplication - review for data entry errors"
                : "Good data uniqueness",
        })
      }
    })

    // Validity Rules
    columnStats.forEach((col: any) => {
      if (col.type === "Number") {
        const values = data.map((row: any) => Number(row[col.name])).filter((val: number) => !isNaN(val))
        const outliers = values.filter((val: number) => {
          const q1 = col.q1 || 0
          const q3 = col.q3 || 0
          const iqr = q3 - q1
          return val < q1 - 1.5 * iqr || val > q3 + 1.5 * iqr
        })
        const validityScore = ((values.length - outliers.length) / values.length) * 100

        rules.push({
          id: `validity_${col.name}`,
          category: "Validity",
          title: `${col.name} Outlier Detection`,
          description: `Column ${col.name} has ${validityScore.toFixed(1)}% values within normal range`,
          status: validityScore >= 90 ? "passed" : validityScore >= 75 ? "warning" : "failed",
          score: validityScore,
          details: `${outliers.length} potential outliers detected using IQR method`,
          recommendation:
            validityScore < 75
              ? "High number of outliers - investigate data collection or entry errors"
              : validityScore < 90
                ? "Some outliers present - review for data quality issues"
                : "Values are within expected ranges",
        })
      }
    })

    // Consistency Rules
    const numericColumns = columnStats.filter((col: any) => col.type === "Number")
    if (numericColumns.length >= 2) {
      const correlations = results.correlationMatrix?.strongPairs || []
      const consistencyScore = correlations.length > 0 ? 85 : 60

      rules.push({
        id: "consistency_correlations",
        category: "Consistency",
        title: "Data Relationships",
        description: `Found ${correlations.length} strong correlations between variables`,
        status: correlations.length >= 2 ? "passed" : correlations.length >= 1 ? "warning" : "failed",
        score: consistencyScore,
        details: `Strong correlations indicate consistent relationships in the data`,
        recommendation:
          correlations.length === 0
            ? "No strong relationships found - verify data collection methods"
            : "Good data consistency with logical relationships",
      })
    }

    // Accuracy Rules (Data Distribution)
    columnStats.forEach((col: any) => {
      if (col.type === "Number") {
        const skewness = Math.abs(col.skewness || 0)
        const accuracyScore = skewness < 1 ? 90 : skewness < 2 ? 70 : 50

        rules.push({
          id: `accuracy_${col.name}`,
          category: "Accuracy",
          title: `${col.name} Distribution`,
          description: `Column ${col.name} has ${skewness < 1 ? "normal" : skewness < 2 ? "moderate" : "high"} skewness`,
          status: skewness < 1 ? "passed" : skewness < 2 ? "warning" : "failed",
          score: accuracyScore,
          details: `Skewness value: ${skewness.toFixed(2)}`,
          recommendation:
            skewness >= 2
              ? "Highly skewed distribution - consider data transformation"
              : skewness >= 1
                ? "Moderately skewed - may benefit from normalization"
                : "Well-distributed data",
        })
      }
    })

    setQualityRules(rules)

    // Calculate overall score
    const avgScore = rules.reduce((sum, rule) => sum + rule.score, 0) / rules.length
    setOverallScore(avgScore)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "passed":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case "failed":
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "passed":
        return "text-green-600 bg-green-50 border-green-200"
      case "warning":
        return "text-yellow-600 bg-yellow-50 border-yellow-200"
      case "failed":
        return "text-red-600 bg-red-50 border-red-200"
      default:
        return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Completeness":
        return <Database className="h-5 w-5" />
      case "Uniqueness":
        return <Target className="h-5 w-5" />
      case "Validity":
        return <Shield className="h-5 w-5" />
      case "Consistency":
        return <BarChart3 className="h-5 w-5" />
      case "Accuracy":
        return <TrendingUp className="h-5 w-5" />
      default:
        return <Zap className="h-5 w-5" />
    }
  }

  const groupedRules = qualityRules.reduce(
    (acc, rule) => {
      if (!acc[rule.category]) {
        acc[rule.category] = []
      }
      acc[rule.category].push(rule)
      return acc
    },
    {} as Record<string, DataQualityRule[]>,
  )

  if (!analysisResults) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="rounded-3xl max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <Database className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No data available for quality analysis.</p>
            <p className="text-sm text-muted-foreground mt-2">Please upload and analyze data first.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="rounded-3xl border-2 border-primary/20 shadow-2xl">
          <CardHeader className="text-center pb-8">
            <CardTitle className="flex items-center justify-center gap-3 text-3xl">
              <Shield className="h-8 w-8 text-primary" />
              Data Quality Rules
            </CardTitle>
            <CardDescription className="text-lg">
              Comprehensive analysis of your data quality across multiple dimensions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 px-8 pb-8">
            {/* Overall Score */}
            <Card className="rounded-2xl bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="p-8 text-center">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <div className="text-6xl font-bold text-primary">{Math.round(overallScore)}</div>
                  <div className="text-left">
                    <p className="text-2xl font-semibold">Overall Quality Score</p>
                    <p className="text-muted-foreground">
                      {overallScore >= 85
                        ? "Excellent"
                        : overallScore >= 70
                          ? "Good"
                          : overallScore >= 50
                            ? "Fair"
                            : "Poor"}{" "}
                      data quality
                    </p>
                  </div>
                </div>
                <Progress value={overallScore} className="h-4" />
              </CardContent>
            </Card>

            {/* Quality Rules by Category */}
            <div className="space-y-8">
              {Object.entries(groupedRules).map(([category, rules]) => (
                <div key={category} className="space-y-4">
                  <div className="flex items-center gap-3">
                    {getCategoryIcon(category)}
                    <h3 className="text-xl font-semibold">{category}</h3>
                    <Badge variant="outline" className="text-sm">
                      {rules.length} rules
                    </Badge>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {rules.map((rule) => (
                      <Card key={rule.id} className={`rounded-2xl border-2 ${getStatusColor(rule.status)}`}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              {getStatusIcon(rule.status)}
                              <h4 className="font-semibold">{rule.title}</h4>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {Math.round(rule.score)}%
                            </Badge>
                          </div>

                          <p className="text-sm text-muted-foreground mb-3">{rule.description}</p>

                          <div className="space-y-2">
                            <Progress value={rule.score} className="h-2" />
                            <p className="text-xs text-muted-foreground">{rule.details}</p>
                          </div>

                          <div className="mt-4 p-3 rounded-lg bg-muted/50">
                            <p className="text-sm font-medium text-muted-foreground">Recommendation:</p>
                            <p className="text-sm">{rule.recommendation}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Summary Statistics */}
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Quality Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center p-4 rounded-lg bg-green-50">
                    <p className="text-2xl font-bold text-green-600">
                      {qualityRules.filter((r) => r.status === "passed").length}
                    </p>
                    <p className="text-sm text-green-600">Rules Passed</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-yellow-50">
                    <p className="text-2xl font-bold text-yellow-600">
                      {qualityRules.filter((r) => r.status === "warning").length}
                    </p>
                    <p className="text-sm text-yellow-600">Warnings</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-red-50">
                    <p className="text-2xl font-bold text-red-600">
                      {qualityRules.filter((r) => r.status === "failed").length}
                    </p>
                    <p className="text-sm text-red-600">Issues Found</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
