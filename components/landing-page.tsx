"use client"

import type React from "react"
import { useRef, useEffect, useState } from "react"
import Link from "next/link"
import { motion, useScroll, useTransform, useMotionValue, useSpring,AnimatePresence } from "framer-motion"

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
  Users,
  Cloud,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Footer } from "@/components/footer"
import { Header } from "@/components/header"
import { PricingSection } from "@/components/pricing-section"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import BentoPrivacy from "./bento-privacy"
import HeroSection from "./HeroSection"

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
      rotateX: -5,
      z: -50,
    },
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      z: 0,
      transition: {
        duration: 0.8,
        ease: "easeInOut", // use a valid string easing
      },
    },
  }

  const useCases = [
  {
    title: "Finance Analyst",
    description: "Balance sheet creation for a SaaS company",
    icon: TrendingUp,
    gradient: "from-purple-400/10 to-pink-400/10",
  },
  {
    title: "Marketing",
    description: "Acquisition channel efficiency analysis",
    icon: BarChart2,
    gradient: "from-blue-400/10 to-purple-400/10",
  },
  {
    title: "Operations",
    description: "Forecasting and inventory optimization",
    icon: Activity,
    gradient: "from-green-400/10 to-blue-400/10",
  },
  {
    title: "Business Owners",
    description: "Cash flow forecasting and budgeting",
    icon: PieChart,
    gradient: "from-yellow-400/10 to-orange-400/10",
  },
  {
    title: "Data Science",
    description: "Data cleaning and preparation",
    icon: Database,
    gradient: "from-teal-400/10 to-blue-400/10",
  },
  {
    title: "Scientific Research",
    description: "Correlation matrix on research datasets",
    icon: LineChart,
    gradient: "from-indigo-400/10 to-purple-400/10",
  },
];

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

  const features1 = [
  { title: "End-to-End Encryption", description: "Your data is always secured with AES-256 encryption.", icon: Lock },
  { title: "Data Sovereignty", description: "Full control over where your data is stored & processed.", icon: Database },
  { title: "Privacy Compliance", description: "Built to meet GDPR, HIPAA, and SOC2 standards.", icon: Shield },
  { title: "Advanced Analytics", description: "Powerful insights without exposing raw data.", icon: BarChart2 },
  { title: "Collaboration", description: "Secure sharing with role-based permissions.", icon: Users },
  { title: "Cloud Flexibility", description: "Deploy on-premise, private cloud, or hybrid.", icon: Cloud },
];

  const getStartedLink = !loading ? (user ? "/app" : "/auth/sign-up") : "/auth/sign-up"

  const [active, setActive] = useState(0);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
   <section
  ref={ref}
  className="relative overflow-hidden pb-16 md:pb-28"
  style={{ perspective: "1000px" }}
  onMouseMove={handleMouseMove}
>
  <HeroSection />
</section>


