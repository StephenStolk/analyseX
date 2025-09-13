"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Check, Star, ArrowRight, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"

interface PricingTier {
  id: string
  name: string
  description: string
  priceUSD: number
  priceINR: number
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  badgeVariant?: "default" | "secondary" | "destructive" | "outline"
  features: string[]
  limitations?: string[]
  cta: string
  ctaVariant?: "default" | "outline" | "secondary"
  popular?: boolean
}

const pricingTiers: PricingTier[] = [
  {
    id: "single_report",
    name: "Single Report",
    description: "Pay once for one report",
    priceUSD: 4.99,
    priceINR: 414,
    icon: Check,
    features: ["1 Data Analysis Report", "Basic Visualizations", "CSV/Excel Support"],
    cta: "Buy Single Report",
    ctaVariant: "outline",
  },
  {
    id: "starter",
    name: "Starter",
    description: "For light usage",
    priceUSD: 15,
    priceINR: 1245,
    icon: Check,
    popular: false,
    features: ["10 Reports per month", "Advanced Visualizations", "Priority Support"],
    cta: "Choose Starter",
    ctaVariant: "default",
  },
  {
    id: "pro",
    name: "Pro (Best Value)",
    description: "For regular analysis",
    priceUSD: 19,
    priceINR: 1577,
    icon: Check,
    popular: true,
    badge: "Best Value",
    features: ["30 Reports per month", "AI-Powered Insights", "Custom Charts", "Export Options"],
    cta: "Go Pro",
    ctaVariant: "default",
  },
]

const addOns = [
  {
    name: "One-time Forecast Report",
    priceUSD: 2.99,
    priceINR: 249,
    description: "Get a comprehensive forecast analysis for any dataset",
  },
  {
    name: "Data Cleaning Module",
    priceUSD: null,
    priceINR: null,
    description: "Advanced data cleaning and preprocessing tools",
    comingSoon: true,
  },
]

const faqs = [
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes, you can cancel your subscription at any time. Your access will continue until the end of your current billing period, and you won't be charged for the next cycle.",
  },
  {
    question: "Do you use my data for training or other purposes?",
    answer:
      "No, we never use your data for training our models or any other purposes. Your data is processed locally when possible, and when cloud processing is needed, it's immediately deleted after analysis. We are fully GDPR compliant.",
  },
  {
    question: "What file formats do you support?",
    answer:
      "We support CSV, Excel (.xlsx, .xls), and JSON files. We're continuously adding support for more formats based on user feedback.",
  },
  {
    question: "Is there a limit on file size?",
    answer:
      "Free plan supports files up to 10MB. Pro plan supports up to 100MB, and Power plan supports up to 1GB. For larger files, please contact our support team.",
  },
  {
    question: "Do you offer educational discounts?",
    answer:
      "Yes! Students and educational institutions can get up to 50% off on Pro and Power plans. Contact us with your educational email for verification.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit cards, PayPal, and UPI for Indian customers. All payments are processed securely through Razorpay.",
  },
]

