import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
const crypto = require("crypto")

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Payment verification started")

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = await request.json()

    console.log("[v0] Verification request data:", {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature: razorpay_signature ? "present" : "missing",
      planId,
    })

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      console.log("[v0] User not authenticated during verification")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] User authenticated for verification:", user.id)

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      console.log("[v0] Missing required payment fields")
      return NextResponse.json({ error: "Missing payment verification data" }, { status: 400 })
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
      console.error("[v0] Razorpay secret key missing")
      return NextResponse.json({ error: "Payment configuration error" }, { status: 500 })
    }

    console.log("[v0] Creating signature for verification...")
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex")

    console.log("[v0] Signature comparison:", {
      expected: expectedSignature,
      received: razorpay_signature,
      match: expectedSignature === razorpay_signature,
    })

    if (expectedSignature !== razorpay_signature) {
      console.log("[v0] Payment signature verification failed")
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 })
    }

    console.log("[v0] Payment signature verified successfully")

    // Load plan
    const { data: plan, error: planErr } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("id", planId)
      .single()

    if (planErr || !plan) {
      console.log("[v0] Plan lookup failed:", { planErr, planId })
      return NextResponse.json({ error: "Plan not found" }, { status: 404 })
    }

    console.log("[v0] Plan found:", { id: plan.id, name: plan.name, datasets_limit: plan.datasets_limit })

    // Manage subscription
    const { data: existingSubscription } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle()

    const baseUpdate = {
      plan_id: plan.id,
      datasets_used: 0,
      datasets_limit: plan.datasets_limit,
      status: "active",
      updated_at: new Date().toISOString(),
      expires_at: plan.is_unlimited ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    }

    let subscriptionResult
    if (existingSubscription) {
      console.log("[v0] Updating existing subscription:", existingSubscription.id)
      subscriptionResult = await supabase
        .from("user_subscriptions")
        .update(baseUpdate)
        .eq("id", existingSubscription.id)
    } else {
      console.log("[v0] Creating new subscription")
      subscriptionResult = await supabase.from("user_subscriptions").insert({
        user_id: user.id,
        ...baseUpdate,
      })
    }

    if (subscriptionResult.error) {
      console.error("[v0] Subscription save failed:", subscriptionResult.error)
      return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 })
    }

    console.log("[v0] Subscription saved successfully")

    // Insert into payments table
    console.log("[v0] Creating payment record...")
    const paymentRecord = await supabase.from("payments").insert({
      user_id: user.id,
      plan_id: plan.id,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount: plan.price_inr, // INR value, not paise
      currency: "INR",
      status: "captured", // ✅ matches schema default
    })

    if (paymentRecord.error) {
      console.log("[v0] Payment record creation failed (non-critical):", paymentRecord.error)
    } else {
      console.log("[v0] Payment record created successfully")
    }

    console.log("[v0] Payment verification completed successfully")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error verifying payment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
