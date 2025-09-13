"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ConversationInput } from "@/components/conversation-input"
import { SentimentAnalysis } from "@/components/sentiment-analysis"
import { KeyPhraseAnalysis } from "@/components/key-phrase-analysis"
import { ConversationTimeline } from "@/components/conversation-timeline"
import { ConversationStats } from "@/components/conversation-stats"
import { KnowMyTests } from "@/components/know-my-tests"
import { Brain, TestTube } from "lucide-react"

export function Dashboard() {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisComplete, setAnalysisComplete] = useState(false)
  const [showKnowMyTests, setShowKnowMyTests] = useState(false)

  const handleAnalyze = async (conversation: string) => {
    setIsAnalyzing(true)

    // Simulate API call
    setTimeout(() => {
      setIsAnalyzing(false)
      setAnalysisComplete(true)
    }, 2000)
  }

  if (showKnowMyTests) {
    return <KnowMyTests onClose={() => setShowKnowMyTests(false)} />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Analyze conversations and visualize insights with ChatLens.</p>
      </div>

      {/* New Know My Tests Section */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />📊 Get to Know Your Tests
          </CardTitle>
          <CardDescription>
            Not sure what tests to run on your dataset? Answer a few simple questions, and we'll recommend the most
            relevant tests—along with explanations and real-life examples. You'll get a downloadable PDF guide at the
            end.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setShowKnowMyTests(true)} className="bg-blue-600 hover:bg-blue-700">
            <TestTube className="h-4 w-4 mr-2" />
            Get Started
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Conversation Analysis</CardTitle>
          <CardDescription>Enter a conversation to analyze or upload a file.</CardDescription>
        </CardHeader>
        <CardContent>
          <ConversationInput onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />
        </CardContent>
      </Card>

      {analysisComplete && (
        <>
          <ConversationStats />

          <Tabs defaultValue="sentiment">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="sentiment">Sentiment Analysis</TabsTrigger>
              <TabsTrigger value="keyphrases">Key Phrases</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>
            <TabsContent value="sentiment" className="mt-4">
              <SentimentAnalysis />
            </TabsContent>
            <TabsContent value="keyphrases" className="mt-4">
              <KeyPhraseAnalysis />
            </TabsContent>
            <TabsContent value="timeline" className="mt-4">
              <ConversationTimeline />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
