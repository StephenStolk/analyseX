export interface DetailedChartInsight {
  title: string
  description: string
  type: "info" | "warning" | "success" | "error"
  statistical?: string
  detailedAnalysis: {
    purpose: string[]
    interpretation: string[]
    keyFindings: string[]
    recommendations: string[]
    statisticalNotes: string[]
  }
}

export function getDetailedChartInsight(
  chartType: string,
  data: any[],
  xColumn?: string,
  yColumn?: string,
  groupColumn?: string,
): DetailedChartInsight {
  try {
    if (!data || data.length === 0) {
      return {
        title: "No Data Available",
        description: "Please provide data to generate insights.",
        type: "warning",
        detailedAnalysis: {
          purpose: ["Data visualization requires valid dataset"],
          interpretation: ["No data points available for analysis"],
          keyFindings: ["Dataset is empty or invalid"],
          recommendations: ["Upload a valid dataset with numeric/categorical data"],
          statisticalNotes: ["Statistical analysis requires minimum data points"],
        },
      }
    }

    switch (chartType.toLowerCase()) {
      case "bar":
      case "bar chart":
        return getDetailedBarChartInsight(data, xColumn, yColumn)

      case "line":
      case "line chart":
        return getDetailedLineChartInsight(data, xColumn, yColumn)

      case "scatter":
      case "scatter plot":
        return getDetailedScatterPlotInsight(data, xColumn, yColumn)

      case "pie":
      case "pie chart":
        return getDetailedPieChartInsight(data, xColumn)

      case "histogram":
        return getDetailedHistogramInsight(data, xColumn)

      case "box":
      case "boxplot":
      case "box plot":
        return getDetailedBoxPlotInsight(data, xColumn)

      case "area":
      case "area chart":
        return getDetailedAreaChartInsight(data, xColumn, yColumn)

      default:
        return getGenericDetailedInsight(chartType, data)
    }
  } catch (error) {
    console.error("Error generating detailed chart insight:", error)
    return {
      title: "Analysis Error",
      description: "Unable to generate detailed insights for this chart.",
      type: "error",
      detailedAnalysis: {
        purpose: ["Chart analysis encountered an error"],
        interpretation: ["Unable to process chart data"],
        keyFindings: ["Data processing failed"],
        recommendations: ["Check data quality and try again"],
        statisticalNotes: ["Error in statistical computation"],
      },
    }
  }
}

function getDetailedBarChartInsight(data: any[], xColumn?: string, yColumn?: string): DetailedChartInsight {
  if (!xColumn || !yColumn) {
    return {
      title: "Bar Chart Configuration Required",
      description: "Select both X and Y columns for comprehensive analysis.",
      type: "warning",
      detailedAnalysis: {
        purpose: ["Bar charts compare categorical data across different groups"],
        interpretation: ["Configuration incomplete - need both axes defined"],
        keyFindings: ["Missing column selection prevents analysis"],
        recommendations: ["Select categorical variable for X-axis and numeric variable for Y-axis"],
        statisticalNotes: ["Bar charts require categorical vs numeric data comparison"],
      },
    }
  }

  const values = data.map((row) => Number(row[yColumn])).filter((val) => !isNaN(val))
  if (values.length === 0) {
    return {
      title: "No Valid Numeric Data",
      description: "Y-axis column contains no numeric values.",
      type: "error",
      detailedAnalysis: {
        purpose: ["Bar charts display numeric values across categories"],
        interpretation: ["Selected Y-column has no numeric data"],
        keyFindings: ["Data type mismatch prevents visualization"],
        recommendations: ["Choose a numeric column for Y-axis values"],
        statisticalNotes: ["Numeric data required for meaningful bar chart analysis"],
      },
    }
  }

  const maxValue = Math.max(...values)
  const minValue = Math.min(...values)
  const avgValue = values.reduce((sum, val) => sum + val, 0) / values.length
  const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - avgValue, 2), 0) / values.length)

  const maxIndex = values.indexOf(maxValue)
  const minIndex = values.indexOf(minValue)
  const maxCategory = data[maxIndex]?.[xColumn] || "Unknown"
  const minCategory = data[minIndex]?.[xColumn] || "Unknown"

  const range = maxValue - minValue
  const coefficientOfVariation = (stdDev / avgValue) * 100

  return {
    title: "📊 Comprehensive Bar Chart Analysis",
    description: `${maxCategory} leads with ${maxValue.toFixed(2)}, while ${minCategory} has the lowest value at ${minValue.toFixed(2)}. The data shows ${coefficientOfVariation.toFixed(1)}% variability.`,
    type: "success",
    statistical: `Mean: ${avgValue.toFixed(2)}, Std Dev: ${stdDev.toFixed(2)}, CV: ${coefficientOfVariation.toFixed(1)}%`,
    detailedAnalysis: {
      purpose: [
        "🎯 Bar charts compare quantities across different categories",
        "📈 Ideal for showing discrete categorical data with numeric values",
        "🔍 Perfect for identifying highest/lowest performing categories",
        "📊 Enables quick visual comparison between groups",
        "💡 Helps spot patterns and outliers in categorical data",
      ],
      interpretation: [
        `📌 Highest Value: ${maxCategory} (${maxValue.toFixed(2)}) - ${((maxValue / avgValue - 1) * 100).toFixed(1)}% above average`,
        `📌 Lowest Value: ${minCategory} (${minValue.toFixed(2)}) - ${((1 - minValue / avgValue) * 100).toFixed(1)}% below average`,
        `📊 Data Range: ${range.toFixed(2)} units spanning from ${minValue.toFixed(2)} to ${maxValue.toFixed(2)}`,
        `📈 Average Performance: ${avgValue.toFixed(2)} across all categories`,
        `📉 Variability: ${coefficientOfVariation.toFixed(1)}% coefficient of variation indicates ${coefficientOfVariation > 30 ? "high" : coefficientOfVariation > 15 ? "moderate" : "low"} dispersion`,
      ],
      keyFindings: [
        `🏆 Top Performer: ${maxCategory} significantly outperforms others`,
        `⚠️ Bottom Performer: ${minCategory} may need attention or improvement`,
        `📊 Distribution: ${coefficientOfVariation > 30 ? "Highly variable data suggests significant differences between categories" : "Relatively consistent performance across categories"}`,
        `🎯 Performance Gap: ${(((maxValue - minValue) / avgValue) * 100).toFixed(1)}% difference between best and worst`,
        `📈 Data Quality: ${values.length} valid data points out of ${data.length} total records`,
      ],
      recommendations: [
        `🔍 Focus Analysis: Investigate why ${maxCategory} performs best - replicate success factors`,
        `⚡ Improvement Area: ${minCategory} shows potential for enhancement`,
        `📊 Benchmarking: Use ${maxCategory} as benchmark for other categories`,
        `🎯 Resource Allocation: Consider redistributing resources based on performance gaps`,
        `📈 Monitoring: Track changes in these metrics over time for trend analysis`,
      ],
      statisticalNotes: [
        `📊 Sample Size: ${values.length} categories analyzed`,
        `📈 Central Tendency: Mean = ${avgValue.toFixed(2)}, indicating typical performance level`,
        `📉 Dispersion: Standard deviation = ${stdDev.toFixed(2)}, showing data spread`,
        `🎯 Relative Variability: CV = ${coefficientOfVariation.toFixed(1)}% indicates ${coefficientOfVariation > 30 ? "high heterogeneity" : "reasonable consistency"}`,
        `⚖️ Data Balance: Range covers ${((range / avgValue) * 100).toFixed(1)}% of the average value`,
      ],
    },
  }
}

