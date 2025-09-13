import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

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

    const {
      data,
      targetColumn,
      categoryColumn,
      fileName,
      domainType = "general",
      numericColumns = [],
      categoricalColumns = [],
    } = await request.json()

    // Validate input
    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: "Invalid data provided" }, { status: 400 })
    }

    if (!targetColumn) {
      return NextResponse.json({ error: "Target column is required" }, { status: 400 })
    }

    // Check if OPENROUTER_API_KEY is available
    if (!process.env.OPENROUTER_API_KEY) {
      console.warn("OPENROUTER_API_KEY not found, returning comprehensive fallback insights")
      return NextResponse.json({
        insights: generateHumanReadableFallbackInsights(data, targetColumn, categoryColumn, domainType, fileName),
      })
    }

    // Prepare comprehensive data summary for AI analysis
    const targetValues = data.map((row) => Number(row[targetColumn])).filter((val) => !isNaN(val))
    const targetStats = {
      total: targetValues.reduce((sum, val) => sum + val, 0),
      average: targetValues.length > 0 ? targetValues.reduce((sum, val) => sum + val, 0) / targetValues.length : 0,
      max: targetValues.length > 0 ? Math.max(...targetValues) : 0,
      min: targetValues.length > 0 ? Math.min(...targetValues) : 0,
      count: targetValues.length,
      median: calculateMedian(targetValues),
      stdDev: calculateStandardDeviation(targetValues),
    }

    // Category breakdown if available
    let categoryBreakdown = {}
    let categoryStats = {}
    if (categoryColumn) {
      categoryBreakdown = data.reduce((acc, row) => {
        const category = row[categoryColumn]
        const value = Number(row[targetColumn]) || 0
        if (category) {
          acc[category] = (acc[category] || 0) + value
        }
        return acc
      }, {})

      // Calculate category statistics
      categoryStats = Object.entries(categoryBreakdown)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .reduce((acc, [cat, val]) => {
          acc[cat] = {
            value: val,
            percentage: ((val / targetStats.total) * 100).toFixed(1),
            count: data.filter((row) => row[categoryColumn] === cat).length,
          }
          return acc
        }, {})
    }

    // Correlation analysis
    const correlations = calculateCorrelations(data, numericColumns.slice(0, 5))

    // Anomaly detection
    const anomalies = detectAnomalies(targetValues)

    // Trend analysis
    const trendAnalysis = analyzeTrends(targetValues)

    const dataSummary = {
      fileName,
      domainType,
      totalRecords: data.length,
      targetColumn,
      categoryColumn,
      targetStats,
      categoryBreakdown,
      categoryStats,
      correlations,
      anomalies,
      trendAnalysis,
      dataQuality: calculateDataQuality(data),
      numericColumns: numericColumns.slice(0, 5),
      categoricalColumns: categoricalColumns.slice(0, 5),
    }

    // Enhanced domain-specific prompting for human-readable insights
    const domainContext = getDomainContext(domainType)
    const prompt = createHumanReadablePrompt(dataSummary, domainContext)

    console.log("Sending human-readable prompt to AI:", prompt.substring(0, 500) + "...")

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": "AnalyseXtool - Advanced Analytics",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b:free",
        messages: [
          {
            role: "system",
            content: `You are a friendly ${domainContext.expertTitle} who explains data insights in simple, conversational language. Avoid technical jargon and statistical terms. Focus on what the data means for real people and what actions they should take. Write like you're explaining to a colleague over coffee, not writing an academic paper. Do NOT use markdown formatting like **bold** or *italic* - just write in plain, clear sentences.`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 2000,
        temperature: 0.8,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("OpenRouter API error:", response.status, errorText)
      return NextResponse.json({
        insights: generateHumanReadableFallbackInsights(data, targetColumn, categoryColumn, domainType, fileName),
        rawInsights: "API unavailable - using human-readable fallback insights",
        dataSummary,
      })
    }

    const aiResponse = await response.json()
    const insights = aiResponse.choices[0]?.message?.content || "Unable to generate insights at this time."

    console.log("AI Response received:", insights.substring(0, 500) + "...")

    // Parse the structured insights
    const parsedInsights = parseComprehensiveInsights(insights, domainType)

    return NextResponse.json({
      insights: parsedInsights,
      rawInsights: insights,
      dataSummary,
    })
  } catch (error) {
    console.error("AI Insights API Error:", error)
    return NextResponse.json(
      {
        error: "Failed to generate AI insights",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

function calculateStandardDeviation(values: number[]): number {
  if (values.length === 0) return 0
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
  return Math.sqrt(variance)
}

function calculateCorrelations(data: any[], numericColumns: string[]) {
  const correlations = []
  for (let i = 0; i < numericColumns.length; i++) {
    for (let j = i + 1; j < numericColumns.length; j++) {
      const col1Values = data.map((row) => Number(row[numericColumns[i]])).filter((val) => !isNaN(val))
      const col2Values = data.map((row) => Number(row[numericColumns[j]])).filter((val) => !isNaN(val))

      if (col1Values.length > 2 && col2Values.length > 2) {
        const correlation = calculatePearsonCorrelation(col1Values, col2Values)
        correlations.push({
          var1: numericColumns[i],
          var2: numericColumns[j],
          correlation: correlation,
          strength: Math.abs(correlation) > 0.7 ? "strong" : Math.abs(correlation) > 0.3 ? "moderate" : "weak",
        })
      }
    }
  }
  return correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation)).slice(0, 3)
}

function calculatePearsonCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length)
  if (n < 2) return 0

  const sumX = x.slice(0, n).reduce((sum, val) => sum + val, 0)
  const sumY = y.slice(0, n).reduce((sum, val) => sum + val, 0)
  const sumXY = x.slice(0, n).reduce((sum, val, i) => sum + val * y[i], 0)
  const sumX2 = x.slice(0, n).reduce((sum, val) => sum + val * val, 0)
  const sumY2 = y.slice(0, n).reduce((sum, val) => sum + val * val, 0)

  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))
  if (denominator === 0) return 0

  return (n * sumXY - sumX * sumY) / denominator
}

