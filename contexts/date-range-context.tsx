"use client"

import { createContext, useContext, useState, ReactNode } from "react"
import { DateRange } from "react-day-picker"

const DEFAULT_DATE_RANGE: DateRange = {
  from: new Date(2020, 0, 1),
  to: new Date(2025, 11, 31),
}

interface DateRangeContextType {
  dateRange: DateRange | undefined
  setDateRange: (range: DateRange | undefined) => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

const DateRangeContext = createContext<DateRangeContextType | undefined>(undefined)

export function DateRangeProvider({ children }: { children: ReactNode }) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(DEFAULT_DATE_RANGE)
  const [isLoading, setIsLoading] = useState(false)

  return (
    <DateRangeContext.Provider value={{ dateRange, setDateRange, isLoading, setIsLoading }}>
      {children}
    </DateRangeContext.Provider>
  )
}

export function useDateRange() {
  const context = useContext(DateRangeContext)
  if (!context) {
    throw new Error("useDateRange must be used within a DateRangeProvider")
  }
  return context
}