function getDetailedLineChartInsight(data: any[], xColumn?: string, yColumn?: string): DetailedChartInsight {
  if (!xColumn || !yColumn) {
    return {
      title: "Line Chart Configuration Required",
      description: "Select both X and Y columns for trend analysis.",
      type: "warning",
      detailedAnalysis: {
        purpose: ["Line charts show trends and changes over time or continuous variables"],
        interpretation: ["Configuration incomplete - need both axes defined"],
        keyFindings: ["Missing column selection prevents trend analysis"],
        recommendations: ["Select continuous variable for X-axis and numeric variable for Y-axis"],
        statisticalNotes: ["Line charts require ordered data for meaningful trend analysis"],
      },
    }
  }

  const values = data.map((row) => Number(row[yColumn])).filter((val) => !isNaN(val))
  if (values.length < 2) {
    return {
      title: "Insufficient Data for Trend Analysis",
      description: "Need at least 2 data points to analyze trends.",
      type: "error",
      detailedAnalysis: {
        purpose: ["Line charts reveal patterns and trends in sequential data"],
        interpretation: ["Insufficient data points for trend calculation"],
        keyFindings: ["Cannot determine trend direction with < 2 points"],
        recommendations: ["Provide more data points for meaningful trend analysis"],
        statisticalNotes: ["Minimum 2 points required for slope calculation"],
      },
    }
  }

  // Calculate trend using linear regression
  const n = values.length
  const xValues = Array.from({ length: n }, (_, i) => i)
  const sumX = xValues.reduce((sum, x) => sum + x, 0)
  const sumY = values.reduce((sum, y) => sum + y, 0)
  const sumXY = xValues.reduce((sum, x, i) => sum + x * values[i], 0)
  const sumX2 = xValues.reduce((sum, x) => sum + x * x, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  const firstHalf = values.slice(0, Math.floor(n / 2))
  const secondHalf = values.slice(Math.floor(n / 2))
  const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length
  const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length

  const trendDirection = slope > 0.01 ? "increasing" : slope < -0.01 ? "decreasing" : "stable"
  const trendStrength = Math.abs(slope)
  const changePercent = ((secondAvg - firstAvg) / firstAvg) * 100

  return {
    title: "📈 Comprehensive Line Chart Trend Analysis",
    description: `Data shows a ${trendDirection} trend with slope of ${slope.toFixed(4)}. ${changePercent > 0 ? "Values increased" : changePercent < 0 ? "Values decreased" : "Values remained stable"} by ${Math.abs(changePercent).toFixed(1)}% from start to end.`,
    type: trendDirection === "stable" ? "info" : "success",
    statistical: `Slope: ${slope.toFixed(4)}, R² trend strength, Change: ${changePercent.toFixed(1)}%`,
    detailedAnalysis: {
      purpose: [
        "📈 Line charts reveal trends and patterns over time or sequences",
        "🔍 Perfect for identifying growth, decline, or stability patterns",
        "📊 Shows rate of change and trend direction clearly",
        "🎯 Enables forecasting and prediction based on historical patterns",
        "💡 Helps identify cyclical patterns, seasonality, and anomalies",
      ],
      interpretation: [
        `📈 Trend Direction: ${trendDirection.toUpperCase()} with slope coefficient of ${slope.toFixed(4)}`,
        `📊 Overall Change: ${changePercent.toFixed(1)}% change from first half (${firstAvg.toFixed(2)}) to second half (${secondAvg.toFixed(2)})`,
        `🎯 Trend Strength: ${trendStrength > 1 ? "Strong" : trendStrength > 0.1 ? "Moderate" : "Weak"} trend based on slope magnitude`,
        `📉 Volatility: ${values.length} data points show ${trendDirection === "stable" ? "consistent" : "changing"} behavior`,
        `⚡ Rate of Change: ${(slope * 100).toFixed(2)} units change per period on average`,
      ],
      keyFindings: [
        `🏆 Trend Pattern: ${trendDirection === "increasing" ? "Positive growth trajectory detected" : trendDirection === "decreasing" ? "Declining trend requires attention" : "Stable pattern indicates consistency"}`,
        `📊 Performance Shift: ${Math.abs(changePercent).toFixed(1)}% ${changePercent > 0 ? "improvement" : changePercent < 0 ? "decline" : "stability"} between periods`,
        `🎯 Predictive Value: ${trendStrength > 0.5 ? "Strong trend enables reliable forecasting" : "Weak trend limits prediction accuracy"}`,
        `📈 Data Consistency: ${n} sequential points provide ${n > 10 ? "robust" : n > 5 ? "adequate" : "limited"} trend analysis`,
        `⚖️ Trend Reliability: ${Math.abs(slope) > 0.1 ? "Statistically significant trend" : "Trend may be due to random variation"}`,
      ],
      recommendations: [
        `🔍 ${trendDirection === "increasing" ? "Capitalize on positive momentum - investigate success factors" : trendDirection === "decreasing" ? "Address declining trend - identify root causes" : "Monitor for emerging patterns in stable data"}`,
        `📊 Forecasting: ${trendStrength > 0.5 ? "Use trend for short-term predictions" : "Collect more data before making predictions"}`,
        `🎯 Monitoring: Track ${Math.abs(changePercent) > 10 ? "significant changes" : "subtle variations"} for early trend detection`,
        `📈 Data Collection: ${n < 10 ? "Gather more data points for robust trend analysis" : "Current data provides good trend visibility"}`,
        `⚡ Action Items: ${trendDirection === "decreasing" ? "Implement corrective measures immediately" : "Continue monitoring and maintain current strategies"}`,
      ],
      statisticalNotes: [
        `📊 Linear Regression: y = ${slope.toFixed(4)}x + ${intercept.toFixed(2)}`,
        `📈 Slope Interpretation: ${(slope * 100).toFixed(2)} unit change per 100 periods`,
        `🎯 Sample Size: ${n} data points provide ${n > 30 ? "excellent" : n > 10 ? "good" : "basic"} statistical power`,
        `📉 Trend Significance: ${Math.abs(slope) > 0.1 ? "Statistically meaningful" : "May be within normal variation"}`,
        `⚖️ Confidence Level: ${n > 20 ? "High confidence" : n > 10 ? "Moderate confidence" : "Low confidence"} in trend direction`,
      ],
    },
  }
}

function getDetailedScatterPlotInsight(data: any[], xColumn?: string, yColumn?: string): DetailedChartInsight {
  if (!xColumn || !yColumn) {
    return {
      title: "Scatter Plot Configuration Required",
      description: "Select both X and Y columns for correlation analysis.",
      type: "warning",
      detailedAnalysis: {
        purpose: ["Scatter plots reveal relationships between two continuous variables"],
        interpretation: ["Configuration incomplete - need both variables defined"],
        keyFindings: ["Missing variable selection prevents correlation analysis"],
        recommendations: ["Select two numeric variables to analyze their relationship"],
        statisticalNotes: ["Correlation analysis requires two continuous variables"],
      },
    }
  }

  const pairs = data
    .map((row) => ({
      x: Number(row[xColumn]),
      y: Number(row[yColumn]),
    }))
    .filter((pair) => !isNaN(pair.x) && !isNaN(pair.y))

  if (pairs.length < 3) {
    return {
      title: "Insufficient Data for Correlation Analysis",
      description: "Need at least 3 valid data points to analyze correlation.",
      type: "error",
      detailedAnalysis: {
        purpose: ["Scatter plots show relationships between two variables"],
        interpretation: ["Insufficient data points for correlation calculation"],
        keyFindings: ["Cannot determine relationship with < 3 points"],
        recommendations: ["Provide more valid data points for correlation analysis"],
        statisticalNotes: ["Minimum 3 points required for correlation coefficient"],
      },
    }
  }

  // Calculate Pearson correlation coefficient
  const n = pairs.length
  const sumX = pairs.reduce((sum, pair) => sum + pair.x, 0)
  const sumY = pairs.reduce((sum, pair) => sum + pair.y, 0)
  const sumXY = pairs.reduce((sum, pair) => sum + pair.x * pair.y, 0)
  const sumX2 = pairs.reduce((sum, pair) => sum + pair.x * pair.x, 0)
  const sumY2 = pairs.reduce((sum, pair) => sum + pair.y * pair.y, 0)

  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))
  if (denominator === 0) {
    return {
      title: "No Variation in Data",
      description: "One or both variables have no variation - correlation cannot be calculated.",
      type: "warning",
      detailedAnalysis: {
        purpose: ["Scatter plots require variation in both variables"],
        interpretation: ["Constant values prevent correlation analysis"],
        keyFindings: ["No relationship can be determined with constant variables"],
        recommendations: ["Ensure both variables have varying values"],
        statisticalNotes: ["Zero variance prevents correlation coefficient calculation"],
      },
    }
  }

  const correlation = (n * sumXY - sumX * sumY) / denominator
  const correlationStrength = Math.abs(correlation) > 0.7 ? "strong" : Math.abs(correlation) > 0.3 ? "moderate" : "weak"
  const correlationDirection = correlation > 0 ? "positive" : "negative"

  // Calculate R-squared
  const rSquared = correlation * correlation
  const varianceExplained = rSquared * 100

  return {
    title: "🔍 Comprehensive Scatter Plot Correlation Analysis",
    description: `${correlationStrength.toUpperCase()} ${correlationDirection} correlation (r = ${correlation.toFixed(3)}) between ${xColumn} and ${yColumn}. ${varianceExplained.toFixed(1)}% of variance explained.`,
    type: Math.abs(correlation) > 0.5 ? "success" : "info",
    statistical: `r = ${correlation.toFixed(3)}, R² = ${rSquared.toFixed(3)}, n = ${n}`,
    detailedAnalysis: {
      purpose: [
        "🔍 Scatter plots reveal relationships between two continuous variables",
        "📊 Perfect for identifying linear and non-linear associations",
        "🎯 Enables correlation analysis and strength assessment",
        "📈 Helps detect outliers and unusual data patterns",
        "💡 Foundation for regression analysis and predictive modeling",
      ],
      interpretation: [
        `📊 Correlation Coefficient: r = ${correlation.toFixed(3)} indicates ${correlationStrength} ${correlationDirection} relationship`,
        `🎯 Relationship Strength: ${Math.abs(correlation) > 0.7 ? "Variables are highly related" : Math.abs(correlation) > 0.3 ? "Moderate relationship exists" : "Weak or no linear relationship"}`,
        `📈 Direction: ${correlation > 0 ? "As " + xColumn + " increases, " + yColumn + " tends to increase" : "As " + xColumn + " increases, " + yColumn + " tends to decrease"}`,
        `📉 Variance Explained: R² = ${rSquared.toFixed(3)} means ${varianceExplained.toFixed(1)}% of ${yColumn} variation is explained by ${xColumn}`,
        `⚖️ Statistical Significance: ${Math.abs(correlation) > 0.5 ? "Relationship is likely meaningful" : "Relationship may be due to chance"}`,
      ],
      keyFindings: [
        `🏆 Relationship Quality: ${correlationStrength.toUpperCase()} correlation suggests ${Math.abs(correlation) > 0.5 ? "predictive potential" : "limited predictive value"}`,
        `📊 Data Pattern: ${correlation > 0.7 ? "Strong positive linear pattern" : correlation < -0.7 ? "Strong negative linear pattern" : correlation > 0.3 ? "Moderate positive trend" : correlation < -0.3 ? "Moderate negative trend" : "Scattered data with weak pattern"}`,
        `🎯 Predictive Power: ${varianceExplained.toFixed(1)}% variance explained ${varianceExplained > 50 ? "enables good predictions" : varianceExplained > 25 ? "allows moderate predictions" : "limits prediction accuracy"}`,
        `📈 Sample Adequacy: ${n} data points provide ${n > 30 ? "robust" : n > 10 ? "adequate" : "limited"} correlation analysis`,
        `⚡ Practical Significance: ${Math.abs(correlation) > 0.3 ? "Relationship has practical implications" : "Relationship may not be practically significant"}`,
      ],
      recommendations: [
        `🔍 ${Math.abs(correlation) > 0.5 ? "Leverage this relationship for predictions and decision-making" : "Consider other variables that might better explain the relationship"}`,
        `📊 ${correlation > 0.5 ? "Use " + xColumn + " as a predictor for " + yColumn : correlation < -0.5 ? "Monitor inverse relationship between variables" : "Explore non-linear relationships or additional variables"}`,
        `🎯 Data Quality: ${n < 30 ? "Collect more data points to strengthen correlation analysis" : "Current sample size provides reliable correlation estimates"}`,
        `📈 Further Analysis: ${Math.abs(correlation) > 0.3 ? "Consider regression analysis for quantitative predictions" : "Investigate other potential relationships or confounding variables"}`,
        `⚡ Action Items: ${Math.abs(correlation) > 0.5 ? "Incorporate relationship into business/research decisions" : "Continue exploring other variable combinations"}`,
      ],
      statisticalNotes: [
        `📊 Pearson Correlation: r = ${correlation.toFixed(3)} measures linear relationship strength`,
        `📈 Coefficient of Determination: R² = ${rSquared.toFixed(3)} shows proportion of variance explained`,
        `🎯 Sample Size: n = ${n} provides ${n > 30 ? "high" : n > 10 ? "moderate" : "low"} statistical power`,
        `📉 Significance Level: ${Math.abs(correlation) > 0.6 ? "Highly significant" : Math.abs(correlation) > 0.3 ? "Moderately significant" : "May not be statistically significant"}`,
        `⚖️ Assumptions: Linear relationship assumed - check for non-linear patterns in scatter plot`,
      ],
    },
  }
}

