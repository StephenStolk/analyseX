"use client"

import { useEffect, useState } from "react"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

interface UsageDisplayProps {
  datasetsUsed?: number
  datasetsLimit?: number | null
  isUnlimited?: boolean
  canGenerate?: boolean
  planName?: string
  onUpgrade?: () => void
}

export function UsageDisplay({
  datasetsUsed,
  datasetsLimit,
  isUnlimited,
  canGenerate,
  planName,
  onUpgrade,
}: UsageDisplayProps) {
  // local state only used if props are not provided
  const [local, setLocal] = useState<{
    used: number
    limit: number | null
    unlimited: boolean
    planName: string
    canGenerate: boolean
  } | null>(null)
  const [loading, setLoading] = useState<boolean>(!(
    typeof datasetsUsed === "number" &&
    (typeof datasetsLimit === "number" || datasetsLimit === null) &&
    typeof isUnlimited === "boolean"
  ))

  const supabase = createClient()

  useEffect(() => {
    // If parent supplied usage via props, do nothing
    const propsProvided =
      typeof datasetsUsed === "number" &&
      (typeof datasetsLimit === "number" || datasetsLimit === null) &&
      typeof isUnlimited === "boolean"

    if (propsProvided) {
      setLoading(false)
      return
    }

    // Otherwise fetch usage from API
    const fetchUsage = async () => {
      setLoading(true)
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          setLocal({
            used: 0,
            limit: 0,
            unlimited: false,
            planName: "",
            canGenerate: false,
          })
          return
        }

        const res = await fetch(`/api/subscriptions/usage?userId=${user.id}`, {
          credentials: "include",
        })
        if (!res.ok) {
          setLocal({
            used: 0,
            limit: 0,
            unlimited: false,
            planName: "",
            canGenerate: false,
          })
          return
        }

        const json = await res.json()
        setLocal({
          used: typeof json.datasetsUsed === "number" ? json.datasetsUsed : 0,
          limit: typeof json.datasetsLimit === "number" ? json.datasetsLimit : null,
          unlimited: !!json.isUnlimited,
          planName: json.planName ?? "",
          canGenerate: !!json.canGenerate,
        })
      } catch (err) {
        console.error("UsageDisplay: failed to fetch usage", err)
        setLocal({
          used: 0,
          limit: 0,
          unlimited: false,
          planName: "",
          canGenerate: false,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchUsage()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // decide which source to use: props (preferred) or local fetch
  const used = typeof datasetsUsed === "number" ? datasetsUsed : local?.used ?? 0
  const limit = typeof datasetsLimit === "number" ? datasetsLimit : local?.limit ?? null
  const unlimited = typeof isUnlimited === "boolean" ? isUnlimited : local?.unlimited ?? false
  const plan = planName ?? local?.planName ?? "No Plan"
  const canGen = typeof canGenerate === "boolean" ? canGenerate : local?.canGenerate ?? false

  // Display text / progress computation
  const displayLimit = unlimited ? "Unlimited" : limit ?? 0
  const percentage = !unlimited && limit && limit > 0 ? Math.min(100, (used / limit) * 100) : 0
  const isNearLimit = !unlimited && percentage > 80

  if (loading) {
    return <div className="animate-pulse bg-muted h-20 rounded-lg" />
  }

  return (
    <div className="bg-card border rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">Usage</h3>
        <Badge variant={isNearLimit ? "destructive" : "secondary"}>{plan || "—"}</Badge>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span>Datasets Used</span>
          <span>
            {used} / {displayLimit}
          </span>
        </div>

        {/* only show progress when there is a numeric limit */}
        {!unlimited && limit && limit > 0 ? (
          <Progress value={percentage} className="h-2" />
        ) : (
          <div className="text-xs text-muted-foreground">No limit (Unlimited plan)</div>
        )}

        {isNearLimit && (
          <div className="flex items-center justify-between mt-2">
            <p className="text-sm text-orange-600">You're running low on dataset uploads!</p>
            {onUpgrade && (
              <Button size="sm" onClick={onUpgrade}>
                Upgrade Plan
              </Button>
            )}
          </div>
        )}

        {!isNearLimit && !unlimited && onUpgrade && (
          <div className="flex justify-end">
            <Button size="sm" variant="outline" onClick={onUpgrade}>
              Upgrade
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