{/* Features Section */}
<section className="relative py-28 bg-white dark:bg-background overflow-hidden">
  <div className="container relative px-6 md:px-12">
    {/* Heading */}
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      className="mb-20 text-center max-w-2xl mx-auto"
    >
      <h2 className="text-4xl md:text-5xl font-serif font-normal tracking-tight mb-6 text-foreground dark:text-white">
        Privacy-First Data Analysis
      </h2>
      <p className="text-lg font-sans text-muted-foreground dark:text-gray-300 leading-relaxed">
        Advanced analytics with <span className="font-semibold text-foreground dark:text-white">end-to-end privacy</span> baked into every feature.
      </p>
    </motion.div>

    {/* Layout */}
    <div className="relative flex flex-col lg:flex-row items-center justify-center gap-16">
      {/* Center Secure Data Core */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="relative z-10 w-56 h-56 rounded-3xl bg-black text-white shadow-2xl flex items-center justify-center font-serif font-semibold text-xl text-center px-6"
      >
        Secure Data Core
      </motion.div>

      {/* Features */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-10 max-w-2xl">
        {features.map((feature, i) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              viewport={{ once: true }}
              className="flex flex-col items-start gap-3 p-6 rounded-2xl border border-muted/20 
                         bg-white dark:bg-gray-800 shadow-md dark:shadow-lg 
                         hover:shadow-xl dark:hover:shadow-2xl transition-all duration-300"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-black text-white shadow-inner">
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold font-sans text-foreground dark:text-white">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground dark:text-gray-300 mt-1 font-sans">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  </div>
</section>



       <section
  className="relative py-28 bg-white dark:bg-background overflow-hidden"
>
  {/* Subtle background grid */}
  <div
    className="absolute inset-0 pointer-events-none"
    style={{
      backgroundImage:
        'linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)',
      backgroundSize: '40px 40px',
    }}
  ></div>

  <div className="container relative px-6 md:px-12">
    {/* Heading */}
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      viewport={{ once: true }}
      className="mb-20 text-center relative z-10"
    >
      <h2 className="mb-6 text-4xl sm:text-5xl md:text-6xl font-serif font-normal leading-tight tracking-tight">
        Results in seconds, not hours
      </h2>
      <p className="mx-auto max-w-[720px] text-lg font-sans text-muted-foreground leading-relaxed">
        Simply connect your data, ask your question, and get actionable insights instantly with{" "}
        <span className="font-semibold text-foreground">AnalyzeX</span>.
      </p>
    </motion.div>

    {/* Steps */}
    <div className="grid gap-10 md:grid-cols-3 relative z-10">
      {[{
        step: "1",
        title: "Connect all your data sources",
        desc: "Connect with databases, spreadsheets, and more seamlessly.",
      }, {
        step: "2",
        title: "Ask for analysis",
        desc: "You provide the questions, AnalyzeX does the heavy lifting.",
      }, {
        step: "3",
        title: "Get results, instantly",
        desc: "Choose charts, tables, or full reports tailored to your needs.",
      }].map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: i * 0.2, ease: "easeOut" }}
          viewport={{ once: true }}
          whileHover={{ y: -6, boxShadow: "0px 12px 24px rgba(0,0,0,0.1)" }}
          className="relative p-8 rounded-2xl bg-white dark:bg-card border border-muted/20 shadow-sm transition-all duration-300"
        >
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-black/5 dark:bg-white/10 text-black dark:text-white font-bold text-lg mb-5">
              {item.step}
            </div>
            <h3 className="text-lg font-semibold mb-2 font-sans">{item.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed font-sans">{item.desc}</p>
          </div>
        </motion.div>
      ))}
    </div>

    {/* CTA */}
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
      viewport={{ once: true }}
      className="mt-16 flex justify-center relative z-10"
    >
      <Button
        asChild
        size="lg"
        className="rounded-full px-10 py-6 bg-black text-white shadow-md hover:bg-neutral-800 hover:shadow-lg transition-all font-sans"
      >
        <Link href={getStartedLink}>Get started for free</Link>
      </Button>
    </motion.div>
  </div>
</section>


      


        {/* Use Cases Section */}
       <BentoPrivacy />


        {/* Testimonials Section */}
        {/* <section className="py-24">
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
        </section> */}

        {/* Security Section */}
        {/* <section className="py-24 bg-gradient-to-r from-purple-50/50 to-indigo-50/50 dark:from-purple-950/20 dark:to-indigo-950/20">
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
        </section> */}

        {/* How It Works Section */}
        <section
  className="steps-section relative py-24 overflow-hidden bg-white dark:bg-background"
  style={{ perspective: "1200px" }}
>
  {/* Moving Grid Background */}
  <div className="absolute inset-0 z-0 overflow-hidden">
    <div className="w-full h-full grid grid-cols-12 grid-rows-12 opacity-20 animate-gridMove">
      {Array.from({ length: 12 * 12 }).map((_, idx) => (
        <div
          key={idx}
          className="border border-gray-300 dark:border-gray-600"
          style={{
            width: "100%",
            height: "100%",
            boxShadow: "0 0 4px rgba(0,0,0,0.1)",
          }}
        />
      ))}
    </div>
  </div>

  <div className="container relative px-4 md:px-6 z-10">
    {/* Heading */}
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
      className="mb-16 text-center"
    >
      <h2 className="text-3xl font-serif sm:text-4xl md:text-5xl mb-4 text-foreground dark:text-white tracking-tight">
        Secure Three-Step Process
      </h2>
      <p className="mx-auto max-w-[700px] text-lg text-muted-foreground dark:text-gray-300 leading-relaxed font-sans">
        From private upload to insights in minutes — your data never leaves your device.
      </p>
    </motion.div>

    {/* Steps */}
    <div className="grid gap-8 md:grid-cols-3">
      {[{
        step: "01",
        title: "Secure Upload",
        description: "Drag and drop your files into our privacy-first platform. All processing happens locally on your device.",
        icon: FileSpreadsheet,
      }, {
        step: "02",
        title: "Private AI Analysis",
        description: "Our advanced AI engine analyzes your data instantly without any data leaving your device.",
        icon: Zap,
      }, {
        step: "03",
        title: "Explore Insights",
        description: "Visualize trends, patterns, and predictions with interactive dashboards — all completely private.",
        icon: BarChart2,
      }].map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: i * 0.15 }}
          viewport={{ once: true }}
          className="step-card relative group"
        >
          <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-gray-900/80 backdrop-blur-md p-8 shadow-xl dark:shadow-2xl border border-gray-300 dark:border-gray-700 hover:shadow-2xl transition-all duration-500">
            {/* Step Number */}
            <div className="absolute top-4 right-4 text-6xl font-bold text-black/20 dark:text-primary/30">
  {item.step}
