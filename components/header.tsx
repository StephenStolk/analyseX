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
    // Get initial user
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getUser()

    // Listen for auth changes
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
      className="sticky top-0 z-50 w-full border-b border-border/40 glass-effect"
    >
      <div className="container flex h-16 items-center">
        <div className="mr-4 hidden md:flex">
          <Link className="mr-8 flex items-center space-x-2 group" href="/">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
              className="rounded-lg bg-primary/10 p-1.5"
            >
              <BarChart3 className="h-5 w-5 text-primary" />
            </motion.div>
            <span className="hidden font-bold text-lg sm:inline-block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              AnalyzeX
            </span>
          </Link>
          <nav className="flex items-center space-x-8 text-sm font-medium">
            {navItems.map((item) => (
              <Link
                key={item.href}
                className="relative transition-colors hover:text-primary text-muted-foreground group"
                href={item.href}
              >
                <span className="flex items-center gap-1.5">
                  {item.icon && <item.icon className="h-4 w-4" />}
                  {item.label}
                </span>
                <motion.div
                  className="absolute -bottom-1 left-0 h-0.5 bg-primary"
                  initial={{ width: 0 }}
                  whileHover={{ width: "100%" }}
                  transition={{ duration: 0.2 }}
                />
              </Link>
            ))}
          </nav>
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden">
          <Link className="mr-4 flex items-center space-x-2" href="/">
            <div className="rounded-lg bg-primary/10 p-1.5">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              AnalyzeX
            </span>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-4">
          {!loading && (
            <>
              {user ? (
                <div className="flex items-center gap-3">
                  <Button asChild variant="ghost" className="hidden sm:flex hover:bg-primary/10 transition-colors">
                    <Link href="/app">Dashboard</Link>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-2 hover:bg-primary/10 transition-colors"
                      >
                        <div className="rounded-full bg-primary/10 p-1">
                          <User className="h-3 w-3 text-primary" />
                        </div>
                        <span className="hidden sm:inline max-w-32 truncate">{user.email}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem asChild className="sm:hidden">
                        <Link href="/app">Dashboard</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600">
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Button asChild variant="ghost" size="sm" className="hover:bg-primary/10 transition-colors">
                    <Link href="/auth/login">Sign In</Link>
                  </Button>
                  <Button
                    asChild
                    size="sm"
                    className="rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Link href="/auth/sign-up">Get Started</Link>
                  </Button>
                </div>
              )}
            </>
          )}

          <div className="hidden md:flex">
            <ModeToggle />
          </div>

          {/* Mobile menu button */}
          <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden border-t border-border/40 glass-effect"
          >
            <div className="container py-4 space-y-3">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  className="block py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="flex items-center gap-2">
                    {item.icon && <item.icon className="h-4 w-4" />}
                    {item.label}
                  </span>
                </Link>
              ))}
              <div className="pt-2 border-t border-border/40">
                <ModeToggle />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
