"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CallHistory } from "@/components/call-history"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Phone, Mail, Home, Calendar, ClipboardList, PlusCircle, Plus, Upload, Info, History, Search, Filter } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { StrategyPlanner } from "@/components/strategy-planner"
import { format } from "date-fns"
import type { Lead, Task } from "@/lib/types"
import { useRouter } from "next/navigation"
import { formatDate } from "@/lib/utils"
import { parseExcelLeads } from "@/lib/excel-utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { TaskManager } from "@/components/task-manager"
import { LeadForm } from "@/components/lead-form"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DatePicker } from "@/components/ui/date-picker"
import { Slider } from "@/components/ui/slider"
import { CustomSelect } from "@/components/ui/custom-select"

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
  { value: 'refferal', label: 'Referral' },
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

const locations = [
  { value: 'downtown', label: 'Downtown' },
  { value: 'north-york', label: 'North York' },
  { value: 'scarborough', label: 'Scarborough' },
  { value: 'etobicoke', label: 'Etobicoke' },
  { value: 'mississauga', label: 'Mississauga' },
  { value: 'brampton', label: 'Brampton' },
  { value: 'markham', label: 'Markham' },
  { value: 'vaughan', label: 'Vaughan' },
];

const languages = [
  { value: 'english', label: 'English' },
  { value: 'french', label: 'French' },
  { value: 'spanish', label: 'Spanish' },
  { value: 'mandarin', label: 'Mandarin' },
  { value: 'cantonese', label: 'Cantonese' },
  { value: 'hindi', label: 'Hindi' },
  { value: 'punjabi', label: 'Punjabi' },
  { value: 'urdu', label: 'Urdu' },
];

const genders = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer-not-to-say', label: 'Prefer not to say' },
];

const religions = [
  { value: 'christianity', label: 'Christianity' },
  { value: 'islam', label: 'Islam' },
  { value: 'hinduism', label: 'Hinduism' },
  { value: 'sikhism', label: 'Sikhism' },
  { value: 'buddhism', label: 'Buddhism' },
  { value: 'judaism', label: 'Judaism' },
  { value: 'other', label: 'Other' },
  { value: 'none', label: 'None' },
];

const LEAD_STATUSES = ['All Leads', 'Hot Leads', 'Warm Leads', 'Cold Leads', 'Mild Leads'] as const
const LOCATIONS = ['All Locations', 'Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa'] as const
const LANGUAGES = ['English', 'French', 'Spanish', 'Mandarin', 'Hindi', 'Other'] as const
const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'] as const
const RELIGIONS = ['Christianity', 'Islam', 'Hinduism', 'Buddhism', 'Sikhism', 'Judaism', 'Other', 'Prefer not to say'] as const

type LeadStatus = typeof LEAD_STATUSES[number]
type Location = typeof LOCATIONS[number]
type Language = typeof LANGUAGES[number]
type Gender = typeof GENDERS[number]
type Religion = typeof RELIGIONS[number]

interface Filters {
  leadConversion: 'converted' | 'not-converted' | null
  language: Language | null
  gender: Gender | null
  religion: Religion | null
  ageRange: [number, number]
  realtorAssociation: string
  salesRange: [number, number]
  lastClosedDateRange: [Date | null, Date | null]
  leadStatus: string | null
  leadType: string | null
  assignedTo: string | null
}

