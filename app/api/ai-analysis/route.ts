import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

function performComprehensiveAnalysis(data: any[], selectedColumns: string[], analysisType: string): any {
  if (!data || data.length === 0 || !selectedColumns || selectedColumns.length === 0) {
    return { error: "No data or columns provided" }
  }

  const results: any = {
    success: true,
    analysisType,
    data_points_analyzed: data.length,
    columns_analyzed: selectedColumns.length,
    statistics: {},
    insights: {},
    recommendations: [],
  }

  // Calculate comprehensive statistics for each column
  selectedColumns.forEach((column) => {
    const values = data.map((row) => Number.parseFloat(row[column])).filter((val) => !isNaN(val))
    if (values.length > 0) {
      const sum = values.reduce((a, b) => a + b, 0)
      const mean = sum / values.length
      const sortedValues = values.sort((a, b) => a - b)
      const median = sortedValues[Math.floor(sortedValues.length / 2)]
      const min = Math.min(...values)
      const max = Math.max(...values)

      // Calculate standard deviation and other statistics
      const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length
      const stdDev = Math.sqrt(variance)

      // Calculate trend (simple linear regression slope)
      const n = values.length
      const xValues = Array.from({ length: n }, (_, i) => i)
      const xMean = (n - 1) / 2
      const slope =
        xValues.reduce((sum, x, i) => sum + (x - xMean) * (values[i] - mean), 0) /
        xValues.reduce((sum, x) => sum + Math.pow(x - xMean, 2), 0)

      // Calculate correlation with other numeric columns
      const correlations: Record<string, number> = {}
      selectedColumns.forEach((otherColumn) => {
        if (otherColumn !== column) {
          const otherValues = data.map((row) => Number.parseFloat(row[otherColumn])).filter((val) => !isNaN(val))
          if (otherValues.length === values.length) {
            const otherMean = otherValues.reduce((a, b) => a + b, 0) / otherValues.length
            const numerator = values.reduce((sum, val, i) => sum + (val - mean) * (otherValues[i] - otherMean), 0)
            const denominator = Math.sqrt(
              values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) *
                otherValues.reduce((sum, val) => sum + Math.pow(val - otherMean, 2), 0),
            )
            correlations[otherColumn] = denominator !== 0 ? numerator / denominator : 0
          }
        }
      })

      results.statistics[column] = {
        count: values.length,
        mean: Math.round(mean * 100) / 100,
        median: Math.round(median * 100) / 100,
        min,
        max,
        std_dev: Math.round(stdDev * 100) / 100,
        trend_slope: Math.round(slope * 100) / 100,
        trend_direction: slope > 0.1 ? "increasing" : slope < -0.1 ? "decreasing" : "stable",
        volatility: stdDev > mean * 0.3 ? "high" : stdDev > mean * 0.1 ? "moderate" : "low",
        correlations: Object.fromEntries(
          Object.entries(correlations).map(([key, val]) => [key, Math.round(val * 100) / 100]),
        ),
      }

      // Generate insights for each column
      results.insights[column] = {
        trend_strength: Math.abs(slope) > mean * 0.1 ? "strong" : "weak",
        variability: results.statistics[column].volatility,
        performance: mean > (min + max) / 2 ? "above_average" : "below_average",
        growth_rate: slope > 0 ? Math.round((slope / mean) * 100 * 100) / 100 : 0,
      }
    }
  })

  // Generate analysis-specific recommendations
  switch (analysisType) {
    case "regression_feature_importance":
      results.recommendations = [
        "Identify key drivers using correlation analysis",
        "Focus on variables with strongest relationships",
        "Use insights for predictive modeling",
      ]
      break
    case "time_series":
    case "time_series_forecast":
      results.recommendations = [
        "Monitor trend patterns for strategic planning",
        "Consider seasonal factors in forecasting",
        "Use historical patterns for future predictions",
      ]
      break
    case "pca_clustering":
      results.recommendations = [
        "Group similar data points for segmentation",
        "Focus on main variation drivers",
        "Use clusters for targeted strategies",
      ]
      break
    default:
      results.recommendations = [
        "Analyze key performance indicators",
        "Monitor trends and patterns regularly",
        "Use data insights for decision making",
      ]
  }

  return results
}

