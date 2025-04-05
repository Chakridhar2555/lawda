"use client"

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

// Dynamically import heavy components
const MonthView = dynamic(
  () => import("@/components/calendar/month-view").then(mod => mod.MonthView),
  {
    loading: () => (
      <div className="h-[400px] flex items-center justify-center">
        Loading calendar...
      </div>
    ),
    ssr: false
  }
);

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
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="flex items-center p-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-400/10 mr-4">
              <ClipboardList className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-400">Total Tasks</p>
              <h2 className="text-2xl font-bold text-gray-100">{metrics.totalTasks}</h2>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="flex items-center p-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-400/10 mr-4">
              <Users className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-400">Total Leads</p>
              <h2 className="text-2xl font-bold text-gray-100">{metrics.totalLeads}</h2>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="flex items-center p-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-yellow-400/10 mr-4">
              <CalendarIcon className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-400">Today's Tasks</p>
              <h2 className="text-2xl font-bold text-gray-100">{metrics.todaysTasks}</h2>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="flex items-center p-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-400/10 mr-4">
              <Clock className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-400">Upcoming Tasks</p>
              <h2 className="text-2xl font-bold text-gray-100">{metrics.upcomingTasks}</h2>
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
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-100">All Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700">
                <TableHead className="text-gray-400">Status</TableHead>
                <TableHead className="text-gray-400">Title</TableHead>
                <TableHead className="text-gray-400">Due Date</TableHead>
                <TableHead className="text-gray-400">Priority</TableHead>
                <TableHead className="text-gray-400">Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allTasks.length === 0 ? (
                <MotionTableRow
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <TableCell colSpan={5} className="text-center text-gray-400 py-4">
                    No tasks found
                  </TableCell>
                </MotionTableRow>
              ) : (
                allTasks.map((task, index) => (
                  <MotionTableRow
                    key={task.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    whileHover={{ scale: 1.01, backgroundColor: "rgba(0,0,0,0.02)" }}
                    className="border-gray-700"
                  >
                    <TableCell>
                      <div className="flex items-center">
                        {getStatusIcon(task.status)}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-gray-100">{task.title}</TableCell>
                    <TableCell className="text-gray-300">
                      {format(new Date(task.date), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-gray-300">
                      {task.description || '-'}
                    </TableCell>
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

export default function UserDashboard() {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [metrics, setMetrics] = useState({
    totalTasks: 0,
    totalLeads: 0,
    todaysTasks: 0,
    upcomingTasks: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [allTasks, setAllTasks] = useState<Task[]>([])

  useEffect(() => {
    let isMounted = true

    const fetchMetrics = async () => {
      try {
        const leadsResponse = await fetch('/api/leads')
        const leadsData = await leadsResponse.json()
        
        if (!isMounted) return

        // Calculate metrics
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        const nextWeek = new Date(today)
        nextWeek.setDate(nextWeek.getDate() + 7)
        
        // Get all tasks from leads
        const allTasks: Task[] = leadsData.reduce((acc: Task[], lead: Lead) => {
          return lead.tasks ? [...acc, ...lead.tasks] : acc
        }, [])
        
        const pendingTasks = allTasks.filter(task => task.status === 'pending')
        const todaysTasks = pendingTasks.filter(task => {
          const taskDate = new Date(task.date)
          taskDate.setHours(0, 0, 0, 0)
          return taskDate.getTime() === today.getTime()
        })

        if (isMounted) {
          setMetrics({
            totalTasks: pendingTasks.length,
            totalLeads: leadsData.length,
            todaysTasks: todaysTasks.length,
            upcomingTasks: pendingTasks.filter(task => {
              const taskDate = new Date(task.date)
              return taskDate >= today && taskDate <= nextWeek
            }).length
          })
          setAllTasks(allTasks)
          setIsLoading(false)
        }
      } catch (error) {
        console.error('Error fetching metrics:', error)
        if (isMounted) setIsLoading(false)
      }
    }

    fetchMetrics()
    return () => { isMounted = false }
  }, [])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-400 bg-red-400/10'
      case 'medium':
        return 'text-yellow-400 bg-yellow-400/10'
      case 'low':
        return 'text-green-400 bg-green-400/10'
      default:
        return 'text-gray-400 bg-gray-400/10'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-400" />
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-400" />
      case 'pending':
        return <AlertCircle className="h-5 w-5 text-yellow-400" />
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 animate-pulse">
        <div className="h-8 w-48 bg-gray-800 rounded mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-800 rounded"></div>
          ))}
        </div>
        <div className="h-96 bg-gray-800 rounded"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <motion.div 
        className="space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.h1 
          className="text-2xl font-bold text-gray-100"
          initial={{ x: -20 }}
          animate={{ x: 0 }}
          transition={{ duration: 0.5 }}
        >
          Dashboard
        </motion.h1>

        <MetricsCards metrics={metrics} />
        <TasksTable 
          allTasks={allTasks} 
          getStatusIcon={getStatusIcon}
          getPriorityColor={getPriorityColor}
        />

        <Suspense fallback={<div className="h-[400px] flex items-center justify-center">Loading calendar...</div>}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-gray-100">Calendar</CardTitle>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={() => router.push('/user/calendar/add')}
                    className="bg-red-500 hover:bg-red-600 text-white"
                  >
                    + Add New Event
                  </Button>
                </motion.div>
              </CardHeader>
              <CardContent>
                <MonthView
                  selectedDate={selectedDate}
                  onDateChange={setSelectedDate}
                />
              </CardContent>
            </Card>
          </motion.div>
        </Suspense>
      </motion.div>
    </div>
  )
} 