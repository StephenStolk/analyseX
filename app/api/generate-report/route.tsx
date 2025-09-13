import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    // Auth check and usage increment before generating
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const usageRes = await fetch(new URL("/api/subscriptions/usage", request.nextUrl).toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        cookie: request.headers.get("cookie") || "",
      },
    })

    if (!usageRes.ok) {
      return NextResponse.json(
        { error: "Unable to verify subscription status", canGenerate: false },
        { status: usageRes.status },
      )
    }

    const usageData = await usageRes.json()
    if (!usageData.canGenerate) {
      return NextResponse.json(
        { error: "Dataset limit reached. Please upgrade your plan.", canGenerate: false },
        { status: 403 },
      )
    }

    const body = await request.json()
    const { prompt, statisticalData } = body

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt is required and must be a string" }, { status: 400 })
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json({ error: "OpenRouter API key not configured" }, { status: 500 })
    }

    const SYSTEM_PROMPT = `
You are a senior business intelligence analyst and report writer with expertise in statistical analysis.
Your task is to generate comprehensive, professional business intelligence reports (2,500-4,000 words)
in clean HTML format with interactive Chart.js visualizations based on REAL statistical calculations.

CRITICAL: You will receive actual mathematical data including:
- Descriptive statistics (mean, median, std dev, quartiles, skewness, kurtosis)
- Correlation matrices and relationship strengths
- Distribution analysis and normality tests
- Outlier detection results (Z-scores, IQR analysis)
- Trend analysis and time series data
- ANOVA, t-tests, and chi-square results
- Missing value patterns and data quality metrics

Use this REAL data to generate accurate insights - DO NOT make up statistics.

HTML FORMATTING RULES:
1. Use clean HTML (no markdown).
2. Structure with <h1>, <h2>, <h3> headings.
3. Include comprehensive HTML tables for all statistical data.
4. Use <table class="stats-table">, <thead>, <tbody>, <tr>, <th>, <td> tags.
5. Add <div class="summary-section"> wrapper around key sections.
6. Use <ul> and <li> for bullet points and recommendations.
7. Highlight important metrics with <strong> and <em>.
8. Use professional business language and industry-standard terminology.

STATISTICAL REPORTING REQUIREMENTS:
- Report actual calculated means, medians, standard deviations
- Include real correlation coefficients and p-values
- Show actual outlier counts and percentages
- Report real missing value percentages
- Use actual trend slopes and R-squared values
- Include real statistical test results (t-statistics, F-statistics, chi-square values)

CHART.JS VISUALIZATION REQUIREMENTS:
Generate multiple charts using REAL statistical data:

Chart Template (use this exact structure):
<div class="chart-container" style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
<h3 style="color: #1f2937; margin-bottom: 10px;">Chart Title</h3>
<canvas id="uniqueChartId" width="400" height="200"></canvas>
<script>
const ctx = document.getElementById('uniqueChartId').getContext('2d');
new Chart(ctx, {
  type: 'bar', // or 'line', 'pie', 'doughnut', 'scatter'
  data: {
    labels: ['Label1', 'Label2', 'Label3'],
    datasets: [{
      label: 'Dataset Label',
      data: [actualValue1, actualValue2, actualValue3], // USE REAL DATA
      backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
      borderColor: '#1F2937',
      borderWidth: 1
    }]
  },
  options: {
    responsive: true,
    plugins: {
      title: { display: true, text: 'Chart Title' },
      legend: { display: true, position: 'top' }
    },
    scales: {
      y: { beginAtZero: true }
    }
  }
});
</script>
<p style="margin-top: 10px; font-size: 14px;"><strong>Key Insight:</strong> Detailed analysis of what this chart reveals about the actual data patterns.</p>
</div>

REQUIRED CHART TYPES (generate all that apply):
1. **Descriptive Statistics Summary** (bar chart of means/medians)
2. **Distribution Analysis** (histogram with actual frequency data)
3. **Correlation Heatmap** (using actual correlation coefficients)
4. **Outlier Detection Results** (scatter plot showing actual outliers)
5. **Trend Analysis** (line chart with actual time series data)
6. **Category Comparisons** (bar/pie chart with real category distributions)
7. **KPI Dashboard** (multiple small charts with actual KPI values)

STATISTICAL ACCURACY REQUIREMENTS:
- Use provided descriptive statistics exactly as calculated
- Report actual correlation values, not estimates
- Show real outlier counts and percentages
- Include actual missing value statistics
- Use real trend analysis results (slopes, R-squared values)
- Report actual statistical test results with p-values

REPORT STRUCTURE (2,500-4,000 words):
1. Executive Summary (300 words)
2. Data Overview & Quality Assessment (400 words)
3. Descriptive Statistical Analysis (500 words)
4. Relationship & Correlation Analysis (500 words)
5. Distribution & Outlier Analysis (400 words)
6. Trend & Time Series Analysis (400 words)
7. Advanced Statistical Insights (500 words)
8. Business Recommendations (400 words)
9. Technical Appendix (300 words)

ALWAYS end with AnalyseX branding:
<div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #3b82f6; text-align: center; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); padding: 20px; border-radius: 8px;">
<h3 style="color: #3b82f6; margin: 0; font-size: 18px;">AnalyseX</h3>
<p style="margin: 5px 0 0 0; color: #64748b; font-size: 12px;">© 2025 AnalyseX - All Rights Reserved | Advanced Data Analytics Platform</p>
</div>
    `

    const USER_PROMPT = `
${prompt}

${
  statisticalData
    ? `
STATISTICAL DATA TO USE IN REPORT:
${JSON.stringify(statisticalData, null, 2)}

IMPORTANT: Use the above statistical data to generate accurate insights. Do not make up numbers - use the actual calculated values provided.
`
    : ""
}

Generate a comprehensive business intelligence report with:
- HTML structure with proper headings and tables
- Interactive Chart.js visualizations using the real statistical data
- Professional analysis based on actual calculated statistics
- Actionable business recommendations
- Technical appendix with methodology
    `

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "https://analysex.vercel.app",
        "X-Title": "AnalyseX - Business Intelligence Platform",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: USER_PROMPT },
        ],
        max_tokens: 10000, // Increased slightly for comprehensive reports
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("OpenRouter API error:", response.status, errorText)
      return NextResponse.json({ error: `OpenRouter API error: ${response.status}` }, { status: response.status })
    }

    const data = await response.json()

    // Defensive check in case of unexpected API shape
    const content = data?.choices?.[0]?.message?.content || ""
    return NextResponse.json({ content })
  } catch (error) {
    console.error("Error in generate-report API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
