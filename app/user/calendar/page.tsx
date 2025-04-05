"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Calendar as CalendarIcon, Plus, Edit2, Trash2, Clock, MapPin } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { format } from "date-fns"

interface Event {
  _id: string
  title: string
  date: string
  time: string
  type: string
  location: string
  description: string
  status: string
  createdAt: string
  updatedAt: string
}

const defaultEvent = {
  title: "",
  date: format(new Date(), "yyyy-MM-dd"),
  time: "09:00",
  type: "meeting",
  location: "",
  description: "",
  status: "scheduled"
}

const eventTypes = [
  { value: "meeting", label: "Meeting" },
  { value: "viewing", label: "Property Viewing" },
  { value: "open-house", label: "Open House" },
  { value: "follow-up", label: "Follow-up" },
  { value: "call", label: "Call" },
]

const eventStatuses = [
  { value: "scheduled", label: "Scheduled" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "rescheduled", label: "Rescheduled" },
]

// Add motion table row
const MotionTableRow = motion(TableRow)

export default function CalendarPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [events, setEvents] = useState<Event[]>([])
  const [isNewEventDialogOpen, setIsNewEventDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [formData, setFormData] = useState(defaultEvent)
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const response = await fetch("/api/events")
      const data = await response.json()
      setEvents(data)
      setIsLoading(false)
    } catch (error) {
      console.error("Error fetching events:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch events",
      })
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = "/api/events"
      const method = editingEvent ? "PUT" : "POST"
      const body = editingEvent 
        ? { _id: editingEvent._id, ...formData }
        : formData

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!response.ok) throw new Error()

      toast({
        title: "Success",
        description: `Event ${editingEvent ? "updated" : "created"} successfully`,
      })

      setIsNewEventDialogOpen(false)
      setEditingEvent(null)
      setFormData(defaultEvent)
      fetchEvents()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to ${editingEvent ? "update" : "create"} event`,
      })
    }
  }

  const handleDelete = async (event: Event) => {
    try {
      const response = await fetch(`/api/events/${event._id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error()

      toast({
        title: "Success",
        description: "Event deleted successfully",
      })

      fetchEvents()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete event",
      })
    } finally {
      setEventToDelete(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'scheduled':
        return 'text-blue-400 bg-blue-400/10'
      case 'completed':
        return 'text-green-400 bg-green-400/10'
      case 'cancelled':
        return 'text-red-400 bg-red-400/10'
      case 'rescheduled':
        return 'text-yellow-400 bg-yellow-400/10'
      default:
        return 'text-gray-400 bg-gray-400/10'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'meeting':
        return <CalendarIcon className="h-4 w-4 text-blue-400" />
      case 'viewing':
        return <CalendarIcon className="h-4 w-4 text-green-400" />
      case 'open-house':
        return <CalendarIcon className="h-4 w-4 text-purple-400" />
      case 'follow-up':
        return <CalendarIcon className="h-4 w-4 text-yellow-400" />
      case 'call':
        return <CalendarIcon className="h-4 w-4 text-red-400" />
      default:
        return <CalendarIcon className="h-4 w-4 text-gray-400" />
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 animate-pulse">
        <div className="h-8 w-48 bg-gray-800 rounded mb-6"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-800 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-100">Calendar</h1>
        <Button 
          onClick={() => {
            setEditingEvent(null)
            setFormData(defaultEvent)
            setIsNewEventDialogOpen(true)
          }}
          className="bg-red-500 hover:bg-red-600"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Event
        </Button>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-100">Upcoming Events</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700">
                <TableHead className="text-gray-400">Event</TableHead>
                <TableHead className="text-gray-400">Date & Time</TableHead>
                <TableHead className="text-gray-400">Type</TableHead>
                <TableHead className="text-gray-400">Location</TableHead>
                <TableHead className="text-gray-400">Status</TableHead>
                <TableHead className="text-gray-400 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.length === 0 ? (
                <MotionTableRow
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <TableCell 
                    colSpan={6} 
                    className="text-center text-gray-400 py-4"
                  >
                    No events found
                  </TableCell>
                </MotionTableRow>
              ) : (
                events.map((event, index) => (
                  <MotionTableRow 
                    key={event._id}
                    className="border-gray-700"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.01, backgroundColor: "rgba(0,0,0,0.02)" }}
                  >
                  <TableCell className="font-medium text-gray-100">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(event.type)}
                      {event.title}
                    </div>
                  </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-gray-300">
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                          {format(new Date(event.date), "MMM dd, yyyy")}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2 text-gray-400" />
                          {event.time}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {event.type}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-gray-300">
                        <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                        {event.location || "N/A"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                        {event.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingEvent(event)
                            setFormData({
                              title: event.title,
                              date: event.date,
                              time: event.time,
                              type: event.type,
                              location: event.location,
                              description: event.description,
                              status: event.status,
                            })
                            setIsNewEventDialogOpen(true)
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <Edit2 className="h-4 w-4 text-gray-400" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEventToDelete(event)}
                          className="h-8 w-8 p-0 hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </MotionTableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isNewEventDialogOpen} onOpenChange={setIsNewEventDialogOpen}>
        <DialogContent className="bg-gray-800 text-gray-100">
          <DialogHeader>
            <DialogTitle>
              {editingEvent ? "Edit Event" : "Add New Event"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="bg-gray-700 border-gray-600"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                  className="bg-gray-700 border-gray-600"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  required
                  className="bg-gray-700 border-gray-600"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    {eventTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    {eventStatuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="bg-gray-700 border-gray-600"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-gray-700 border-gray-600"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsNewEventDialogOpen(false)
                  setEditingEvent(null)
                }}
                className="border-gray-600 hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-red-500 hover:bg-red-600">
                {editingEvent ? "Update" : "Create"} Event
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!eventToDelete} onOpenChange={() => setEventToDelete(null)}>
        <AlertDialogContent className="bg-gray-800 text-gray-100">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This action cannot be undone. This will permanently delete the event
              {eventToDelete && ` "${eventToDelete.title}"`} and remove it from the calendar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-600 hover:bg-gray-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={() => eventToDelete && handleDelete(eventToDelete)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 