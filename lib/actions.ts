"use server"

import type { AnalysisResponse, ChatMessage, DashboardContext } from "@/lib/api-types"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

// Use the server-side environment variable
const API_KEY = process.env.OPENROUTER_API_KEY || ""
const SITE_URL = "https://chatlens.theversync.com"
const SITE_NAME = "ChatLens by TheVersync"

// Helper function to extract JSON from a string, robustly handling markdown code blocks
function extractJsonFromString(text: string): any | null {
  // Try to find JSON within a markdown code block first
  const jsonCodeBlockMatch = text.match(/```json\n([\s\S]*?)\n```/)
  if (jsonCodeBlockMatch && jsonCodeBlockMatch[1]) {
    try {
      return JSON.parse(jsonCodeBlockMatch[1])
    } catch (e) {
      console.error("Error parsing JSON from markdown code block:", e)
    }
  }

  // If no markdown code block, or parsing failed, try to find the first and last curly braces
  const firstCurly = text.indexOf("{")
  const lastCurly = text.lastIndexOf("}")

  if (firstCurly !== -1 && lastCurly !== -1 && lastCurly > firstCurly) {
    const jsonString = text.substring(firstCurly, lastCurly + 1)
    try {
      // Sanitize backslashes that are not part of valid escape sequences
      const sanitizedJsonString = jsonString.replace(/\\(?!["\\/bfnrtu])/g, "\\\\")
      return JSON.parse(sanitizedJsonString)
    } catch (e) {
      console.error("Error parsing JSON from extracted substring:", e)
    }
  }

  return null
}

export async function analyzeDataWithAI(data: Record<string, any>[], columns: string[]): Promise<any> {
  const prompt = `
  You are an expert data analyst. Analyze the provided dataset and its columns.
  The data is: ${JSON.stringify(data.slice(0, 5))} (showing first 5 rows for brevity)
  The columns are: ${JSON.stringify(columns)}

  Provide a comprehensive analysis in JSON format, covering the following categories:
  - Overview: A general description of the dataset and its potential.
  - Statistical Analysis: Key metrics, distributions, and relationships between variables.
  - Trend Analysis: Any patterns, seasonality, or growth observed, especially in time-based data.
  - Correlation Analysis: Look deeper into relationships between your key variables.
  - Data Quality Check: Review your data for completeness and accuracy to improve analysis results.

  For each category, provide a "title", a "description", and a "priority" (low, medium, high).
  The output MUST be a single JSON object. Ensure all string values within the JSON are properly escaped.

  Example JSON structure:
  {
    "overview": {
      "title": "Data Overview",
      "description": "Your data has been analyzed and shows interesting patterns worth exploring further.",
      "priority": "high"
    },
    "statistical_analysis": {
      "title": "Key Metrics",
      "description": "The statistical analysis reveals relationships between variables in your dataset.",
      "priority": "medium"
    },
    "trend_analysis": {
      "title": "Growth Patterns",
      "description": "Based on available data, seasonal patterns may exist in your time-based data.",
      "priority": "medium"
    },
    "correlation_analysis": {
      "title": "Key Correlations",
      "description": "Look deeper into relationships between your key variables.",
      "priority": "medium"
    },
    "data_quality_check": {
      "title": "Data Quality Check",
      "description": "Review your data for completeness and accuracy to improve analysis results.",
      "priority": "high"
    }
  }
  `

  try {
    const { text } = await generateText({
      model: openai("gpt-oss-20b:free"), // Ensure using openai/gpt-4o model
      prompt: prompt,
    })

    const insights = extractJsonFromString(text)
    if (insights) {
      return insights
    } else {
      console.error("Failed to extract JSON from AI response:", text)
      throw new Error("AI response could not be parsed as JSON.")
    }
  } catch (error) {
    console.error("API request failed:", error)
    throw new Error(`API request failed: ${error instanceof Error ? error.message : String(error)}`)
  }
}

// New function to analyze dashboard context with AI
export async function analyzeDashboardWithAI(context: DashboardContext): Promise<{ answer: string }> {
  try {
    if (!API_KEY) {
      throw new Error("API key is required")
    }

    console.log("Sending dashboard context to AI for understanding")

    const prompt = `
    You are an AI assistant designed to help non-technical users understand their data dashboard.
    Explain the key aspects of the provided dashboard context in simple, relatable terms.
    Focus on what the numbers mean, why certain columns are important, and what insights can be drawn.
    Avoid jargon or explain it clearly. Provide actionable interpretations.
    
    Here is the dashboard context:
    - File Name: ${context.fileName}
    - Total Records: ${context.rowCount}
    - Active Columns: ${context.columnCount}
    - Missing Values: ${context.missingValuesCount}
    - Target Column: ${context.targetColumn || "Not selected"}
    - Numeric Columns: ${context.numericColumns.map((c) => c.name).join(", ") || "None"}
    - Categorical Columns: ${context.categoricalColumns.map((c) => c.name).join(", ") || "None"}
    - Key Performance Indicators (KPIs): ${context.kpiMetrics.map((kpi) => `${kpi.title}: ${kpi.value}`).join("; ")}
    - Strongest Correlations (top 3): ${
      context.correlations?.strongPairs
        ?.slice(0, 3)
        .map((pair) => {
          const correlationValue =
            pair.correlation !== undefined && pair.correlation !== null && !isNaN(pair.correlation)
              ? pair.correlation.toFixed(2)
              : "N/A"
          return `${pair.col1} and ${pair.col2} (Correlation: ${correlationValue})`
        })
        .join("; ") || "None found"
    }
    - Key Regression Models (top 3 by R-squared): ${
      Object.entries(context.regressionModels || {})
        .sort(([_, a], [__, b]) => Math.abs(b?.rSquared ?? 0) - Math.abs(a?.rSquared ?? 0))
        .slice(0, 3)
        .map(([col, model]) => {
          const slopeValue =
            model?.slope !== undefined && model?.slope !== null && !isNaN(model.slope) ? model.slope.toFixed(2) : "N/A"
          const interceptValue =
            model?.intercept !== undefined && model?.intercept !== null && !isNaN(model.intercept)
              ? model.intercept.toFixed(2)
              : "N/A"
          const rSquaredValue =
            model?.rSquared !== undefined && model?.rSquared !== null && !isNaN(model.rSquared)
              ? model.rSquared.toFixed(2)
              : "N/A"
          return `${context.targetColumn} = ${slopeValue} * ${col} + ${interceptValue} (R²: ${rSquaredValue})`
        })
        .join("; ") || "None found"
    }
    
    Based on this information, provide a concise, easy-to-understand summary of what this dashboard is telling the user.
    Explain the significance of the target column, the KPIs, and any strong relationships.
    Conclude with a general suggestion on how the user can use this information.
    Return ONLY the explanation text, no JSON or markdown code blocks.
  `

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "HTTP-Referer": SITE_URL,
        "X-Title": SITE_NAME,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b:free", // Using GPT-4o via OpenRouter for better understanding and explanation
        messages: [
          {
            role: "system",
            content:
              "You are an AI assistant designed to help non-technical users understand their data dashboard. Explain the key aspects of the provided dashboard context in simple, relatable terms. Focus on what the numbers mean, why certain columns are important, and what insights can be drawn. Avoid jargon or explain it clearly. Provide actionable interpretations. Return ONLY the explanation text, no JSON or markdown code blocks.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 1000,
      }),
    })

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`)
    }

    const result = await response.json()
    if (!result || !result.choices || result.choices.length === 0 || !result.choices[0].message) {
      console.error("Unexpected API response structure from OpenRouter:", result)
      throw new Error("Unexpected API response structure from AI.")
    }
    const answer = result.choices[0].message.content

    return { answer }
  } catch (error) {
    console.error("Error analyzing dashboard with AI:", error)
    throw new Error(`Failed to generate dashboard insights: ${error instanceof Error ? error.message : String(error)}`)
  }
}

// New function to handle follow-up questions
export async function askFollowUpQuestion({
  question,
  analysisResults,
  previousMessages = [],
  model = "openai/gpt-oss-20b:free", // Changed default model to GPT-OSS-20B
}: {
  question: string
  analysisResults: any
  previousMessages?: ChatMessage[]
  model?: string // Allow specifying model for follow-up questions
}): Promise<{ answer: string }> {
  try {
    if (!API_KEY) {
      throw new Error("API key is required")
    }

    // Create a simplified version of the analysis results to include in the prompt
    const simplifiedResults = {
      summary: {
        rowCount: analysisResults.rowCount,
        columnCount: analysisResults.columnCount,
        columns: analysisResults.columnStats?.map((col: any) => ({
          name: col.name,
          type: col.type,
          stats: {
            mean: col.mean,
            median: col.median,
            min: col.min,
            max: col.max,
            stdDev: col.stdDev,
          },
        })),
      },
      correlations: analysisResults.correlationMatrix?.strongPairs || [],
      trends:
        analysisResults.regressionModels?.map((model: any) => ({
          x: model.xColumn,
          y: model.yColumn,
          rSquared: model.rSquared,
          slope: model.slope,
        })) || [],
      charts: analysisResults.charts || [], // Include chart metadata
      report: analysisResults.report || "", // Include the generated report
    }

    // Format previous messages for the API
    const formattedMessages = previousMessages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }))

    // Add system message and user question
    const messages = [
      {
        role: "system",
        content: `You are a data analysis assistant for non-technical users. You have access to the following analysis results and a generated business report: ${JSON.stringify(simplifiedResults)}. 
      Provide clear, simple explanations using everyday language and real-world examples. Avoid technical jargon or explain it when necessary.
      When appropriate, suggest visualizations that could help understand the data better.
      If you don't have enough information to answer a question, explain what additional data would be needed in simple terms.
      Always refer to the context provided by the charts and the generated report when answering.`,
      },
      ...formattedMessages,
      {
        role: "user",
        content: question,
      },
    ]

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "HTTP-Referer": SITE_URL,
        "X-Title": SITE_NAME,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model, // Use the specified model
        messages,
        max_tokens: 1000,
      }),
    })

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`)
    }

    const result = await response.json()
    if (!result || !result.choices || result.choices.length === 0 || !result.choices[0].message) {
      console.error("Unexpected API response structure from OpenRouter:", result)
      throw new Error("Unexpected API response structure from AI.")
    }
    const answer = result.choices[0].message.content

    return { answer }
  } catch (error) {
    console.error("Error asking follow-up question:", error)
    throw new Error(`Failed to process follow-up question: ${error instanceof Error ? error.message : String(error)}`)
  }
}