function classifyIntent(prompt: string, answers: any): { analysisType: string; confidence: number } {
  const goal = answers?.goal || ""

  const intentMap: Record<string, string> = {
    profit_drivers: "regression_feature_importance",
    seasonal_patterns: "time_series",
    hidden_patterns: "pca_clustering",
    compare_groups: "statistical_tests",
    predict_future: "time_series_forecast",
    custom: "ai_interpretation",
  }

  const analysisType = intentMap[goal] || "exploratory"

  return {
    analysisType,
    confidence: goal ? 0.9 : 0.5,
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const gateRes = await fetch(new URL("/api/subscriptions/usage", request.nextUrl).toString(), {
      method: "GET",
      headers: { "Content-Type": "application/json", cookie: request.headers.get("cookie") || "" },
    })

    if (!gateRes.ok) {
      return NextResponse.json(
        { error: "Unable to verify subscription status", canGenerate: false },
        { status: gateRes.status },
      )
    }

    const gateData = await gateRes.json()
    if (!gateData.canGenerate) {
      return NextResponse.json(
        { error: "Dataset limit reached. Please upgrade your plan.", canGenerate: false },
        { status: 403 },
      )
    }

    const body = await request.json()
    const { prompt, dataSummary, answers, customQuestion, isFollowUp, actualData } = body

    console.log("[v0] API request received:", {
      isFollowUp,
      hasActualData: !!actualData,
      actualDataLength: actualData?.length,
      dataSummaryTotalRows: dataSummary?.totalRows,
      selectedColumns: dataSummary?.selectedColumns,
    })

    if (actualData && dataSummary) {
      const actualCount = actualData.length
      const reportedCount = dataSummary.totalRows
      if (actualCount !== reportedCount) {
        console.log(
          `[v0] DATA MISMATCH: actualData has ${actualCount} rows but dataSummary reports ${reportedCount} rows`,
        )
      } else {
        console.log(`[v0] DATA VERIFIED: Both actualData and dataSummary confirm ${actualCount} rows`)
      }
    }

    let systemMessage = ""
    let analysisResults = null
    let hasRealResults = false

    if (isFollowUp) {
      const actualRowCount = actualData?.length || dataSummary?.totalRows || 0
      systemMessage = `You are a helpful data analyst assistant made by Team AnalyzeX continuing a conversation about a ${actualRowCount}-row dataset analysis. 

DATASET CONTEXT:
- Dataset size: ${actualRowCount} rows
- Columns: ${dataSummary?.selectedColumns?.join(", ") || "various columns"}
- Previous analysis completed on actual data

Provide clear, business-focused answers that build on the previous analysis context make sure u keep the conversation domain related. Reference specific data characteristics when relevant. Keep responses conversational and practical.`
    } else {
      const actualRowCount = actualData?.length || dataSummary?.totalRows || 0
      systemMessage = `You are a data analyst helping a business user understand their dataset.

CRITICAL DATA INFORMATION:
- ACTUAL DATASET SIZE: ${actualRowCount} rows (the dataset has ${actualRowCount} rows)
- Data source: ${dataSummary?.fileName || "uploaded dataset"}
- Columns analyzed: ${dataSummary?.selectedColumns?.join(", ") || "none selected"}
- Available columns: ${actualData?.[0] ? Object.keys(actualData[0]).join(", ") : "unknown"}

IMPORTANT: The dataset contains exactly ${actualRowCount} rows of data.`

      if (actualData && actualData.length > 0 && dataSummary?.selectedColumns?.length > 0) {
        const intent = classifyIntent(prompt, answers)
        console.log(`[v0] Classified intent: ${intent.analysisType}`)

        try {
          analysisResults = performComprehensiveAnalysis(actualData, dataSummary.selectedColumns, intent.analysisType)
          hasRealResults = analysisResults.success && !analysisResults.error

          console.log(`[v0] Analysis completed:`, {
            success: hasRealResults,
            dataPointsAnalyzed: analysisResults.data_points_analyzed,
            columnsAnalyzed: analysisResults.columns_analyzed,
          })
        } catch (error) {
          console.error("[v0] Analysis failed:", error)
          analysisResults = { error: "Analysis failed", success: false }
        }

        if (hasRealResults) {
          const insightsSummary = {
            analysis_type: analysisResults.analysisType || intent.analysisType,
            data_points: analysisResults.data_points_analyzed,
            columns_analyzed: analysisResults.columns_analyzed,
            key_statistics: analysisResults.statistics,
            insights: analysisResults.insights,
            recommendations: analysisResults.recommendations,
          }

          systemMessage += `\n\nREAL ANALYSIS RESULTS FROM ${actualRowCount} ROWS:
${JSON.stringify(insightsSummary, null, 2)}

These are actual statistical calculations performed on your ${actualRowCount}-row dataset. Interpret these real results in business-friendly language or answer in such a way that it matches the domain of the dataset. Focus on actionable insights and practical recommendations.`
        }
      }
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "https://analysex.vercel.app",
        "X-Title": "AnalyzeX Data Analytics Platform",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [
          {
            role: "system",
            content: systemMessage,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: isFollowUp ? 0.7 : 0.2,
        max_tokens: isFollowUp ? 1000 : 2500,
        top_p: 0.9,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("OpenRouter API error:", response.status, errorText)
      throw new Error(`API request failed: ${response.status}`)
    }

    const aiResponse = await response.json()

    aiResponse.metadata = {
      hasRealResults,
      analysisExecuted: !!analysisResults,
      dataRows: actualData?.length || dataSummary?.totalRows || 0,
      dataVerified: actualData?.length === dataSummary?.totalRows,
      analysisMethod: analysisResults?.analysisType || "comprehensive_js",
      jsAnalysis: true,
      timestamp: new Date().toISOString(),
    }

    aiResponse.intent = {
      analysisType: analysisResults?.analysisType || "exploratory",
      confidence: 0.9,
    }

    console.log("[v0] API response prepared successfully with metadata:", aiResponse.metadata)
    return NextResponse.json(aiResponse)
  } catch (error) {
    console.error("AI Analysis API error:", error)
    return NextResponse.json(
      {
        error: "Failed to process AI analysis request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
