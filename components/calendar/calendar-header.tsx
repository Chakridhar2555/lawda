"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useState } from "react"

export function CalendarHeader() {
  const [currentDate, setCurrentDate] = useState(new Date())

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-4">
        <h1 className="text-2xl font-semibold">Calendar</h1>
        <Button variant="default" className="bg-red-500 hover:bg-red-600">
          + Add New Event
        </Button>
      </div>
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date())}>
          Today
        </Button>
        <div className="flex items-center space-x-1">
          <Button variant="ghost" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-medium px-4">
            {currentDate.toLocaleString("default", { month: "long", year: "numeric" })}
          </h2>
          <Button variant="ghost" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center rounded-lg border bg-white">
          <Button variant="ghost" size="sm" className="rounded-none">
            Day
          </Button>
          <Button variant="ghost" size="sm" className="rounded-none">
            Week
          </Button>
          <Button variant="ghost" size="sm" className="rounded-none bg-red-500 text-white hover:bg-red-600">
            Month
          </Button>
        </div>
      </div>
    </div>
  )
}

