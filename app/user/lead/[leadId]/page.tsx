"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Phone, Mail, MapPin, Calendar, History, FileText, MessageSquare } from "lucide-react"
import { CallHistory } from "@/components/call-history"
import { ShowingCalendar } from "@/components/showing-calendar"
import { TaskManager } from "@/components/task-manager"
import type { Lead, Task, Showing } from "@/lib/types"
import { formatDate } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ExtendedLead extends Lead {
  source?: string;
  address?: string;
  createdAt?: string;
}

const leadStatuses = [
  { value: 'cold', label: 'Cold' },
  { value: 'warm', label: 'Warm' },
  { value: 'hot', label: 'Hot' },
  { value: 'mild', label: 'Mild' },
];

const leadResponses = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'not answering', label: 'Not Answering' },
  { value: 'not actively answering', label: 'Not Actively Answering' },
  { value: 'always responding', label: 'Always Responding' },
];

const leadSources = [
  { value: 'google ads', label: 'Google Ads' },
  { value: 'meta', label: 'Meta' },
  { value: 'refferal', label: 'Refferal' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'youtube', label: 'YouTube' },
];

const leadTypes = [
  { value: 'Pre construction', label: 'Pre Construction' },
  { value: 'resale', label: 'Resale' },
  { value: 'seller', label: 'Seller' },
  { value: 'buyer', label: 'Buyer' },
];

const clientTypes = [
  { value: 'Investor', label: 'Investor' },
  { value: 'custom buyer', label: 'Custom Buyer' },
  { value: 'first home buyer', label: 'First Home Buyer' },
  { value: 'seasonal investor', label: 'Seasonal Investor' },
  { value: 'commercial buyer', label: 'Commercial Buyer' },
];

