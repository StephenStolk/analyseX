"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartBar, ChartAxisOptions, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

// Sample data
const keyPhraseData = [
  { phrase: "customer service", count: 42 },
  { phrase: "product quality", count: 38 },
  { phrase: "shipping time", count: 34 },
  { phrase: "user experience", count: 30 },
  { phrase: "pricing", count: 28 },
  { phrase: "technical support", count: 25 },
  { phrase: "return policy", count: 22 },
  { phrase: "website navigation", count: 18 },
]

export function KeyPhraseAnalysis() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Key Phrases</CardTitle>
        <CardDescription>Most frequently mentioned phrases in the conversation</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          <ChartContainer
            data={keyPhraseData}
            xField="phrase"
            yField="count"
            categories={["count"]}
            colors={["#7f5af0"]}
            valueFormatter={(value) => `${value} mentions`}
          >
            <ChartAxisOptions
              xAxis={{
                tickLabelStyle: {
                  fontSize: 12,
                  angle: -45,
                  textAnchor: "end",
                },
              }}
              yAxis={{
                tickLabelStyle: {
                  fontSize: 12,
                },
              }}
            />
            <ChartBar />
            <ChartTooltip>
              <ChartTooltipContent />
            </ChartTooltip>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  )
}
