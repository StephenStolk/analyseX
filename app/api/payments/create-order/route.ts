import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const Razorpay = require("razorpay")

function isUUID(v?: string) {
  return typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)
}

const SLUG_TO_NAME: Record<string, string[]> = {
  single_report: ["Single Dataset"], // ✅ match DB name
  starter: ["Starter"],
  pro: ["Pro", "Pro (Best Value)"],
}

export async function POST(request: NextRequest) {
  try {
    const { planId } = await request.json()
    console.log("[v0] Payment request received for planId:", planId)

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error("[v0] Razorpay env vars missing")
      return NextResponse.json({ error: "Payment configuration missing" }, { status: 500 })
    }

    if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
      console.error("[v0] Razorpay public key missing")
      return NextResponse.json({ error: "Payment configuration incomplete" }, { status: 500 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      console.log("[v0] User not authenticated")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] User authenticated:", user.id)

    // 🔎 Resolve plan
    let plan: any = null
    if (isUUID(planId)) {
      const { data, error } = await supabase.from("subscription_plans").select("*").eq("id", planId).single()
      if (data) plan = data
      if (error) console.log("[v0] UUID lookup error:", error)
    } else {
      // PlanId is a slug like "single_report"
      const names = SLUG_TO_NAME[planId] || []
      if (names.length) {
        const { data, error } = await supabase
          .from("subscription_plans")
          .select("*")
          .in("name", names)
          .order("price_inr", { ascending: true })
          .limit(1)

        if (data && data.length > 0) plan = data[0]
        if (error) console.log("[v0] Name lookup error:", error)
      }
    }

    console.log("[v0] Plan lookup result:", { planId, resolvedPlanId: plan?.id, name: plan?.name })

    if (!plan) {
      console.log("[v0] Plan not found for planId:", planId)
      return NextResponse.json({ error: "Plan not found" }, { status: 404 })
    }

    const priceInINR = Number.parseFloat(String(plan.price_inr))
    if (!Number.isFinite(priceInINR) || priceInINR <= 0) {
      console.log("[v0] Invalid plan amount:", priceInINR)
      return NextResponse.json({ error: "Invalid plan amount" }, { status: 400 })
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })

    const amountInPaise = Math.round(priceInINR * 100)
    const shortUserId = user.id.slice(0, 8)

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `order_${shortUserId}_${Date.now()}`, // ✅ always < 40 chars now
      notes: {
        planResolvedId: plan.id,
        planName: plan.name,
        userId: user.id,
      },
    })

    console.log("[v0] Razorpay order created successfully:", {
        id: order?.id,
        amount: order?.amount,
        status: order?.status,
      })

    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      planId: plan.id, // UUID always
      planName: plan.name,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    })
  } catch (error) {
    console.error("[v0] Error creating payment order:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
