"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { v4 as uuidv4 } from 'uuid'
import type { Lead } from "@/lib/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const leadStatuses = [
  { value: 'cold', label: 'Cold' },
  { value: 'warm', label: 'Warm' },
  { value: 'hot', label: 'Hot' },
  { value: 'mild', label: 'Mild' },
];

const leadTypes = [
  { value: 'Pre construction', label: 'Pre Construction' },
  { value: 'resale', label: 'Resale' },
  { value: 'seller', label: 'Seller' },
  { value: 'buyer', label: 'Buyer' },
];

interface LeadStrategy {
  lastUpdated: string;
  tasks: any[];
  notes: string;
}

interface ExtendedLead extends Lead {
  strategy?: LeadStrategy;
}

type LeadStatus = 'cold' | 'warm' | 'hot' | 'mild';
type LeadType = 'Pre construction' | 'resale' | 'seller' | 'buyer';

interface LeadFormData {
  name: string;
  email: string;
  phone: string;
  leadStatus: LeadStatus;
  leadType: LeadType;
  property: string;
  notes: string;
  assignedTo: string;
}

interface LeadFormProps {
  open: boolean;
  onClose?: () => void;
}

export function LeadForm({ open, onClose }: LeadFormProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [users, setUsers] = useState<{ _id: string; name: string }[]>([])
  const [leadData, setLeadData] = useState<LeadFormData>({
    name: "",
    email: "",
    phone: "",
    leadStatus: "cold",
    leadType: "buyer",
    property: "",
    notes: "",
    assignedTo: "unassigned",
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      const data = await response.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error('Error fetching users:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch users",
      })
      setUsers([])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const newLead: Partial<ExtendedLead> = {
        name: leadData.name,
        email: leadData.email,
        phone: leadData.phone,
        leadStatus: leadData.leadStatus,
        leadType: leadData.leadType,
        property: leadData.property,
        notes: leadData.notes,
        assignedTo: leadData.assignedTo === "unassigned" ? undefined : leadData.assignedTo,
        date: new Date().toISOString(),
        callHistory: [],
        tasks: [],
        propertyPreferences: {
          budget: {
            min: 0,
            max: 0
          },
          propertyType: [],
          bedrooms: 0,
          bathrooms: 0,
          locations: [],
          features: []
        },
        leadResponse: "inactive",
        leadSource: "google ads",
        clientType: "custom buyer"
      }

      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newLead),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create lead')
      }

      toast({
        title: "Success",
        description: "Lead added successfully.",
      })

      // Reset form
      setLeadData({
        name: "",
        email: "",
        phone: "",
        leadStatus: "cold",
        leadType: "buyer",
        property: "",
        notes: "",
        assignedTo: "unassigned",
      })

      // Close dialog and refresh the leads
      onClose?.()
      window.location.reload()
    } catch (error) {
      console.error('Error creating lead:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add lead. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Lead</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              required
              value={leadData.name}
              onChange={(e) => setLeadData({ ...leadData, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={leadData.email}
                onChange={(e) => setLeadData({ ...leadData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                required
                value={leadData.phone}
                onChange={(e) => setLeadData({ ...leadData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={leadData.leadStatus}
                onValueChange={(value) => setLeadData({ ...leadData, leadStatus: value as LeadStatus })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
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
              <Label htmlFor="type">Lead Type</Label>
              <Select
                value={leadData.leadType}
                onValueChange={(value) => setLeadData({ ...leadData, leadType: value as LeadType })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
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
          </div>

          <div className="space-y-2">
            <Label>Assigned To</Label>
            <Select
              value={leadData.assignedTo}
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
            <Label htmlFor="property">Property</Label>
            <Input
              id="property"
              required
              value={leadData.property}
              onChange={(e) => setLeadData({ ...leadData, property: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={leadData.notes}
              onChange={(e) => setLeadData({ ...leadData, notes: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Lead"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 