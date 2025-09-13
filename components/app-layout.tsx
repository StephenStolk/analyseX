"use client"

import type React from "react"

import { useState } from "react"
import { AppHeader } from "@/components/app-header"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [defaultOpen, setDefaultOpen] = useState(true)

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <div className="flex min-h-screen flex-col">
        <AppHeader />
        <div className="flex flex-1">
          <AppSidebar />
          <main className="flex-1 bg-background p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}
