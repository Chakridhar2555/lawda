"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"

interface Notification {
  _id: string
  message: string
  type: string
  read: boolean
  createdAt: string
}

export function NotificationsPopover() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const { toast } = useToast()

  const fetchNotifications = async () => {
    try {
      const userData = localStorage.getItem('user')
      if (!userData) return

      const user = JSON.parse(userData)
      const response = await fetch(`/api/notifications?userId=${user._id}`)
      const data = await response.json()

      if (!response.ok) throw new Error()

      setNotifications(data)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  useEffect(() => {
    fetchNotifications()
    // Set up polling for new notifications
    const interval = setInterval(fetchNotifications, 30000) // Poll every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId })
      })

      if (!response.ok) throw new Error()

      // Remove the notification from the list
      setNotifications(prev => prev.filter(n => n._id !== notificationId))
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to mark notification as read"
      })
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {notifications.length > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
              {notifications.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <h4 className="text-sm font-semibold">Notifications</h4>
        </div>
        <ScrollArea className="h-[300px]">
          <AnimatePresence mode="popLayout">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                No new notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <motion.div
                  key={notification._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className="p-4 border-b last:border-0"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1 space-y-1">
                      <p className="text-sm">{notification.message}</p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(notification.createdAt), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAsRead(notification._id)}
                      className="text-xs"
                    >
                      Mark as read
                    </Button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
} 