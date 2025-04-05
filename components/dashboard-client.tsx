'use client';

import dynamic from 'next/dynamic'
import { useState, useEffect, Suspense } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { DashboardLayout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ClipboardList, Users, Calendar as CalendarIcon, Clock, CheckCircle2, XCircle, AlertCircle, MapPin } from "lucide-react"
import { format } from "date-fns"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ErrorBoundary } from 'react-error-boundary'
import { cn } from "@/lib/utils"

// Dynamically import heavy components with error fallback
const MonthView = dynamic<{
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}>(() => import("@/components/calendar/month-view").then(mod => mod.MonthView), {
  loading: () => (
    <div className="h-[400px] flex items-center justify-center">
      Loading calendar...
    </div>
  ),
  ssr: false
});

interface Task {
  id: string
  title: string
  date: string | Date
  description?: string
  status: 'pending' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high'
}

interface Lead {
  _id: string
  name: string
  tasks?: Task[]
}

interface CalendarEvent {
  id: string
  title: string
  date: Date
  time: string
  type: 'viewing' | 'meeting' | 'open-house' | 'follow-up' | 'call'
  description: string
  location?: string
}

interface ScheduledTask {
  id: string
  title: string
  date: Date
  time: string
  type: string
  source: 'task' | 'calendar'
  description?: string
  location?: string
  priority?: 'low' | 'medium' | 'high'
  status?: 'pending' | 'completed' | 'cancelled'
}

// Add type for motion table row
const MotionTableRow = motion(TableRow)

// Separate metrics cards into a component
function MetricsCards({ metrics }: { metrics: any }) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }

  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={item}>
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mr-4">
              <ClipboardList className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Tasks</p>
              <h2 className="text-2xl font-bold">{metrics.totalTasks}</h2>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mr-4">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Leads</p>
              <h2 className="text-2xl font-bold">{metrics.totalLeads}</h2>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-yellow-100 mr-4">
              <CalendarIcon className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Today's Tasks</p>
              <h2 className="text-2xl font-bold">{metrics.todaysTasks}</h2>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 mr-4">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Upcoming Tasks</p>
              <h2 className="text-2xl font-bold">{metrics.upcomingTasks}</h2>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}

