"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function ModeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Toggle theme"
          className="relative rounded-full border border-gray-400 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 p-1 hover:bg-gray-300 dark:hover:bg-gray-700 transition-all"
        >
          <Sun
            className={`absolute h-5 w-5 transition-transform duration-300 ${
              theme === "dark" ? "rotate-90 scale-0" : "rotate-0 scale-100"
            }`}
          />
          <Moon
            className={`absolute h-5 w-5 transition-transform duration-300 ${
              theme === "dark" ? "rotate-0 scale-100" : "rotate-90 scale-0"
            }`}
          />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="bg-white dark:bg-black border border-gray-400 dark:border-gray-700 rounded-lg shadow-md"
      >
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className="text-base font-medium hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors rounded-md"
        >
          Light
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className="text-base font-medium hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors rounded-md"
        >
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className="text-base font-medium hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors rounded-md"
        >
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
