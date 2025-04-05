"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { DashboardLayout } from "@/components/layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, Phone, Plus, Save } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { CallHistory } from "@/components/call-history"
import { Lead as BaseLeadType, Task, Showing } from "@/lib/types"
import { ShowingCalendar } from "@/components/showing-calendar"
import { TaskManager } from "@/components/task-manager"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

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
  { value: 'investor', label: 'Investor' },
  { value: 'commercial buyer', label: 'Commercial Buyer' },
  { value: 'seasonal investor', label: 'Seasonal Investor' },
  { value: 'first home buyer', label: 'First Home Buyer' },
  { value: 'custom buyer', label: 'Custom Buyer' },
];

type Gender = 'male' | 'female' | 'other' | 'prefer-not-to-say';

// Add propertyDetails type definition
interface PropertyDetails {
  lastClosedDate: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  squareFootage: number;
  yearBuilt: number;
  lotSize: string;
  parking: string;
  features: string[];
}

// Create a custom Lead type that extends the base Lead type
type Lead = BaseLeadType & {
  propertyDetails?: {
    lastClosedDate: string;
    propertyType: string;
    bedrooms: number;
    bathrooms: number;
    squareFootage: number;
    yearBuilt: number;
    lotSize: string;
    parking: string;
    features: string[];
  };
}