export function PricingSection() {
  const [isYearly, setIsYearly] = useState(false)
  const [currency, setCurrency] = useState<"USD" | "INR">("USD")

  const formatPrice = (usd: number, inr: number) => {
    if (usd === 0) return "Free"
    const price = currency === "USD" ? usd : inr
    const symbol = currency === "USD" ? "$" : "₹"
    const yearlyPrice = isYearly ? price * 10 : price // 2 months free on yearly
    return `${symbol}${yearlyPrice.toFixed(2)}`
  }

  const getSavings = (usd: number, inr: number) => {
    if (usd === 0 || !isYearly) return null
    const monthlyTotal = currency === "USD" ? usd * 12 : inr * 12
    const yearlyPrice = currency === "USD" ? usd * 10 : inr * 10
    const savings = monthlyTotal - yearlyPrice
    const symbol = currency === "USD" ? "$" : "₹"
    return `Save ${symbol}${savings.toFixed(2)}`
  }

  return (
    <section className="py-20 bg-gradient-to-b from-background to-muted/20">
      <div className="container px-4 md:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">Power Your Data Decisions</p>

          {/* Currency and Billing Toggle */}
          <div className="flex items-center justify-center gap-6 mb-8">
            <div className="flex items-center gap-2">
              <Button
                variant={currency === "USD" ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrency("USD")}
                className="rounded-full"
              >
                USD ($)
              </Button>
              <Button
                variant={currency === "INR" ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrency("INR")}
                className="rounded-full"
              >
                INR (₹)
              </Button>
            </div>

            <Separator orientation="vertical" className="h-6" />

            <div className="flex items-center gap-3">
              <span className={`text-sm ${!isYearly ? "font-medium" : "text-muted-foreground"}`}>Monthly</span>
              <Switch checked={isYearly} onCheckedChange={setIsYearly} className="data-[state=checked]:bg-primary" />
              <span className={`text-sm ${isYearly ? "font-medium" : "text-muted-foreground"}`}>
                Yearly
                <Badge variant="secondary" className="ml-2 text-xs">
                  2 months free
                </Badge>
              </span>
            </div>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid gap-8 lg:grid-cols-3 mb-16">
          {pricingTiers.map((tier, index) => (
            <motion.div
              key={tier.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`relative ${tier.popular ? "lg:scale-105" : ""}`}
            >
              <Card
                className={`h-full rounded-3xl border-2 transition-all hover:shadow-lg ${
                  tier.popular ? "border-primary shadow-lg" : "border-border"
                }`}
              >
                {tier.badge && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge variant={tier.badgeVariant} className="px-4 py-1">
                      <Star className="w-3 h-3 mr-1" />
                      {tier.badge}
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    <div
                      className={`p-3 rounded-full ${tier.popular ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                    >
                      <tier.icon className="w-6 h-6" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl">{tier.name}</CardTitle>
                  <CardDescription className="text-base">{tier.description}</CardDescription>

                  <div className="mt-4">
                    <div className="text-4xl font-bold">
                      {formatPrice(tier.priceUSD, tier.priceINR)}
                      {tier.priceUSD > 0 && (
                        <span className="text-lg font-normal text-muted-foreground">
                          /{isYearly ? "year" : "month"}
                        </span>
                      )}
                    </div>
                    {getSavings(tier.priceUSD, tier.priceINR) && (
                      <div className="text-sm text-green-600 font-medium mt-1">
                        {getSavings(tier.priceUSD, tier.priceINR)}
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="flex-1">
                  <ul className="space-y-3">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button className="w-full rounded-full" variant={tier.ctaVariant} size="lg" asChild>
                    <Link
                      href={`/checkout?plan=${tier.id}&billing=${isYearly ? "yearly" : "monthly"}&currency=${currency}`}
                    >
                      {tier.cta}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Add-ons Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h3 className="text-2xl font-bold text-center mb-8">Add-ons & Extensions</h3>
          <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
            {addOns.map((addon, index) => (
              <Card key={index} className="rounded-3xl">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{addon.name}</span>
                    {addon.comingSoon ? (
                      <Badge variant="outline">Coming Soon</Badge>
                    ) : (
                      <span className="text-lg font-bold">
                        {currency === "USD" ? `$${addon.priceUSD}` : `₹${addon.priceINR}`}
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>{addon.description}</CardDescription>
                </CardHeader>
                <CardFooter>
                  {addon.comingSoon ? (
                    <Button variant="outline" className="w-full rounded-full bg-transparent" disabled>
                      Join Waitlist
                    </Button>
                  ) : (
                    <Button variant="outline" className="w-full rounded-full bg-transparent" asChild>
                      <Link href={`/checkout?addon=${addon.name.toLowerCase().replace(/\s+/g, "-")}`}>
                        Purchase Add-on
                      </Link>
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h3 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h3>
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left hover:no-underline">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-primary" />
                      {faq.question}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </motion.div>

        {/* Contact Support CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <Card className="max-w-2xl mx-auto rounded-3xl bg-gradient-to-r from-primary/10 to-primary/5">
            <CardContent className="p-8">
              <h3 className="text-xl font-bold mb-2">Need a Custom Solution?</h3>
              <p className="text-muted-foreground mb-6">
                Enterprise customers with specific requirements can contact our team for custom pricing and features.
              </p>
              <div className="flex gap-4 justify-center">
                <Button asChild className="rounded-full">
                  <Link href="/contact">Contact Sales</Link>
                </Button>
                <Button variant="outline" asChild className="rounded-full bg-transparent">
                  <Link href="/demo">Book a Demo</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Legal Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center text-sm text-muted-foreground"
        >
          <p className="mb-2">
            All prices are exclusive of applicable taxes. By subscribing, you agree to our{" "}
            <Link href="/terms" className="underline hover:text-foreground">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline hover:text-foreground">
              Privacy Policy
            </Link>
            .
          </p>
          <p>We are GDPR compliant and your data is processed securely. Payments processed by Stripe.</p>
        </motion.div>
      </div>
    </section>
  )
}