// Separate tasks table into a component
function TasksTable({ allTasks, getStatusIcon, getPriorityColor }: {
  allTasks: Task[],
  getStatusIcon: (status: string) => JSX.Element | null,
  getPriorityColor: (priority: string) => string
}) {
  return (
    <motion.div
      className="mb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card>
        <CardHeader>
          <CardTitle>All Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allTasks.length === 0 ? (
                <MotionTableRow
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                    No tasks found
                  </TableCell>
                </MotionTableRow>
              ) : (
                allTasks.map((task, index) => (
                  <MotionTableRow
                    key={task.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <TableCell>
                      <div className="flex items-center">
                        {getStatusIcon(task.status)}
                        <span className="ml-2 capitalize">{task.status}</span>
                      </div>
                    </TableCell>
                    <TableCell>{task.title}</TableCell>
                    <TableCell>
                      {typeof task.date === 'string' ? task.date : format(task.date, 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>{task.description || 'No description'}</TableCell>
                  </MotionTableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Separate daily events into a component
function DailyEvents({ events, getTypeColor }: {
  events: any[],
  getTypeColor: (type: string) => string
}) {
  return (
    <motion.div
      className="mb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Today's Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {events.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">
                No events scheduled for today
              </div>
            ) : (
              events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start space-x-4 p-3 rounded-lg bg-gray-50"
                >
                  <div className={cn(
                    "w-2 h-2 mt-2 rounded-full",
                    getTypeColor(event.type)
                  )} />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{event.title}</p>
                      <span className="text-sm text-muted-foreground">
                        {event.time}
                      </span>
                    </div>
                    {event.location && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4 mr-1" />
                        {event.location}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Error fallback component
function ErrorFallback({ error, resetErrorBoundary }: { error: Error, resetErrorBoundary: () => void }) {
  return (
    <div className="p-4 border rounded-lg bg-red-50 text-red-600">
      <p>Something went wrong:</p>
      <pre className="mt-2 text-sm">{error.message}</pre>
      <Button onClick={resetErrorBoundary} className="mt-4">Try again</Button>
    </div>
  )
}

export function DashboardClient() {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [metrics, setMetrics] = useState({
    totalTasks: 0,
    totalLeads: 0,
    todaysTasks: 0,
    upcomingTasks: 0
  })
  const [allTasks, setAllTasks] = useState<Task[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTask[]>([])

  useEffect(() => {
    // Fetch user data from localStorage
    const user = localStorage.getItem('user')
    if (!user) {
      router.push('/login')
      return
    }

    // Simulate fetching data
    const mockTasks: Task[] = [
      {
        id: '1',
        title: 'Follow up with John Doe',
        date: new Date(),
        status: 'pending',
        priority: 'high',
        description: 'Discuss property requirements'
      },
      {
        id: '2',
        title: 'Property viewing',
        date: new Date(Date.now() + 86400000),
        status: 'completed',
        priority: 'medium',
        description: '123 Main St'
      }
    ]

    const mockLeads: Lead[] = [
      { _id: '1', name: 'John Doe' },
      { _id: '2', name: 'Jane Smith' }
    ]

    const mockEvents: CalendarEvent[] = [
      {
        id: '1',
        title: 'Property Viewing',
        date: new Date(),
        time: '10:00 AM',
        type: 'viewing',
        description: '123 Main St',
        location: '123 Main St'
      }
    ]

    setAllTasks(mockTasks)
    setLeads(mockLeads)
    setEvents(mockEvents)

    // Update metrics
    setMetrics({
      totalTasks: mockTasks.length,
      totalLeads: mockLeads.length,
      todaysTasks: mockTasks.filter(task => 
        typeof task.date === 'string' ? 
          task.date === format(new Date(), 'yyyy-MM-dd') :
          format(task.date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
      ).length,
      upcomingTasks: mockTasks.filter(task => 
        typeof task.date === 'string' ? 
          new Date(task.date) > new Date() :
          task.date > new Date()
      ).length
    })

    // Combine tasks and events into scheduled tasks
    const combinedTasks: ScheduledTask[] = [
      ...mockTasks.map(task => ({
        id: task.id,
        title: task.title,
        date: typeof task.date === 'string' ? new Date(task.date) : task.date,
        time: format(typeof task.date === 'string' ? new Date(task.date) : task.date, 'h:mm a'),
        type: 'task',
        source: 'task' as const,
        description: task.description,
        priority: task.priority,
        status: task.status
      })),
      ...mockEvents.map(event => ({
        id: event.id,
        title: event.title,
        date: event.date,
        time: event.time,
        type: event.type,
        source: 'calendar' as const,
        description: event.description,
        location: event.location
      }))
    ]

    setScheduledTasks(combinedTasks)
  }, [router])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'pending':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />
      default:
        return null
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 hover:bg-red-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-800 hover:bg-green-200'
      default:
        return ''
    }
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <MetricsCards metrics={metrics} />
        <TasksTable
          allTasks={allTasks}
          getStatusIcon={getStatusIcon}
          getPriorityColor={getPriorityColor}
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <ErrorBoundary fallback={<div>Error loading calendar</div>}>
                <Suspense fallback={<div>Loading calendar...</div>}>
                  <MonthView
                    selectedDate={selectedDate}
                    onDateChange={setSelectedDate}
                  />
                </Suspense>
              </ErrorBoundary>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scheduledTasks
                  .filter(task => format(task.date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd'))
                  .map((task, index) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start space-x-4 p-4 rounded-lg bg-gray-50"
                    >
                      <div className={cn(
                        "flex items-center justify-center w-10 h-10 rounded-full",
                        task.source === 'task' ? "bg-blue-100" : "bg-green-100"
                      )}>
                        {task.source === 'task' ? (
                          <ClipboardList className="w-5 h-5 text-blue-600" />
                        ) : (
                          <CalendarIcon className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {task.title}
                        </p>
                        <div className="flex items-center mt-1">
                          <Clock className="w-4 h-4 text-gray-400 mr-1" />
                          <p className="text-sm text-gray-500">{task.time}</p>
                          {task.location && (
                            <>
                              <MapPin className="w-4 h-4 text-gray-400 ml-3 mr-1" />
                              <p className="text-sm text-gray-500 truncate">
                                {task.location}
                              </p>
                            </>
                          )}
                        </div>
                        {task.description && (
                          <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                      </div>
                      {task.source === 'task' && task.priority && (
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                      )}
                    </motion.div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
} 