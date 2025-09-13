"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartArea,
  ChartAxisOptions,
  ChartContainer,
  ChartLegend,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Sample data
const sentimentData = [
  { date: "Jan 1", positive: 40, neutral: 35, negative: 25 },
  { date: "Jan 2", positive: 45, neutral: 30, negative: 25 },
  { date: "Jan 3", positive: 30, neutral: 40, negative: 30 },
  { date: "Jan 4", positive: 50, neutral: 25, negative: 25 },
  { date: "Jan 5", positive: 55, neutral: 30, negative: 15 },
  { date: "Jan 6", positive: 60, neutral: 25, negative: 15 },
  { date: "Jan 7", positive: 65, neutral: 20, negative: 15 },
]

export function SentimentAnalysis() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Sentiment Analysis</CardTitle>
          <CardDescription>Sentiment distribution over time</CardDescription>
        </div>
        <Select defaultValue="7days">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7days">Last 7 days</SelectItem>
            <SelectItem value="30days">Last 30 days</SelectItem>
            <SelectItem value="90days">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          <ChartContainer
            data={sentimentData}
            xField="date"
            categories={["positive", "neutral", "negative"]}
            colors={["#4ade80", "#94a3b8", "#f87171"]}
            valueFormatter={(value) => `${value}%`}
          >
            <ChartAxisOptions
              xAxis={{
                tickLabelStyle: {
                  fontSize: 12,
                },
              }}
              yAxis={{
                tickLabelStyle: {
                  fontSize: 12,
                },
                min: 0,
                max: 100,
              }}
            />
            <ChartArea />
            <ChartTooltip>
              <ChartTooltipContent />
            </ChartTooltip>
            <ChartLegend
              position="bottom"
              categoryNames={{
                positive: "Positive",
                neutral: "Neutral",
                negative: "Negative",
              }}
            />
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  )
}
