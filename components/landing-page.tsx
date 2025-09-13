"use client"

import type React from "react"
import { useRef, useEffect, useState } from "react"
import Link from "next/link"
import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion"
import {
  ArrowRight,
  BarChart2,
  FileSpreadsheet,
  LineChart,
  Zap,
  Shield,
  Lock,
  Eye,
  Database,
  Star,
  CheckCircle,
  TrendingUp,
  PieChart,
  Activity,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Footer } from "@/components/footer"
import { Header } from "@/components/header"
import { PricingSection } from "@/components/pricing-section"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

export function LandingPage() {
  const ref = useRef(null)
  const heroRef = useRef(null)
  const floating3DRef = useRef(null)
  const featuresRef = useRef(null)
  const stepsRef = useRef(null)
  const ctaRef = useRef(null)

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const springConfig = { damping: 25, stiffness: 700 }
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [15, -15]), springConfig)
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-15, 15]), springConfig)

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  })

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  const handleMouseMove = (event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - rect.left - rect.width / 2) / rect.width
    const y = (event.clientY - rect.top - rect.height / 2) / rect.height
    mouseX.set(x)
    mouseY.set(y)

    if (heroRef.current) {
      gsap.to(heroRef.current, {
        rotationY: x * 10,
        rotationX: -y * 10,
        transformPerspective: 1000,
        duration: 1,
        ease: "power2.out",
      })
    }
  }

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(".floating-3d", {
        transformStyle: "preserve-3d",
        transformPerspective: 1000,
      })

      gsap.to(".floating-orb-1", {
        rotationY: 360,
        rotationX: 180,
        z: 100,
        duration: 20,
        repeat: -1,
        ease: "none",
      })

      gsap.to(".floating-orb-2", {
        rotationX: 360,
        rotationZ: 180,
        z: -50,
        duration: 25,
        repeat: -1,
        ease: "none",
      })

      gsap.to(".geometric-shape", {
        rotationY: 360,
        rotationX: 360,
        z: 150,
        duration: 15,
        repeat: -1,
        ease: "none",
      })

      gsap.fromTo(
        ".feature-card",
        {
          rotationY: -90,
          z: -200,
          opacity: 0,
        },
        {
          rotationY: 0,
          z: 0,
          opacity: 1,
          duration: 1.2,
          stagger: 0.2,
          ease: "back.out(1.7)",
          scrollTrigger: {
            trigger: ".features-section",
            start: "top 80%",
            end: "bottom 20%",
            toggleActions: "play none none reverse",
          },
        },
      )

      gsap.fromTo(
        ".step-card",
        {
          rotationX: -90,
          z: -100,
          opacity: 0,
        },
        {
          rotationX: 0,
          z: 0,
          opacity: 1,
          duration: 1,
          stagger: 0.3,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".steps-section",
            start: "top 70%",
            end: "bottom 30%",
            toggleActions: "play none none reverse",
          },
        },
      )

      gsap.fromTo(
        ".cta-section",
        {
          rotationY: 180,
          z: -300,
          opacity: 0,
        },
        {
          rotationY: 0,
          z: 0,
          opacity: 1,
          duration: 1.5,
          ease: "power4.out",
          scrollTrigger: {
            trigger: ".cta-section",
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        },
      )

      gsap.set(".hover-3d", {
        transformStyle: "preserve-3d",
      })
    })

    return () => ctx.revert()
  }, [])

  const handle3DHover = (element: HTMLElement, enter: boolean) => {
    if (enter) {
      gsap.to(element, {
        rotationY: 5,
        rotationX: 5,
        z: 50,
        scale: 1.05,
        duration: 0.3,
        ease: "power2.out",
      })
    } else {
      gsap.to(element, {
        rotationY: 0,
        rotationX: 0,
        z: 0,
        scale: 1,
        duration: 0.3,
        ease: "power2.out",
      })
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 20,
      rotateX: -15,
      z: -100,
    },
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      z: 0,
      transition: {
        duration: 0.8,
        ease: [0.25, 0.25, 0, 1],
      },
    },
  }

  const features = [
    {
      icon: FileSpreadsheet,
      title: "Effortless Data Import",
      description:
        "Upload your Excel or CSV files with a simple drag and drop interface. Files are processed locally for maximum security.",
      gradient: "from-purple-500/20 to-pink-500/20",
      highlight: "Local Processing",
    },
    {
      icon: Zap,
      title: "Lightning Fast Analysis",
      description:
        "Get instant insights with our optimized analysis engine powered by AI. All processing happens in real-time.",
      gradient: "from-purple-500/20 to-blue-500/20",
      highlight: "Real-time Results",
    },
    {
      icon: LineChart,
      title: "Beautiful Visualizations",
      description:
        "Transform your data into stunning, interactive visualizations that tell compelling stories and reveal hidden patterns.",
      gradient: "from-purple-500/20 to-indigo-500/20",
      highlight: "Interactive Charts",
    },
    {
      icon: Shield,
      title: "100% Privacy Guaranteed",
      description:
        "Your data never leaves your device. We don't store, collect, or access your sensitive information - ever.",
      gradient: "from-purple-500/20 to-violet-500/20",
      highlight: "Zero Data Storage",
    },
  ]

  const getStartedLink = !loading ? (user ? "/app" : "/auth/sign-up") : "/auth/sign-up"

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
    <section
      ref={ref}
      className="relative overflow-hidden pb-20 pt-24 md:pb-32 md:pt-36"
      style={{ perspective: "1000px" }}
      onMouseMove={handleMouseMove}
    >
      {/* Background with diagonal cut */}
      <div className="absolute inset-0 -z-20">
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-primary/10 to-transparent clip-diagonal" />
      </div>

      {/* Grid powering up background */}
