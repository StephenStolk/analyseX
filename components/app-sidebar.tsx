// components/app-sidebar.tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Upload, User, Settings, Search } from "lucide-react"

export function AppSidebar() {
  const pathname = usePathname()

  const items = [
    { title: "Home", icon: Home, href: "/app" },
    { title: "Upload", icon: Upload, href: "/app/upload" },
    { title: "Profile", icon: User, href: "/app/profile" },
    { title: "Analysis", icon: Search, href: "/app/analysis" },
    { title: "Settings", icon: Settings, href: "/app/settings" },
  ]

  return (
    // `peer` so following sibling can use peer-hover:*,
    // fixed so it doesn't scroll with page, z-50 to sit above content,
    // w-16 collapsed, hover expands to w-56 (adjust sizes to taste)
    <aside
      className="peer fixed left-0 top-0 z-50 h-screen border-r transition-width duration-300 overflow-hidden w-16 hover:w-56"
      aria-label="Main sidebar"
    >
      <div className="flex flex-col h-full py-20">

        {/* Menu - make it scrollable if many items */}
        <nav className="flex-1 px-1">
          <ul className="flex flex-col gap-1">
            {items.map((it) => {
              const isActive = pathname === it.href
              return (
                <li key={it.title} className="px-1">
                  <Link
                    href={it.href}
                    className={`flex items-center gap-3 rounded-md px-3 py-2 transition-colors
                      ${isActive ? "bg-primary text-white" : "hover:bg-primary hover:text-white"}
                    `}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {/* icon wrapper: center icon in collapsed rail */}
                    <div className="flex-shrink-0 w-10 flex items-center justify-center pr-4">
                      <it.icon className={`h-5 w-5 ${isActive ? "text-white" : "text-black"}`} />
                    </div>

                    {/* label: hidden when collapsed, visible when expanded */}
                    <span className="whitespace-nowrap opacity-100 transition-opacity duration-200 peer-hover:opacity-100">
                      {it.title}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

       
      </div>
    </aside>
  )
}
