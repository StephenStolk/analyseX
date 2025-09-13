"use client"

import type React from "react"

import { useState } from "react"
import { Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"

interface ConversationInputProps {
  onAnalyze: (conversation: string) => void
  isAnalyzing: boolean
}

export function ConversationInput({ onAnalyze, isAnalyzing }: ConversationInputProps) {
  const [conversation, setConversation] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (conversation.trim()) {
      onAnalyze(conversation)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4">
        <Textarea
          placeholder="Paste your conversation here..."
          className="min-h-[200px] resize-none"
          value={conversation}
          onChange={(e) => setConversation(e.target.value)}
          disabled={isAnalyzing}
        />
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" className="gap-2" disabled={isAnalyzing}>
            <Upload className="h-4 w-4" />
            Upload File
          </Button>
          <Button type="submit" className="ml-auto" disabled={!conversation.trim() || isAnalyzing}>
            {isAnalyzing ? "Analyzing..." : "Analyze Conversation"}
          </Button>
        </div>
        {isAnalyzing && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Analyzing conversation</span>
              <span>Please wait...</span>
            </div>
            <Progress value={45} className="h-2" />
          </div>
        )}
      </div>
    </form>
  )
}
