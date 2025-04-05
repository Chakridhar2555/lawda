"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function SendNotificationsPage() {
  const [notification, setNotification] = useState({
    title: "",
    message: "",
    type: "system",
    recipients: "all"
  })
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Get existing notifications
      const existingNotifications = JSON.parse(localStorage.getItem('notifications') || '[]')
      
      // Create new notification
      const newNotification = {
        id: Date.now().toString(),
        title: notification.title,
        message: notification.message,
        type: notification.type,
        date: new Date().toISOString(),
        read: false
      }
      
      // Add to existing notifications
      const updatedNotifications = [...existingNotifications, newNotification]
      
      // Save to localStorage
      localStorage.setItem('notifications', JSON.stringify(updatedNotifications))
      
      // Show success message
      toast({
        title: "Success",
        description: "Notification sent successfully",
      })
      
      // Reset form
      setNotification({
        title: "",
        message: "",
        type: "system",
        recipients: "all"
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send notification",
      })
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Send Notifications</h1>
        <Card>
          <CardHeader>
            <CardTitle>Create New Notification</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={notification.title}
                  onChange={(e) => setNotification({ ...notification, title: e.target.value })}
                  placeholder="Notification title"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Message</label>
                <Textarea
                  value={notification.message}
                  onChange={(e) => setNotification({ ...notification, message: e.target.value })}
                  placeholder="Notification message"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <Select
                  value={notification.type}
                  onValueChange={(value) => setNotification({ ...notification, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="showing">Showing</SelectItem>
                    <SelectItem value="document">Document</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Recipients</label>
                <Select
                  value={notification.recipients}
                  onValueChange={(value) => setNotification({ ...notification, recipients: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select recipients" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="agents">Agents Only</SelectItem>
                    <SelectItem value="admins">Admins Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button type="submit" className="w-full">
                Send Notification
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
} 