function getDetailedPieChartInsight(data: any[], xColumn?: string): DetailedChartInsight {
  if (!xColumn) {
    return {
      title: "Pie Chart Configuration Required",
      description: "Select a categorical column for distribution analysis.",
      type: "warning",
      detailedAnalysis: {
        purpose: ["Pie charts show proportional distribution of categorical data"],
        interpretation: ["Configuration incomplete - need category variable defined"],
        keyFindings: ["Missing category selection prevents distribution analysis"],
        recommendations: ["Select a categorical variable to analyze its distribution"],
        statisticalNotes: ["Pie charts require categorical data for meaningful analysis"],
      },
    }
  }

  const categories = data.map((row) => row[xColumn]).filter((val) => val !== null && val !== undefined && val !== "")

  if (categories.length === 0) {
    return {
      title: "No Valid Categorical Data",
      description: "Selected column contains no valid values for pie chart analysis.",
      type: "error",
      detailedAnalysis: {
        purpose: ["Pie charts display categorical data distribution"],
        interpretation: ["Selected column has no valid categorical values"],
        keyFindings: ["Data quality issues prevent visualization"],
        recommendations: ["Choose a column with valid categorical data"],
        statisticalNotes: ["Valid categories required for distribution analysis"],
      },
    }
  }

  const categoryCount = categories.reduce(
    (acc, cat) => {
      const key = String(cat)
      acc[key] = (acc[key] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const sortedCategories = Object.entries(categoryCount).sort(([, a], [, b]) => b - a)
  const totalCount = categories.length
  const uniqueCategories = sortedCategories.length

  const topCategory = sortedCategories[0]
  const topPercentage = (topCategory[1] / totalCount) * 100

  // Calculate distribution metrics
  const entropy = -sortedCategories.reduce((sum, [, count]) => {
    const p = count / totalCount
    return sum + p * Math.log2(p)
  }, 0)

  const maxEntropy = Math.log2(uniqueCategories)
  const normalizedEntropy = entropy / maxEntropy

  const dominanceIndex = topPercentage / 100
  const distributionType =
    dominanceIndex > 0.5 ? "dominated" : normalizedEntropy > 0.8 ? "balanced" : "moderately skewed"

  return {
    title: "🥧 Comprehensive Pie Chart Distribution Analysis",
    description: `${topCategory[0]} dominates with ${topPercentage.toFixed(1)}% share. Distribution is ${distributionType} across ${uniqueCategories} categories with ${(normalizedEntropy * 100).toFixed(1)}% balance score.`,
    type: "success",
    statistical: `Entropy: ${entropy.toFixed(2)}, Balance: ${(normalizedEntropy * 100).toFixed(1)}%, Categories: ${uniqueCategories}`,
    detailedAnalysis: {
      purpose: [
        "🥧 Pie charts visualize proportional relationships in categorical data",
        "📊 Perfect for showing market share, composition, or part-to-whole relationships",
        "🎯 Enables quick identification of dominant categories",
        "📈 Reveals distribution balance and concentration patterns",
        "💡 Helps communicate relative importance of different segments",
      ],
      interpretation: [
        `🏆 Dominant Category: ${topCategory[0]} represents ${topPercentage.toFixed(1)}% of total (${topCategory[1]} out of ${totalCount} items)`,
        `📊 Distribution Type: ${distributionType.toUpperCase()} - ${dominanceIndex > 0.5 ? "one category dominates" : normalizedEntropy > 0.8 ? "categories are well-balanced" : "moderate concentration exists"}`,
        `🎯 Category Diversity: ${uniqueCategories} distinct categories with ${(normalizedEntropy * 100).toFixed(1)}% balance score`,
        `📈 Concentration Level: ${dominanceIndex > 0.7 ? "Highly concentrated" : dominanceIndex > 0.4 ? "Moderately concentrated" : "Well distributed"} data`,
        `⚖️ Information Content: Entropy = ${entropy.toFixed(2)} bits indicates ${entropy > 2 ? "high" : entropy > 1 ? "moderate" : "low"} information diversity`,
      ],
      keyFindings: [
        `🎯 Market Leader: ${topCategory[0]} holds ${topPercentage.toFixed(1)}% market share - ${topPercentage > 50 ? "clear dominance" : topPercentage > 30 ? "strong position" : "leading but competitive"}`,
        `📊 Competition Level: ${uniqueCategories > 5 ? "Highly fragmented market" : uniqueCategories > 3 ? "Moderate competition" : "Concentrated market"} with ${uniqueCategories} players`,
        `🏆 Top 3 Analysis: ${sortedCategories
          .slice(0, 3)
          .map(([name, count]) => `${name} (${((count / totalCount) * 100).toFixed(1)}%)`)
          .join(
            ", ",
          )} control ${(sortedCategories.slice(0, 3).reduce((sum, [, count]) => sum + count, 0) / totalCount) * 100 > 70 ? "majority" : "significant portion"}`,
        `📈 Distribution Health: ${normalizedEntropy > 0.8 ? "Healthy diversity" : normalizedEntropy > 0.5 ? "Moderate diversity" : "Low diversity - potential risk"}`,
        `⚡ Strategic Insights: ${dominanceIndex > 0.6 ? "Monopolistic tendencies detected" : "Competitive landscape with opportunities"}`,
      ],
      recommendations: [
        `🔍 ${dominanceIndex > 0.5 ? "Investigate success factors of " + topCategory[0] + " for competitive advantage" : "Analyze top performers to identify growth opportunities"}`,
        `📊 Market Strategy: ${topPercentage > 60 ? "Challenge dominant player or find niche markets" : "Compete for market share in balanced environment"}`,
        `🎯 Portfolio Balance: ${normalizedEntropy < 0.5 ? "Diversify to reduce concentration risk" : "Maintain current balanced distribution"}`,
        `📈 Growth Opportunities: Focus on ${sortedCategories
          .slice(-3)
          .map(([name]) => name)
          .join(", ")} for potential expansion`,
        `⚡ Risk Management: ${dominanceIndex > 0.7 ? "High concentration risk - develop contingency plans" : "Balanced risk profile across categories"}`,
      ],
      statisticalNotes: [
        `📊 Shannon Entropy: H = ${entropy.toFixed(2)} bits measures information content`,
        `📈 Normalized Entropy: ${(normalizedEntropy * 100).toFixed(1)}% of maximum possible diversity`,
        `🎯 Dominance Index: ${(dominanceIndex * 100).toFixed(1)}% concentration in top category`,
        `📉 Gini Coefficient: ${(1 - sortedCategories.reduce((sum, [, count]) => sum + Math.pow(count / totalCount, 2), 0)).toFixed(3)} inequality measure`,
        `⚖️ Sample Adequacy: ${totalCount} observations provide ${totalCount > 100 ? "excellent" : totalCount > 30 ? "good" : "basic"} statistical reliability`,
      ],
    },
  }
}

function getDetailedHistogramInsight(data: any[], column?: string): DetailedChartInsight {
  if (!column) {
    return {
      title: "Histogram Configuration Required",
      description: "Select a numeric column for distribution analysis.",
      type: "warning",
      detailedAnalysis: {
        purpose: ["Histograms show frequency distribution of continuous data"],
        interpretation: ["Configuration incomplete - need numeric variable defined"],
        keyFindings: ["Missing variable selection prevents distribution analysis"],
        recommendations: ["Select a numeric variable to analyze its distribution"],
        statisticalNotes: ["Histograms require continuous numeric data"],
      },
    }
  }

  const values = data.map((row) => Number(row[column])).filter((val) => !isNaN(val))
  if (values.length === 0) {
    return {
      title: "No Valid Numeric Data",
      description: "Selected column contains no numeric values for histogram analysis.",
      type: "error",
      detailedAnalysis: {
        purpose: ["Histograms display distribution of numeric values"],
        interpretation: ["Selected column has no valid numeric data"],
        keyFindings: ["Data type mismatch prevents distribution analysis"],
        recommendations: ["Choose a column with numeric values"],
        statisticalNotes: ["Numeric data required for frequency distribution"],
      },
    }
  }

  const n = values.length
  const mean = values.reduce((sum, val) => sum + val, 0) / n
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n
  const stdDev = Math.sqrt(variance)

  if (stdDev === 0) {
    return {
      title: "No Variation in Data",
      description: "All values are identical - no distribution to analyze.",
      type: "warning",
      detailedAnalysis: {
        purpose: ["Histograms require variation in data values"],
        interpretation: ["Constant values prevent distribution analysis"],
        keyFindings: ["No statistical distribution with identical values"],
        recommendations: ["Ensure data has varying values for analysis"],
        statisticalNotes: ["Zero variance indicates no distribution pattern"],
      },
    }
  }

  const sortedValues = [...values].sort((a, b) => a - b)
  const min = sortedValues[0]
  const max = sortedValues[n - 1]
  const range = max - min
  const median = n % 2 === 0 ? (sortedValues[n / 2 - 1] + sortedValues[n / 2]) / 2 : sortedValues[Math.floor(n / 2)]

  // Calculate quartiles
  const q1 = sortedValues[Math.floor(n * 0.25)]
  const q3 = sortedValues[Math.floor(n * 0.75)]
  const iqr = q3 - q1

  // Calculate skewness and kurtosis
  const skewness = values.reduce((sum, val) => sum + Math.pow((val - mean) / stdDev, 3), 0) / n
  const kurtosis = values.reduce((sum, val) => sum + Math.pow((val - mean) / stdDev, 4), 0) / n - 3

  const distributionType = Math.abs(skewness) < 0.5 ? "normal" : skewness > 0.5 ? "right-skewed" : "left-skewed"
  const kurtosisType = kurtosis > 1 ? "leptokurtic" : kurtosis < -1 ? "platykurtic" : "mesokurtic"

  return {
    title: "📊 Comprehensive Histogram Distribution Analysis",
    description: `${distributionType.toUpperCase()} distribution with mean ${mean.toFixed(2)} ± ${stdDev.toFixed(2)}. Skewness: ${skewness.toFixed(2)}, showing ${Math.abs(skewness) > 1 ? "strong" : Math.abs(skewness) > 0.5 ? "moderate" : "slight"} asymmetry.`,
    type: "success",
    statistical: `μ = ${mean.toFixed(2)}, σ = ${stdDev.toFixed(2)}, Skew = ${skewness.toFixed(2)}, Kurt = ${kurtosis.toFixed(2)}`,
    detailedAnalysis: {
      purpose: [
        "📊 Histograms reveal the underlying distribution pattern of numeric data",
        "🔍 Perfect for identifying normality, skewness, and outliers",
        "📈 Shows frequency concentration and data spread patterns",
        "🎯 Enables statistical inference and assumption checking",
        "💡 Foundation for choosing appropriate statistical tests and models",
      ],
      interpretation: [
        `📊 Distribution Shape: ${distributionType.toUpperCase()} - ${distributionType === "normal" ? "symmetric bell curve" : distributionType === "right-skewed" ? "tail extends to the right" : "tail extends to the left"}`,
        `📈 Central Tendency: Mean = ${mean.toFixed(2)}, Median = ${median.toFixed(2)} ${Math.abs(mean - median) > stdDev * 0.1 ? "(significant difference indicates skewness)" : "(close values suggest symmetry)"}`,
        `📉 Variability: Standard deviation = ${stdDev.toFixed(2)} represents ${((stdDev / mean) * 100).toFixed(1)}% coefficient of variation`,
        `🎯 Data Spread: Range = ${range.toFixed(2)} from ${min.toFixed(2)} to ${max.toFixed(2)}, IQR = ${iqr.toFixed(2)}`,
        `⚖️ Shape Characteristics: ${kurtosisType} distribution with ${kurtosis > 0 ? "heavier" : kurtosis < 0 ? "lighter" : "normal"} tails`,
      ],
      keyFindings: [
        `🏆 Distribution Type: ${distributionType === "normal" ? "Normal distribution enables parametric statistical tests" : "Non-normal distribution may require non-parametric methods"}`,
        `📊 Symmetry Analysis: Skewness = ${skewness.toFixed(2)} indicates ${Math.abs(skewness) < 0.5 ? "approximately symmetric" : skewness > 0 ? "right tail dominance" : "left tail dominance"}`,
        `🎯 Outlier Potential: ${kurtosis > 1 ? "Heavy tails suggest outlier presence" : kurtosis < -1 ? "Light tails indicate uniform distribution" : "Normal tail behavior"}`,
        `📈 Data Quality: ${n} observations with ${((1 - values.filter((v) => Math.abs(v - mean) > 3 * stdDev).length / n) * 100).toFixed(1)}% within 3 standard deviations`,
        `⚡ Statistical Power: Sample size ${n > 30 ? "adequate for Central Limit Theorem" : "may be insufficient for normal approximation"}`,
      ],
      recommendations: [
        `🔍 Statistical Tests: ${distributionType === "normal" ? "Use parametric tests (t-test, ANOVA)" : "Consider non-parametric alternatives (Mann-Whitney, Kruskal-Wallis)"}`,
        `📊 Data Transformation: ${Math.abs(skewness) > 1 ? "Apply log or square root transformation to reduce skewness" : "Current distribution suitable for most analyses"}`,
        `🎯 Outlier Investigation: ${kurtosis > 1 ? "Examine extreme values for data quality issues" : "Distribution appears well-behaved"}`,
        `📈 Sample Size: ${n < 30 ? "Collect more data for robust statistical inference" : n > 100 ? "Excellent sample size for analysis" : "Adequate sample for basic analysis"}`,
        `⚡ Modeling Approach: ${distributionType === "normal" ? "Linear models appropriate" : "Consider robust or non-parametric modeling techniques"}`,
      ],
      statisticalNotes: [
        `📊 Descriptive Statistics: n = ${n}, μ = ${mean.toFixed(2)}, σ = ${stdDev.toFixed(2)}`,
        `📈 Quartile Summary: Q1 = ${q1.toFixed(2)}, Median = ${median.toFixed(2)}, Q3 = ${q3.toFixed(2)}`,
        `🎯 Moment Analysis: Skewness = ${skewness.toFixed(2)}, Kurtosis = ${kurtosis.toFixed(2)}`,
        `📉 Normality Assessment: ${Math.abs(skewness) < 0.5 && Math.abs(kurtosis) < 1 ? "Approximately normal" : "Deviates from normality"}`,
        `⚖️ Coefficient of Variation: ${((stdDev / mean) * 100).toFixed(1)}% indicates ${stdDev / mean > 0.3 ? "high" : stdDev / mean > 0.15 ? "moderate" : "low"} relative variability`,
      ],
    },
  }
}

function getDetailedBoxPlotInsight(data: any[], column?: string): DetailedChartInsight {
  if (!column) {
    return {
      title: "Box Plot Configuration Required",
      description: "Select a numeric column for distribution analysis.",
      type: "warning",
      detailedAnalysis: {
        purpose: ["Box plots show distribution summary with quartiles and outliers"],
        interpretation: ["Configuration incomplete - need numeric variable defined"],
        keyFindings: ["Missing variable selection prevents distribution analysis"],
        recommendations: ["Select a numeric variable to analyze its distribution"],
        statisticalNotes: ["Box plots require continuous numeric data"],
      },
    }
  }

  const values = data.map((row) => Number(row[column])).filter((val) => !isNaN(val))
  if (values.length === 0) {
    return {
      title: "No Valid Numeric Data",
      description: "Selected column contains no numeric values for box plot analysis.",
      type: "error",
      detailedAnalysis: {
        purpose: ["Box plots display distribution summary statistics"],
        interpretation: ["Selected column has no valid numeric data"],
        keyFindings: ["Data type mismatch prevents distribution analysis"],
        recommendations: ["Choose a column with numeric values"],
        statisticalNotes: ["Numeric data required for quartile analysis"],
      },
    }
  }

  const n = values.length
  const sortedValues = [...values].sort((a, b) => a - b)

  // Calculate five-number summary
  const min = sortedValues[0]
  const max = sortedValues[n - 1]
  const q1 = sortedValues[Math.floor(n * 0.25)]
  const median = n % 2 === 0 ? (sortedValues[n / 2 - 1] + sortedValues[n / 2]) / 2 : sortedValues[Math.floor(n / 2)]
  const q3 = sortedValues[Math.floor(n * 0.75)]
  const iqr = q3 - q1

  // Identify outliers using IQR method
  const lowerFence = q1 - 1.5 * iqr
  const upperFence = q3 + 1.5 * iqr
  const outliers = values.filter((val) => val < lowerFence || val > upperFence)
  const outlierPercentage = (outliers.length / n) * 100

  // Calculate additional statistics
  const mean = values.reduce((sum, val) => sum + val, 0) / n
  const range = max - min
  const skewness = ((mean - median) / (q3 - q1)) * 3 // Approximate skewness

  return {
    title: "📦 Comprehensive Box Plot Distribution Analysis",
    description: `Five-number summary: Min=${min.toFixed(2)}, Q1=${q1.toFixed(2)}, Median=${median.toFixed(2)}, Q3=${q3.toFixed(2)}, Max=${max.toFixed(2)}. ${outliers.length} outliers detected (${outlierPercentage.toFixed(1)}%).`,
    type: "success",
    statistical: `IQR = ${iqr.toFixed(2)}, Outliers = ${outliers.length}, Range = ${range.toFixed(2)}`,
    detailedAnalysis: {
      purpose: [
        "📦 Box plots provide comprehensive distribution summary in compact form",
        "🔍 Perfect for identifying outliers, skewness, and data spread",
        "📊 Shows quartiles, median, and extreme values simultaneously",
        "🎯 Enables comparison between multiple groups or time periods",
        "💡 Robust visualization that handles outliers gracefully",
      ],
      interpretation: [
        `📊 Five-Number Summary: Min=${min.toFixed(2)}, Q1=${q1.toFixed(2)}, Median=${median.toFixed(2)}, Q3=${q3.toFixed(2)}, Max=${max.toFixed(2)}`,
        `📈 Central 50%: Middle half of data spans ${iqr.toFixed(2)} units (Interquartile Range)`,
        `🎯 Data Symmetry: ${Math.abs(skewness) < 0.1 ? "Symmetric distribution" : skewness > 0.1 ? "Right-skewed (mean > median)" : "Left-skewed (mean < median)"}`,
        `📉 Outlier Analysis: ${outliers.length} outliers (${outlierPercentage.toFixed(1)}%) beyond fences [${lowerFence.toFixed(2)}, ${upperFence.toFixed(2)}]`,
        `⚖️ Spread Analysis: Total range = ${range.toFixed(2)}, with IQR containing middle 50% of data`,
      ],
      keyFindings: [
        `🏆 Distribution Center: Median = ${median.toFixed(2)} represents typical value, ${Math.abs(mean - median) > iqr * 0.1 ? "differs from mean due to skewness" : "closely matches mean indicating symmetry"}`,
        `📊 Data Concentration: ${iqr.toFixed(2)} IQR shows ${iqr < range * 0.3 ? "concentrated" : iqr > range * 0.7 ? "spread out" : "moderately distributed"} middle 50%`,
        `🎯 Outlier Impact: ${outlierPercentage.toFixed(1)}% outliers ${outlierPercentage > 5 ? "significantly affect" : outlierPercentage > 1 ? "moderately influence" : "minimally impact"} distribution`,
        `📈 Quartile Balance: Q1-Median span = ${(median - q1).toFixed(2)}, Median-Q3 span = ${(q3 - median).toFixed(2)} ${Math.abs(median - q1 - (q3 - median)) < iqr * 0.1 ? "(balanced)" : "(unbalanced)"}`,
        `⚡ Data Quality: ${(((n - outliers.length) / n) * 100).toFixed(1)}% of data within normal range, ${outliers.length > 0 ? "investigate outliers for data quality" : "no outliers detected"}`,
      ],
      recommendations: [
        `🔍 Outlier Investigation: ${
          outliers.length > 0
            ? `Examine ${outliers.length} outliers: [${outliers
                .slice(0, 3)
                .map((v) => v.toFixed(2))
                .join(", ")}${outliers.length > 3 ? "..." : ""}] for data quality issues`
            : "No outliers detected - data quality appears good"
        }`,
        `📊 Statistical Analysis: ${outlierPercentage > 5 ? "Consider robust statistical methods due to outlier presence" : "Standard statistical methods appropriate"}`,
        `🎯 Data Transformation: ${Math.abs(skewness) > 0.5 ? "Apply transformation to reduce skewness" : "Current distribution suitable for analysis"}`,
        `📈 Comparative Analysis: Use box plots to compare ${column} across different groups or time periods`,
        `⚡ Reporting: Median (${median.toFixed(2)}) more representative than mean (${mean.toFixed(2)}) ${outliers.length > 0 ? "due to outlier influence" : "for this distribution"}`,
      ],
      statisticalNotes: [
        `📦 Five-Number Summary: Comprehensive distribution description with quartiles`,
        `📊 IQR Method: Outliers defined as values beyond Q1-1.5×IQR or Q3+1.5×IQR`,
        `🎯 Robustness: Box plot statistics resistant to outlier influence`,
        `📈 Sample Size: n = ${n} provides ${n > 50 ? "excellent" : n > 20 ? "good" : "basic"} quartile estimation`,
        `⚖️ Distribution Assessment: ${Math.abs(skewness) < 0.1 ? "Symmetric" : "Asymmetric"} based on quartile relationships`,
      ],
    },
  }
}

function getDetailedAreaChartInsight(data: any[], xColumn?: string, yColumn?: string): DetailedChartInsight {
  // Area charts are similar to line charts but emphasize cumulative values
  const lineInsight = getDetailedLineChartInsight(data, xColumn, yColumn)

  return {
    ...lineInsight,
    title: "📊 Comprehensive Area Chart Analysis",
    detailedAnalysis: {
      purpose: [
        "📊 Area charts emphasize magnitude and cumulative trends over time",
        "🔍 Perfect for showing volume, total quantities, or cumulative effects",
        "📈 Highlights the 'area under the curve' representing total impact",
        "🎯 Enables comparison of total contributions across periods",
        "💡 Ideal for financial data, sales volumes, and resource utilization",
      ],
      interpretation: lineInsight.detailedAnalysis.interpretation,
      keyFindings: [
        ...lineInsight.detailedAnalysis.keyFindings,
        "📊 Area Emphasis: Filled area represents cumulative magnitude of the measured variable",
      ],
      recommendations: [
        ...lineInsight.detailedAnalysis.recommendations,
        "📊 Consider stacked area charts for multiple series comparison",
      ],
      statisticalNotes: [
        ...lineInsight.detailedAnalysis.statisticalNotes,
        "📊 Area calculation: Total area under curve represents cumulative impact",
      ],
    },
  }
}

function getGenericDetailedInsight(chartType: string, data: any[]): DetailedChartInsight {
  return {
    title: `📊 ${chartType} Chart Analysis`,
    description: `Analysis of ${chartType} visualization with ${data.length} data points.`,
    type: "info",
    detailedAnalysis: {
      purpose: [
        `📊 ${chartType} charts provide specific visualization for your data type`,
        "🔍 Enables pattern recognition and data exploration",
        "📈 Supports data-driven decision making",
        "🎯 Facilitates communication of insights",
        "💡 Reveals hidden patterns in your dataset",
      ],
      interpretation: [
        `📊 Chart Type: ${chartType} selected for data visualization`,
        `📈 Data Points: ${data.length} observations included in analysis`,
        "🎯 Visual Pattern: Chart reveals data structure and relationships",
        "📉 Data Quality: Visualization helps identify data issues",
        "⚖️ Insight Generation: Chart enables pattern discovery",
      ],
      keyFindings: [
        `🏆 Data Overview: ${data.length} data points visualized effectively`,
        "📊 Pattern Recognition: Chart reveals underlying data structure",
        "🎯 Visual Clarity: Chosen chart type appropriate for data",
        "📈 Analysis Ready: Data prepared for statistical examination",
        "⚡ Insight Potential: Visualization enables deeper analysis",
      ],
      recommendations: [
        "🔍 Explore different chart types for additional insights",
        "📊 Consider statistical analysis to quantify patterns",
        "🎯 Use interactive features to drill down into data",
        "📈 Compare with other datasets for context",
        "⚡ Document findings for future reference",
      ],
      statisticalNotes: [
        `📊 Sample Size: n = ${data.length} observations`,
        "📈 Visualization Method: Chart type selected based on data characteristics",
        "🎯 Analysis Scope: Visual exploration of data patterns",
        "📉 Statistical Foundation: Chart provides basis for quantitative analysis",
        "⚖️ Data Representation: Visual summary of dataset characteristics",
      ],
    },
  }
}
