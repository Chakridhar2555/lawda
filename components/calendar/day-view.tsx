'use client';

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { format, isSameDay, addDays, subDays } from 'date-fns'
import { Clock, ChevronLeft, ChevronRight, MapPin } from "lucide-react"

interface Event {
  id: string
  title: string
  date: Date
  time: string
  type: 'viewing' | 'meeting' | 'open-house' | 'follow-up' | 'call'
  description: string
  location?: string
  attendees?: string
  contactPhone?: string
  contactEmail?: string
  propertyDetails?: string
  notes?: string
  aiSuggestions?: string[]
}

interface DayViewProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function DayView({ selectedDate, onDateChange }: DayViewProps) {
  const [events, setEvents] = useState<Event[]>([])

  useEffect(() => {
    const savedEvents = localStorage.getItem('calendar_events')
    if (savedEvents) {
      setEvents(JSON.parse(savedEvents).map((event: any) => ({
        ...event,
        date: new Date(event.date)
      })))
    }
  }, [])

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

  const handlePrevDay = () => onDateChange(subDays(selectedDate, 1))
  const handleNextDay = () => onDateChange(addDays(selectedDate, 1))

  // Get events for the selected day
  const dayEvents = events.filter(event => 
    isSameDay(new Date(event.date), selectedDate)
  ).sort((a, b) => {
    const timeA = new Date(`1970/01/01 ${a.time}`);
    const timeB = new Date(`1970/01/01 ${b.time}`);
    return timeA.getTime() - timeB.getTime();
  });

  // Generate time slots for the day
  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return `${hour}:00`;
  });

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="flex justify-center items-center p-4 border-b">
        <Button variant="ghost" size="icon" onClick={handlePrevDay}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold px-4">
          {format(selectedDate, 'EEEE, MMMM d, yyyy')}
        </h2>
        <Button variant="ghost" size="icon" onClick={handleNextDay}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-[100px_1fr] divide-x">
        <div className="border-r">
          {timeSlots.map((time) => (
            <div key={time} className="h-20 border-b p-2 text-sm text-gray-500">
              {time}
            </div>
          ))}
        </div>

        <div className="relative min-h-[1000px]">
          {/* Time slot grid lines */}
          {timeSlots.map((time) => (
            <div key={time} className="h-20 border-b" />
          ))}

          {/* Events */}
          <div className="absolute top-0 left-0 right-0">
            {dayEvents.map((event) => {
              const [hours] = event.time.split(':');
              const top = parseInt(hours) * 80; // 80px is the height of each time slot

              return (
                <div
                  key={event.id}
                  className={`absolute left-2 right-2 p-2 rounded ${getEventTypeColor(event.type)}`}
                  style={{ top: `${top}px`, minHeight: '60px' }}
                >
                  <div className="flex items-center gap-1 text-sm">
                    <Clock className="h-3 w-3" />
                    <span>{event.time}</span>
                  </div>
                  <div className="font-medium">{event.title}</div>
                  {event.location && (
                    <div className="flex items-center gap-1 text-xs mt-1">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  )
} 