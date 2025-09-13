import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  return (
    <main className="container py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span>Email</span>
            <span className="text-muted-foreground">{user.email}</span>
          </div>
          <div className="flex gap-3">
            <Link href="/app/profile">
              <Button variant="outline">Edit profile</Button>
            </Link>
            <Link href="/auth/logout">
              <Button variant="outline">Sign out</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Billing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Manage your subscription and plan.</p>
          <Link href="/pricing">
            <Button>Manage plan</Button>
          </Link>
        </CardContent>
      </Card>
    </main>
  )
}
