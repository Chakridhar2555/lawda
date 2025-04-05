"use client"

import { useState, useEffect, useCallback } from 'react'
import { DashboardLayout } from "@/components/layout"
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Plus, RefreshCcw } from "lucide-react"
import { useRouter } from "next/navigation"

interface Showing {
  id: string
  date: Date
  time: string
  property: string
  notes?: string
  status: 'scheduled' | 'completed' | 'cancelled'
  leadName: string
  leadId: string
}

interface Event {
  _id: string
  title: string
  date: string
  time: string
  type: 'viewing' | 'meeting' | 'open-house' | 'follow-up' | 'call'
  description: string
  location?: string
  status: string
}

export default function CalendarPage() {
  const router = useRouter()
  const [showings, setShowings] = useState<Showing[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      // Fetch lead showings to ensure they're synchronized with events
      await fetch('/api/showings')

      // Now fetch all events (which will include synchronized showings)
      const response = await fetch('/api/events')

      if (!response.ok) {
        throw new Error('Failed to fetch events')
      }

      const data = await response.json()

      // Process the events to handle date objects
      const processedEvents = data.map((event: any) => ({
        ...event,
        date: new Date(event.date),
        type: event.type || 'meeting'
      }))

      setEvents(processedEvents)

      // Store in localStorage for components that read from there
      localStorage.setItem('calendar_events', JSON.stringify(processedEvents))

      setIsLoading(false)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch calendar data",
      })
      setIsLoading(false)
    }
  }, [toast])

  const getShowingsForDate = (date: Date) => {
    return showings.filter(showing => {
      const showingDate = new Date(showing.date)
      return showingDate.toDateString() === date.toDateString()
    })
  }

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.date)
      return eventDate.toDateString() === date.toDateString()
    })
  }

  const hasActivitiesOnDate = (date: Date) => {
    return getShowingsForDate(date).length > 0 || getEventsForDate(date).length > 0
  }

  const getAllActivitiesForDate = (date: Date) => {
    const dateShowings = getShowingsForDate(date).map(showing => ({
      id: showing.id,
      title: showing.property,
      time: showing.time,
      type: 'showing',
      description: showing.notes || '',
      status: showing.status
    }))

    const dateEvents = getEventsForDate(date).map(event => ({
      id: event._id,
      title: event.title,
      time: event.time,
      type: event.type,
      description: event.description || '',
      status: event.status
    }))

    return [...dateShowings, ...dateEvents].sort((a, b) =>
      a.time.localeCompare(b.time)
    )
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Calendar</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={isLoading}
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button
              className="bg-[#ef4444] hover:bg-[#dc2626] text-white"
              size="sm"
              onClick={() => router.push('/calendar/add')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Section */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-6">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  className="w-full"
                  modifiers={{
                    hasActivity: (date) => hasActivitiesOnDate(date)
                  }}
                  modifiersStyles={{
                    hasActivity: {
                      backgroundColor: 'var(--primary-50)',
                      color: 'var(--primary-900)',
                      fontWeight: 'bold'
                    }
                  }}
                  styles={{
                    head_cell: {
                      width: '100%',
                      fontSize: '1rem',
                      padding: '1rem',
                      color: 'var(--primary-700)'
                    },
                    cell: {
                      width: '100%',
                      height: '100%',
                      fontSize: '1rem',
                      padding: '1rem'
                    },
                    nav_button_previous: {
                      width: '2.5rem',
                      height: '2.5rem'
                    },
                    nav_button_next: {
                      width: '2.5rem',
                      height: '2.5rem'
                    },
                    caption: {
                      fontSize: '1.25rem',
                      padding: '1rem'
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Activities Details Section */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>
                {selectedDate ?
                  `Activities for ${selectedDate.toLocaleDateString()}` :
                  'Select a date to view activities'
                }
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center p-6">
                  <div className="animate-pulse">Loading...</div>
                </div>
              ) : (
                selectedDate ? (
                  <div className="space-y-4">
                    {getAllActivitiesForDate(selectedDate).length > 0 ? (
                      getAllActivitiesForDate(selectedDate).map((activity) => (
                        <div
                          key={activity.id}
                          className="border rounded-lg p-4 space-y-2 hover:shadow-md transition-shadow"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-semibold text-lg">
                                {activity.time}
                              </div>
                              <div className="text-primary-600 font-medium">
                                {activity.title}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Badge
                                variant="outline"
                                className="capitalize"
                              >
                                {activity.type}
                              </Badge>
                              <Badge
                                variant={
                                  activity.status === 'completed' ? 'secondary' :
                                    activity.status === 'cancelled' ? 'destructive' :
                                      'default'
                                }
                                className="capitalize"
                              >
                                {activity.status}
                              </Badge>
                            </div>
                          </div>
                          {activity.description && (
                            <div className="text-sm text-muted-foreground mt-2 bg-muted/50 p-2 rounded">
                              {activity.description}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-muted-foreground py-6">
                        No activities scheduled for this date
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-6">
                    Select a date to view scheduled activities
                  </div>
                )
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}

