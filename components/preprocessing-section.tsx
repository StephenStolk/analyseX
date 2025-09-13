"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Info, AlertCircle, RefreshCw, Trash2, EyeOff, Replace, Filter } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import {
  getDataInfo,
  getDataDescription,
  handleMissingValues,
  handleOutliers,
  removeDuplicateRows,
  filterRowsByValue,
  type ColumnInfo,
  type ColumnDescription,
} from "@/lib/preprocessing-utils"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface PreprocessingSectionProps {
  onDataProcessed?: (processedData: any[], fileName: string) => void
}

export function PreprocessingSection({ onDataProcessed }: PreprocessingSectionProps) {
  const [originalData, setOriginalData] = useState<any[]>([])
  const [processedData, setProcessedData] = useState<any[]>([])
  const [fileName, setFileName] = useState<string>("")
  const [dataInfo, setDataInfo] = useState<ColumnInfo[]>([])
  const [dataDescription, setDataDescription] = useState<{ [key: string]: ColumnDescription }>({})
  const [activeTab, setActiveTab] = useState("overview")
  const [isProcessing, setIsProcessing] = useState(false)

  // Missing Value State
  const [missingValueColumn, setMissingValueColumn] = useState<string>("")
  const [missingValueStrategy, setMissingValueStrategy] = useState<"mean" | "median" | "mode" | "remove" | "zero">(
    "mean",
  )

  // Outlier State
  const [outlierColumn, setOutlierColumn] = useState<string>("")
  const [outlierStrategy, setOutlierStrategy] = useState<"remove" | "median" | "mean" | "cap">("remove")
  const [outlierMethod, setOutlierMethod] = useState<"iqr" | "zscore">("iqr")

  // Duplicate State
  const [removeDuplicatesEnabled, setRemoveDuplicatesEnabled] = useState(false)

  // Filter State
  const [filterColumn, setFilterColumn] = useState<string>("")
  const [filterOperator, setFilterOperator] = useState<string>("equals")
  const [filterValue, setFilterValue] = useState<string>("")

  useEffect(() => {
    const storedData = sessionStorage.getItem("analysisResults")
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData)

        // Try multiple possible data keys to find the actual dataset
        let actualData = parsedData.rawData || parsedData.data || parsedData.previewData || []

        // If we still don't have data, try to get it from the summary
        if (!actualData || actualData.length === 0) {
          if (parsedData.summary && parsedData.summary.previewData) {
            actualData = parsedData.summary.previewData
          }
        }

        // If we have analysis results but no raw data, we need to reconstruct it
        // This can happen when only processed results are stored
        if ((!actualData || actualData.length === 0) && parsedData.fileName) {
          console.warn("No raw data found, but analysis results exist. This may limit preprocessing capabilities.")
          // Set empty data but still show the interface
          actualData = []
        }

        if (actualData && Array.isArray(actualData) && actualData.length > 0) {
          setOriginalData(actualData)
          setProcessedData(actualData) // Initialize processed data with raw data
          setFileName(parsedData.fileName || "uploaded_data")
          console.log(`Loaded ${actualData.length} rows for preprocessing`)
        } else if (parsedData.fileName) {
          // We have a filename but no data - this suggests the data exists but wasn't stored properly
          console.warn("Analysis results found but no usable data array. Filename:", parsedData.fileName)
          setFileName(parsedData.fileName)
          // Don't show the "no data" state if we at least have a filename
          setOriginalData([])
          setProcessedData([])
        }
      } catch (error) {
        console.error("Error parsing stored data:", error)
        toast({
          title: "Error Loading Data",
          description: "Could not load previous data. Please re-upload.",
          variant: "destructive",
        })
      }
    }
  }, [])

  useEffect(() => {
    if (processedData.length > 0) {
      const info = getDataInfo(processedData)
      setDataInfo(info)
      const description = getDataDescription(processedData)
      setDataDescription(description)

      // Only call onDataProcessed if it's provided
      if (onDataProcessed && typeof onDataProcessed === "function") {
        onDataProcessed(processedData, fileName)
      }
    }
  }, [processedData, fileName, onDataProcessed])

  const handleApplyPreprocessing = async () => {
    setIsProcessing(true)
    let currentData = [...originalData] // Start with original data for each full run

    try {
      // 1. Handle Missing Values
      if (missingValueColumn && missingValueStrategy) {
        toast({
          title: "Applying Missing Value Strategy",
          description: `Processing column '${missingValueColumn}' with strategy '${missingValueStrategy}'.`,
        })
        currentData = handleMissingValues(currentData, missingValueColumn, missingValueStrategy)
      }

      // 2. Handle Outliers
      if (outlierColumn && outlierStrategy && outlierMethod) {
        toast({
          title: "Applying Outlier Strategy",
          description: `Processing column '${outlierColumn}' with strategy '${outlierStrategy}' using '${outlierMethod}' method.`,
        })
        currentData = handleOutliers(currentData, outlierColumn, outlierStrategy, outlierMethod)
      }

      // 3. Remove Duplicates
      if (removeDuplicatesEnabled) {
        toast({
          title: "Removing Duplicate Rows",
          description: "Checking for and removing any duplicate rows in the dataset.",
        })
        currentData = removeDuplicateRows(currentData)
      }

      // 4. Apply Filter
      if (filterColumn && filterOperator && filterValue) {
        toast({
          title: "Applying Filter",
          description: `Filtering rows where '${filterColumn}' ${filterOperator} '${filterValue}'.`,
        })
        currentData = filterRowsByValue(currentData, filterColumn, filterOperator, filterValue)
      }

      setProcessedData(currentData)
      toast({
        title: "Preprocessing Complete",
        description: "All selected preprocessing steps have been applied.",
      })
    } catch (error: any) {
      console.error("Preprocessing error:", error)
      toast({
        title: "Preprocessing Failed",
        description: error.message || "An error occurred during preprocessing.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleResetData = () => {
    setProcessedData(originalData)
    setMissingValueColumn("")
    setMissingValueStrategy("mean")
    setOutlierColumn("")
    setOutlierStrategy("remove")
    setOutlierMethod("iqr")
    setRemoveDuplicatesEnabled(false)
    setFilterColumn("")
    setFilterOperator("equals")
    setFilterValue("")
    toast({
      title: "Data Reset",
      description: "Data has been reset to its original uploaded state.",
    })
  }

  const getNumericColumns = () => {
    return dataInfo.filter((col) => col.type === "numeric").map((col) => col.name)
  }

  const getAllColumns = () => {
    return dataInfo.map((col) => col.name)
  }

  if (originalData.length === 0 && !fileName) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Data Preprocessing</CardTitle>
          <CardDescription>Clean and prepare your data for analysis</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-6 p-8 text-center">
          <div className="rounded-full bg-primary/10 p-4 text-primary">
            <AlertCircle className="h-12 w-12" />
          </div>
          <div>
            <h3 className="mb-2 text-xl font-semibold">No Data Loaded</h3>
            <p className="mb-6 text-muted-foreground">
              Please upload a dataset first to access preprocessing features.
            </p>
          </div>
          <Button onClick={() => (window.location.href = "/app/upload")} className="rounded-full px-8">
            Upload Data
          </Button>
        </CardContent>
      </Card>
    )
  }

  // If we have a filename but no data, show a different message
  if (originalData.length === 0 && fileName) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Data Preprocessing</CardTitle>
          <CardDescription>Clean and prepare your data for analysis</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-6 p-8 text-center">
          <div className="rounded-full bg-yellow-100 p-4 text-yellow-600">
            <AlertCircle className="h-12 w-12" />
          </div>
          <div>
            <h3 className="mb-2 text-xl font-semibold">Data Not Available for Preprocessing</h3>
            <p className="mb-6 text-muted-foreground">
              The dataset "{fileName}" was analyzed but the raw data is not available for preprocessing. Please
              re-upload your file to access preprocessing features.
            </p>
          </div>
          <Button onClick={() => (window.location.href = "/app/upload")} className="rounded-full px-8">
            Re-upload Data
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Data Preprocessing</CardTitle>
        <CardDescription>Clean and prepare your data for analysis</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 rounded-full">
            <TabsTrigger value="overview" className="rounded-full">
              Overview
            </TabsTrigger>
            <TabsTrigger value="missing" className="rounded-full">
              Missing Values
            </TabsTrigger>
            <TabsTrigger value="outliers" className="rounded-full">
              Outliers
            </TabsTrigger>
            <TabsTrigger value="duplicates" className="rounded-full">
              Duplicates
            </TabsTrigger>
            <TabsTrigger value="filter" className="rounded-full">
              Filter Rows
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-4">
            <div className="rounded-lg border bg-muted/30 p-4 mb-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">Data Overview</h4>
                  <p className="text-sm text-muted-foreground">
                    This section provides a summary of your dataset's structure and quality.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Dataset Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p>
                    <span className="font-medium">File Name:</span> {fileName}
                  </p>
                  <p>
                    <span className="font-medium">Original Rows:</span> {originalData.length}
                  </p>
                  <p>
                    <span className="font-medium">Processed Rows:</span> {processedData.length}
                  </p>
                  <p>
                    <span className="font-medium">Columns:</span> {dataInfo.length}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Data Info</CardTitle>
                  <CardDescription>Column names, types, and missing values.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px] w-full rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Column</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-right">Missing (%)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dataInfo.map((info) => (
                          <TableRow key={info.name}>
                            <TableCell className="font-medium">{info.name}</TableCell>
                            <TableCell>{info.type}</TableCell>
                            <TableCell className="text-right">
                              {typeof info?.nullPercentage === "number" ? info.nullPercentage.toFixed(1) : "N/A"}%
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Descriptive Statistics</CardTitle>
                <CardDescription>Summary statistics for numeric columns.</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px] w-full rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Column</TableHead>
                        <TableHead>Mean</TableHead>
                        <TableHead>Median</TableHead>
                        <TableHead>Std Dev</TableHead>
                        <TableHead>Min</TableHead>
                        <TableHead>Max</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getNumericColumns().map((colName) => {
                        const desc = dataDescription[colName]
                        return (
                          <TableRow key={colName}>
                            <TableCell className="font-medium">{colName}</TableCell>
                            <TableCell>{typeof desc?.mean === "number" ? desc.mean.toFixed(2) : "N/A"}</TableCell>
                            <TableCell>{typeof desc?.median === "number" ? desc.median.toFixed(2) : "N/A"}</TableCell>
                            <TableCell>{typeof desc?.std === "number" ? desc.std.toFixed(2) : "N/A"}</TableCell>
                            <TableCell>{typeof desc?.min === "number" ? desc.min.toFixed(2) : "N/A"}</TableCell>
                            <TableCell>{typeof desc?.max === "number" ? desc.max.toFixed(2) : "N/A"}</TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="missing" className="mt-6 space-y-4">
            <div className="rounded-lg border bg-muted/30 p-4 mb-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">Handle Missing Values</h4>
                  <p className="text-sm text-muted-foreground">
                    Address gaps in your data by filling or removing missing entries.
                  </p>
                </div>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <EyeOff className="h-5 w-5" /> Missing Value Imputation
                </CardTitle>
                <CardDescription>Choose a column and a strategy to handle missing values.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="missing-column">Column</Label>
                  <Select value={missingValueColumn} onValueChange={setMissingValueColumn}>
                    <SelectTrigger id="missing-column">
                      <SelectValue placeholder="Select a column" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAllColumns().map((col) => (
                        <SelectItem key={col} value={col}>
                          {col}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="missing-strategy">Strategy</Label>
                  <Select
                    value={missingValueStrategy}
                    onValueChange={
                      setMissingValueStrategy as (value: "mean" | "median" | "mode" | "remove" | "zero") => void
                    }
                  >
                    <SelectTrigger id="missing-strategy">
                      <SelectValue placeholder="Select strategy" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mean">Impute with Mean (Numeric only)</SelectItem>
                      <SelectItem value="median">Impute with Median (Numeric only)</SelectItem>
                      <SelectItem value="mode">Impute with Mode</SelectItem>
                      <SelectItem value="zero">Impute with Zero (Numeric only)</SelectItem>
                      <SelectItem value="remove">Remove Rows with Missing Value</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="outliers" className="mt-6 space-y-4">
            <div className="rounded-lg border bg-muted/30 p-4 mb-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">Handle Outliers</h4>
                  <p className="text-sm text-muted-foreground">
                    Identify and manage extreme values that can skew your analysis.
                  </p>
                </div>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" /> Outlier Treatment
                </CardTitle>
                <CardDescription>Choose a numeric column, detection method, and treatment strategy.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="outlier-column">Column</Label>
                  <Select value={outlierColumn} onValueChange={setOutlierColumn}>
                    <SelectTrigger id="outlier-column">
                      <SelectValue placeholder="Select a numeric column" />
                    </SelectTrigger>
                    <SelectContent>
                      {getNumericColumns().map((col) => (
                        <SelectItem key={col} value={col}>
                          {col}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="outlier-method">Detection Method</Label>
                  <Select value={outlierMethod} onValueChange={setOutlierMethod as (value: "iqr" | "zscore") => void}>
                    <SelectTrigger id="outlier-method">
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="iqr">IQR (Interquartile Range)</SelectItem>
                      <SelectItem value="zscore">Z-Score</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="outlier-strategy">Treatment Strategy</Label>
                  <Select
                    value={outlierStrategy}
                    onValueChange={setOutlierStrategy as (value: "remove" | "median" | "mean" | "cap") => void}
                  >
                    <SelectTrigger id="outlier-strategy">
                      <SelectValue placeholder="Select strategy" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="remove">Remove Outlier Rows</SelectItem>
                      <SelectItem value="median">Replace with Median</SelectItem>
                      <SelectItem value="mean">Replace with Mean</SelectItem>
                      <SelectItem value="cap">Cap at Bounds</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="duplicates" className="mt-6 space-y-4">
            <div className="rounded-lg border bg-muted/30 p-4 mb-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">Remove Duplicate Rows</h4>
                  <p className="text-sm text-muted-foreground">
                    Ensure each row in your dataset is unique to avoid skewed results.
                  </p>
                </div>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trash2 className="h-5 w-5" /> Duplicate Row Removal
                </CardTitle>
                <CardDescription>Remove rows that are exact duplicates across all columns.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remove-duplicates"
                    checked={removeDuplicatesEnabled}
                    onCheckedChange={(checked: boolean) => setRemoveDuplicatesEnabled(checked)}
                  />
                  <Label htmlFor="remove-duplicates">Enable duplicate row removal</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="filter" className="mt-6 space-y-4">
            <div className="rounded-lg border bg-muted/30 p-4 mb-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">Filter Rows</h4>
                  <p className="text-sm text-muted-foreground">
                    Selectively include or exclude rows based on specific column values.
                  </p>
                </div>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" /> Custom Row Filter
                </CardTitle>
                <CardDescription>Define a condition to filter your dataset rows.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="filter-column">Column</Label>
                  <Select value={filterColumn} onValueChange={setFilterColumn}>
                    <SelectTrigger id="filter-column">
                      <SelectValue placeholder="Select a column" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAllColumns().map((col) => (
                        <SelectItem key={col} value={col}>
                          {col}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="filter-operator">Operator</Label>
                  <Select value={filterOperator} onValueChange={setFilterOperator}>
                    <SelectTrigger id="filter-operator">
                      <SelectValue placeholder="Select operator" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equals">Equals</SelectItem>
                      <SelectItem value="not_equals">Not Equals</SelectItem>
                      <SelectItem value="greater_than">Greater Than (Numeric only)</SelectItem>
                      <SelectItem value="less_than">Less Than (Numeric only)</SelectItem>
                      <SelectItem value="contains">Contains (Text only)</SelectItem>
                      <SelectItem value="starts_with">Starts With (Text only)</SelectItem>
                      <SelectItem value="ends_with">Ends With (Text only)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="filter-value">Value</Label>
                  <Input
                    id="filter-value"
                    placeholder="Enter value to filter by"
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={handleResetData} disabled={isProcessing}>
              <RefreshCw className="h-4 w-4 mr-2" /> Reset Data
            </Button>
            <Button onClick={handleApplyPreprocessing} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2"></div>
                  Applying...
                </>
              ) : (
                <>
                  <Replace className="h-4 w-4 mr-2" /> Apply Preprocessing
                </>
              )}
            </Button>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  )
}
