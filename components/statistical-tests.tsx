"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ScatterChart, Scatter } from "recharts"
import { Activity, Download, Lightbulb, CheckCircle, XCircle } from "lucide-react"
import { performTTest, performANOVA, performChiSquareTest, performNormalityTest } from "@/lib/advanced-statistics"
import type { TTestResult, AnovaResult, ChiSquareResult, NormalityTestResult } from "@/lib/advanced-statistics"

interface StatisticalTestsProps {
  data: any[]
  numericColumns: string[]
  categoricalColumns: string[]
  onError: (error: string | null) => void
}

export function StatisticalTests({ data, numericColumns, categoricalColumns, onError }: StatisticalTestsProps) {
  const [activeTest, setActiveTest] = useState("ttest")
  const [isLoading, setIsLoading] = useState(false)

  // T-Test state
  const [tTestResult, setTTestResult] = useState<TTestResult | null>(null)
  const [tTestValueColumn, setTTestValueColumn] = useState<string>("")
  const [tTestGroupColumn, setTTestGroupColumn] = useState<string>("")
  const [tTestGroup1, setTTestGroup1] = useState<string>("")
  const [tTestGroup2, setTTestGroup2] = useState<string>("")
  const [availableGroups, setAvailableGroups] = useState<string[]>([])

  // ANOVA state
  const [anovaResult, setAnovaResult] = useState<AnovaResult | null>(null)
  const [anovaValueColumn, setAnovaValueColumn] = useState<string>("")
  const [anovaGroupColumn, setAnovaGroupColumn] = useState<string>("")

  // Chi-Square state
  const [chiSquareResult, setChiSquareResult] = useState<ChiSquareResult | null>(null)
  const [chiSquareVar1, setChiSquareVar1] = useState<string>("")
  const [chiSquareVar2, setChiSquareVar2] = useState<string>("")

  // Normality Test state
  const [normalityResult, setNormalityResult] = useState<NormalityTestResult | null>(null)
  const [normalityColumn, setNormalityColumn] = useState<string>("")

  useEffect(() => {
    if (numericColumns.length > 0) {
      setTTestValueColumn(numericColumns[0])
      setAnovaValueColumn(numericColumns[0])
      setNormalityColumn(numericColumns[0])
    }
    if (categoricalColumns.length > 0) {
      setTTestGroupColumn(categoricalColumns[0])
      setAnovaGroupColumn(categoricalColumns[0])
      setChiSquareVar1(categoricalColumns[0])
      if (categoricalColumns.length > 1) {
        setChiSquareVar2(categoricalColumns[1])
      }
    }
  }, [numericColumns, categoricalColumns])

  const performTTestAnalysis = async () => {
    if (!tTestValueColumn || !tTestGroupColumn || !tTestGroup1 || !tTestGroup2) {
      onError("Please select all required fields for t-test")
      return
    }

    setIsLoading(true)
    onError(null)

    try {
      // Pre-validate the data before calling performTTest
      const group1Data = data
        .filter((row) => String(row[tTestGroupColumn]) === tTestGroup1)
        .map((row) => Number(row[tTestValueColumn]))
        .filter((val) => !isNaN(val))

      const group2Data = data
        .filter((row) => String(row[tTestGroupColumn]) === tTestGroup2)
        .map((row) => Number(row[tTestValueColumn]))
        .filter((val) => !isNaN(val))

      console.log(`Group "${tTestGroup1}" has ${group1Data.length} valid observations:`, group1Data.slice(0, 5))
      console.log(`Group "${tTestGroup2}" has ${group2Data.length} valid observations:`, group2Data.slice(0, 5))

      if (group1Data.length < 2) {
        onError(
          `Group "${tTestGroup1}" has only ${group1Data.length} valid observation(s). At least 2 are required for t-test.`,
        )
        return
      }

      if (group2Data.length < 2) {
        onError(
          `Group "${tTestGroup2}" has only ${group2Data.length} valid observation(s). At least 2 are required for t-test.`,
        )
        return
      }

      const result = performTTest(data, tTestValueColumn, tTestGroupColumn, tTestGroup1, tTestGroup2)
      setTTestResult(result)
    } catch (error) {
      console.error("T-test error:", error)
      onError(`T-test failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (tTestGroupColumn && data.length > 0) {
      const groupCounts: { [key: string]: number } = {}

      data.forEach((row) => {
        const group = String(row[tTestGroupColumn])
        const value = Number(row[tTestValueColumn])

        if (group && !isNaN(value)) {
          groupCounts[group] = (groupCounts[group] || 0) + 1
        }
      })

      const groups = Object.keys(groupCounts).filter((group) => groupCounts[group] >= 2)
      console.log("Available groups with valid data:", groupCounts)

      setAvailableGroups(groups)
      if (groups.length >= 2) {
        setTTestGroup1(groups[0])
        setTTestGroup2(groups[1])
      }
    }
  }, [tTestGroupColumn, tTestValueColumn, data])

  const performANOVAAnalysis = async () => {
    if (!anovaValueColumn || !anovaGroupColumn) {
      onError("Please select value and group columns for ANOVA")
      return
    }

    // Add validation for minimum groups
    const uniqueGroups = [...new Set(data.map((row) => String(row[anovaGroupColumn])).filter(Boolean))]
    if (uniqueGroups.length < 2) {
      onError(
        `ANOVA requires at least 2 groups. Column "${anovaGroupColumn}" has only ${uniqueGroups.length} unique value(s): ${uniqueGroups.join(", ")}`,
      )
      return
    }

    setIsLoading(true)
    onError(null)

    try {
      const result = performANOVA(data, anovaValueColumn, anovaGroupColumn)
      setAnovaResult(result)
    } catch (error) {
      console.error("ANOVA error:", error)
      onError(`ANOVA failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsLoading(false)
    }
  }

  const performChiSquareAnalysis = async () => {
    if (!chiSquareVar1 || !chiSquareVar2) {
      onError("Please select two categorical variables for chi-square test")
      return
    }

    // Add validation for minimum unique values
    const unique1 = [...new Set(data.map((row) => String(row[chiSquareVar1])).filter(Boolean))]
    const unique2 = [...new Set(data.map((row) => String(row[chiSquareVar2])).filter(Boolean))]

    if (unique1.length < 2) {
      onError(
        `Chi-square test requires at least 2 unique values. Column "${chiSquareVar1}" has only ${unique1.length} unique value(s): ${unique1.join(", ")}`,
      )
      return
    }

    if (unique2.length < 2) {
      onError(
        `Chi-square test requires at least 2 unique values. Column "${chiSquareVar2}" has only ${unique2.length} unique value(s): ${unique2.join(", ")}`,
      )
      return
    }

    setIsLoading(true)
    onError(null)

    try {
      const result = performChiSquareTest(data, chiSquareVar1, chiSquareVar2)
      setChiSquareResult(result)
    } catch (error) {
      console.error("Chi-square test error:", error)
      onError(`Chi-square test failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsLoading(false)
    }
  }

  const performNormalityAnalysis = async () => {
    if (!normalityColumn) {
      onError("Please select a column for normality test")
      return
    }

    setIsLoading(true)
    onError(null)

    try {
      const result = performNormalityTest(data, normalityColumn)
      setNormalityResult(result)
    } catch (error) {
      console.error("Normality test error:", error)
      onError(`Normality test failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsLoading(false)
    }
  }

  const downloadResults = (testType: string, result: any) => {
    const results = {
      analysis: `${testType} Test`,
      timestamp: new Date().toISOString(),
      result,
    }

    const blob = new Blob([JSON.stringify(results, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${testType.toLowerCase()}_test.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-red-600" />
          <h3 className="text-lg font-semibold">Statistical Tests</h3>
        </div>
      </div>

      {/* Theory Section */}
      <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-800 dark:text-red-200">
            <Lightbulb className="h-4 w-4" />
            What are Statistical Tests?
          </CardTitle>
        </CardHeader>
        <CardContent className="text-red-700 dark:text-red-300">
          <p className="mb-3">
            <strong>Statistical Tests</strong> help determine if observed differences in data are statistically
            significant or could have occurred by chance. They provide p-values to test hypotheses about your data.
          </p>
          <p className="mb-3">
            <strong>Mathematical Foundation:</strong> Tests use probability distributions (t, F, χ², normal) to
            calculate the likelihood of observing your data under null hypothesis assumptions.
          </p>
          <p>
            <strong>Why it matters:</strong> Statistical tests validate assumptions, compare groups, and provide
            evidence for data-driven decisions with quantified confidence levels.
          </p>
        </CardContent>
      </Card>

      <Tabs value={activeTest} onValueChange={setActiveTest}>
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="ttest">T-Test</TabsTrigger>
          <TabsTrigger value="anova">ANOVA</TabsTrigger>
          <TabsTrigger value="chisquare">Chi-Square</TabsTrigger>
          <TabsTrigger value="normality">Normality</TabsTrigger>
        </TabsList>

        {/* T-Test Tab */}
        <TabsContent value="ttest">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>T-Test for Mean Differences</CardTitle>
                <CardDescription>Compare means between two groups</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Value Column</label>
                    <Select value={tTestValueColumn} onValueChange={setTTestValueColumn}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select numeric column" />
                      </SelectTrigger>
                      <SelectContent>
                        {numericColumns.map((col) => (
                          <SelectItem key={col} value={col}>
                            {col}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Group Column</label>
                    <Select value={tTestGroupColumn} onValueChange={setTTestGroupColumn}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select categorical column" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoricalColumns.map((col) => (
                          <SelectItem key={col} value={col}>
                            {col}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {availableGroups.length >= 2 && (
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Group 1</label>
                      <Select value={tTestGroup1} onValueChange={setTTestGroup1}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select first group" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableGroups.map((group) => (
                            <SelectItem key={group} value={group}>
                              {group}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Group 2</label>
                      <Select value={tTestGroup2} onValueChange={setTTestGroup2}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select second group" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableGroups
                            .filter((g) => g !== tTestGroup1)
                            .map((group) => (
                              <SelectItem key={group} value={group}>
                                {group}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={performTTestAnalysis}
                    disabled={isLoading || !tTestValueColumn || !tTestGroupColumn || !tTestGroup1 || !tTestGroup2}
                  >
                    {isLoading ? "Running T-Test..." : "Run T-Test"}
                  </Button>
                  {tTestResult && (
                    <Button variant="outline" onClick={() => downloadResults("T-Test", tTestResult)}>
                      <Download className="h-4 w-4 mr-1" />
                      Export
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {tTestResult && (
              <div className="grid gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      T-Test Results
                      {tTestResult.significant ? (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Significant
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <XCircle className="h-3 w-3" />
                          Not Significant
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="text-lg font-bold text-blue-600">t-statistic</div>
                        <div className="text-sm text-muted-foreground">{tTestResult.t.toFixed(3)}</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="text-lg font-bold text-red-600">p-value</div>
                        <div className="text-sm text-muted-foreground">{tTestResult.pValue.toFixed(6)}</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="text-lg font-bold text-green-600">Effect Size</div>
                        <div className="text-sm text-muted-foreground">{tTestResult.effectSize.toFixed(3)}</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="text-lg font-bold text-purple-600">df</div>
                        <div className="text-sm text-muted-foreground">{tTestResult.degreesOfFreedom}</div>
                      </div>
                    </div>

                    <div className="mt-4 grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Group Means</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>{tTestGroup1}:</span>
                            <span className="font-medium">
                              {tTestResult.mean1.toFixed(3)} ± {tTestResult.std1.toFixed(3)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>{tTestGroup2}:</span>
                            <span className="font-medium">
                              {tTestResult.mean2.toFixed(3)} ± {tTestResult.std2.toFixed(3)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Confidence Interval (95%)</h4>
                        <div className="text-sm">
                          Difference: [{tTestResult.confidenceInterval[0].toFixed(3)},{" "}
                          {tTestResult.confidenceInterval[1].toFixed(3)}]
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
                  <CardHeader>
                    <CardTitle className="text-blue-800 dark:text-blue-200">Interpretation</CardTitle>
                  </CardHeader>
                  <CardContent className="text-blue-700 dark:text-blue-300">
                    <div className="space-y-2">
                      <p>
                        <strong>Statistical Significance:</strong>{" "}
                        {tTestResult.significant
                          ? `The difference between ${tTestGroup1} and ${tTestGroup2} is statistically significant (p = ${tTestResult.pValue.toFixed(6)} < 0.05).`
                          : `The difference between ${tTestGroup1} and ${tTestGroup2} is not statistically significant (p = ${tTestResult.pValue.toFixed(6)} ≥ 0.05).`}
                      </p>
                      <p>
                        <strong>Effect Size:</strong>{" "}
                        {tTestResult.effectSize < 0.2
                          ? "Small effect size - minimal practical difference."
                          : tTestResult.effectSize < 0.5
                            ? "Small to medium effect size - noticeable difference."
                            : tTestResult.effectSize < 0.8
                              ? "Medium to large effect size - substantial difference."
                              : "Large effect size - very substantial difference."}
                      </p>
                      <p>
                        <strong>Practical Meaning:</strong> The mean difference is{" "}
                        {Math.abs(tTestResult.mean1 - tTestResult.mean2).toFixed(3)} units, with{" "}
                        {tTestResult.mean1 > tTestResult.mean2 ? tTestGroup1 : tTestGroup2} having higher values on
                        average.
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 dark:bg-gradient-to-r dark:from-indigo-950 dark:to-purple-950 dark:border-indigo-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-indigo-800 dark:text-indigo-200">
                      <Lightbulb className="h-4 w-4" />
                      Statistical Insight
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-indigo-700 dark:text-indigo-300">
                    <p className="text-sm leading-relaxed">
                      {tTestResult.significant
                        ? `The t-test reveals a statistically significant difference between ${tTestGroup1} and ${tTestGroup2}. With a p-value of ${tTestResult.pValue.toFixed(6)}, we can confidently reject the null hypothesis that the means are equal.`
                        : `The t-test shows no statistically significant difference between ${tTestGroup1} and ${tTestGroup2}. The p-value of ${tTestResult.pValue.toFixed(6)} suggests any observed difference could be due to random variation.`}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ANOVA Tab */}
        <TabsContent value="anova">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>One-Way ANOVA</CardTitle>
                <CardDescription>Compare means across multiple groups</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Value Column</label>
                    <Select value={anovaValueColumn} onValueChange={setAnovaValueColumn}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select numeric column" />
                      </SelectTrigger>
                      <SelectContent>
                        {numericColumns.map((col) => (
                          <SelectItem key={col} value={col}>
                            {col}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Group Column</label>
                    <Select value={anovaGroupColumn} onValueChange={setAnovaGroupColumn}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select categorical column" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoricalColumns.map((col) => (
                          <SelectItem key={col} value={col}>
                            {col}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={performANOVAAnalysis} disabled={isLoading || !anovaValueColumn || !anovaGroupColumn}>
                    {isLoading ? "Running ANOVA..." : "Run ANOVA"}
                  </Button>
                  {anovaResult && (
                    <Button variant="outline" onClick={() => downloadResults("ANOVA", anovaResult)}>
                      <Download className="h-4 w-4 mr-1" />
                      Export
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {anovaResult && (
              <div className="grid gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      ANOVA Results
                      {anovaResult.significant ? (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Significant
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <XCircle className="h-3 w-3" />
                          Not Significant
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="text-lg font-bold text-blue-600">F-statistic</div>
                        <div className="text-sm text-muted-foreground">{anovaResult.F.toFixed(3)}</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="text-lg font-bold text-red-600">p-value</div>
                        <div className="text-sm text-muted-foreground">{anovaResult.pValue.toFixed(6)}</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="text-lg font-bold text-green-600">df Between</div>
                        <div className="text-sm text-muted-foreground">{anovaResult.dfBetween}</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="text-lg font-bold text-purple-600">df Within</div>
                        <div className="text-sm text-muted-foreground">{anovaResult.dfWithin}</div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <h4 className="font-medium mb-2">ANOVA Table</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border">
                          <thead>
                            <tr className="bg-gray-50 dark:bg-gray-800">
                              <th className="border p-2 text-left">Source</th>
                              <th className="border p-2 text-left">SS</th>
                              <th className="border p-2 text-left">df</th>
                              <th className="border p-2 text-left">MS</th>
                              <th className="border p-2 text-left">F</th>
                              <th className="border p-2 text-left">p-value</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border p-2">Between Groups</td>
                              <td className="border p-2">{anovaResult.ssBetween.toFixed(3)}</td>
                              <td className="border p-2">{anovaResult.dfBetween}</td>
                              <td className="border p-2">{anovaResult.msBetween.toFixed(3)}</td>
                              <td className="border p-2">{anovaResult.F.toFixed(3)}</td>
                              <td className="border p-2">{anovaResult.pValue.toFixed(6)}</td>
                            </tr>
                            <tr>
                              <td className="border p-2">Within Groups</td>
                              <td className="border p-2">{anovaResult.ssWithin.toFixed(3)}</td>
                              <td className="border p-2">{anovaResult.dfWithin}</td>
                              <td className="border p-2">{anovaResult.msWithin.toFixed(3)}</td>
                              <td className="border p-2">-</td>
                              <td className="border p-2">-</td>
                            </tr>
                            <tr>
                              <td className="border p-2">Total</td>
                              <td className="border p-2">{anovaResult.ssTotal.toFixed(3)}</td>
                              <td className="border p-2">{anovaResult.dfTotal}</td>
                              <td className="border p-2">-</td>
                              <td className="border p-2">-</td>
                              <td className="border p-2">-</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {anovaResult.postHoc && (
                      <div className="mt-4">
                        <h4 className="font-medium mb-2">Post-Hoc Tests (Tukey HSD)</h4>
                        <div className="space-y-1">
                          {Object.entries(anovaResult.postHoc).map(([comparison, result]) => (
                            <div
                              key={comparison}
                              className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded"
                            >
                              <span>{comparison}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-sm">p = {result.pValue.toFixed(6)}</span>
                                {result.significant ? (
                                  <Badge variant="destructive">
                                    Significant
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary">
                                    Not Significant
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
                  <CardHeader>
                    <CardTitle className="text-green-800 dark:text-green-200">Interpretation</CardTitle>
                  </CardHeader>
                  <CardContent className="text-green-700 dark:text-green-300">
                    <div className="space-y-2">
                      <p>
                        <strong>Overall Test:</strong>{" "}
                        {anovaResult.significant
                          ? `There is a statistically significant difference between group means (F = ${anovaResult.F.toFixed(3)}, p = ${anovaResult.pValue.toFixed(6)} < 0.05).`
                          : `There is no statistically significant difference between group means (F = ${anovaResult.F.toFixed(3)}, p = ${anovaResult.pValue.toFixed(6)} ≥ 0.05).`}
                      </p>
                      <p>
                        <strong>Effect Size:</strong> {((anovaResult.ssBetween / anovaResult.ssTotal) * 100).toFixed(1)}
                        % of the variance in {anovaValueColumn} is explained by {anovaGroupColumn}.
                      </p>
                      {anovaResult.postHoc && (
                        <p>
                          <strong>Pairwise Comparisons:</strong>{" "}
                          {Object.values(anovaResult.postHoc).filter((result) => result.significant).length} out of{" "}
                          {Object.keys(anovaResult.postHoc).length} pairwise comparisons are statistically significant.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-teal-200 bg-gradient-to-r from-teal-50 to-cyan-50 dark:bg-gradient-to-r dark:from-teal-950 dark:to-cyan-950 dark:border-teal-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-teal-800 dark:text-teal-200">
                      <Lightbulb className="h-4 w-4" />
                      ANOVA Insight
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-teal-700 dark:text-teal-300">
                    <p className="text-sm leading-relaxed">
                      {anovaResult.significant
                        ? `ANOVA detected significant differences between group means (F = ${anovaResult.F.toFixed(3)}, p < 0.05). This suggests that ${anovaGroupColumn} has a meaningful impact on ${anovaValueColumn} values.`
                        : `ANOVA found no significant differences between group means (F = ${anovaResult.F.toFixed(3)}, p ≥ 0.05). The groups appear to have similar ${anovaValueColumn} distributions.`}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Chi-Square Tab */}
        <TabsContent value="chisquare">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Chi-Square Test of Independence</CardTitle>
                <CardDescription>Test independence between two categorical variables</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Variable 1</label>
                    <Select value={chiSquareVar1} onValueChange={setChiSquareVar1}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select first categorical variable" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoricalColumns.map((col) => (
                          <SelectItem key={col} value={col}>
                            {col}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Variable 2</label>
                    <Select value={chiSquareVar2} onValueChange={setChiSquareVar2}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select second categorical variable" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoricalColumns
                          .filter((col) => col !== chiSquareVar1)
                          .map((col) => (
                            <SelectItem key={col} value={col}>
                              {col}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={performChiSquareAnalysis} disabled={isLoading || !chiSquareVar1 || !chiSquareVar2}>
                    {isLoading ? "Running Chi-Square..." : "Run Chi-Square Test"}
                  </Button>
                  {chiSquareResult && (
                    <Button variant="outline" onClick={() => downloadResults("Chi-Square", chiSquareResult)}>
                      <Download className="h-4 w-4 mr-1" />
                      Export
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {chiSquareResult && (
              <div className="grid gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      Chi-Square Test Results
                      {chiSquareResult.significant ? (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Significant
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <XCircle className="h-3 w-3" />
                          Not Significant
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="text-lg font-bold text-blue-600">χ² statistic</div>
                        <div className="text-sm text-muted-foreground">{chiSquareResult.chiSquare.toFixed(3)}</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="text-lg font-bold text-red-600">p-value</div>
                        <div className="text-sm text-muted-foreground">{chiSquareResult.pValue.toFixed(6)}</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="text-lg font-bold text-green-600">Cramer's V</div>
                        <div className="text-sm text-muted-foreground">{chiSquareResult.cramersV.toFixed(3)}</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="text-lg font-bold text-purple-600">df</div>
                        <div className="text-sm text-muted-foreground">{chiSquareResult.degreesOfFreedom}</div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Contingency Table (Observed)</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border">
                          <thead>
                            <tr className="bg-gray-50 dark:bg-gray-800">
                              <th className="border p-2">
                                {chiSquareVar1} \ {chiSquareVar2}
                              </th>
                              {chiSquareResult.contingencyTable[0]?.map((_, j) => (
                                <th key={j} className="border p-2">
                                  Category {j + 1}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {chiSquareResult.contingencyTable.map((row, i) => (
                              <tr key={i}>
                                <td className="border p-2 font-medium">Category {i + 1}</td>
                                {row.map((cell, j) => (
                                  <td key={j} className="border p-2 text-center">
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-purple-200 bg-purple-50 dark:bg-purple-950 dark:border-purple-800">
                  <CardHeader>
                    <CardTitle className="text-purple-800 dark:text-purple-200">Interpretation</CardTitle>
                  </CardHeader>
                  <CardContent className="text-purple-700 dark:text-purple-300">
                    <div className="space-y-2">
                      <p>
                        <strong>Independence Test:</strong>{" "}
                        {chiSquareResult.significant
                          ? `${chiSquareVar1} and ${chiSquareVar2} are NOT independent (χ² = ${chiSquareResult.chiSquare.toFixed(3)}, p = ${chiSquareResult.pValue.toFixed(6)} < 0.05). There is a significant association between these variables.`
                          : `${chiSquareVar1} and ${chiSquareVar2} appear to be independent (χ² = ${chiSquareResult.chiSquare.toFixed(3)}, p = ${chiSquareResult.pValue.toFixed(6)} ≥ 0.05). No significant association detected.`}
                      </p>
                      <p>
                        <strong>Effect Size (Cramer's V):</strong>{" "}
                        {chiSquareResult.cramersV < 0.1
                          ? "Negligible association"
                          : chiSquareResult.cramersV < 0.3
                            ? "Small association"
                            : chiSquareResult.cramersV < 0.5
                              ? "Medium association"
                              : "Large association"}{" "}
                        (V = {chiSquareResult.cramersV.toFixed(3)}).
                      </p>
                      <p>
                        <strong>Practical Meaning:</strong>{" "}
                        {chiSquareResult.significant
                          ? `Knowing the value of ${chiSquareVar1} provides information about the likely value of ${chiSquareVar2}.`
                          : `The distribution of ${chiSquareVar2} is similar across all categories of ${chiSquareVar1}.`}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Normality Test Tab */}
        <TabsContent value="normality">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Normality Test</CardTitle>
                <CardDescription>Test if a variable follows a normal distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <label className="text-sm font-medium mb-2 block">Column to Test</label>
                  <Select value={normalityColumn} onValueChange={setNormalityColumn}>
                    <SelectTrigger className="max-w-md">
                      <SelectValue placeholder="Select numeric column" />
                    </SelectTrigger>
                    <SelectContent>
                      {numericColumns.map((col) => (
                        <SelectItem key={col} value={col}>
                          {col}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button onClick={performNormalityAnalysis} disabled={isLoading || !normalityColumn}>
                    {isLoading ? "Running Normality Test..." : "Run Normality Test"}
                  </Button>
                  {normalityResult && (
                    <Button variant="outline" onClick={() => downloadResults("Normality", normalityResult)}>
                      <Download className="h-4 w-4 mr-1" />
                      Export
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {normalityResult && (
              <div className="grid gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      Normality Test Results
                      {normalityResult.isNormal ? (
                        <Badge variant="default" className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Normal
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <XCircle className="h-3 w-3" />
                          Not Normal
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="text-lg font-bold text-blue-600">Shapiro-Wilk</div>
                        <div className="text-sm text-muted-foreground">
                          W = {normalityResult.shapiroWilk.W.toFixed(4)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          p = {normalityResult.shapiroWilk.pValue.toFixed(6)}
                        </div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="text-lg font-bold text-green-600">K-S Test</div>
                        <div className="text-sm text-muted-foreground">
                          D = {normalityResult.kolmogorovSmirnov.D.toFixed(4)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          p = {normalityResult.kolmogorovSmirnov.pValue.toFixed(6)}
                        </div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="text-lg font-bold text-purple-600">Skewness</div>
                        <div className="text-sm text-muted-foreground">{normalityResult.skewness.toFixed(3)}</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="text-lg font-bold text-orange-600">Kurtosis</div>
                        <div className="text-sm text-muted-foreground">{normalityResult.kurtosis.toFixed(3)}</div>
                      </div>
                    </div>

                    {normalityResult.qqPlotData.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-medium mb-2">Q-Q Plot</h4>
                        <ResponsiveContainer width="100%" height={300}>
                          <ScatterChart>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              type="number"
                              dataKey="x"
                              name="Theoretical Quantiles"
                              label={{ value: "Theoretical Quantiles", position: "bottom" }}
                            />
                            <YAxis
                              type="number"
                              dataKey="y"
                              name="Sample Quantiles"
                              label={{ value: "Sample Quantiles", angle: -90, position: "left" }}
                            />
                            <Tooltip formatter={(value: any, name: string) => [value.toFixed(3), name]} />
                            <Scatter name="Q-Q Plot" data={normalityResult.qqPlotData} fill="#8b5cf6" />
                            {/* Reference line */}
                            <Line
                              type="linear"
                              dataKey="x"
                              stroke="#ef4444"
                              strokeDasharray="5 5"
                              dot={false}
                              name="Perfect Normal"
                            />
                          </ScatterChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-indigo-200 bg-indigo-50 dark:bg-indigo-950 dark:border-indigo-800">
                  <CardHeader>
                    <CardTitle className="text-indigo-800 dark:text-indigo-200">Interpretation</CardTitle>
                  </CardHeader>
                  <CardContent className="text-indigo-700 dark:text-indigo-300">
                    <div className="space-y-2">
                      <p>
                        <strong>Overall Assessment:</strong>{" "}
                        {normalityResult.isNormal
                          ? `${normalityColumn} appears to follow a normal distribution. Both statistical tests support normality.`
                          : `${normalityColumn} does not follow a normal distribution. Consider data transformation or non-parametric methods.`}
                      </p>
                      <p>
                        <strong>Shapiro-Wilk Test:</strong>{" "}
                        {normalityResult.shapiroWilk.isNormal
                          ? `Supports normality (p = ${normalityResult.shapiroWilk.pValue.toFixed(6)} ≥ 0.05).`
                          : `Rejects normality (p = ${normalityResult.shapiroWilk.pValue.toFixed(6)} < 0.05).`}
                      </p>
                      <p>
                        <strong>Distribution Shape:</strong>{" "}
                        {Math.abs(normalityResult.skewness) < 0.5
                          ? "Approximately symmetric"
                          : normalityResult.skewness > 0.5
                            ? "Right-skewed (tail extends to the right)"
                            : "Left-skewed (tail extends to the left)"}
                        .{" "}
                        {Math.abs(normalityResult.kurtosis) < 0.5
                          ? "Normal tail thickness."
                          : normalityResult.kurtosis > 0.5
                            ? "Heavy tails (more extreme values)."
                            : "Light tails (fewer extreme values)."}
                      </p>
                      <p>
                        <strong>Recommendations:</strong>{" "}
                        {normalityResult.isNormal
                          ? "You can use parametric statistical tests (t-tests, ANOVA, linear regression)."
                          : "Consider non-parametric tests (Mann-Whitney U, Kruskal-Wallis) or data transformation (log, square root)."}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
