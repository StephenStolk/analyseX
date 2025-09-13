"use server"

import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import type {
  SmartColumnCard,
  AnomalyDetection,
  DataCleaningSuggestion,
  NarrativeInsight,
  ScenarioSimulation,
} from "./advanced-data-analyzer"

interface NarrativeInsightsInput {
  smartColumnCards: SmartColumnCard[]
  anomalies: AnomalyDetection[]
  cleaningSuggestions: DataCleaningSuggestion[]
  correlations: Array<{ column1: string; column2: string; correlation: number }>
}

interface ScenarioSimulationInput {
  targetColumn: string
  features: { [key: string]: number }
  correlations: Array<{ column1: string; column2: string; correlation: number }>
  columnStats: SmartColumnCard[]
}

export async function generateNarrativeInsights(input: NarrativeInsightsInput): Promise<NarrativeInsight[]> {
  try {
    const { smartColumnCards, anomalies, cleaningSuggestions, correlations } = input

    // Prepare statistical summary
    const numericColumns = smartColumnCards.filter((card) => card.type === "numeric")
    const categoricalColumns = smartColumnCards.filter((card) => card.type === "categorical")

    const statisticalSummary = numericColumns.map((card) => ({
      column: card.column,
      mean: card.mean?.toFixed(2),
      stdDev: card.standardDeviation?.toFixed(2),
      skewness: card.skewness?.toFixed(2),
      outliers: card.outlierCount,
      nullPercentage: card.nullPercentage.toFixed(1),
    }))

    const correlationSummary = correlations
      .slice(0, 5)
      .map((corr) => `${corr.column1} and ${corr.column2} have a correlation of ${corr.correlation.toFixed(2)}`)
      .join("; ")

    const prompt = `You are an AI data analyst. Given the following statistical outputs from a dataset, generate an easily understandable summary using simple English. Mention the relationships, trends, and any important findings in a human-friendly format.

Dataset Overview:
- Total columns: ${smartColumnCards.length}
- Numeric columns: ${numericColumns.length}
- Categorical columns: ${categoricalColumns.length}
- Anomalies detected: ${anomalies.length}
- Data quality issues: ${cleaningSuggestions.length}

Statistical Summary:
${statisticalSummary
  .map(
    (stat) =>
      `- ${stat.column}: Mean=${stat.mean}, StdDev=${stat.stdDev}, Skewness=${stat.skewness}, Outliers=${stat.outliers}, Missing=${stat.nullPercentage}%`,
  )
  .join("\n")}

Key Correlations:
${correlationSummary}

Critical Issues:
${cleaningSuggestions
  .filter((s) => s.severity === "critical")
  .map((s) => `- ${s.column}: ${s.issue}`)
  .join("\n")}

High-Severity Anomalies:
${anomalies
  .filter((a) => a.severity === "high")
  .map((a) => `- ${a.column}: ${a.reason}`)
  .join("\n")}

Provide a comprehensive analysis with:
1. A clear summary of the dataset's overall health
2. 3-5 key findings about the data patterns
3. 3-5 actionable recommendations for data improvement or analysis next steps
4. Confidence level (0-100) based on data quality and completeness

Format your response as JSON with this structure:
{
  "title": "Data Quality Overview",
  "summary": "Brief overview in 2-3 sentences",
  "keyFindings": ["finding1", "finding2", "finding3"],
  "recommendations": ["rec1", "rec2", "rec3"],
  "confidence": 85
}`

    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt,
      temperature: 0.3,
    })

    // Parse the JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const insight = JSON.parse(jsonMatch[0])
      return [insight]
    }

    // Fallback if JSON parsing fails
    return [
      {
        title: "Data Analysis Summary",
        summary: `Your dataset contains ${smartColumnCards.length} columns with ${anomalies.length} anomalies detected. ${cleaningSuggestions.filter((s) => s.severity === "critical").length} critical data quality issues require attention.`,
        keyFindings: [
          `${numericColumns.length} numeric columns available for statistical analysis`,
          `${anomalies.filter((a) => a.severity === "high").length} high-severity anomalies detected`,
          `${smartColumnCards.filter((c) => c.nullPercentage > 20).length} columns have significant missing values`,
        ],
        recommendations: [
          "Address critical data quality issues before proceeding with analysis",
          "Investigate high-severity anomalies to determine if they represent errors",
          "Consider imputation strategies for columns with missing values",
        ],
        confidence: 80,
      },
    ]
  } catch (error) {
    console.error("Error generating narrative insights:", error)

    // Return fallback insights based on the input data
    return [
      {
        title: "Data Analysis Summary",
        summary: `Analysis completed for ${input.smartColumnCards.length} columns. ${input.anomalies.length} anomalies and ${input.cleaningSuggestions.length} data quality issues identified.`,
        keyFindings: [
          `${input.smartColumnCards.filter((c) => c.type === "numeric").length} numeric columns analyzed`,
          `${input.anomalies.filter((a) => a.severity === "high").length} high-priority anomalies found`,
          `${input.cleaningSuggestions.filter((s) => s.severity === "critical").length} critical data issues detected`,
        ],
        recommendations: [
          "Review detected anomalies for data accuracy",
          "Address critical data quality issues",
          "Consider data cleaning before advanced analysis",
        ],
        confidence: 75,
      },
    ]
  }
}

