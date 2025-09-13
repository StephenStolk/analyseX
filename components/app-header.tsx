"use client"

import { useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, HelpCircle, Menu, User, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function AppHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <header className="sticky w-full top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
              AX
            </div>
            <span className="text-lg font-semibold">AnalyzeX</span>
          </Link>

          
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="hidden md:flex">
            <HelpCircle className="h-5 w-5" />
            <span className="sr-only">Help</span>
          </Button>

          <ModeToggle />

          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMobileMenuOpen(true)}>
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background md:hidden"
          >
            <div className="container flex h-16 items-center justify-between px-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  AX
                </div>
                <span className="text-lg font-semibold">AnalyzeX</span>
              </Link>
              <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                <X className="h-5 w-5" />
                <span className="sr-only">Close menu</span>
              </Button>
            </div>
            <nav className="container mt-8 flex flex-col gap-4 px-4">
              <Link href="/app" className="py-2 text-lg font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                Dashboard
              </Link>
              <Link href="/app/upload" className="py-2 text-lg font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                Upload
              </Link>
              <Link
                href="/app/analysis"
                className="py-2 text-lg font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Analysis
              </Link>
              <Link href="/app/history" className="py-2 text-lg font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                History
              </Link>
              <Link
                href="/app/templates"
                className="py-2 text-lg font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Templates
              </Link>
              <Link
                href="/app/settings"
                className="py-2 text-lg font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Settings
              </Link>
              <Link href="/app/profile" className="py-2 text-lg font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                Profile
              </Link>
              <Link href="/logout" className="py-2 text-lg font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                Logout
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
