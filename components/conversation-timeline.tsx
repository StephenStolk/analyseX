"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartLine,
  ChartAxisOptions,
  ChartContainer,
  ChartLegend,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

// Sample data
const timelineData = [
  { time: "09:00", messages: 5, words: 45, questions: 2 },
  { time: "09:15", messages: 8, words: 72, questions: 3 },
  { time: "09:30", messages: 12, words: 108, questions: 5 },
  { time: "09:45", messages: 7, words: 63, questions: 2 },
  { time: "10:00", messages: 10, words: 90, questions: 4 },
  { time: "10:15", messages: 15, words: 135, questions: 6 },
  { time: "10:30", messages: 9, words: 81, questions: 3 },
]

export function ConversationTimeline() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversation Timeline</CardTitle>
        <CardDescription>Message frequency and content over time</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          <ChartContainer
            data={timelineData}
            xField="time"
            categories={["messages", "questions"]}
            colors={["#5a67d8", "#f59e0b"]}
            valueFormatter={(value) => `${value}`}
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
              }}
            />
            <ChartLine connectNulls={true} curve="monotone" lineWidth={3} />
            <ChartTooltip>
              <ChartTooltipContent />
            </ChartTooltip>
            <ChartLegend
              position="bottom"
              categoryNames={{
                messages: "Messages",
                questions: "Questions",
              }}
            />
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  )
}
