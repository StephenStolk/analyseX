"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

export function DataSummary() {
  const [activeTab, setActiveTab] = useState("overview")

  // Get analysis results from session storage
  const resultsString = typeof window !== "undefined" ? sessionStorage.getItem("analysisResults") : null
  const results = resultsString ? JSON.parse(resultsString) : null

  if (!results) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Data Summary</CardTitle>
          <CardDescription>No data available for analysis</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  // Prepare data for charts
  const columnTypeData = [
    {
      name: "Numeric",
      value: results.columnStats.filter((col: any) => col.type === "Number").length,
    },
    {
      name: "Date",
      value: results.columnStats.filter((col: any) => col.type === "Date").length,
    },
    {
      name: "String",
      value: results.columnStats.filter((col: any) => col.type === "String").length,
    },
  ]

  const missingValueData = results.columnStats
    .filter((col: any) => col.missing > 0)
    .map((col: any) => ({
      name: col.name,
      value: col.missing,
    }))
    .sort((a: any, b: any) => b.value - a.value)
    .slice(0, 5)

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"]

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Data Summary</CardTitle>
          <CardDescription>Overview of your dataset structure and quality</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid grid-cols-3 gap-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="columns">Columns</TabsTrigger>
              <TabsTrigger value="preview">Data Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">File Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{results.fileName}</div>
                    <p className="text-xs text-muted-foreground">
                      {results.rowCount.toLocaleString()} rows × {results.columnCount} columns
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Missing Values</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{results.missingValues.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      {((results.missingValues / (results.rowCount * results.columnCount)) * 100).toFixed(2)}% of all
                      cells
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Duplicate Rows</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{results.duplicateRows.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      {((results.duplicateRows / results.rowCount) * 100).toFixed(2)}% of all rows
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card className="overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Column Types</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={columnTypeData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {columnTypeData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [value, "Count"]} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Top Missing Values by Column</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="h-[200px]">
                      {missingValueData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={missingValueData}
                            layout="vertical"
                            margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis dataKey="name" type="category" width={100} />
                            <Tooltip formatter={(value) => [value, "Missing Values"]} />
                            <Bar dataKey="value" fill="#8884d8">
                              {missingValueData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <p className="text-muted-foreground">No missing values found</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="columns">
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Column Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Count</TableHead>
                          <TableHead>Missing</TableHead>
                          <TableHead>Unique</TableHead>
                          <TableHead>Min</TableHead>
                          <TableHead>Max</TableHead>
                          <TableHead>Mean</TableHead>
                          <TableHead>Std Dev</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {results.columnStats.map((column: any) => (
                          <TableRow key={column.name}>
                            <TableCell className="font-medium">{column.name}</TableCell>
                            <TableCell>{column.type}</TableCell>
                            <TableCell>{column.count.toLocaleString()}</TableCell>
                            <TableCell>{column.missing.toLocaleString()}</TableCell>
                            <TableCell>{column.unique.toLocaleString()}</TableCell>
                            <TableCell>
                              {column.min !== undefined
                                ? typeof column.min === "number"
                                  ? column.min.toLocaleString()
                                  : column.min
                                : "-"}
                            </TableCell>
                            <TableCell>
                              {column.max !== undefined
                                ? typeof column.max === "number"
                                  ? column.max.toLocaleString()
                                  : column.max
                                : "-"}
                            </TableCell>
                            <TableCell>{column.mean !== undefined ? column.mean.toFixed(2) : "-"}</TableCell>
                            <TableCell>{column.stdDev !== undefined ? column.stdDev.toFixed(2) : "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preview">
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {results.columnStats.map((column: any) => (
                            <TableHead key={column.name}>{column.name}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {results.previewData.map((row: any, rowIndex: number) => (
                          <TableRow key={rowIndex}>
                            {results.columnStats.map((column: any) => (
                              <TableCell key={column.name}>
                                {row[column.name] !== null && row[column.name] !== undefined
                                  ? typeof row[column.name] === "number"
                                    ? row[column.name].toLocaleString()
                                    : String(row[column.name])
                                  : "-"}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