export default function UserLeadDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [leadData, setLeadData] = useState<ExtendedLead | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [newNote, setNewNote] = useState("")

  useEffect(() => {
    fetchLead()
  }, [params.leadId])

  const fetchLead = async () => {
    try {
      const leadId = params.leadId as string
      if (!leadId) return

      const response = await fetch(`/api/leads/${leadId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch lead")
      }

      setLeadData(data)
      setIsLoading(false)
    } catch (error) {
      console.error("Error fetching lead:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch lead details",
      })
      router.push("/user/leads")
    }
  }

  const handleCall = async () => {
    if (!leadData) return
    
    try {
      const response = await fetch("/api/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          leadId: leadData._id,
          phoneNumber: leadData.phone 
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to initiate call")
      }

      toast({
        title: "Call Initiated",
        description: "Connecting your call...",
      })
      
      fetchLead()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to initiate call",
      })
    }
  }

  const addNote = async () => {
    if (!newNote.trim() || !leadData) return

    try {
      const response = await fetch(`/api/leads/${leadData._id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: newNote }),
      })

      if (!response.ok) {
        throw new Error("Failed to add note")
      }

      toast({
        title: "Success",
        description: "Note added successfully",
      })

      setNewNote("")
      fetchLead()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add note",
      })
    }
  }

  const handleTaskUpdate = async (taskId: string, updates: Partial<{
    id: string;
    title: string;
    date: string | Date;
    description?: string;
    status: 'pending' | 'completed' | 'cancelled';
    priority: 'low' | 'medium' | 'high';
  }>) => {
    if (!leadData) return;

    // Convert Date to string if present
    const processedUpdates = {
      ...updates,
      date: updates.date ? (typeof updates.date === 'string' ? updates.date : updates.date.toISOString()) : new Date().toISOString()
    };

    const updatedTasks = leadData.tasks?.map(task =>
      task.id === taskId ? { ...task, ...processedUpdates } : task
    ) || [];
    
    // Ensure all dates are strings and tasks have required fields
    const normalizedTasks = updatedTasks.map((task: {
      id: string;
      title: string;
      date: string | Date;
      description?: string;
      status: 'pending' | 'completed' | 'cancelled';
      priority: 'low' | 'medium' | 'high';
    }) => ({
      id: task.id,
      title: task.title,
      date: typeof task.date === 'string' ? task.date : (task.date as Date).toISOString(),
      description: task.description,
      status: task.status || 'pending',
      priority: task.priority || 'medium'
    }));

    const updatedData = {
      ...leadData,
      tasks: normalizedTasks
    } as Lead;
    setLeadData(updatedData);

    try {
      const response = await fetch(`/api/leads/${params.leadId}/tasks`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks: normalizedTasks })
      });

      if (!response.ok) {
        throw new Error("Failed to update task");
      }

      // Trigger a refresh of the leads list to update metrics
      window.dispatchEvent(new Event('storage'));

      toast({
        title: "Success",
        description: "Task updated successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update task",
      });
    }
  };

  if (isLoading || !leadData) {
    return (
      <div className="p-6 animate-pulse">
        <div className="h-8 w-48 bg-gray-800 rounded mb-6"></div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-800 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">{leadData.name}</h1>
          <p className="text-gray-400">{leadData.email}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/user/leads")}
            className="border-gray-600 hover:bg-gray-700"
          >
            Back to Leads
          </Button>
          <Button onClick={handleCall} className="bg-red-500 hover:bg-red-600">
            <Phone className="h-4 w-4 mr-2" />
            Call Lead
          </Button>
        </div>
      </div>

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList className="bg-gray-800 border-gray-700">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="showings">Showings</TabsTrigger>
          <TabsTrigger value="history">Call History</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-100">Lead Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Lead Status</Label>
                  <Select
                    value={leadData.leadStatus}
                    onValueChange={(value) => setLeadData({ ...leadData, leadStatus: value as Lead['leadStatus'] })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select lead status" />
                    </SelectTrigger>
                    <SelectContent>
                      {leadStatuses.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Lead Response</Label>
                  <Select
                    value={leadData.leadResponse}
                    onValueChange={(value) => setLeadData({ ...leadData, leadResponse: value as Lead['leadResponse'] })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select lead response" />
                    </SelectTrigger>
                    <SelectContent>
                      {leadResponses.map((response) => (
                        <SelectItem key={response.value} value={response.value}>
                          {response.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Lead Source</Label>
                  <Select
                    value={leadData.leadSource}
                    onValueChange={(value) => setLeadData({ ...leadData, leadSource: value as Lead['leadSource'] })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select lead source" />
                    </SelectTrigger>
                    <SelectContent>
                      {leadSources.map((source) => (
                        <SelectItem key={source.value} value={source.value}>
                          {source.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Lead Type</Label>
                  <Select
                    value={leadData.leadType}
                    onValueChange={(value) => setLeadData({ ...leadData, leadType: value as Lead['leadType'] })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select lead type" />
                    </SelectTrigger>
                    <SelectContent>
                      {leadTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Client Type</Label>
                  <Select
                    value={leadData.clientType}
                    onValueChange={(value) => setLeadData({ ...leadData, clientType: value as Lead['clientType'] })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select client type" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-gray-400">Source</Label>
                  <div className="text-gray-100">{leadData.source || 'N/A'}</div>
                </div>
                <div className="space-y-1">
                  <Label className="text-gray-400">Phone</Label>
                  <div className="text-gray-100">{leadData.phone}</div>
                </div>
                <div className="space-y-1">
                  <Label className="text-gray-400">Email</Label>
                  <div className="text-gray-100">{leadData.email}</div>
                </div>
                <div className="space-y-1">
                  <Label className="text-gray-400">Address</Label>
                  <div className="text-gray-100">{leadData.address || 'N/A'}</div>
                </div>
                <div className="space-y-1">
                  <Label className="text-gray-400">Created</Label>
                  <div className="text-gray-100">
                    {leadData.createdAt ? formatDate(leadData.createdAt) : formatDate(leadData.date)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-100">Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <TaskManager
                tasks={leadData.tasks || []}
                onUpdateTask={handleTaskUpdate}
                onAddTask={async (task: {
                  id: string;
                  title: string;
                  date: string | Date;
                  description?: string;
                  status: 'pending' | 'completed' | 'cancelled';
                  priority: 'low' | 'medium' | 'high';
                }) => {
                  if (!leadData) return;
                  const normalizedTask = {
                    ...task,
                    date: typeof task.date === 'string' ? task.date : task.date.toISOString()
                  };
                  const updatedTasks = [...(leadData.tasks || []), normalizedTask];
                  try {
                    const response = await fetch(`/api/leads/${leadData._id}/tasks`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(normalizedTask),
                    });

                    if (!response.ok) {
                      throw new Error("Failed to add task");
                    }

                    setLeadData({ ...leadData, tasks: updatedTasks });
                    toast({
                      title: "Success",
                      description: "Task added successfully",
                    });
                  } catch (error) {
                    toast({
                      variant: "destructive",
                      title: "Error",
                      description: "Failed to add task",
                    });
                  }
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="showings">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-100">Property Showings</CardTitle>
            </CardHeader>
            <CardContent>
              <ShowingCalendar
                showings={leadData.showings || []}
                onAddShowing={async (showing) => {
                  if (!leadData) return;
                  const updatedShowings = [...(leadData.showings || []), showing];
                  try {
                    const response = await fetch(`/api/leads/${leadData._id}/showings`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(showing),
                    });

                    if (!response.ok) {
                      throw new Error("Failed to add showing");
                    }

                    await fetchLead();
                    toast({
                      title: "Success",
                      description: "Showing added successfully",
                    });
                  } catch (error) {
                    toast({
                      variant: "destructive",
                      title: "Error",
                      description: "Failed to add showing",
                    });
                  }
                }}
                onUpdateShowing={async (showingId, updates) => {
                  if (!leadData) return;
                  try {
                    const response = await fetch(`/api/leads/${leadData._id}/showings/${showingId}`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(updates),
                    });

                    if (!response.ok) {
                      throw new Error("Failed to update showing");
                    }

                    await fetchLead();
                    toast({
                      title: "Success",
                      description: "Showing updated successfully",
                    });
                  } catch (error) {
                    toast({
                      variant: "destructive",
                      title: "Error",
                      description: "Failed to update showing",
                    });
                  }
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-100">Call History</CardTitle>
            </CardHeader>
            <CardContent>
              <CallHistory calls={leadData.callHistory || []} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-100">Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note..."
                  className="bg-gray-700 border-gray-600"
                />
                <Button onClick={addNote} className="bg-red-500 hover:bg-red-600">
                  Add Note
                </Button>
              </div>
              <div className="space-y-4">
                {leadData.notes && leadData.notes.split('\n').map((note, index) => (
                  <div key={index} className="p-3 bg-gray-700 rounded-lg text-gray-100">
                    {note}
                  </div>
                ))}
                {!leadData.notes && (
                  <p className="text-center text-gray-500">No notes available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 