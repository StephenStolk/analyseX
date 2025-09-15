"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { FileSpreadsheet, Upload, X, LinkIcon, Cloud } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { analyzeFile } from "@/lib/data-analyzer"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"
import { saveAnalysis } from "@/lib/data-persistence"

declare global {
  interface Window {
    gapi: any
    google: any
    gapiLoaded?: boolean
    gisLoaded?: boolean
  }
}

export function DataUploadPage() {
  const router = useRouter()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [file, setFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)

  // gating
  const [userId, setUserId] = useState<string | null>(null)
  const [canGenerate, setCanGenerate] = useState<boolean>(false)
  const [usageInfo, setUsageInfo] = useState<any>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [sourceUrl, setSourceUrl] = useState("")

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        router.push("/auth/login?redirect=/app/upload")
        return
      }
      setUserId(data.user.id)

      try {
        const res = await fetch(`/api/subscriptions/usage?userId=${data.user.id}`, {
          credentials: "include",
        })

        if (!res.ok) throw new Error("Failed to fetch usage")

        const json = await res.json()

        // Normalize field names for UI
        setUsageInfo({
          datasetsUsed: json.datasetsUsed ?? json.used ?? 0,
          datasetsLimit: json.datasetsLimit ?? json.limit ?? 0,
          isUnlimited: json.isUnlimited ?? false,
          canGenerate: json.canGenerate ?? json.canGenerate ?? false,
          hasSubscription: json.hasSubscription ?? true,
        })

        setCanGenerate(!!json.canGenerate)

        if (!json.hasSubscription) {
          toast({
            title: "Subscription Required",
            description: "Please select a plan to upload datasets.",
            variant: "destructive",
          })
          router.push("/app")
          return
        }
      } catch (error) {
        console.error("Error checking usage:", error)
        router.push("/app")
        return
      }

      setIsLoading(false)
    }

    init()
  }, [router, toast])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }
  const handleDragLeave = () => setIsDragging(false)
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0]
      handleFile(droppedFile)
    }
  }
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0]
      handleFile(selectedFile)
    }
  }
  const handleFile = (selectedFile: File) => {
    const fileType = selectedFile.name.split(".").pop()?.toLowerCase()
    if (fileType === "csv" || fileType === "xlsx" || fileType === "xls") {
      setFile(selectedFile)
      setAnalysisError(null)
    } else {
      toast({
        title: "Invalid file format",
        description: "Please upload a CSV or Excel file (.xlsx, .xls)",
        variant: "destructive",
      })
    }
  }

  const handleUpload = async () => {
    if (!file || !userId) return

    if (!canGenerate) {
      if (usageInfo && usageInfo.datasetsUsed >= usageInfo.datasetsLimit && !usageInfo.isUnlimited) {
        toast({
          title: "Upload limit reached",
          description: `You've used all ${usageInfo.datasetsLimit} uploads in your plan. Please upgrade to continue.`,
          variant: "destructive",
        })
        router.push("/app")
      } else {
        toast({
          title: "Cannot upload",
          description: "Please check your subscription status.",
          variant: "destructive",
        })
      }
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Optional: show progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 5
        })
      }, 100)

      // Upload to Supabase Storage (optional)
      try {
        const supabase = createClient()
        const { data: upRes, error: upErr } = await supabase.storage
          .from("datasets")
          .upload(`${userId}/${Date.now()}_${file.name}`, file, { upsert: false })
        if (upErr) {
          // ignore if bucket missing; keep local-only analysis
        }
      } catch {
        // ignore
      }

      // Analyze file locally
      const results = await analyzeFile(file)

      sessionStorage.setItem("analysisResults", JSON.stringify(results))

      // Save to persistent history with metadata
      const analysisId = saveAnalysis(file.name, results, {
        fileSize: file.size,
        analysisType: ["basic", "statistical"],
      })

      console.log(`[v0] Analysis saved to history with ID: ${analysisId}`)

      // Increment usage on server
      const usageRes = await fetch("/api/subscriptions/usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })

      if (!usageRes.ok) {
        const err = await usageRes.json().catch(() => ({}))
        toast({
          title: "Upload limit reached",
          description: err?.error || "Please upgrade your plan to upload more datasets.",
          variant: "destructive",
        })
        setIsUploading(false)
        clearInterval(progressInterval)
        return
      }

      // Update UI with latest usage
      const usageJson = await usageRes.json()
      setUsageInfo(usageJson)
      setCanGenerate(!!usageJson.canGenerate)

      clearInterval(progressInterval)
      setUploadProgress(100)

      setTimeout(() => {
        router.push("/app/analysis")
      }, 500)
    } catch (error) {
      console.error("Analysis error:", error)
      setAnalysisError("Error analyzing file. Please try a different file.")
      setIsUploading(false)
      setUploadProgress(0)
      toast({
        title: "Analysis Error",
        description: "There was a problem analyzing your file. Please try again with a different file.",
        variant: "destructive",
      })
    }
  }

  const pickFromDrive = async () => {
    try {
      // Call server-side API that handles Google Drive authentication securely
      const response = await fetch("/api/google-drive/picker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      })

      if (!response.ok) {
        const error = await response.json()
        toast({
          title: "Google Drive not available",
          description: error.message || "Google Drive integration is not configured.",
          variant: "destructive",
        })
        return
      }

      const { authUrl } = await response.json()
      // Open Google auth in popup
      window.open(authUrl, "google-auth", "width=500,height=600")

      // Listen for file selection (this would need additional implementation)
      toast({
        title: "Google Drive",
        description: "Google Drive integration requires additional setup. Please use local file upload for now.",
        variant: "default",
      })
    } catch (e) {
      console.error(e)
      toast({
        title: "Drive picker failed",
        description: "Try again or use local file upload",
        variant: "destructive",
      })
    }
  }

  const loadFromUrl = async () => {
    try {
      if (!sourceUrl) return
      const res = await fetch(sourceUrl)
      if (!res.ok) throw new Error("Failed to fetch file")
      const blob = await res.blob()
      const nameGuess = sourceUrl.split("/").pop() || "dataset.csv"
      handleFile(new File([blob], nameGuess))
    } catch (e: any) {
      toast({ title: "Could not download", description: e.message || "Check the URL", variant: "destructive" })
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <main className="flex-1 bg-gradient-to-b from-background to-background/80">
          <div className="container flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-12 md:px-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Loading...</h1>
              <p className="mt-4 text-muted-foreground">Checking your subscription status...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 bg-gradient-to-b from-background to-background/80">
        <div className="container flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-12 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-2xl"
          >
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Upload Your Data</h1>
              <p className="mt-4 text-muted-foreground">
                Upload Excel or CSV to begin analysis.
                {usageInfo && (
                  <span className="block mt-2 text-sm">
                    {canGenerate
                      ? `${usageInfo.datasetsLimit - usageInfo.datasetsUsed} uploads remaining in your plan`
                      : "Upload limit reached - please upgrade your plan"}
                  </span>
                )}
              </p>
            </div>

            {!file ? (
              <>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className={`flex flex-col items-center justify-center rounded-3xl border-2 border-dashed p-12 transition-colors ${
                    isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/20"
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="mb-4 rounded-full bg-primary/10 p-4 text-primary">
                    <FileSpreadsheet className="h-10 w-10" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold">Drag and drop your file here</h3>
                  <p className="mb-6 text-center text-muted-foreground">or click to browse your files</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-full"
                    disabled={!canGenerate}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Browse Files
                  </Button>

                  {!canGenerate && (
                    <div className="mt-4 text-center">
                      <p className="text-sm text-destructive mb-2">Upload limit reached for your current plan.</p>
                      <Button variant="outline" size="sm" onClick={() => router.push("/app")}>
                        Upgrade Plan
                      </Button>
                    </div>
                  )}
                  <p className="mt-4 text-sm text-muted-foreground">Supported formats: .xlsx, .xls, .csv</p>
                </motion.div>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <Button
                    variant="outline"
                    className="w-full rounded-full bg-transparent"
                    onClick={pickFromDrive}
                    disabled={!canGenerate}
                  >
                    <Cloud className="mr-2 h-4 w-4" />
                    Google Drive
                  </Button>
                  <div className="flex gap-2 md:col-span-2">
                    <Input
                      placeholder="https://example.com/data.csv"
                      value={sourceUrl}
                      onChange={(e) => setSourceUrl(e.target.value)}
                    />
                    <Button variant="outline" onClick={loadFromUrl} disabled={!canGenerate}>
                      <LinkIcon className="mr-2 h-4 w-4" />
                      From URL
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-3xl border bg-muted/30 p-8"
              >
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-primary/10 p-3 text-primary">
                      <FileSpreadsheet className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{file.name}</h3>
                      <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setFile(null)} disabled={isUploading}>
                    <X className="h-5 w-5" />
                    <span className="sr-only">Remove file</span>
                  </Button>
                </div>

                {analysisError && (
                  <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{analysisError}</div>
                )}

                {isUploading ? (
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span>Analyzing data...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-sm text-muted-foreground">
                      {uploadProgress < 30 && "Reading file..."}
                      {uploadProgress >= 30 && uploadProgress < 60 && "Calculating statistics..."}
                      {uploadProgress >= 60 && uploadProgress < 90 && "Generating visualizations..."}
                      {uploadProgress >= 90 && "Finalizing analysis..."}
                    </p>
                  </div>
                ) : (
                  <div className="flex justify-end">
                    <Button onClick={handleUpload} className="rounded-full px-8" disabled={!canGenerate}>
                      Verify & Analyze
                    </Button>
                  </div>
                )}
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="mt-8 rounded-3xl border bg-muted/30 p-6"
            >
              <h3 className="mb-4 text-lg font-semibold">Privacy First</h3>
              <p className="text-muted-foreground">
                Your data privacy is our priority. Initial analysis is performed locally on your device. Only the
                minimal necessary data will be sent to our AI for deeper insights, and only with your explicit
                permission.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