</div>


            {/* Icon */}
            <motion.div
              className="mb-6 inline-flex rounded-2xl bg-black text-white p-4 border border-gray-700 shadow-lg"
              whileHover={{ rotateX: 360, scale: 1.1, transition: { duration: 0.8 } }}
              style={{ transformStyle: "preserve-3d" }}
            >
              <item.icon className="h-7 w-7" />
            </motion.div>

            {/* Title & Description */}
            <h3 className="mb-4 text-xl font-bold font-serif text-black dark:text-white">{item.title}</h3>
            <p className="text-muted-foreground dark:text-gray-300 leading-relaxed font-sans">{item.description}</p>

            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>

          {/* Connecting line between steps */}
          {i < 2 && (
            <motion.div
              className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-primary/50 to-transparent"
              animate={{ scaleX: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
        </motion.div>
      ))}
    </div>

    {/* CTA Button */}
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
      className="mt-16 flex justify-center"
    >
      <motion.div
        whileHover={{ scale: 1.05, rotateX: -5, z: 20 }}
        whileTap={{ scale: 0.95, rotateX: 5 }}
        style={{ transformStyle: "preserve-3d" }}
      >
        <Button
          asChild
          size="lg"
          className="group rounded-full px-8 py-6 text-base shadow-lg bg-black text-white hover:bg-white hover:text-black border border-black dark:border-white transition-all duration-300"
        >
          <Link href={getStartedLink}>
            {user ? "Go to Dashboard" : "Start Your Analysis"}
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </motion.div>
    </motion.div>
  </div>

  {/* Tailwind CSS animation for grid */}
  <style jsx>{`
    @keyframes gridMove {
      0% { transform: translateY(0); }
      50% { transform: translateY(-15%); }
      100% { transform: translateY(0); }
    }
    .animate-gridMove { animation: gridMove 25s linear infinite; }
  `}</style>
</section>


        {/* Pricing Section */}
        <div id="pricing" className="bg-gradient-to-b from-muted/30 to-background">
          <PricingSection />
        </div>

        {/* CTA Section */}
{/* CTA Section */}
<section className="py-24 bg-white dark:bg-background" style={{ perspective: "1000px" }}>
  <div className="container px-4 md:px-6">
    <div
      className="cta-section relative overflow-hidden rounded-3xl bg-black/80 dark:bg-white/10 p-12 text-center shadow-2xl hover:shadow-3xl hover-3d backdrop-blur-sm border border-black/20 dark:border-white/20 transition-colors duration-300"
      onMouseEnter={(e) => handle3DHover(e.currentTarget, true)}
      onMouseLeave={(e) => handle3DHover(e.currentTarget, false)}
      style={{ transformStyle: "preserve-3d" }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-black/5 to-white/5 opacity-20" />
      <div className="relative z-10">
        <h2 className="mb-6 text-3xl font-serif font-bold tracking-tight sm:text-4xl dark:text-white text-black hover-3d">
          Ready for Private Data Analysis?
        </h2>
        <p className="mx-auto mb-8 max-w-[600px] text-lg font-sans text-black dark:text-white/80 leading-relaxed hover-3d">
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
            className="group rounded-full px-8 py-6 text-base font-sans shadow-lg bg-black text-white hover:bg-white hover:text-black border border-black dark:border-white transition-all duration-300"
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
