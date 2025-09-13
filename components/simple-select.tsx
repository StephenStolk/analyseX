"use client"

import React from "react"
import { useState, useRef, useEffect } from "react"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SimpleSelectProps {
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  children: React.ReactNode
}

interface SimpleSelectItemProps {
  value: string
  children: React.ReactNode
  onSelect?: (value: string) => void
}

export function SimpleSelect({ value, onValueChange, placeholder, children }: SimpleSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  const handleSelect = (selectedValue: string) => {
    onValueChange(selectedValue)
    setIsOpen(false)
  }

  const toggleDropdown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsOpen(!isOpen)
  }

  // Find the display text for the selected value
  const getDisplayText = () => {
    if (!value) return placeholder || "Select..."

    let displayText = value
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child) && child.props.value === value) {
        displayText = child.props.children
      }
    })
    return displayText
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        className="w-full justify-between text-left font-normal"
        onClick={toggleDropdown}
        type="button"
      >
        <span className="truncate">{getDisplayText()}</span>
        <ChevronDown className={`h-4 w-4 opacity-50 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </Button>

      {isOpen && (
        <div className="absolute z-[100] w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto">
          <div className="py-1">
            {React.Children.map(children, (child) => {
              if (React.isValidElement(child)) {
                return React.cloneElement(child as React.ReactElement<SimpleSelectItemProps>, {
                  onSelect: handleSelect,
                })
              }
              return child
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export function SimpleSelectItem({ value, children, onSelect }: SimpleSelectItemProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onSelect?.(value)
  }

  return (
    <div
      className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-sm transition-colors"
      onClick={handleClick}
      role="option"
    >
      {children}
    </div>
  )
}

// Default export for compatibility
export default SimpleSelect
