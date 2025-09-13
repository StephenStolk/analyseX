import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"
import { SubscriptionButton } from "@/components/subscription-button"

export default async function PricingPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  // Get subscription plans and filter out unlimited per requirements
  const { data: allPlans } = await supabase
    .from("subscription_plans")
    .select("*")
    .order("price_usd", { ascending: true })
  const plans = (allPlans || []).filter((p) => !p.is_unlimited).slice(0, 3)

  // Get current user subscription
  const { data: currentSubscription } = await supabase
    .from("user_subscriptions")
    .select(`
      *,
      subscription_plans (
        id,
        name
      )
    `)
    .eq("user_id", user.id)
    .eq("status", "active")
    .single()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Plan</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Select the perfect plan for your data analysis needs. Upgrade or downgrade anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans?.map((plan) => {
            const isCurrentPlan = currentSubscription?.subscription_plans?.id === plan.id
            const isPopular = plan.name === "Pro"

            return (
              <Card key={plan.id} className={`relative ${isPopular ? "ring-2 ring-blue-500 shadow-lg" : "shadow-md"}`}>
                {isPopular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500">Best Value</Badge>
                )}

                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">${plan.price_usd}</span>
                    <span className="text-gray-600 ml-1">USD</span>
                  </div>
                  <div className="text-sm text-gray-500">₹{plan.price_inr} INR</div>
                  <CardDescription className="mt-2">
                    {plan.is_unlimited ? "Unlimited reports*" : `${plan.reports_limit} reports`}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span className="text-sm">
                        {plan.is_unlimited ? "Unlimited analysis" : `${plan.reports_limit} analysis reports`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span className="text-sm">CSV & Excel support</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Advanced analytics</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Export results</span>
                    </div>
                    {(plan.name === "Pro" || plan.name === "Unlimited") && (
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500" />
                        <span className="text-sm">Priority support</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4">
                    {isCurrentPlan ? (
                      <Button disabled className="w-full">
                        Current Plan
                      </Button>
                    ) : (
                      <SubscriptionButton
                        planId={plan.id}
                        planName={plan.name}
                        price={plan.price_usd}
                        userId={user.id}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Hide the unlimited plans note since unlimited plans are not shown */}
        {/* {plans?.some((plan) => plan.is_unlimited) && (
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              * Unlimited plans have a fair use policy with internal limits of 200-300 reports for optimal performance.
            </p>
          </div>
        )} */}
      </div>
    </div>
  )
}
