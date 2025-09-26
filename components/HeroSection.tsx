"use client";
import { motion } from "framer-motion";
import { Shield, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GridBackground } from "./GridBackground";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden pb-20 pt-28 md:pb-32 md:pt-30">
      {/* Animated Grid Background with Power Beams */}
      <div className="absolute inset-0 -z-20">
        <GridBackground
          gridSize="16:12"
          colors={{
            background: "bg-background",
            borderColor: "border-primary/8",
          }}
          beams={{ count: 12, speed: 4 }}
        />
      </div>

      {/* Subtle Background Gradient */}
      <div className="absolute inset-0 -z-30">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-transparent to-accent/3" />
      </div>

      <div className="container relative px-4 md:px-6">
        <div className="mx-auto max-w-4xl text-center">
          {/* Security Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8 inline-flex items-center gap-2 rounded-full bg-card/50 px-4 py-2 backdrop-blur-sm border border-border/50"
          >
            <Shield className="h-5 w-5 text-black dark:text-white" />
            <span className="text-sm font-sans text-foreground dark:text-white">
              Secure & Private
            </span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="mb-6 text-4xl sm:text-5xl md:text-6xl font-serif font-normal leading-tight tracking-tight text-foreground dark:text-white"
          >
            Professional Data Analysis
            <br />
            <span className="bg-gradient-to-r from-black via-gray-700 to-black dark:from-white dark:via-gray-300 dark:to-white bg-clip-text text-transparent font-serif font-semibold">
              Made Simple
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="mb-10 mx-auto max-w-2xl text-lg font-sans leading-relaxed text-muted-foreground dark:text-gray-300"
          >
            Transform your Excel and CSV files into powerful insights with AI-driven analysis.
            Your data never leaves your device.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="flex flex-col gap-4 sm:flex-row sm:justify-center"
          >
            <Button
              size="lg"
              className="rounded-full px-8 py-6 text-base font-sans font-semibold bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
            >
              Start Analyzing
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="rounded-full px-8 py-6 text-base font-sans font-semibold text-foreground border-foreground hover:bg-black hover:text-white dark:text-white dark:border-white dark:hover:bg-white dark:hover:text-black"
            >
              View Demo
            </Button>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="mt-12 flex items-center justify-center gap-8 text-sm font-sans text-muted-foreground dark:text-gray-300"
          >
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
              <span>No data storage</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
              <span>GDPR compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
              <span>Enterprise ready</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