export function LeadListing() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [mounted, setMounted] = useState(false)
  const [status, setStatus] = useState<LeadStatus>("All Leads")
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)
  const router = useRouter()
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [users, setUsers] = useState<{ _id: string; name: string }[]>([])
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false)
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<Location>("All Locations")
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus>("All Leads")
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<Filters>({
    leadConversion: null,
    language: null,
    gender: null,
    religion: null,
    ageRange: [20, 70],
    realtorAssociation: '',
    salesRange: [0, 1000000],
    lastClosedDateRange: [null, null],
    leadStatus: null,
    leadType: null,
    assignedTo: null
  })
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    setMounted(true)
    fetchLeads()
    fetchUsers()
  }, [])

  useEffect(() => {
    if (mounted) {
      fetchLeads()
      
      // Listen for storage changes
      const handleStorageChange = () => {
        const updatedLeads = JSON.parse(localStorage.getItem('leads') || '[]')
        setLeads(updatedLeads)
      }

      window.addEventListener('storage', handleStorageChange)
      return () => {
        window.removeEventListener('storage', handleStorageChange)
      }
    }
  }, [mounted])

  const fetchLeads = async () => {
    try {
      setLoading(true)
      
      // Fetch leads from MongoDB
      const response = await fetch("/api/leads")
      if (!response.ok) {
        throw new Error("Failed to fetch leads")
      }
      
      const leads = await response.json()
      
      // Update both state and localStorage
      setLeads(leads)
      localStorage.setItem('leads', JSON.stringify(leads))
      
    } catch (error) {
      console.error("Fetch leads error:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch leads. Please try again.",
      })
      
      // Fallback to localStorage if API fails
      const storedLeads = JSON.parse(localStorage.getItem('leads') || '[]')
      setLeads(storedLeads)
    } finally {
      setLoading(false)
    }
  }

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

  const getUserName = (userId: string) => {
    const user = users.find(u => u._id === userId)
    return user ? user.name : 'Unassigned'
  }

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    try {
      const response = await fetch("/api/leads", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: leadId, status: newStatus }),
      })

      if (!response.ok) throw new Error("Failed to update status")

      toast({
        title: "Success",
        description: "Lead status updated successfully",
      })
      fetchLeads()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update lead status",
      })
    }
  }

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      new: "bg-blue-100 text-blue-800",
      contacted: "bg-yellow-100 text-yellow-800",
      qualified: "bg-green-100 text-green-800",
      proposal: "bg-purple-100 text-purple-800",
      negotiation: "bg-orange-100 text-orange-800",
      closed: "bg-gray-100 text-gray-800"
    }
    return statusColors[status] || statusColors.new
  }

  const handleCall = async (leadId: string, phoneNumber: string) => {
    try {
      const response = await fetch("/api/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, phoneNumber }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to initiate call")
      }

      toast({
        title: "Call Initiated",
        description: "Connecting your call...",
      })
      
      // Refresh leads to show updated call history
      fetchLeads()
    } catch (error) {
      console.error("Call error:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to initiate call. Please try again.",
      })
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Parse Excel file
      const importedLeads = await parseExcelLeads(file);
      
      // Save to MongoDB
      const response = await fetch("/api/leads/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leads: importedLeads }),
      });

      if (!response.ok) {
        throw new Error("Failed to save leads to database");
      }

      // Get existing leads from localStorage
      const existingLeads = JSON.parse(localStorage.getItem('leads') || '[]');
      
      // Merge new leads with existing ones
      const updatedLeads = [...existingLeads, ...importedLeads];
      
      // Save to localStorage
      localStorage.setItem('leads', JSON.stringify(updatedLeads));
      
      // Refresh leads display
      fetchLeads();
      
      toast({
        title: "Success",
        description: `${importedLeads.length} leads imported successfully`,
      });
    } catch (error) {
      console.error('Import error:', error);
      toast({
        variant: "destructive",
        title: "Import Failed",
        description: "Failed to import leads. Please check the file format and try again.",
      });
    } finally {
      // Clear the file input
      event.target.value = '';
    }
  };

  const handleTaskUpdate = async (leadId: string, tasks: Task[]) => {
    try {
      const response = await fetch(`/api/leads/${leadId}/tasks`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks })
      });

      if (!response.ok) {
        throw new Error("Failed to update tasks");
      }

      // Update local state
      setLeads(leads.map(lead => 
        lead._id === leadId ? { ...lead, tasks } : lead
      ));

      toast({
        title: "Success",
        description: "Tasks updated successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update tasks",
      });
    }
  };

  const getLeadStatusColor = (status?: Lead['leadStatus']) => {
    const colors: Record<string, string> = {
      hot: "bg-red-500 text-white",
      warm: "bg-yellow-500 text-white",
      cold: "bg-blue-500 text-white",
      mild: "bg-green-500 text-white"
    }
    return colors[status || 'cold'] || colors.cold
  }

  const getLeadTypeColor = (type?: Lead['leadType']) => {
    const colors: Record<string, string> = {
      'Pre construction': "bg-purple-500 text-white",
      'resale': "bg-indigo-500 text-white",
      'seller': "bg-pink-500 text-white",
      'buyer': "bg-orange-500 text-white"
    }
    return colors[type || 'buyer'] || colors.buyer
  }

  const filteredLeads = leads.filter(lead => {
    // Status filter
    if (selectedStatus !== 'All Leads' && lead.leadStatus?.toLowerCase() !== selectedStatus.split(' ')[0].toLowerCase()) {
      return false
    }

    // Location filter
    if (selectedLocation !== 'All Locations' && lead.location !== selectedLocation) {
      return false
    }

    // Search query
    const searchLower = searchQuery.toLowerCase()
    const leadName = lead.name || ''
    if (searchQuery && !leadName.toLowerCase().includes(searchLower)) {
      return false
    }

    // New filters
    if (filters.leadStatus && lead.leadStatus !== filters.leadStatus) {
      return false
    }
    if (filters.leadType && lead.leadType !== filters.leadType) {
      return false
    }
    if (filters.assignedTo && lead.assignedTo !== filters.assignedTo) {
      return false
    }

    // Existing filters
    if (filters.leadConversion && lead.leadConversion !== filters.leadConversion) {
      return false
    }
    if (filters.language && lead.language !== filters.language) {
      return false
    }
    if (filters.gender && lead.gender !== filters.gender.toLowerCase()) {
      return false
    }
    if (filters.religion && lead.religion !== filters.religion) {
      return false
    }
    if (lead.age && (lead.age < filters.ageRange[0] || lead.age > filters.ageRange[1])) {
      return false
    }
    if (filters.realtorAssociation && !lead.realtorAssociation?.name.includes(filters.realtorAssociation)) {
      return false
    }
    if (lead.closedSales?.totalValue && 
        (lead.closedSales.totalValue < filters.salesRange[0] || 
         lead.closedSales.totalValue > filters.salesRange[1])) {
      return false
    }
    if (filters.lastClosedDateRange[0] && filters.lastClosedDateRange[1] && lead.closedSales?.lastClosedDate) {
      const lastClosedDate = new Date(lead.closedSales.lastClosedDate)
      if (lastClosedDate < filters.lastClosedDateRange[0] || lastClosedDate > filters.lastClosedDateRange[1]) {
        return false
      }
    }

    return true
  })

  // Only render table content after mounting
  if (!mounted) {
    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Leads</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody />
          </Table>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <CardTitle>Lead Management</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="text-red-500 border-red-500 hover:bg-red-50">
                <Phone className="h-4 w-4 mr-2" />
                No Calls (1918)
              </Button>
              <Button variant="outline" className="text-blue-500 border-blue-500 hover:bg-blue-50">
                <Home className="h-4 w-4 mr-2" />
                Website Enquiries (0)
              </Button>
              <Button variant="outline" className="text-green-500 border-green-500 hover:bg-green-50">
                <Upload className="h-4 w-4 mr-2" />
                Import Leads
              </Button>
            </div>
          </div>

          {/* Status Buttons */}
          <div className="flex flex-wrap gap-2">
            {LEAD_STATUSES.map(status => (
              <Button
                key={status}
                variant={selectedStatus === status ? "default" : "outline"}
                className={selectedStatus === status 
                  ? "bg-red-500 hover:bg-red-600 text-white" 
                  : "text-gray-700 hover:bg-gray-50"}
                onClick={() => setSelectedStatus(status)}
              >
                {status}
              </Button>
            ))}
          </div>

          {/* Location Buttons */}
          <div className="flex flex-wrap gap-2">
            {LOCATIONS.map(location => (
              <Button
                key={location}
                variant={selectedLocation === location ? "default" : "outline"}
                className={selectedLocation === location 
                  ? "bg-red-500 hover:bg-red-600 text-white" 
                  : "text-gray-700 hover:bg-gray-50"}
                onClick={() => setSelectedLocation(location)}
              >
                {location}
              </Button>
            ))}
          </div>

          {/* Search and Filter Controls */}
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button 
              variant="outline"
              className="flex items-center gap-2 text-gray-700 hover:bg-gray-50"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Filter Panel */}
      {showFilters && (
        <div className="p-4 border-b bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <CustomSelect
                label="Lead Status"
                value={filters.leadStatus}
                onValueChange={(value) => 
                  setFilters(prev => ({ ...prev, leadStatus: value }))
                }
                options={leadStatuses.map(status => status.value)}
                className="w-full"
                renderOption={(value) => 
                  leadStatuses.find(s => s.value === value)?.label || value
                }
              />
            </div>

            <div className="space-y-2">
              <CustomSelect
                label="Lead Type"
                value={filters.leadType}
                onValueChange={(value) => 
                  setFilters(prev => ({ ...prev, leadType: value }))
                }
                options={leadTypes.map(type => type.value)}
                className="w-full"
                renderOption={(value) => 
                  leadTypes.find(t => t.value === value)?.label || value
                }
              />
            </div>

            <div className="space-y-2">
              <CustomSelect
                label="Assigned To"
                value={filters.assignedTo}
                onValueChange={(value) => 
                  setFilters(prev => ({ ...prev, assignedTo: value }))
                }
                options={['unassigned', ...users.map(user => user._id)] as const}
                className="w-full"
                placeholder="Select Agent"
                renderOption={(value) => {
                  if (value === 'unassigned') return 'Unassigned'
                  const user = users.find(u => u._id === value)
                  return user ? user.name : value
                }}
              />
            </div>

            <div className="space-y-2">
              <CustomSelect
                label="Lead Conversion"
                value={filters.leadConversion}
                onValueChange={(value) => 
                  setFilters(prev => ({ ...prev, leadConversion: value }))
                }
                options={['converted', 'not-converted'] as const}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <CustomSelect
                label="Language"
                value={filters.language}
                onValueChange={(value) => 
                  setFilters(prev => ({ ...prev, language: value }))
                }
                options={LANGUAGES}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <CustomSelect
                label="Gender"
                value={filters.gender}
                onValueChange={(value) => 
                  setFilters(prev => ({ ...prev, gender: value }))
                }
                options={GENDERS}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <CustomSelect
                label="Religion"
                value={filters.religion}
                onValueChange={(value) => 
                  setFilters(prev => ({ ...prev, religion: value }))
                }
                options={RELIGIONS}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Age Range</label>
              <Slider
                min={20}
                max={70}
                value={filters.ageRange}
                onValueChange={(value: [number, number]) => 
                  setFilters(prev => ({ ...prev, ageRange: value }))
                }
                className="py-4"
              />
              <div className="flex justify-between text-sm text-gray-500">
                <span>{filters.ageRange[0]} years</span>
                <span>{filters.ageRange[1]} years</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Realtor Association</label>
              <Input
                value={filters.realtorAssociation}
                onChange={(e) => setFilters(prev => ({ ...prev, realtorAssociation: e.target.value }))}
                placeholder="Search by association"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Sales Range</label>
              <Slider
                min={0}
                max={1000000}
                step={10000}
                value={filters.salesRange}
                onValueChange={(value: [number, number]) => 
                  setFilters(prev => ({ ...prev, salesRange: value }))
                }
                className="py-4"
              />
              <div className="flex justify-between text-sm text-gray-500">
                <span>${filters.salesRange[0].toLocaleString()}</span>
                <span>${filters.salesRange[1].toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Last Closed Date Range</label>
              <div className="flex space-x-2">
                <DatePicker
                  selected={filters.lastClosedDateRange[0]}
                  onChange={(date) => setFilters(prev => ({
                    ...prev,
                    lastClosedDateRange: [date, prev.lastClosedDateRange[1]]
                  }))}
                  placeholderText="Start Date"
                  className="flex-1"
                />
                <DatePicker
                  selected={filters.lastClosedDateRange[1]}
                  onChange={(date) => setFilters(prev => ({
                    ...prev,
                    lastClosedDateRange: [prev.lastClosedDateRange[0], date]
                  }))}
                  placeholderText="End Date"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold">Name</TableHead>
              <TableHead className="font-semibold">Contact</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Type</TableHead>
              <TableHead className="font-semibold">Source</TableHead>
              <TableHead className="font-semibold">Location</TableHead>
              <TableHead className="font-semibold">Property</TableHead>
              <TableHead className="font-semibold">Created</TableHead>
              <TableHead className="font-semibold">Assigned To</TableHead>
              <TableHead className="font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLeads.map((lead) => (
              <TableRow key={lead._id} className="hover:bg-gray-50">
                <TableCell>
                  <Button
                    variant="link"
                    className="p-0 h-auto font-normal text-blue-600 hover:text-blue-800"
                    onClick={() => router.push(`/lead/${lead._id}`)}
                  >
                    {lead.name}
                  </Button>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div className="text-gray-900">{lead.email}</div>
                    <div className="text-gray-500">{lead.phone}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getLeadStatusColor(lead.leadStatus)}>
                    {(lead.leadStatus || 'cold').charAt(0).toUpperCase() + (lead.leadStatus || 'cold').slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={getLeadTypeColor(lead.leadType)}>
                    {(lead.leadType || 'buyer').charAt(0).toUpperCase() + (lead.leadType || 'buyer').slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-gray-600">{lead.leadSource || '-'}</span>
                </TableCell>
                <TableCell>
                  <span className="text-gray-600">{lead.location || '-'}</span>
                </TableCell>
                <TableCell>
                  <span className="text-gray-600">{lead.property || '-'}</span>
                </TableCell>
                <TableCell>
                  <span className="text-gray-600">{formatDate(lead.date)}</span>
                </TableCell>
                <TableCell>
                  <span className="text-gray-600">
                    {lead.assignedTo ? getUserName(lead.assignedTo) : 'Unassigned'}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50" 
                        onClick={() => handleCall(lead._id, lead.phone)}
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        Call
                      </Button>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-gray-300 text-gray-700 hover:bg-gray-50"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                router.push(`/lead/${lead._id}`)
                              }}
                            >
                              <Info className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View full details</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gray-300 text-gray-700 hover:bg-gray-50 w-full"
                      onClick={() => setIsHistoryOpen(true)}
                    >
                      <History className="h-4 w-4 mr-2" />
                      View Call History
                    </Button>
                    <div className="mt-2 space-y-1">
                      <div className="text-sm text-gray-500">
                        Tasks: {lead.tasks?.length || 0}
                        {lead.tasks && lead.tasks.length > 0 && (
                          <span className="ml-2 text-gray-400">
                            ({lead.tasks.filter(t => t.status === 'pending').length} pending)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