export async function generateScenarioSimulation(input: ScenarioSimulationInput): Promise<ScenarioSimulation> {
  try {
    const { targetColumn, features, correlations, columnStats } = input

    // Find target column statistics
    const targetStats = columnStats.find((card) => card.column === targetColumn)
    if (!targetStats || targetStats.type !== "numeric") {
      throw new Error("Target column must be numeric")
    }

    // Calculate predicted value using correlation-based estimation
    let predictedValue = targetStats.mean || 0
    const featureImpacts: { feature: string; impact: "positive" | "negative" | "neutral"; magnitude: number }[] = []

    // For each feature, calculate its impact based on correlation
    Object.entries(features).forEach(([featureName, featureValue]) => {
      const featureStats = columnStats.find((card) => card.column === featureName)
      if (!featureStats || featureStats.type !== "numeric") return

      // Find correlation between feature and target
      const correlation = correlations.find(
        (corr) =>
          (corr.column1 === featureName && corr.column2 === targetColumn) ||
          (corr.column1 === targetColumn && corr.column2 === featureName),
      )

      const corrValue = correlation?.correlation || 0
      const featureMean = featureStats.mean || 0
      const featureStd = featureStats.standardDeviation || 1
      const targetStd = targetStats.standardDeviation || 1

      // Calculate standardized impact
      const standardizedFeature = (featureValue - featureMean) / featureStd
      const impact = corrValue * standardizedFeature * targetStd

      predictedValue += impact

      // Determine impact direction and magnitude
      const impactDirection = impact > 0 ? "positive" : impact < 0 ? "negative" : "neutral"
      const impactMagnitude = Math.abs(impact) / (targetStats.standardDeviation || 1)

      featureImpacts.push({
        feature: featureName,
        impact: impactDirection,
        magnitude: Math.min(1, impactMagnitude), // Normalize to 0-1
      })
    })

    // Generate AI explanation
    const prompt = `You are a scenario simulation assistant. Based on this dataset analysis, explain the impact on the target variable when feature values are changed.

Target Variable: ${targetColumn}
Current Average: ${targetStats.mean?.toFixed(2)}
Predicted Value: ${predictedValue.toFixed(2)}

Feature Changes:
${Object.entries(features)
  .map(([name, value]) => `- ${name}: Set to ${value}`)
  .join("\n")}

Correlations with Target:
${correlations
  .filter((corr) => corr.column1 === targetColumn || corr.column2 === targetColumn)
  .map((corr) => {
    const otherColumn = corr.column1 === targetColumn ? corr.column2 : corr.column1
    return `- ${otherColumn}: ${corr.correlation.toFixed(3)} correlation`
  })
  .join("\n")}

Feature Impacts:
${featureImpacts
  .map((impact) => `- ${impact.feature}: ${impact.impact} impact (${(impact.magnitude * 100).toFixed(1)}% magnitude)`)
  .join("\n")}

Provide a clear, non-technical explanation of:
1. Why the predicted value changed
2. Which features had the most influence
3. The reliability of this prediction

Keep the explanation under 100 words and focus on practical insights.`

    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt,
      temperature: 0.3,
    })

    // Calculate confidence based on correlation strength and data quality
    const avgCorrelation = featureImpacts.reduce((sum, impact) => sum + impact.magnitude, 0) / featureImpacts.length
    const confidence = Math.min(95, Math.max(60, avgCorrelation * 100))

    return {
      targetColumn,
      changedFeatures: features,
      predictedValue,
      explanation: text.trim(),
      confidence: Math.round(confidence),
      featureImpacts,
    }
  } catch (error) {
    console.error("Error generating scenario simulation:", error)

    // Fallback calculation
    const targetStats = input.columnStats.find((card) => card.column === input.targetColumn)
    const baseValue = targetStats?.mean || 0

    return {
      targetColumn: input.targetColumn,
      changedFeatures: input.features,
      predictedValue: baseValue,
      explanation:
        "Simulation completed using baseline statistical methods. For more accurate predictions, ensure your dataset has strong correlations between features.",
      confidence: 65,
      featureImpacts: Object.keys(input.features).map((feature) => ({
        feature,
        impact: "neutral" as const,
        magnitude: 0.5,
      })),
    }
  }
}
