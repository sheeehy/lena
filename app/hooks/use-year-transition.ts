//hooks/use-year-transition.ts
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useYear } from "../context/year-context"

export function useYearTransition(currentYear: string) {
  const router = useRouter()
  const { selectedYear } = useYear()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [direction, setDirection] = useState<"next" | "prev" | null>(null)

  useEffect(() => {
    if (selectedYear !== currentYear && !isTransitioning) {
      // Determine direction for animation
      const selectedYearNum = parseInt(selectedYear)
      const currentYearNum = parseInt(currentYear)
      const newDirection = selectedYearNum > currentYearNum ? "next" : "prev"
      
      setDirection(newDirection)
      setIsTransitioning(true)
      
      // Navigate after animation completes
      const timer = setTimeout(() => {
        router.push(`/memories/${selectedYear}`)
      }, 300)
      
      return () => clearTimeout(timer)
    }
  }, [selectedYear, currentYear, router, isTransitioning])

  // Reset transition state when navigation completes
  useEffect(() => {
    setIsTransitioning(false)
  }, [currentYear])

  return { isTransitioning, direction }
}