<div className="absolute inset-0 -z-10">
  <div className="grid-bg absolute inset-0" />
  <div className="grid-glow absolute inset-0" />
</div>


      {/* Hero Content */}
      <div className="container px-4 md:px-6">
        <motion.div
          ref={heroRef}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center justify-center space-y-8 text-center hover-3d"
          style={{ transformStyle: "preserve-3d" }}
        >
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-6 py-2 text-sm font-medium text-emerald-600 ring-1 ring-emerald-500/20 hover-3d border border-emerald-500/20"
            onMouseEnter={(e) => handle3DHover(e.currentTarget, true)}
            onMouseLeave={(e) => handle3DHover(e.currentTarget, false)}
          >
            <Shield className="h-4 w-4" />
            100% Private & Secure
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl hover-3d"
            style={{ transformStyle: "preserve-3d" }}
          >
            Analyze Your Data{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Without Compromise
            </span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="max-w-[700px] text-lg text-muted-foreground md:text-xl hover-3d"
            style={{
              transformStyle: "preserve-3d",
              z: 50,
            }}
          >
            Your data stays 100% private on your device. Upload Excel and CSV files for instant AI-powered analysis
            with beautiful visualizations - no data storage, no privacy concerns, no compromises.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col gap-4 sm:flex-row hover-3d"
            style={{ transformStyle: "preserve-3d" }}
          >
            <motion.div
              whileHover={{
                scale: 1.05,
                rotateX: -5,
                rotateY: 5,
                z: 30,
              }}
              whileTap={{
                scale: 0.95,
                rotateX: 5,
                rotateY: -5,
              }}
              style={{ transformStyle: "preserve-3d" }}
            >
              <Button
                asChild
                size="lg"
                className="group rounded-full px-8 py-6 text-base shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Link href={getStartedLink}>
                  {user ? "Go to Dashboard" : "Start Analyzing"}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </motion.div>

            <motion.div
              whileHover={{
                scale: 1.05,
                rotateX: 5,
                rotateY: -5,
                z: 30,
              }}
              whileTap={{
                scale: 0.95,
                rotateX: -5,
                rotateY: 5,
              }}
              style={{ transformStyle: "preserve-3d" }}
            >
              <Button
                variant="outline"
                size="lg"
                className="rounded-full px-8 py-6 text-base glass-effect hover:bg-primary/5 transition-all duration-300 bg-transparent"
              >
                <Link href="#pricing">View Pricing</Link>
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>


        {/* Trusted By Section */}
        <section className="py-12 bg-gradient-to-r from-purple-50/50 to-indigo-50/50 dark:from-purple-950/20 dark:to-indigo-950/20 border-y border-purple-200/20">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-8">
              <p className="text-sm font-medium text-muted-foreground mb-6">Trusted by teams at</p>
              <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
                <div className="text-2xl font-bold text-purple-600">TechCorp</div>
                <div className="text-2xl font-bold text-purple-600">DataFlow</div>
                <div className="text-2xl font-bold text-purple-600">AnalyticsPro</div>
                <div className="text-2xl font-bold text-purple-600">InsightLab</div>
                <div className="text-2xl font-bold text-purple-600">MetricHub</div>
              </div>
            </div>
          </div>
        </section>

        {/* Privacy Trust Section */}
        <section className="py-16 bg-gradient-to-r from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20 border-y border-emerald-200/20">
          <div className="container px-4 md:px-6">
            <div className="grid gap-8 md:grid-cols-3 items-center">
              <div className="text-center group">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Lock className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Zero Data Storage</h3>
                <p className="text-sm text-muted-foreground">
                  Your files are processed locally and never uploaded to our servers
                </p>
              </div>
              <div className="text-center group">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Eye className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Complete Privacy</h3>
                <p className="text-sm text-muted-foreground">
                  We can't see your data because it never leaves your device
                </p>
              </div>
              <div className="text-center group">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Database className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Your Data, Your Control</h3>
                <p className="text-sm text-muted-foreground">
                  Full control over your sensitive information at all times
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Results Process Section */}
        <section className="py-24 bg-gradient-to-b from-purple-50/30 to-background dark:from-purple-950/10">
          <div className="container px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="mb-16 text-center"
            >
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4">
                Results in seconds, not hours
              </h2>
              <p className="mx-auto max-w-[700px] text-lg text-muted-foreground">
                Ask for what you want and AnalyzeX analyzes the data for you
              </p>
            </motion.div>

            <div className="grid gap-8 md:grid-cols-3 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="text-center md:text-left"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-4">
                  <span className="text-lg font-bold text-purple-600">1</span>
                </div>
                <h3 className="text-xl font-bold mb-2">Connect all your data sources</h3>
                <p className="text-muted-foreground">
                  Connect with data sources like databases, spreadsheets, and more
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-4">
                  <span className="text-lg font-bold text-purple-600">2</span>
                </div>
                <h3 className="text-xl font-bold mb-2">Ask for analysis</h3>
                <p className="text-muted-foreground">You provide the questions, AnalyzeX handles the analysis</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true }}
                className="text-center md:text-right"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-4">
                  <span className="text-lg font-bold text-purple-600">3</span>
                </div>
                <h3 className="text-xl font-bold mb-2">Get results, instantly</h3>
                <p className="text-muted-foreground">
                  Choose from charts, tables or full reports tailored to your data
                </p>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              viewport={{ once: true }}
              className="mt-12 flex justify-center"
            >
              <Button asChild size="lg" className="rounded-full px-8 py-6">
                <Link href={getStartedLink}>Get started for free</Link>
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section
          className="features-section py-24 bg-gradient-to-b from-muted/30 to-background"
          style={{ perspective: "1200px" }}
        >
          <div className="container px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="mb-16 text-center hover-3d"
            >
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4 hover-3d">
                Privacy-First Data Analysis
              </h2>
              <p className="mx-auto max-w-[700px] text-lg text-muted-foreground hover-3d">
                Advanced analytics capabilities with uncompromising privacy protection built into every feature.
              </p>
            </motion.div>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, i) => (
                <div
                  key={i}
                  className={`feature-card group relative overflow-hidden rounded-3xl bg-gradient-to-br ${feature.gradient} p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-border/50 hover-3d backdrop-blur-sm`}
                  onMouseEnter={(e) => handle3DHover(e.currentTarget, true)}
                  onMouseLeave={(e) => handle3DHover(e.currentTarget, false)}
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <div className="absolute top-4 right-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-primary border border-white/30 backdrop-blur-sm">
                      {feature.highlight}
                    </span>
                  </div>

                  <div className="relative z-10">
                    <motion.div
                      className="mb-6 inline-flex rounded-2xl bg-white/90 dark:bg-gray-900/90 p-4 shadow-lg hover-3d backdrop-blur-sm border border-white/20"
                      whileHover={{
                        rotateY: 180,
                        scale: 1.1,
                        transition: { duration: 0.6 },
                      }}
                      style={{ transformStyle: "preserve-3d" }}
                    >
                      <feature.icon className="h-7 w-7 text-primary" />
                    </motion.div>
                    <h3 className="mb-4 text-xl font-bold hover-3d text-foreground">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed hover-3d text-sm">{feature.description}</p>
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Use Cases Section */}
        <section className="py-24 bg-gradient-to-b from-purple-50/30 to-background dark:from-purple-950/10">
          <div className="container px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="mb-16 text-center"
            >
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4">
                An AnalyzeX for every job
              </h2>
            </motion.div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: "Finance Analyst",
                  description: "Balance sheet creation for a SaaS company",
                  icon: TrendingUp,
                  gradient: "from-purple-500/20 to-blue-500/20",
                },
                {
                  title: "Marketing",
                  description: "Acquisition channel efficiency analysis",
                  icon: BarChart2,
                  gradient: "from-purple-500/20 to-pink-500/20",
                },
                {
                  title: "Operations",
                  description: "Forecasting and inventory optimization",
                  icon: Activity,
                  gradient: "from-purple-500/20 to-indigo-500/20",
                },
                {
                  title: "Business Owners",
                  description: "Cash flow forecasting and budgeting",
                  icon: PieChart,
                  gradient: "from-purple-500/20 to-violet-500/20",
                },
                {
                  title: "Data Science",
                  description: "Data cleaning and preparation",
                  icon: Database,
                  gradient: "from-purple-500/20 to-cyan-500/20",
                },
                {
                  title: "Scientific Research",
                  description: "Correlation matrix on research datasets",
                  icon: LineChart,
                  gradient: "from-purple-500/20 to-emerald-500/20",
                },
              ].map((useCase, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${useCase.gradient} p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-purple-200/20 hover:border-purple-300/30`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/90 dark:bg-gray-900/90 shadow-lg">
                        <useCase.icon className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-2">{useCase.title}</h3>
                      <p className="text-muted-foreground text-sm mb-4">{useCase.description}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-purple-600 hover:text-purple-700 p-0 h-auto font-medium"
                      >
                        Try it out →
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-24">
          <div className="container px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="mb-16 text-center"
            >
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4">
                Loved by a community of 50,000+ users
              </h2>
            </motion.div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  text: "AnalyzeX is my data scientist assistant who is much more competent at analysis than I am. I can focus on understanding and interpreting the data.",
                  author: "Sarah M.",
                  role: "Director, Policy Innovation Center",
                },
                {
                  text: "You can use AnalyzeX for virtually any type of business data. It's remarkably versatile and keeps everything private.",
                  author: "Jeremy C.",
                  role: "Business Analyst",
                },
                {
                  text: "AnalyzeX just saved me like 2 hours of writing formulas and generated a perfect summary. All while keeping my data secure.",
                  author: "Alex R.",
                  role: "Financial Analyst",
                },
              ].map((testimonial, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-purple-200/20"
                >
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4 italic">"{testimonial.text}"</p>
                  <div>
                    <p className="font-semibold">{testimonial.author}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Security Section */}
        <section className="py-24 bg-gradient-to-r from-purple-50/50 to-indigo-50/50 dark:from-purple-950/20 dark:to-indigo-950/20">
          <div className="container px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                AnalyzeX ensures your data remains safe and secure
              </h2>
              <p className="mx-auto max-w-[700px] text-lg text-muted-foreground">
                We're committed to the highest standards of data protection and privacy compliance.
              </p>
            </motion.div>

            <div className="grid gap-8 md:grid-cols-3 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-purple-100 dark:bg-purple-900/30 mb-4">
                  <Shield className="h-10 w-10 text-purple-600" />
                </div>
                <h3 className="font-bold text-lg mb-2">Local Processing</h3>
                <p className="text-sm text-muted-foreground">All data processing happens on your device</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-purple-100 dark:bg-purple-900/30 mb-4">
                  <Lock className="h-10 w-10 text-purple-600" />
                </div>
                <h3 className="font-bold text-lg mb-2">Zero Data Storage</h3>
                <p className="text-sm text-muted-foreground">We never store or access your sensitive data</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-purple-100 dark:bg-purple-900/30 mb-4">
                  <CheckCircle className="h-10 w-10 text-purple-600" />
                </div>
                <h3 className="font-bold text-lg mb-2">Privacy First</h3>
                <p className="text-sm text-muted-foreground">Built with privacy as the core principle</p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="steps-section py-24" style={{ perspective: "1200px" }}>
          <div className="container px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="mb-16 text-center hover-3d"
            >
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4 hover-3d">
                Secure Three-Step Process
              </h2>
              <p className="mx-auto max-w-[700px] text-lg text-muted-foreground hover-3d">
                From private upload to insights in minutes - your data never leaves your device.
              </p>
            </motion.div>

            <div className="grid gap-8 md:grid-cols-3">
              {[
                {
                  step: "01",
                  title: "Secure Upload",
                  description:
                    "Drag and drop your files into our privacy-first platform. All processing happens locally on your device.",
                  icon: FileSpreadsheet,
                },
                {
                  step: "02",
                  title: "Private AI Analysis",
                  description:
                    "Our advanced AI engine analyzes your data instantly without any data leaving your device.",
                  icon: Zap,
                },
                {
                  step: "03",
                  title: "Explore Insights",
                  description:
                    "Visualize trends, patterns, and predictions with interactive dashboards - all completely private.",
                  icon: BarChart2,
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="step-card relative group hover-3d"
                  onMouseEnter={(e) => handle3DHover(e.currentTarget, true)}
                  onMouseLeave={(e) => handle3DHover(e.currentTarget, false)}
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <div className="relative overflow-hidden rounded-3xl bg-card/80 backdrop-blur-sm p-8 shadow-xl hover:shadow-2xl transition-all duration-500 border border-border/50 group-hover:border-primary/20">
                    <motion.div
                      className="absolute top-4 right-4 text-6xl font-bold text-primary/10 group-hover:text-primary/20 transition-colors duration-300 hover-3d"
                      animate={{
                        rotateZ: [0, 5, -5, 0],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                      }}
                    >
                      {item.step}
                    </motion.div>
                    <div className="relative z-10">
                      <motion.div
                        className="mb-6 inline-flex rounded-2xl bg-primary/10 p-4 hover-3d border border-primary/20 shadow-lg"
                        whileHover={{
                          rotateX: 360,
                          scale: 1.1,
                          transition: { duration: 0.8 },
                        }}
                        style={{ transformStyle: "preserve-3d" }}
                      >
                        <item.icon className="h-7 w-7 text-primary" />
                      </motion.div>
                      <h3 className="mb-4 text-xl font-bold hover-3d">{item.title}</h3>
                      <p className="text-muted-foreground leading-relaxed hover-3d">{item.description}</p>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>
                  {i < 2 && (
                    <motion.div
                      className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-primary/50 to-transparent hover-3d"
                      animate={{
                        scaleX: [1, 1.2, 1],
                        opacity: [0.5, 1, 0.5],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                      }}
                    />
                  )}
                </div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="mt-16 flex justify-center hover-3d"
            >
              <motion.div
                whileHover={{
                  scale: 1.05,
                  rotateX: -5,
                  z: 20,
                }}
                whileTap={{
                  scale: 0.95,
                  rotateX: 5,
                }}
                style={{ transformStyle: "preserve-3d" }}
              >
                <Button
                  asChild
                  size="lg"
                  className="group rounded-full px-8 py-6 text-base shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Link href={getStartedLink}>
                    {user ? "Go to Dashboard" : "Start Your Analysis"}
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Pricing Section */}
        <div id="pricing" className="bg-gradient-to-b from-muted/30 to-background">
          <PricingSection />
        </div>

        {/* CTA Section */}
        <section className="py-24" style={{ perspective: "1000px" }}>
          <div className="container px-4 md:px-6">
            <div
              className="cta-section relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 p-12 text-center shadow-2xl hover-3d backdrop-blur-sm border border-primary/20"
              onMouseEnter={(e) => handle3DHover(e.currentTarget, true)}
              onMouseLeave={(e) => handle3DHover(e.currentTarget, false)}
              style={{ transformStyle: "preserve-3d" }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5" />
              <div className="relative z-10">
                <h2 className="mb-6 text-3xl font-bold tracking-tight sm:text-4xl hover-3d">
                  Ready for Private Data Analysis?
                </h2>
                <p className="mx-auto mb-8 max-w-[600px] text-lg text-muted-foreground hover-3d">
                  Join thousands of professionals who trust AnalyzeX to unlock insights while keeping their data
                  completely private and secure.
                </p>
                <motion.div
                  whileHover={{
                    scale: 1.05,
                    rotateX: -5,
                    z: 30,
                  }}
                  whileTap={{
                    scale: 0.95,
                    rotateX: 5,
                  }}
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <Button
                    asChild
                    size="lg"
                    className="group rounded-full px-8 py-6 text-base shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Link href={getStartedLink}>
                      {user ? "Go to Dashboard" : "Get Started for Free"}
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
