import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

async function updateProfile(formData: FormData) {
  "use server"
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  const name = (formData.get("full_name") as string) || ""
  const purpose = (formData.get("purpose_of_use") as string) || "general"
  const profession = (formData.get("profession") as string) || "unspecified"

  await supabase.auth.updateUser({ data: { full_name: name } })
  await supabase
    .from("user_profiles")
    .upsert({ user_id: user.id, full_name: name, purpose_of_use: purpose, profession })
}

async function updatePassword(formData: FormData) {
  "use server"
  const supabase = await createClient()
  const newPassword = formData.get("new_password") as string
  if (!newPassword) return
  await supabase.auth.updateUser({ password: newPassword })
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle()

  // fetch ALL subscriptions instead of maybeSingle
  const { data: subscriptions } = await supabase
    .from("user_subscriptions")
    .select("*, subscription_plans(name, reports_limit, is_unlimited)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false }) // newest first

  const fullName = (user.user_metadata as any)?.full_name || ""
  const purpose = profile?.purpose_of_use || "general"
  const profession = profile?.profession || "unspecified"

  return (
    <main className="container py-8">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile info */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={updateProfile} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Full name</label>
                <Input name="full_name" defaultValue={fullName} />
              </div>
              <div>
                <label className="text-sm font-medium">Purpose of use</label>
                <Select name="purpose_of_use" defaultValue={purpose}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select purpose" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="report_making">Report making</SelectItem>
                    <SelectItem value="research">Research</SelectItem>
                    <SelectItem value="analysis">Analysis</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Profession / Field</label>
                <Input name="profession" defaultValue={profession} />
              </div>
              <div className="text-sm text-muted-foreground">Email: {user.email}</div>
              <Button type="submit">Save changes</Button>
            </form>
          </CardContent>
        </Card>

        {/* Plans (all subscriptions) */}
        <Card>
          <CardHeader>
            <CardTitle>Plans</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {subscriptions && subscriptions.length > 0 ? (
              subscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className={`p-3 rounded-md border ${
                    sub.status === "active" ? "bg-primary/10 border-primary" : "bg-muted"
                  }`}
                >
                  <div className="text-sm font-medium">
                    {sub.subscription_plans?.name}{" "}
                    {sub.status === "active" && <span className="text-primary">(Active)</span>}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Usage: {sub.reports_used}/{sub.subscription_plans?.reports_limit}
                    {sub.subscription_plans?.is_unlimited ? " (unlimited)" : ""}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Started: {new Date(sub.created_at).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Status: {sub.status}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm">No subscriptions found</div>
            )}
            <a href="/pricing">
              <Button variant="outline">Manage Plans</Button>
            </a>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={updatePassword} className="space-y-4">
              <div>
                <label className="text-sm font-medium">New password</label>
                <Input type="password" name="new_password" placeholder="Enter new password" />
              </div>
              <Button type="submit">Update Password</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
