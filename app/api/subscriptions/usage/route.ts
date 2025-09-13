import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()
    if (!userId) return NextResponse.json({ error: "Missing user ID" }, { status: 400 })

    const supabase = await createClient()

    // Verify auth
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user || user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch subscription
    const { data: subscription, error: subscriptionError } = await supabase
      .from("user_subscriptions")
      .select(
        `
        *,
        subscription_plans (
          is_unlimited,
          datasets_limit,
          name
        )
      `
      )
      .eq("user_id", userId)
      .eq("status", "active")
      .single()

    if (subscriptionError || !subscription) {
      return NextResponse.json({ error: "No active subscription found" }, { status: 404 })
    }

    if (
      !subscription.subscription_plans.is_unlimited &&
      subscription.datasets_used >= subscription.datasets_limit
    ) {
      return NextResponse.json(
        {
          error: "Dataset limit reached. Please upgrade your plan.",
          canGenerate: false,
        },
        { status: 403 },
      )
    }

    // Increment usage
    await supabase
      .from("user_subscriptions")
      .update({
        datasets_used: subscription.datasets_used + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscription.id)

    return NextResponse.json({
      canGenerate: true,
      datasetsUsed: subscription.datasets_used + 1,
      datasetsLimit: subscription.datasets_limit,
      isUnlimited: subscription.subscription_plans.is_unlimited,
    })
  } catch (error) {
    console.error("Usage tracking error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) return NextResponse.json({ error: "Missing user ID" }, { status: 400 })

    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user || user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: subscription, error: subscriptionError } = await supabase
      .from("user_subscriptions")
      .select(
        `
        *,
        subscription_plans (
          name,
          is_unlimited,
          datasets_limit
        )
      `
      )
      .eq("user_id", userId)
      .eq("status", "active")
      .single()

    if (subscriptionError || !subscription) {
      return NextResponse.json({ hasSubscription: false, canGenerate: false })
    }

    const canGenerate =
      subscription.subscription_plans.is_unlimited ||
      subscription.datasets_used < subscription.datasets_limit

    return NextResponse.json({
      hasSubscription: true,
      canGenerate,
      datasetsUsed: subscription.datasets_used,
      datasetsLimit: subscription.datasets_limit,
      isUnlimited: subscription.subscription_plans.is_unlimited,
      planName: subscription.subscription_plans.name,
    })
  } catch (error) {
    console.error("Usage check error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
