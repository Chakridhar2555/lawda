"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { motion } from "framer-motion"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface NotificationPreferences {
  emailAlerts: boolean
  smsAlerts: boolean
  leadNotifications: boolean
  showingReminders: boolean
  marketUpdates: boolean
  documentAlerts: boolean
}

export default function NotificationsPage() {
  const [message, setMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const { toast } = useToast()
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailAlerts: true,
    smsAlerts: true,
    leadNotifications: true,
    showingReminders: true,
    marketUpdates: true,
    documentAlerts: true
  })

  const handleSendNotification = async () => {
    if (!message.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a message",
      })
      return
    }

    setIsSending(true)
    try {
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sendToAllUsers: true,
          message: message,
          type: "info"
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send notification")
      }

      toast({
        title: "Success",
        description: data.message,
      })

      setMessage("")
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send notification",
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleTogglePreference = (key: keyof NotificationPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <motion.h1
          className="text-2xl font-bold"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Notification Settings
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Broadcast Message</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Textarea
                  placeholder="Enter your message here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
                <p className="text-sm text-muted-foreground">
                  This message will be sent to all users with the role "User".
                </p>
              </div>
              <Button
                onClick={handleSendNotification}
                disabled={isSending}
                className="bg-red-500 hover:bg-red-600"
              >
                {isSending ? "Sending..." : "Send to All Users"}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive important updates via email
                    </p>
                  </div>
                  <Switch
                    checked={preferences.emailAlerts}
                    onCheckedChange={() => handleTogglePreference('emailAlerts')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>SMS Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notifications via text message
                    </p>
                  </div>
                  <Switch
                    checked={preferences.smsAlerts}
                    onCheckedChange={() => handleTogglePreference('smsAlerts')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Lead Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified about new leads and updates
                    </p>
                  </div>
                  <Switch
                    checked={preferences.leadNotifications}
                    onCheckedChange={() => handleTogglePreference('leadNotifications')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Showing Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive reminders for property showings
                    </p>
                  </div>
                  <Switch
                    checked={preferences.showingReminders}
                    onCheckedChange={() => handleTogglePreference('showingReminders')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Market Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Stay informed about market changes
                    </p>
                  </div>
                  <Switch
                    checked={preferences.marketUpdates}
                    onCheckedChange={() => handleTogglePreference('marketUpdates')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Document Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified about document updates
                    </p>
                  </div>
                  <Switch
                    checked={preferences.documentAlerts}
                    onCheckedChange={() => handleTogglePreference('documentAlerts')}
                  />
                </div>
              </div>

              <Button className="w-full bg-red-500 hover:bg-red-600">
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  )
} 