function detectAnomalies(values: number[]) {
  if (values.length === 0) return { count: 0, percentage: 0, severity: "low" }

  const mean = values.reduce((sum, val) => sum + val, 0) / values.length
  const stdDev = calculateStandardDeviation(values)

  const anomalies = values.filter((val) => Math.abs(val - mean) > 2 * stdDev)
  const percentage = (anomalies.length / values.length) * 100

  return {
    count: anomalies.length,
    percentage: percentage,
    severity: percentage > 10 ? "high" : percentage > 5 ? "medium" : "low",
  }
}

function analyzeTrends(values: number[]) {
  if (values.length < 3) return { direction: "stable", strength: 0, volatility: 0 }

  const firstHalf = values.slice(0, Math.floor(values.length / 2))
  const secondHalf = values.slice(Math.floor(values.length / 2))

  const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length
  const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length

  const change = ((secondAvg - firstAvg) / firstAvg) * 100
  const volatility =
    (calculateStandardDeviation(values) / (values.reduce((sum, val) => sum + val, 0) / values.length)) * 100

  return {
    direction: change > 5 ? "upward" : change < -5 ? "downward" : "stable",
    strength: Math.abs(change),
    volatility: volatility,
  }
}

function getDomainContext(domainType: string) {
  const contexts = {
    science: {
      expertTitle: "Research Scientist who explains complex data simply",
      specialization: "making scientific findings accessible to everyone",
      terminology: "experiments, results, findings, discoveries, patterns",
      focus: "what the research means and what we should do next",
    },
    research: {
      expertTitle: "Research Analyst who makes data easy to understand",
      specialization: "turning research data into clear, actionable insights",
      terminology: "studies, findings, patterns, trends, evidence",
      focus: "what the research tells us and how to use it",
    },
    academic: {
      expertTitle: "Academic Advisor who explains research clearly",
      specialization: "making academic findings practical and understandable",
      terminology: "studies, research, findings, evidence, patterns",
      focus: "what the academic work means in real terms",
    },
    business: {
      expertTitle: "Business Consultant who speaks in plain English",
      specialization: "turning business data into clear action plans",
      terminology: "performance, results, opportunities, growth, success",
      focus: "what the business should do to improve and grow",
    },
    finance: {
      expertTitle: "Financial Advisor who explains money matters simply",
      specialization: "making financial data easy to understand and act on",
      terminology: "money, profits, costs, investments, returns",
      focus: "what the financial data means for decision-making",
    },
    healthcare: {
      expertTitle: "Healthcare Analyst who explains medical data clearly",
      specialization: "making healthcare data understandable for everyone",
      terminology: "patients, treatments, outcomes, health, care",
      focus: "what the health data means for patient care and outcomes",
    },
    general: {
      expertTitle: "Data Analyst who makes numbers tell stories",
      specialization: "turning complex data into simple, clear insights",
      terminology: "patterns, trends, results, findings, insights",
      focus: "what the data means and what actions to take",
    },
  }

  return contexts[domainType] || contexts.general
}

