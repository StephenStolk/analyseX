"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import type { ModuleTemplate } from "@/lib/dashboard-types"

interface ModuleConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: ModuleTemplate
  numericColumns: string[]
  categoricalColumns: string[]
  onConfigured: (template: ModuleTemplate, columns: string[], parameters: Record<string, any>) => void
}

export function ModuleConfigDialog({
  open,
  onOpenChange,
  template,
  numericColumns,
  categoricalColumns,
  onConfigured,
}: ModuleConfigDialogProps) {
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])
  const [parameters, setParameters] = useState<Record<string, any>>({})
  const [isValid, setIsValid] = useState(false)

  useEffect(() => {
    setSelectedColumns([])
    setParameters({})
  }, [template])

  useEffect(() => {
    const requiredNumeric = template.requiredColumns.numeric || 0
    const requiredCategorical = template.requiredColumns.categorical || 0

    const numericSelected = selectedColumns.filter((col) => numericColumns.includes(col)).length
    const categoricalSelected = selectedColumns.filter((col) => categoricalColumns.includes(col)).length

    setIsValid(numericSelected >= requiredNumeric && categoricalSelected >= requiredCategorical)
  }, [selectedColumns, template.requiredColumns, numericColumns, categoricalColumns])

  const handleColumnSelect = (index: number, column: string) => {
    const newColumns = [...selectedColumns]
    newColumns[index] = column
    setSelectedColumns(newColumns)
  }

  const handleParameterChange = (key: string, value: any) => {
    setParameters((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = () => {
    if (isValid) {
      onConfigured(template, selectedColumns.filter(Boolean), parameters)
    }
  }

  const renderColumnSelectors = () => {
    const selectors = []
    const requiredNumeric = template.requiredColumns.numeric || 0
    const requiredCategorical = template.requiredColumns.categorical || 0

    // Numeric column selectors
    for (let i = 0; i < requiredNumeric; i++) {
      selectors.push(
        <div key={`numeric-${i}`} className="space-y-2">
          <Label>
            Numeric Column {i + 1}
            <Badge variant="secondary" className="ml-2">
              Required
            </Badge>
          </Label>
          <Select onValueChange={(value) => handleColumnSelect(i, value)}>
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
        </div>,
      )
    }

    // Categorical column selectors
    for (let i = 0; i < requiredCategorical; i++) {
      selectors.push(
        <div key={`categorical-${i}`} className="space-y-2">
          <Label>
            Categorical Column {i + 1}
            <Badge variant="secondary" className="ml-2">
              Required
            </Badge>
          </Label>
          <Select onValueChange={(value) => handleColumnSelect(requiredNumeric + i, value)}>
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
        </div>,
      )
    }

    return selectors
  }

  const renderParameterInputs = () => {
    switch (template.type) {
      case "t-test":
      case "chi-square":
      case "anova":
      case "correlation":
        return (
          <div className="space-y-2">
            <Label>Significance Level (α)</Label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              max="0.1"
              defaultValue="0.05"
              onChange={(e) => handleParameterChange("alpha", Number.parseFloat(e.target.value))}
            />
          </div>
        )

      case "text-annotation":
        return (
          <div className="space-y-2">
            <Label>Text Content</Label>
            <Textarea
              placeholder="Enter your text here..."
              onChange={(e) => handleParameterChange("content", e.target.value)}
            />
          </div>
        )

      case "title-block":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input placeholder="Enter title..." onChange={(e) => handleParameterChange("title", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Subtitle (optional)</Label>
              <Input
                placeholder="Enter subtitle..."
                onChange={(e) => handleParameterChange("subtitle", e.target.value)}
              />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Configure {template.title}</DialogTitle>
          <DialogDescription>{template.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Column Selection */}
          {(template.requiredColumns.numeric || template.requiredColumns.categorical) && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-3">Select Data Columns</h4>
                <div className="space-y-3">{renderColumnSelectors()}</div>
              </div>
            </div>
          )}

          {/* Parameters */}
          {renderParameterInputs() && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-3">Parameters</h4>
                {renderParameterInputs()}
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!isValid}>
              Add Module
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
