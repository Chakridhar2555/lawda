"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, addDays, isValid } from 'date-fns'
import { Clock, Plus, ChevronLeft, ChevronRight } from "lucide-react"
import { useRouter } from 'next/navigation'

interface Event {
  id: string
  title: string
  date: Date
  description: string
  time: string
  type: 'viewing' | 'meeting' | 'open-house' | 'follow-up' | 'call'
  location?: string
  attendees?: string
  contactPhone?: string
  contactEmail?: string
  propertyDetails?: string
  notes?: string
  aiSuggestions?: string[]
}

interface CalendarGridProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  events?: Event[];
}

export function CalendarGrid({ selectedDate, onDateChange, events: propEvents }: CalendarGridProps) {
  const router = useRouter()
  const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]
  const [events, setEvents] = useState<Event[]>([])
  const [currentDate, setCurrentDate] = useState<Date>(new Date())

  useEffect(() => {
    if (selectedDate && isValid(selectedDate)) {
      setCurrentDate(selectedDate)
    }
  }, [selectedDate])

  useEffect(() => {
    if (propEvents) {
      setEvents(propEvents)
    } else {
      const savedEvents = localStorage.getItem('calendar_events')
      if (savedEvents) {
        try {
          const parsedEvents = JSON.parse(savedEvents).map((event: any) => ({
            ...event,
            date: new Date(event.date)
          }))
          setEvents(parsedEvents)
        } catch (error) {
          console.error('Error parsing events:', error)
          setEvents([])
        }
      }
    }
  }, [propEvents])

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'calendar_events') {
        try {
          const newEvents = JSON.parse(e.newValue || '[]').map((event: any) => ({
            ...event,
            date: new Date(event.date)
          }))
          setEvents(newEvents)
        } catch (error) {
          console.error('Error parsing events from storage:', error)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const getDayEvents = (date: Date) => {
    if (!isValid(date)) return []
    return events.filter(event => isSameDay(event.date, date))
  }

  const getEventTypeColor = (type: Event['type']) => {
    switch (type) {
      case 'viewing': return 'bg-blue-100 text-blue-700'
      case 'meeting': return 'bg-purple-100 text-purple-700'
      case 'open-house': return 'bg-green-100 text-green-700'
      case 'follow-up': return 'bg-yellow-100 text-yellow-700'
      case 'call': return 'bg-orange-100 text-orange-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const handleDayClick = (date: Date) => {
    if (!isValid(date)) return
    router.push(`/calendar/add-event?date=${format(date, 'yyyy-MM-dd')}`)
  }

  const handlePrevMonth = () => {
    const prevMonth = new Date(currentDate)
    prevMonth.setMonth(prevMonth.getMonth() - 1)
    if (isValid(prevMonth) && typeof onDateChange === 'function') {
      onDateChange(prevMonth)
    }
  }

  const handleNextMonth = () => {
    const nextMonth = new Date(currentDate)
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    if (isValid(nextMonth) && typeof onDateChange === 'function') {
      onDateChange(nextMonth)
    }
  }

  if (!isValid(currentDate)) {
    setCurrentDate(new Date())
    return null
  }

  // Get the first day of the month
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  
  // Get all days in the month
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })
  
  // Calculate padding days for the start of the month
  const startDay = monthStart.getDay()
  const paddingDays = Array.from({ length: startDay }, (_, index) => {
    const paddedDate = addDays(monthStart, -startDay + index)
    return { date: paddedDate, isPadding: true }
  })
  
  // Combine padding days with month days
  const allDays = [
    ...paddingDays,
    ...monthDays.map(date => ({ date, isPadding: false }))
  ]

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="flex justify-center items-center p-4 border-b">
        <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold px-4">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <Button variant="ghost" size="icon" onClick={handleNextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-7 border-b">
        {days.map((day) => (
          <div key={day} className="py-2 text-center text-sm font-medium text-gray-600">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y">
        {allDays.map(({ date, isPadding }, i) => (
          <Button
            key={date.toISOString()}
            variant="ghost"
            className={`h-32 p-2 flex flex-col items-start justify-start hover:bg-gray-50 relative ${
              !isPadding && isSameDay(date, new Date()) ? 'bg-primary/5' : ''
            }`}
            onClick={() => !isPadding && handleDayClick(date)}
            disabled={isPadding}
          >
            <span className={`text-sm ${isPadding ? 'text-gray-300' : 'text-gray-500'}`}>
              {format(date, 'd')}
            </span>
            {!isPadding && getDayEvents(date).map((event, index) => (
              <div 
                key={index} 
                className={`mt-1 text-xs p-1 rounded w-full truncate flex items-center gap-1 ${getEventTypeColor(event.type)}`}
                title={`${event.title}${event.time ? ` - ${event.time}` : ''}\n${event.description || ''}`}
              >
                {event.time && <Clock className="h-3 w-3" />}
                {event.title}
              </div>
            ))}
          </Button>
        ))}
      </div>
    </div>
  )
}