export default function LeadDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [leadData, setLeadData] = useState<Lead | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [newNote, setNewNote] = useState("")
  const [users, setUsers] = useState<{ _id: string; name: string }[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  useEffect(() => {
    fetchLead()
    fetchUsers()
  }, [params.leadId])

  const fetchLead = async () => {
    try {
      const leadId = params.leadId as string
      if (!leadId) return

      console.log('Fetching lead with ID:', leadId)
      const response = await fetch(`/api/leads/${leadId}`)
      const data = await response.json()

      if (!response.ok) {
        console.error('Error response:', data)
        throw new Error(data.error || "Failed to fetch lead")
      }

      console.log('Fetched lead data:', data)
      setLeadData(data)
    } catch (error) {
      console.error("Fetch lead error:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch lead details",
      })
      // Redirect back to leads page on error
      router.push('/lead')
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      const data = await response.json()
      
      // Ensure data is an array and has the correct shape
      if (Array.isArray(data)) {
        const validUsers = data.filter(user => 
          user && 
          typeof user === 'object' && 
          typeof user._id === 'string' && 
          typeof user.name === 'string'
        )
        setUsers(validUsers)
      } else {
        console.error('Invalid users data received:', data)
        setUsers([])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      setUsers([])
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch users",
      })
    }
  }

  const handleSubmit = async () => {
    if (!leadData) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/leads/${params.leadId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...leadData,
          location: leadData.location || '',  // Ensure location is a string
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update lead');
      }

      toast({
        title: "Success",
        description: "Lead updated successfully"
      });
      router.refresh();
    } catch (error) {
      console.error('Error updating lead:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update lead"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCall = () => {
    if (!leadData?.phone) return
    // Implement call functionality using Twilio
    const timestamp = new Date().toISOString()
    const newCall = {
      date: timestamp,
      duration: 0,
      recording: undefined
    }

    const updatedCallHistory = [...(leadData.callHistory || []), newCall]
    setLeadData({ ...leadData, callHistory: updatedCallHistory })

    toast({
      title: "Calling",
      description: `Initiating call to ${leadData.phone}`
    })
  }

  const addNote = async () => {
    if (!newNote.trim() || !leadData) return

    try {
      console.log('Adding note for lead:', params.leadId);
      const timestamp = new Date().toISOString()
      const updatedNotes = leadData.notes
        ? `${leadData.notes}\n\n${timestamp}: ${newNote}`
        : `${timestamp}: ${newNote}`

      // Only send the necessary update data
      const updateData = {
        notes: updatedNotes
      }

      const response = await fetch(`/api/leads/${params.leadId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData)
      })

      const data = await response.json()
      console.log('Response from server:', data);

      if (!response.ok) {
        throw new Error(data.error || "Failed to save note")
      }

      // Update the local state with the complete updated lead data
      setLeadData(data)
      setNewNote("")

      toast({
        title: "Success",
        description: "Note added successfully",
      })
    } catch (error) {
      console.error("Save note error:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save note",
      })
    }
  }

  const handlePropertyPreferencesUpdate = (preferences: Partial<Lead['propertyPreferences']>) => {
    if (!leadData) return;

    // Ensure all required fields are present with default values if missing
    const updatedPreferences: Lead['propertyPreferences'] = {
      budget: {
        min: preferences?.budget?.min ?? 0,
        max: preferences?.budget?.max ?? 0
      },
      propertyType: preferences?.propertyType ?? [],
      bedrooms: preferences?.bedrooms ?? 0,
      bathrooms: preferences?.bathrooms ?? 0,
      locations: preferences?.locations ?? [],
      features: preferences?.features ?? []
    };

    setLeadData({
      ...leadData,
      propertyPreferences: updatedPreferences
    });
  };

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
    const processedUpdates: Partial<Task> = {
      ...updates,
      date: updates.date ? (typeof updates.date === 'string' ? updates.date : (updates.date as Date).toISOString()) : new Date().toISOString()
    };

    const updatedTasks = leadData.tasks?.map(task =>
      task.id === taskId ? { ...task, ...processedUpdates } : task
    ) || [];

    const updatedData = {
      ...leadData,
      tasks: updatedTasks.map(task => ({
        ...task,
        date: typeof task.date === 'string' ? task.date : new Date().toISOString()
      }))
    } as Lead;
    setLeadData(updatedData as Lead | null);

    try {
      const response = await fetch(`/api/leads/${params.leadId}/tasks`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks: updatedTasks })
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

  const handleShowingUpdate = async (showingId: string, updates: Partial<Showing>) => {
    if (!leadData) return;

    // Ensure id is always a string and date is a Date object
    const processedUpdates: Partial<Showing> = {
      ...updates,
      id: showingId,
      date: updates.date ? (updates.date instanceof Date ? updates.date : new Date(updates.date)) : new Date()
    };

    const updatedShowings = leadData.showings?.map(showing =>
      showing.id === showingId ? { ...showing, ...processedUpdates } : showing
    ) || [];

    const updatedData = {
      ...leadData,
      showings: updatedShowings.map(showing => ({
        ...showing,
        id: showing.id || showingId,
        date: showing.date instanceof Date ? showing.date : new Date(showing.date)
      }))
    } as Lead;
    setLeadData(updatedData as Lead | null);

    try {
      const response = await fetch(`/api/leads/${params.leadId}/showings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showings: updatedShowings })
      });

      if (!response.ok) {
        throw new Error("Failed to update showing");
      }

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
  };

  const handleBudgetUpdate = (type: 'min' | 'max', value: number) => {
    if (!leadData) return;

    const currentBudget = leadData.propertyPreferences?.budget || { min: 0, max: 0 };
    const updatedBudget = {
      ...currentBudget,
      [type]: value
    };

    handlePropertyPreferencesUpdate({
      budget: updatedBudget
    });
  };

  if (!leadData) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Loading lead details...</h2>
            <p className="text-gray-500">Please wait while we fetch the information.</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="border-black text-black hover:bg-black hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Leads
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Lead Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                {/* Property Details */}
                <div className="border-t pt-4 mt-4">
                  <h3 className="text-lg font-medium mb-4">Property Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Property Type</Label>
                      <Input
                        value={leadData.propertyDetails?.propertyType ?? ''}
                        onChange={(e) => setLeadData({
                          ...leadData,
                          propertyDetails: {
                            lastClosedDate: leadData.propertyDetails?.lastClosedDate ?? '',
                            propertyType: e.target.value,
                            bedrooms: leadData.propertyDetails?.bedrooms ?? 0,
                            bathrooms: leadData.propertyDetails?.bathrooms ?? 0,
                            squareFootage: leadData.propertyDetails?.squareFootage ?? 0,
                            yearBuilt: leadData.propertyDetails?.yearBuilt ?? 0,
                            lotSize: leadData.propertyDetails?.lotSize ?? '',
                            parking: leadData.propertyDetails?.parking ?? '',
                            features: leadData.propertyDetails?.features ?? []
                          }
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Last Closed Date</Label>
                      <Input
                        type="date"
                        value={leadData.propertyDetails?.lastClosedDate ?? ''}
                        onChange={(e) => setLeadData({
                          ...leadData,
                          propertyDetails: {
                            lastClosedDate: e.target.value,
                            propertyType: leadData.propertyDetails?.propertyType ?? '',
                            bedrooms: leadData.propertyDetails?.bedrooms ?? 0,
                            bathrooms: leadData.propertyDetails?.bathrooms ?? 0,
                            squareFootage: leadData.propertyDetails?.squareFootage ?? 0,
                            yearBuilt: leadData.propertyDetails?.yearBuilt ?? 0,
                            lotSize: leadData.propertyDetails?.lotSize ?? '',
                            parking: leadData.propertyDetails?.parking ?? '',
                            features: leadData.propertyDetails?.features ?? []
                          }
                        })}
                      />
                    </div>
                  </div>
                </div>

                {/* Basic Information */}
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={leadData.name}
                    onChange={(e) => setLeadData({ ...leadData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={leadData.email}
                    onChange={(e) => setLeadData({ ...leadData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={leadData.phone}
                    onChange={(e) => setLeadData({ ...leadData, phone: e.target.value })}
                  />
                </div>

                {/* Assignment & Property */}
                <div className="border-t pt-4 mt-4">
                  <h3 className="text-lg font-medium mb-4">Assignment & Property</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Assigned To</Label>
                      <Select
                        value={leadData.assignedTo || 'unassigned'}
                        onValueChange={(value) => setLeadData({ ...leadData, assignedTo: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a user" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {users.map((user) => (
                            <SelectItem key={user._id} value={user._id}>
                              {user.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Location</Label>
                      <Input
                        value={leadData.location || ''}
                        onChange={(e) => setLeadData({
                          ...leadData,
                          location: e.target.value
                        })}
                      />
                    </div>
                  </div>
                </div>

                {/* Demographics */}
                <div className="border-t pt-4 mt-4">
                  <h3 className="text-lg font-medium mb-4">Demographics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Age</Label>
                      <Input
                        type="number"
                        value={leadData.age || ''}
                        onChange={(e) => setLeadData({ ...leadData, age: parseInt(e.target.value) || undefined })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Gender</Label>
                      <Select
                        value={(leadData.gender || '')}
                        onValueChange={(value: string) => setLeadData({
                          ...leadData,
                          gender: value as Gender
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                          <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Language</Label>
                      <Input
                        value={leadData.language || ''}
                        onChange={(e) => setLeadData({ ...leadData, language: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Religion</Label>
                      <Input
                        value={leadData.religion || ''}
                        onChange={(e) => setLeadData({ ...leadData, religion: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Sales Information */}
                <div className="border-t pt-4 mt-4">
                  <h3 className="text-lg font-medium mb-4">Sales Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Realtor Association Name</Label>
                      <Input
                        value={leadData.realtorAssociation?.name || ''}
                        onChange={(e) => setLeadData({
                          ...leadData,
                          realtorAssociation: {
                            ...leadData.realtorAssociation,
                            name: e.target.value,
                            membershipNumber: leadData.realtorAssociation?.membershipNumber || '',
                            joinDate: leadData.realtorAssociation?.joinDate || ''
                          }
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Membership Number</Label>
                      <Input
                        value={leadData.realtorAssociation?.membershipNumber || ''}
                        onChange={(e) => setLeadData({
                          ...leadData,
                          realtorAssociation: {
                            ...leadData.realtorAssociation,
                            name: leadData.realtorAssociation?.name || '',
                            membershipNumber: e.target.value,
                            joinDate: leadData.realtorAssociation?.joinDate || ''
                          }
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Join Date</Label>
                      <Input
                        type="date"
                        value={leadData.realtorAssociation?.joinDate || ''}
                        onChange={(e) => setLeadData({
                          ...leadData,
                          realtorAssociation: {
                            ...leadData.realtorAssociation,
                            name: leadData.realtorAssociation?.name || '',
                            membershipNumber: leadData.realtorAssociation?.membershipNumber || '',
                            joinDate: e.target.value
                          }
                        })}
                      />
                    </div>
                  </div>
                </div>

                {/* Closed Sales */}
                <div className="border-t pt-4 mt-4">
                  <h3 className="text-lg font-medium mb-4">Closed Sales</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Number of Sales</Label>
                      <Input
                        type="number"
                        value={leadData.closedSales?.count || 0}
                        onChange={(e) => setLeadData({
                          ...leadData,
                          closedSales: {
                            ...leadData.closedSales,
                            count: parseInt(e.target.value) || 0,
                            totalValue: leadData.closedSales?.totalValue || 0,
                            lastClosedDate: leadData.closedSales?.lastClosedDate || ''
                          }
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Total Value</Label>
                      <Input
                        type="number"
                        value={leadData.closedSales?.totalValue || 0}
                        onChange={(e) => setLeadData({
                          ...leadData,
                          closedSales: {
                            ...leadData.closedSales,
                            count: leadData.closedSales?.count || 0,
                            totalValue: parseInt(e.target.value) || 0,
                            lastClosedDate: leadData.closedSales?.lastClosedDate || ''
                          }
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Last Closed Date</Label>
                      <Input
                        type="date"
                        value={leadData.closedSales?.lastClosedDate || ''}
                        onChange={(e) => setLeadData({
                          ...leadData,
                          closedSales: {
                            ...leadData.closedSales,
                            count: leadData.closedSales?.count || 0,
                            totalValue: leadData.closedSales?.totalValue || 0,
                            lastClosedDate: e.target.value
                          }
                        })}
                      />
                    </div>
                  </div>
                </div>

                {/* Lead Status and Type */}
                <div className="border-t pt-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Lead Status</Label>
                      <Select
                        value={leadData.leadStatus || ''}
                        onValueChange={(value: string) => setLeadData({
                          ...leadData,
                          leadStatus: value as BaseLeadType['leadStatus']
                        })}
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
                        value={leadData.leadResponse || ''}
                        onValueChange={(value: string) => setLeadData({
                          ...leadData,
                          leadResponse: value as BaseLeadType['leadResponse']
                        })}
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
                  </div>
                </div>

                {/* Client Type */}
                <div className="space-y-2">
                  <Label>Client Type</Label>
                  <Select
                    value={leadData.clientType || ''}
                    onValueChange={(value: string) => setLeadData({
                      ...leadData,
                      clientType: value as BaseLeadType['clientType']
                    })}
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

                {/* Lead Type */}
                <div className="space-y-2">
                  <Label>Lead Type</Label>
                  <Select
                    value={leadData.leadType || ''}
                    onValueChange={(value: string) => setLeadData({
                      ...leadData,
                      leadType: value as BaseLeadType['leadType']
                    })}
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

                {/* Add Save Changes button at the bottom */}
                <div className="border-t pt-6 mt-6">
                  <Button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="w-full bg-[#ef4444] hover:bg-[#dc2626] text-white"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Communication</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" onClick={handleCall}>
                  <Phone className="h-4 w-4 mr-2" />
                  Make Call
                </Button>
                <CallHistory calls={leadData.callHistory || []} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Add a new note..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      onClick={addNote}
                      className="self-start"
                      disabled={!newNote.trim() || isLoading}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Note
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {leadData?.notes?.split('\n\n').map((note, index) => (
                      <div key={index} className="text-sm border-b pb-2">
                        {note}
                      </div>
                    ))}
                    {!leadData?.notes && (
                      <p className="text-sm text-gray-500">No notes yet</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Property Preferences</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Budget Range */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Budget Range</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="Min"
                          value={leadData.propertyPreferences?.budget?.min || ''}
                          onChange={(e) => handleBudgetUpdate('min', Number(e.target.value))}
                        />
                        <Input
                          type="number"
                          placeholder="Max"
                          value={leadData.propertyPreferences?.budget?.max || ''}
                          onChange={(e) => handleBudgetUpdate('max', Number(e.target.value))}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Property Type</Label>
                      <Select
                        value={leadData.propertyPreferences?.propertyType?.[0] || ''}
                        onValueChange={(value) => handlePropertyPreferencesUpdate({
                          ...leadData.propertyPreferences,
                          propertyType: [value]
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="detached">Detached</SelectItem>
                          <SelectItem value="semi-detached">Semi-Detached</SelectItem>
                          <SelectItem value="townhouse">Townhouse</SelectItem>
                          <SelectItem value="condo">Condo</SelectItem>
                          <SelectItem value="apartment">Apartment</SelectItem>
                          <SelectItem value="commercial">Commercial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Bedrooms and Bathrooms */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Bedrooms</Label>
                      <Input
                        type="number"
                        value={leadData.propertyPreferences?.bedrooms || ''}
                        onChange={(e) => handlePropertyPreferencesUpdate({
                          ...leadData.propertyPreferences,
                          bedrooms: Number(e.target.value)
                        })}
                        min="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Bathrooms</Label>
                      <Input
                        type="number"
                        value={leadData.propertyPreferences?.bathrooms || ''}
                        onChange={(e) => handlePropertyPreferencesUpdate({
                          ...leadData.propertyPreferences,
                          bathrooms: Number(e.target.value)
                        })}
                        min="0"
                      />
                    </div>
                  </div>

                  {/* Preferred Locations */}
                  <div className="space-y-2">
                    <Label>Preferred Locations</Label>
                    <div className="flex gap-2 flex-wrap">
                      <Input
                        placeholder="Add location and press Enter"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const input = e.currentTarget;
                            const location = input.value.trim();
                            if (location) {
                              const currentLocations = leadData.propertyPreferences?.locations || [];
                              handlePropertyPreferencesUpdate({
                                ...leadData.propertyPreferences,
                                locations: [...currentLocations, location]
                              });
                              input.value = '';
                            }
                          }
                        }}
                      />
                      <div className="flex flex-wrap gap-2 mt-2">
                        {leadData.propertyPreferences?.locations?.map((location, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="flex items-center gap-1"
                          >
                            {location}
                            <button
                              onClick={() => {
                                const updatedLocations = leadData.propertyPreferences?.locations?.filter(
                                  (_, i) => i !== index
                                ) || [];
                                handlePropertyPreferencesUpdate({
                                  ...leadData.propertyPreferences,
                                  locations: updatedLocations
                                });
                              }}
                              className="ml-1 hover:text-red-500"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-2">
                    <Label>Desired Features</Label>
                    <div className="flex gap-2 flex-wrap">
                      <Input
                        placeholder="Add feature and press Enter"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const input = e.currentTarget;
                            const feature = input.value.trim();
                            if (feature) {
                              const currentFeatures = leadData.propertyPreferences?.features || [];
                              handlePropertyPreferencesUpdate({
                                ...leadData.propertyPreferences,
                                features: [...currentFeatures, feature]
                              });
                              input.value = '';
                            }
                          }
                        }}
                      />
                      <div className="flex flex-wrap gap-2 mt-2">
                        {leadData.propertyPreferences?.features?.map((feature, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="flex items-center gap-1"
                          >
                            {feature}
                            <button
                              onClick={() => {
                                const updatedFeatures = leadData.propertyPreferences?.features?.filter(
                                  (_, i) => i !== index
                                ) || [];
                                handlePropertyPreferencesUpdate({
                                  ...leadData.propertyPreferences,
                                  features: updatedFeatures
                                });
                              }}
                              className="ml-1 hover:text-red-500"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Property Showings Card */}
            <Card>
              <CardHeader className="border-b">
                <div className="flex justify-between items-center">
                  <CardTitle>Property Showings</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-col space-y-8">
                  {/* Calendar Section */}
                  <ShowingCalendar
                    showings={leadData.showings || []}
                    onDateSelect={(date) => setSelectedDate(date || null)}
                    onAddShowing={async (showing) => {
                      const newShowing: Showing = {
                        id: showing.id || new Date().toISOString(),
                        date: showing.date instanceof Date ? showing.date : new Date(showing.date),
                        time: showing.time || '',
                        property: showing.property || '',
                        status: showing.status || 'scheduled',
                        notes: showing.notes || ''
                      };

                      const updatedShowings = [...(leadData.showings || []), newShowing];
                      setLeadData({
                        ...leadData,
                        showings: updatedShowings
                      });

                      // Set selected date to the new showing's date
                      setSelectedDate(newShowing.date);

                      try {
                        const response = await fetch(`/api/leads/${params.leadId}/showings`, {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ showings: updatedShowings })
                        });

                        if (!response.ok) {
                          throw new Error("Failed to schedule showing");
                        }

                        toast({
                          title: "Success",
                          description: "Showing scheduled successfully",
                        });
                      } catch (error) {
                        toast({
                          variant: "destructive",
                          title: "Error",
                          description: "Failed to schedule showing",
                        });
                      }
                    }}
                    onUpdateShowing={handleShowingUpdate}
                  />

                  {/* Showings List Section */}
                  <div className="w-full">
                    <h3 className="text-lg font-medium mb-4">All Upcoming Showings</h3>
                    <div className="space-y-4">
                      {leadData.showings?.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                        .filter(showing => new Date(showing.date) >= new Date())
                        .map((showing) => (
                          <div key={showing.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium">{showing.property}</p>
                              <p className="text-sm text-gray-500">
                                {new Date(showing.date).toLocaleDateString()} at {showing.time}
                              </p>
                              {showing.notes && (
                                <p className="text-sm text-gray-600 mt-1">{showing.notes}</p>
                              )}
                            </div>
                            <Badge variant={showing.status === 'scheduled' ? 'default' : 'secondary'}>
                              {showing.status}
                            </Badge>
                          </div>
                        ))}
                      {(!leadData.showings || leadData.showings.length === 0) && (
                        <p className="text-gray-500 text-center">No upcoming showings scheduled</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <TaskManager
                  tasks={leadData.tasks || []}
                  onAddTask={async (task) => {
                    // Ensure task has required fields and date is a string
                    const newTask: Task = {
                      id: task.id || new Date().toISOString(),
                      title: task.title,
                      date: task.date instanceof Date ? task.date.toISOString() : task.date,
                      description: task.description,
                      status: task.status || 'pending',
                      priority: task.priority || 'medium'
                    };

                    const updatedTasks = [...(leadData.tasks || []), newTask];
                    const updatedData = {
                      ...leadData,
                      tasks: updatedTasks
                    } as Lead;
                    setLeadData(updatedData);

                    try {
                      const response = await fetch(`/api/leads/${params.leadId}/tasks`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ tasks: updatedTasks })
                      });

                      if (!response.ok) {
                        throw new Error("Failed to add task");
                      }

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
                  onUpdateTask={handleTaskUpdate}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
} 