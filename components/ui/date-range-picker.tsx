"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface DateRangePickerProps {
  className?: string
  date: DateRange | undefined
  onDateChange: (date: DateRange | undefined) => void
  isLoading?: boolean
}

const YEARS = [2020, 2021, 2022, 2023, 2024, 2025]
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

const PRESETS = [
  { label: "All Time", from: new Date(2020, 0, 1), to: new Date(2025, 11, 31) },
  { label: "2025", from: new Date(2025, 0, 1), to: new Date(2025, 11, 31) },
  { label: "2024", from: new Date(2024, 0, 1), to: new Date(2024, 11, 31) },
  { label: "2023", from: new Date(2023, 0, 1), to: new Date(2023, 11, 31) },
  { label: "2022", from: new Date(2022, 0, 1), to: new Date(2022, 11, 31) },
  { label: "2021", from: new Date(2021, 0, 1), to: new Date(2021, 11, 31) },
  { label: "2020", from: new Date(2020, 0, 1), to: new Date(2020, 11, 31) },
]

export function DateRangePicker({
  className,
  date,
  onDateChange,
  isLoading = false,
}: DateRangePickerProps) {
  const [leftMonth, setLeftMonth] = React.useState<Date>(date?.from || new Date(2020, 0, 1))
  const [rightMonth, setRightMonth] = React.useState<Date>(date?.to || new Date(2025, 11, 1))
  const [open, setOpen] = React.useState(false)
  const [pendingClose, setPendingClose] = React.useState(false)
  const [wasLoading, setWasLoading] = React.useState(false)
  const [pendingRange, setPendingRange] = React.useState<DateRange | undefined>(undefined)

  React.useEffect(() => {
    if (isLoading) {
      setWasLoading(true)
    }
    if (pendingClose && wasLoading && !isLoading) {
      setOpen(false)
      setPendingClose(false)
      setWasLoading(false)
    }
  }, [isLoading, pendingClose, wasLoading])

  const handleFromMonthChange = (monthIndex: string) => {
    const m = parseInt(monthIndex)
    setLeftMonth(new Date(leftMonth.getFullYear(), m, 1))
  }

  const handleFromYearChange = (year: string) => {
    const y = parseInt(year)
    setLeftMonth(new Date(y, leftMonth.getMonth(), 1))
  }

  const handleToMonthChange = (monthIndex: string) => {
    const m = parseInt(monthIndex)
    setRightMonth(new Date(rightMonth.getFullYear(), m, 1))
  }

  const handleToYearChange = (year: string) => {
    const y = parseInt(year)
    setRightMonth(new Date(y, rightMonth.getMonth(), 1))
  }

  const handleCalendarSelect = (range: DateRange | undefined) => {
    if (range?.from && range?.to) {
      onDateChange(range)
      setPendingRange(undefined)
      setPendingClose(true)
    } else {
      setPendingRange(range)
    }
  }

  const displayedRange = pendingRange || date

  return (
    <div className={cn("grid gap-2", className)}>
      {open && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-40"
          style={{ backgroundColor: 'rgba(0,0,0,0.25)' }}
          onClick={() => setOpen(false)} 
        />,
        document.body
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[260px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 z-50 bg-white dark:bg-zinc-950" align="end" sideOffset={8} style={{ backgroundColor: 'white' }}>
          <div className="flex bg-white dark:bg-zinc-950">
            <div className="border-r py-2 px-2 space-y-1 w-[90px]">
              {PRESETS.map((preset) => (
                <Button
                  key={preset.label}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-left font-normal h-8 text-sm px-2"
                  onClick={() => {
                    onDateChange({ from: preset.from, to: preset.to })
                    setLeftMonth(preset.from)
                    setRightMonth(preset.to)
                    setPendingRange(undefined)
                    setPendingClose(true)
                  }}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-6 mb-4">
                <div className="flex flex-col gap-1 items-center">
                  <span className="text-xs text-muted-foreground font-medium">From</span>
                  <div className="flex gap-1">
                    <Select value={leftMonth.getMonth().toString()} onValueChange={handleFromMonthChange}>
                      <SelectTrigger className="w-[130px] h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MONTHS.map((m, i) => (
                          <SelectItem key={m} value={i.toString()}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={leftMonth.getFullYear().toString()} onValueChange={handleFromYearChange}>
                      <SelectTrigger className="w-[85px] h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {YEARS.map((y) => (
                          <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex flex-col gap-1 items-center">
                  <span className="text-xs text-muted-foreground font-medium">To</span>
                  <div className="flex gap-1">
                    <Select value={rightMonth.getMonth().toString()} onValueChange={handleToMonthChange}>
                      <SelectTrigger className="w-[130px] h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MONTHS.map((m, i) => (
                          <SelectItem key={m} value={i.toString()}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={rightMonth.getFullYear().toString()} onValueChange={handleToYearChange}>
                      <SelectTrigger className="w-[85px] h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {YEARS.map((y) => (
                          <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <Calendar
                  mode="range"
                  month={leftMonth}
                  onMonthChange={setLeftMonth}
                  selected={displayedRange}
                  onSelect={handleCalendarSelect}
                  numberOfMonths={1}
                  hideNavigation
                />
                <Calendar
                  mode="range"
                  month={rightMonth}
                  onMonthChange={setRightMonth}
                  selected={displayedRange}
                  onSelect={handleCalendarSelect}
                  numberOfMonths={1}
                  hideNavigation
                />
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
