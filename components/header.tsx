"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { BarChart3, BookOpen, LogOut, User, Menu, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { motion, AnimatePresence } from "framer-motion"

export function Header() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    getUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const navItems = [
    { href: "/features", label: "Features" },
    { href: "/pricing", label: "Pricing" },
    { href: "/blog", label: "Blog", icon: BookOpen },
    { href: "/about", label: "About" },
  ]

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.25, 0.25, 0, 1] }}
      className="sticky top-0 z-50 w-full border-b border-gray-300/40 bg-white dark:bg-black shadow-sm"
    >
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link className="flex items-center gap-2" href="/">
          <motion.div
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
            className="rounded-lg bg-black/10 dark:bg-white/10 p-1.5"
          >
            <BarChart3 className="h-5 w-5 text-black dark:text-white" />
          </motion.div>
          <span className="font-sans font-semibold text-lg text-black dark:text-white">
            AnalyzeX
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <nav className="flex items-center gap-6 text-md font-sans font-medium">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="relative text-black dark:text-white hover:text-gray-500 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  {item.icon && <item.icon className="h-4 w-4" />}
                  {item.label}
                </span>
                <motion.div
                  className="absolute -bottom-1 left-0 h-0.5 bg-black dark:bg-white"
                  initial={{ width: 0 }}
                  whileHover={{ width: "100%" }}
                  transition={{ duration: 0.2 }}
                />
              </Link>
            ))}
          </nav>
        </div>

        {/* User Actions */}
        <div className="flex items-center gap-4">
          {!loading && (
            <>
              {user ? (
                <div className="flex items-center gap-3">
                  <Button asChild variant="ghost" className="hidden sm:flex text-black dark:text-white hover:text-black hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors text-md">
                    <Link href="/app">Dashboard</Link>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="flex items-center gap-2 text-black dark:text-white hover:bg-gray-100 hover:text-black dark:hover:bg-gray-900 transition-colors">
                        <div className="rounded-full bg-black/10 dark:bg-white/10 p-1">
                          <User className="h-3 w-3 text-black dark:text-white text-md" />
                        </div>
                        <span className="hidden sm:inline max-w-32 truncate">{user.email}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-black border border-gray-300 dark:border-gray-700">
                      <DropdownMenuItem asChild className="sm:hidden text-black dark:text-white">
                        <Link href="/app">Dashboard</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Button asChild variant="ghost" size="sm" className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors">
                    <Link href="/auth/login">Sign In</Link>
                  </Button>
                  <Button asChild size="sm" className="rounded-full bg-black text-white hover:bg-white hover:text-black border border-black dark:bg-white dark:text-black dark:border-white dark:hover:bg-black dark:hover:text-white transition-all duration-300">
                    <Link href="/auth/sign-up">Get Started</Link>
                  </Button>
                </div>
              )}
            </>
          )}
          {/* <div className="hidden md:flex">
            <ModeToggle  />
          </div> */}

          {/* Mobile Menu Toggle */}
          <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-5 w-5 text-black dark:text-white" /> : <Menu className="h-5 w-5 text-black dark:text-white" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden border-t border-gray-300/40 bg-white dark:bg-black"
          >
            <div className="container py-4 space-y-3">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block py-2 text-sm font-sans font-medium text-black dark:text-white hover:text-gray-500 dark:hover:text-gray-400 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="flex items-center gap-2">
                    {item.icon && <item.icon className="h-4 w-4" />}
                    {item.label}
                  </span>
                </Link>
              ))}
              <div className="pt-2 border-t border-gray-300/40">
                <ModeToggle />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