function getMockAnalysisResponse(): AnalysisResponse {
  return {
    insights: [
      {
        category: "Data Quality",
        title: "Missing Data Impact",
        description:
          "Your dataset has some missing values, similar to a survey where not everyone answers all questions. This might affect how accurately we can understand certain patterns, just like how a partially filled survey might not represent everyone's opinions perfectly.",
      },
      {
        category: "Statistical Analysis",
        title: "Key Relationships Found",
        description:
          "We've found some interesting connections between different pieces of your data. It's like noticing that when ice cream sales go up, so do swimming pool visits - both are related to hot weather. These relationships can help predict one value based on another.",
      },
      {
        category: "Data Distribution",
        title: "Value Spread Patterns",
        description:
          "Your data shows specific patterns in how values are distributed. Think of it like looking at household incomes in a neighborhood - you might see most families in the middle range, fewer at very high or very low incomes. Understanding this distribution helps set realistic expectations and identify unusual values.",
      },
    ],
    forecast: {
      growth: "Moderate growth expected in key metrics",
      seasonal: "Some regular patterns appear throughout the year",
      data: {
        message: "Based on your current data patterns, we can make some general predictions about future trends.",
      },
    },
    recommendations: [
      {
        title: "Fill in Data Gaps",
        description:
          "Consider collecting more complete information where data is missing. It's like fixing a puzzle with missing pieces - the complete picture will give you better insights.",
        priority: "high",
      },
      {
        title: "Focus on Strong Relationships",
        description:
          "Pay special attention to variables that show strong connections. For example, if customer satisfaction strongly relates to repeat purchases, focus on improving satisfaction to boost sales.",
        priority: "medium",
      },
      {
        title: "Regular Data Updates",
        description:
          "Set up a system to update your data regularly, like checking your car's dashboard while driving instead of only during annual maintenance. This helps you spot trends and react quickly to changes.",
        priority: "medium",
      },
    ],
  }
}