function createHumanReadablePrompt(dataSummary: any, domainContext: any): string {
  const {
    fileName,
    domainType,
    totalRecords,
    targetColumn,
    categoryColumn,
    targetStats,
    categoryStats,
    correlations,
    anomalies,
    trendAnalysis,
    dataQuality,
  } = dataSummary

  return `I need you to analyze this ${domainType} dataset and explain what it means in simple, everyday language. Imagine you're talking to someone who isn't a data expert - use conversational language and focus on practical insights they can actually use.

DATASET OVERVIEW:
- File: ${fileName}
- Type: ${domainType.toUpperCase()} data
- Total records: ${totalRecords.toLocaleString()}
- Main thing we're measuring: ${targetColumn}
- How we're grouping the data: ${categoryColumn || "No groupings"}
- Data completeness: ${dataQuality.toFixed(1)}% (${dataQuality > 90 ? "excellent" : dataQuality > 70 ? "good" : "needs improvement"})

KEY NUMBERS:
- Total ${targetColumn}: ${targetStats.total.toLocaleString()}
- Typical value: ${targetStats.average.toFixed(2)}
- Highest value: ${targetStats.max.toFixed(2)}
- Lowest value: ${targetStats.min.toFixed(2)}
- Middle value: ${targetStats.median.toFixed(2)}

${
  categoryColumn && Object.keys(categoryStats).length > 0
    ? `TOP PERFORMERS:
${Object.entries(categoryStats)
  .map(([cat, stats]: [string, any]) => `- ${cat}: ${stats.value.toLocaleString()} (${stats.percentage}% of total)`)
  .join("\n")}`
    : ""
}

RELATIONSHIPS FOUND:
${
  correlations.length > 0
    ? correlations.map((corr) => `- ${corr.var1} and ${corr.var2} are ${corr.strength}ly connected`).join("\n")
    : "- No strong relationships found between variables"
}

UNUSUAL PATTERNS:
- Found ${anomalies.count} unusual values (${anomalies.percentage.toFixed(1)}% of data)
- Overall trend: ${trendAnalysis.direction.toUpperCase()} ${trendAnalysis.strength > 10 ? "(strong)" : "(moderate)"}
- Data consistency: ${trendAnalysis.volatility < 20 ? "Very stable" : trendAnalysis.volatility < 40 ? "Somewhat variable" : "Highly variable"}

Please provide exactly 10 insights in this format, using simple language that anyone can understand. Do NOT use any markdown formatting or special characters - just write in plain, clear sentences:

1. MAIN TAKEAWAY: [What's the most important thing this data tells us? Use everyday language.]
2. PERFORMANCE CHECK: [How are things performing overall? Good, bad, or mixed?]
3. STANDOUT FINDINGS: [What jumped out as interesting or surprising?]
4. PATTERNS DISCOVERED: [What patterns did you notice in the data?]
5. PROBLEM AREAS: [What issues or concerns should we be aware of?]
6. SUCCESS STORIES: [What's working well that we should celebrate or continue?]
7. OPPORTUNITIES: [Where are the biggest opportunities for improvement?]
8. RECOMMENDATIONS: [What are 2-3 specific things we should do next?]
9. WATCH OUT FOR: [What should we monitor or be careful about going forward?]
10. BOTTOM LINE: [If you had to sum this up in one sentence, what would you say?]

Remember:
- Use simple, conversational language
- Avoid technical terms and statistics
- Focus on what people should DO with this information
- Make it practical and actionable
- Write like you're explaining to a friend, not writing a report
- Do NOT use any markdown formatting like asterisks or special characters`
}

