"use client"

import * as React from "react"

export interface ChartContainerProps {
  data: any[]
  xField: string
  yField?: string
  categories?: string[]
  colors?: string[]
  valueFormatter?: (value: number) => string
  xAxisFormatter?: (value: string | number) => string
  children: React.ReactNode
}

export const ChartContainer = ({
  data,
  xField,
  yField,
  categories,
  colors,
  valueFormatter,
  xAxisFormatter,
  children,
}: ChartContainerProps) => {
  return (
    <div>
      {React.Children.map(children, (child) => {
        return React.cloneElement(child as React.ReactElement, {
          data,
          xField,
          yField,
          categories,
          colors,
          valueFormatter,
          xAxisFormatter,
        })
      })}
    </div>
  )
}

export interface ChartAxisOptionsProps {
  xAxis?: {
    tickLabelStyle?: React.CSSProperties
    min?: number
    max?: number
  }
  yAxis?: {
    tickLabelStyle?: React.CSSProperties
    min?: number
    max?: number
  }
}

export const ChartAxisOptions = ({ xAxis, yAxis }: ChartAxisOptionsProps) => {
  return null
}

export interface ChartTooltipProps {
  children: React.ReactNode
}

export const ChartTooltip = ({ children }: ChartTooltipProps) => {
  return null
}

export const ChartTooltipContent = () => {
  return null
}

export interface ChartLegendProps {
  position?: "top" | "bottom" | "left" | "right"
  categoryNames?: Record<string, string>
}

export const ChartLegend = ({ position, categoryNames }: ChartLegendProps) => {
  return null
}

export const Chart = () => {
  return null
}

export const ChartLine = () => {
  return null
}

export const ChartBar = () => {
  return null
}

export const ChartArea = () => {
  return null
}