// New function to generate correlation insights with AI
export async function generateCorrelationInsights(correlationContext: {
  fileName: string
  strongPairs: any[]
  correlationMatrix: { labels: string[]; matrix: number[][] }
  columnStats: any[]
  previewData: any[]
}): Promise<{ insights: string }> {
  try {
    if (!API_KEY) {
      throw new Error("API key is required")
    }

    console.log("Generating correlation insights with AI")

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "HTTP-Referer": SITE_URL,
        "X-Title": SITE_NAME,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b:free", // Changed model to GPT-4o
        messages: [
          {
            role: "system",
            content: `You are a senior business analyst and data scientist. Analyze the correlation data and provide comprehensive, domain-specific business insights. 

Your analysis should include:
1. **Monthly/Temporal Trends** - Identify any time-based patterns
2. **Product Relationships** - Explain how different products/variables relate to each other
3. **Key Drivers Analysis** - Identify what drives the main metrics (like total units, profit, revenue)
4. **Negative Correlation Impact** - Explain what negative correlations mean for the business
5. **Business Implications** - Provide actionable business recommendations

Format your response in clean markdown with proper headers, bullet points, and emphasis. Make it business-focused and actionable. Avoid technical jargon - explain everything in business terms that stakeholders can understand and act upon.

Focus on practical insights like:
- Bundle promotion opportunities
- Seasonal planning strategies  
- Product positioning recommendations
- Customer behavior insights
- Revenue optimization suggestions

Be specific about the data you're analyzing and provide concrete examples.`,
          },
          {
            role: "user",
            content: `Please analyze this correlation data and provide comprehensive business insights:

Dataset: ${correlationContext.fileName}
Columns: ${correlationContext.correlationMatrix.labels.join(", ")}

Strong Correlations Found:
${correlationContext.strongPairs
  .map((pair) => `- ${pair.column1} and ${pair.column2}: ${pair.value.toFixed(3)} correlation`)
  .join("\n")}

Column Statistics:
${correlationContext.columnStats
  .map(
    (col) =>
      `- ${col.name} (${col.type}): Mean=${col.mean?.toFixed(2) || "N/A"}, StdDev=${col.stdDev?.toFixed(2) || "N/A"}`,
  )
  .join("\n")}

Sample Data (first few rows):
${JSON.stringify(correlationContext.previewData.slice(0, 3), null, 2)}

Please provide detailed business insights and actionable recommendations based on this correlation analysis.`,
          },
        ],
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`)
    }

    const result = await response.json()
    if (!result || !result.choices || result.choices.length === 0 || !result.choices[0].message) {
      console.error("Unexpected API response structure from OpenRouter:", result)
      throw new Error("Unexpected API response structure from AI.")
    }
    const insights = result.choices[0].message.content

    return { insights }
  } catch (error) {
    console.error("Error generating correlation insights:", error)
    throw new Error(`Failed to generate AI insights: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export async function checkApiKeyAvailable(): Promise<boolean> {
  // Check if the API key is available
  return !!process.env.OPENROUTER_API_KEY
}

export async function getChartInsight(
  chartType: string,
  xColumn: string,
  yColumn?: string,
  groupBy?: string,
): Promise<any> {
  const prompt = `
  You are an expert data visualization specialist. Provide a concise insight for a ${chartType} chart.
  The chart visualizes ${yColumn ? `${yColumn} by ${xColumn}` : `the distribution of ${xColumn}`}.
  ${groupBy ? `It is grouped by ${groupBy}.` : ""}

  Provide a "title" and a "description" for this chart insight in JSON format.
  The output MUST be a single JSON object. Ensure all string values within the JSON are properly escaped.

  Example JSON structure:
  {
    "title": "Sales Performance by Region",
    "description": "This bar chart illustrates the total sales across different geographical regions, highlighting top-performing areas."
  }
  `

  try {
    const { text } = await generateText({
      model: openai("gpt-oss-20b:free"), // Ensure using openai/gpt-4o model
      prompt: prompt,
    })

    const insight = extractJsonFromString(text)
    if (insight) {
      return insight
    } else {
      console.error("Failed to extract JSON from AI response for chart insight:", text)
      throw new Error("AI chart insight response could not be parsed as JSON.")
    }
  } catch (error) {
    console.error("API request for chart insight failed:", error)
    throw new Error(`API request for chart insight failed: ${error instanceof Error ? error.message : String(error)}`)
  }
}

// New function to generate a comprehensive business report from chart metadata
export async function generateChartReportWithAI(chartMetadata: any[]): Promise<{ report: string }> {
  try {
    if (!API_KEY) {
      throw new Error("API key is required")
    }

    console.log("Generating comprehensive chart report with AI")

    const formattedChartData = chartMetadata.map((chart) => {
      return {
        type: chart.type,
        label: chart.label,
        xColumn: chart.xColumn,
        yColumn: chart.yColumn,
        groupBy: chart.groupBy,
        dataPoints: chart.data.length,
        // Include a small sample of data to give context, but not the full dataset
        sampleData: chart.data.slice(0, 5),
        // Include the detailed analysis from getDetailedChartInsight if available
        detailedAnalysis: chart.detailedAnalysis,
      }
    })

    const prompt = `
    You are a senior business analyst and data strategist for a leading data analytics firm. Your goal is to provide a highly professional, actionable, and strategic business report based on the provided chart metadata.
    Focus on what the data means for business growth, operational efficiency, risk mitigation, and strategic decision-making. Translate statistical observations into clear business language and actionable steps.

    Analyze the following charts and their associated metadata:
    ${JSON.stringify(formattedChartData, null, 2)}

    Your report MUST be structured with the following Markdown headers and content:

    # Business Analysis Report

    ## Executive Summary
    Provide a concise, high-level overview of the most critical findings and overarching recommendations derived from all the charts. This section should give a quick understanding of the key takeaways for a busy executive.

    ## Detailed Chart Analysis
    For each chart provided in the metadata, create a dedicated sub-section.

    ### [Chart Type] Analysis (e.g., Bar Chart Analysis, Line Chart Analysis)
    *   **Purpose**: Briefly explain what this type of chart is typically used for and what it aims to show in this specific context.
    *   **Interpretation**: Describe the patterns, trends, distributions, or relationships observed in this specific chart. Use concrete data points (e.g., "highest value of X at Y," "a declining trend of Z by N%").
    *   **Key Findings**: List the most important observations from this chart. These should be factual statements about the data.
    *   **Business Implications & Recommendations**: Translate the key findings into actionable business insights. What does this mean for the business? What specific steps should be considered? Focus on growth opportunities, areas for improvement, and strategic adjustments.

    ## Overall Business Implications & Recommendations
    Synthesize the insights from all individual charts. Provide overarching strategic recommendations that tie together the various findings. This section should offer a holistic view and actionable strategies for the business.

    ## Key Performance Indicators (KPIs)
    Identify and explain any relevant Key Performance Indicators (KPIs) that can be directly inferred or are represented by the data in these charts. Explain their significance and how they can be tracked or improved.

    Ensure the entire report is written in a professional, clear, and concise tone. Avoid technical jargon where possible, or explain it simply if necessary. The focus should always be on business value and actionable intelligence.
    `

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "HTTP-Referer": SITE_URL,
        "X-Title": SITE_NAME,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b:free", // Using GPT-4o for comprehensive report generation
        messages: [
          {
            role: "system",
            content: `You are a highly skilled business analyst and data strategist for a leading data analytics firm. Your goal is to provide a highly professional, actionable, and strategic business report based on provided chart metadata. Focus on what the data means for business growth, operational efficiency, risk mitigation, and strategic decision-making. Translate statistical observations into clear business language and actionable steps.`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 3000, // Increased max_tokens for a comprehensive report
      }),
    })

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`)
    }

    const result = await response.json()
    if (!result || !result.choices || result.choices.length === 0 || !result.choices[0].message) {
      console.error("Unexpected API response structure from OpenRouter:", result)
      throw new Error("Unexpected API response structure from AI.")
    }
    const report = result.choices[0].message.content

    return { report }
  } catch (error) {
    console.error("Error generating chart report with AI:", error)
    throw new Error(`Failed to generate AI report: ${error instanceof Error ? error.message : String(error)}`)
  }
}
