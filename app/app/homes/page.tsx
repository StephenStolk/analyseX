import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single()

  // Get user subscription
  const { data: subscription } = await supabase
    .from("user_subscriptions")
    .select(`
      *,
      subscription_plans (
        name,
        reports_limit,
        is_unlimited
      )
    `)
    .eq("user_id", data.user.id)
    .eq("status", "active")
    .single()

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Welcome back, {profile?.full_name || data.user.email}!</h1>
        <p className="text-muted-foreground mt-2">Ready to analyze your data with AnalyzeX?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
          </CardHeader>
          <CardContent>
            {subscription ? (
              <div>
                <p className="text-2xl font-bold text-primary">{subscription.subscription_plans.name}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {subscription.subscription_plans.is_unlimited
                    ? "Unlimited reports"
                    : `${subscription.reports_used}/${subscription.reports_limit} reports used`}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-lg text-muted-foreground">No active plan</p>
                <Button asChild className="mt-2">
                  <Link href="/pricing">Choose a Plan</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/app/upload">Start New Analysis</Link>
            </Button>
            <Button variant="outline" asChild className="w-full bg-transparent">
              <Link href="/app/analysis">View Analysis</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" asChild className="w-full bg-transparent">
              <Link href="/pricing">Upgrade Plan</Link>
            </Button>
            <Button variant="outline" asChild className="w-full bg-transparent">
              <Link href="/app/profile">Edit Profile</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
