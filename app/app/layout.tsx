// app-section-layout.tsx
import type { ReactNode } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"

export default function AppSectionLayout({ children }: { children: ReactNode }) {
  return (
    // Sidebar is fixed and a peer — content is the following sibling so it can react to peer-hover
    <div className="min-h-screen w-full">
      <AppSidebar />

      {/* Content container: margin-left changes based on sidebar hover (peer-hover) */}
      <div
        className="transition-all duration-300
                   ml-16 peer-hover:ml-56
                   min-h-screen flex flex-col"
      >
        <AppHeader />
        <main className="flex-1 bg-background overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