function parseComprehensiveInsights(insights: string, domainType: string) {
  const lines = insights.split("\n").filter((line) => line.trim())
  const parsed = {
    performance: "",
    distribution: "",
    correlation: "",
    anomaly: "",
    trend: "",
    segmentation: "",
    opportunity: "",
    risk: "",
    methodology: "",
    strategic: "",
  }

  // Clean function to remove markdown formatting
  const cleanText = (text: string): string => {
    return text
      .replace(/\*\*(.*?)\*\*/g, "$1") // Remove **bold**
      .replace(/\*(.*?)\*/g, "$1") // Remove *italic*
      .replace(/__(.*?)__/g, "$1") // Remove __bold__
      .replace(/_(.*?)_/g, "$1") // Remove _italic_
      .replace(/`(.*?)`/g, "$1") // Remove `code`
      .replace(/#{1,6}\s*/g, "") // Remove headers
      .trim()
  }

  // Map the human-readable format to our structure
  lines.forEach((line) => {
    const trimmed = line.trim()
    if (trimmed.match(/^\d+\.\s*MAIN TAKEAWAY:/i)) {
      parsed.performance = cleanText(trimmed.replace(/^\d+\.\s*MAIN TAKEAWAY:\s*/i, ""))
    } else if (trimmed.match(/^\d+\.\s*PERFORMANCE CHECK:/i)) {
      parsed.distribution = cleanText(trimmed.replace(/^\d+\.\s*PERFORMANCE CHECK:\s*/i, ""))
    } else if (trimmed.match(/^\d+\.\s*STANDOUT FINDINGS:/i)) {
      parsed.correlation = cleanText(trimmed.replace(/^\d+\.\s*STANDOUT FINDINGS:\s*/i, ""))
    } else if (trimmed.match(/^\d+\.\s*PATTERNS DISCOVERED:/i)) {
      parsed.anomaly = cleanText(trimmed.replace(/^\d+\.\s*PATTERNS DISCOVERED:\s*/i, ""))
    } else if (trimmed.match(/^\d+\.\s*PROBLEM AREAS:/i)) {
      parsed.trend = cleanText(trimmed.replace(/^\d+\.\s*PROBLEM AREAS:\s*/i, ""))
    } else if (trimmed.match(/^\d+\.\s*SUCCESS STORIES:/i)) {
      parsed.segmentation = cleanText(trimmed.replace(/^\d+\.\s*SUCCESS STORIES:\s*/i, ""))
    } else if (trimmed.match(/^\d+\.\s*OPPORTUNITIES:/i)) {
      parsed.opportunity = cleanText(trimmed.replace(/^\d+\.\s*OPPORTUNITIES:\s*/i, ""))
    } else if (trimmed.match(/^\d+\.\s*RECOMMENDATIONS:/i)) {
      parsed.risk = cleanText(trimmed.replace(/^\d+\.\s*RECOMMENDATIONS:\s*/i, ""))
    } else if (trimmed.match(/^\d+\.\s*WATCH OUT FOR:/i)) {
      parsed.methodology = cleanText(trimmed.replace(/^\d+\.\s*WATCH OUT FOR:\s*/i, ""))
    } else if (trimmed.match(/^\d+\.\s*BOTTOM LINE:/i)) {
      parsed.strategic = cleanText(trimmed.replace(/^\d+\.\s*BOTTOM LINE:\s*/i, ""))
    }
  })

  // Fallback parsing if structured format fails
  if (!parsed.performance && !parsed.distribution && !parsed.correlation) {
    const sentences = insights.split(/[.!?]+/).filter((s) => s.trim().length > 20)
    parsed.performance = cleanText(
      sentences[0]?.trim() || "The data shows interesting patterns worth exploring further.",
    )
    parsed.distribution = cleanText(
      sentences[1]?.trim() || "Overall performance looks solid with room for improvement.",
    )
    parsed.correlation = cleanText(sentences[2]?.trim() || "Some interesting connections were found in the data.")
    parsed.anomaly = cleanText(sentences[3]?.trim() || "The data reveals some clear patterns we can work with.")
    parsed.trend = cleanText(sentences[4]?.trim() || "There are a few areas that need attention.")
    parsed.segmentation = cleanText(sentences[5]?.trim() || "Several things are working well and should be continued.")
    parsed.opportunity = cleanText(sentences[6]?.trim() || "Good opportunities exist for improvement and growth.")
    parsed.risk = cleanText(sentences[7]?.trim() || "Focus on the top priorities and take action on key areas.")
    parsed.methodology = cleanText(sentences[8]?.trim() || "Keep an eye on key metrics and watch for changes.")
    parsed.strategic = cleanText(
      sentences[9]?.trim() || "Overall, the data tells a positive story with clear next steps.",
    )
  }

  return parsed
}

function generateHumanReadableFallbackInsights(
  data: any[],
  targetColumn: string,
  categoryColumn: string,
  domainType: string,
  fileName: string,
) {
  const targetValues = data.map((row) => Number(row[targetColumn])).filter((val) => !isNaN(val))
  const total = targetValues.reduce((sum, val) => sum + val, 0)
  const average = total / targetValues.length
  const max = Math.max(...targetValues)
  const min = Math.min(...targetValues)

  const isGoodPerformance = average > (max + min) / 2
  const hasGoodRange = (max - min) / average < 2
  const dataSize = targetValues.length

  return {
    performance: `Looking at your ${fileName} data, the main story is that ${targetColumn} shows ${isGoodPerformance ? "strong" : "mixed"} results across ${dataSize} records. The numbers tell us that things are generally ${isGoodPerformance ? "performing well" : "performing okay"} with a total of ${total.toLocaleString()} and typical values around ${average.toFixed(0)}.`,

    distribution: `Performance-wise, you're seeing ${hasGoodRange ? "consistent" : "varied"} results. The range goes from ${min.toFixed(0)} to ${max.toFixed(0)}, which ${hasGoodRange ? "shows good stability" : "indicates some ups and downs"}. This ${hasGoodRange ? "consistency is a good sign" : "variation is normal but worth watching"}.`,

    correlation: `What stands out most is ${max > average * 1.5 ? "some really strong performers that are doing much better than average" : "fairly even performance across the board"}. ${categoryColumn ? `When we look at different ${categoryColumn} groups, there are clear differences worth exploring` : "The data shows interesting patterns that could help guide decisions"}.`,

    anomaly: `The patterns in your data reveal ${dataSize > 100 ? "a solid foundation with enough information to make confident decisions" : "good insights, though more data over time would strengthen the analysis"}. ${average > min * 2 ? "Most values cluster around the higher end, which is encouraging" : "Values are spread fairly evenly across the range"}.`,

    trend: `Areas that need attention include ${min < average * 0.5 ? "some underperforming cases that are dragging down the overall results" : "maintaining current performance levels"}. ${!hasGoodRange ? "The wide variation in results suggests some inconsistency that could be addressed" : "The consistent performance is good, but there's always room for improvement"}.`,

    segmentation: `What's working well is ${max > average * 1.2 ? "the top performers are really excelling and show what's possible" : "the overall stability and predictable patterns in the data"}. ${categoryColumn ? `Some ${categoryColumn} categories are clearly outperforming others, which gives us a blueprint for success` : "The data shows reliable patterns we can build on"}.`,

    opportunity: `The biggest opportunities lie in ${max > average * 1.5 ? "scaling up what the top performers are doing right - there's clearly a winning formula here" : "improving consistency and bringing the lower performers up to average levels"}. ${categoryColumn ? "Focus on the categories that are working best and apply those lessons elsewhere" : "There's room to optimize and improve across the board"}.`,

    risk: `Here's what you should do next: First, ${max > average * 1.5 ? "study your top performers to understand what makes them successful" : "work on bringing up the underperformers"}. Second, ${categoryColumn ? `focus your efforts on the highest-potential ${categoryColumn} groups` : "establish consistent processes to reduce variation"}. Third, keep monitoring these numbers regularly to catch changes early.`,

    methodology: `Watch out for ${!hasGoodRange ? "the inconsistency in results - this could indicate process issues or external factors affecting performance" : "any changes in the stable patterns you're seeing"}. ${dataSize < 50 ? "Also, try to collect more data over time to strengthen your insights" : "Keep tracking these metrics to spot trends early"}. Don't ignore the ${min < average * 0.5 ? "underperformers - they might reveal important issues" : "outliers - they often tell important stories"}.`,

    strategic: `Bottom line: Your ${targetColumn} data shows ${isGoodPerformance ? "promising results with clear opportunities to build on what's working" : "solid potential with room for improvement through focused action"}. ${max > average * 1.5 ? "You have proof that high performance is possible - now it's about scaling that success" : "Focus on consistency and gradual improvement to see steady gains"}.`,
  }
}

function calculateDataQuality(data: any[]): number {
  if (data.length === 0) return 0

  const keys = Object.keys(data[0] || {})
  if (keys.length === 0) return 0

  const totalCells = data.length * keys.length
  const filledCells = data.reduce((count, row) => {
    return (
      count +
      keys.filter((key) => {
        const val = row[key]
        return val !== null && val !== undefined && val !== "" && val !== "N/A"
      }).length
    )
  }, 0)

  return totalCells > 0 ? (filledCells / totalCells) * 100 : 0
}
