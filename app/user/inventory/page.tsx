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
import { Home, Plus, Edit2, Trash2, Search, Eye, Share2, Heart, HeartOff, Loader2, X } from "lucide-react"
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
import type { jsPDF } from 'jspdf'
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"

interface InventoryItem {
  _id: string
  address: string
  description: string
  propertyType: string
  bedrooms: number
  bathrooms: number
  price: number
  status: string
  area: number
  yearBuilt: number
  features: string[]
  lastUpdated: string
  updatedAt: string
  mainImage?: string
  images?: string[]
  image360?: string[]
  isFavorite?: boolean
}

const defaultItem: {
  address: string;
  description: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  price: number;
  status: string;
  area: number;
  yearBuilt: number;
  features: string[];
  mainImage?: string;
  images?: string[];
  image360?: string[];
} = {
  address: "",
  description: "",
  propertyType: "",
  bedrooms: 0,
  bathrooms: 0,
  price: 0,
  status: "available",
  area: 0,
  yearBuilt: new Date().getFullYear(),
  features: [],
  images: [],
  image360: []
}

const propertyTypes = [
  { value: "single-family", label: "Single Family Home" },
  { value: "condo", label: "Condominium" },
  { value: "townhouse", label: "Townhouse" },
  { value: "multi-family", label: "Multi-Family" },
  { value: "land", label: "Land" },
  { value: "commercial", label: "Commercial" }
]

const propertyStatuses = [
  { value: "available", label: "Available" },
  { value: "under-contract", label: "Under Contract" },
  { value: "sold", label: "Sold" },
  { value: "off-market", label: "Off Market" }
]

// Add motion table row
const MotionTableRow = motion(TableRow)

// This ensures the jsPDF import is only loaded on the client side
let JsPDF: typeof jsPDF
if (typeof window !== 'undefined') {
  import('jspdf').then((module) => {
    JsPDF = module.default
  })
}

export default function InventoryPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [isNewItemDialogOpen, setIsNewItemDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [formData, setFormData] = useState(defaultItem)
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState<string | null>(null)

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    try {
      const response = await fetch("/api/inventory")
      const data = await response.json()
      setItems(data)
      setIsLoading(false)
    } catch (error) {
      console.error("Error fetching properties:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch property inventory",
      })
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = "/api/inventory"
      const method = editingItem ? "PUT" : "POST"
      const body = editingItem 
        ? { _id: editingItem._id, ...formData }
        : formData

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!response.ok) throw new Error()

      toast({
        title: "Success",
        description: `Property ${editingItem ? "updated" : "added"} successfully`,
      })

      setIsNewItemDialogOpen(false)
      setEditingItem(null)
      setFormData(defaultItem)
      fetchItems()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to ${editingItem ? "update" : "add"} property`,
      })
    }
  }

  const handleDelete = async (item: InventoryItem) => {
    try {
      const response = await fetch(`/api/inventory/${item._id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error()

      toast({
        title: "Success",
        description: "Property removed from inventory",
      })

      fetchItems()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove property",
      })
    } finally {
      setItemToDelete(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'available':
        return 'text-green-400 bg-green-400/10'
      case 'under-contract':
        return 'text-yellow-400 bg-yellow-400/10'
      case 'sold':
        return 'text-red-400 bg-red-400/10'
      case 'off-market':
        return 'text-gray-400 bg-gray-400/10'
      default:
        return 'text-gray-400 bg-gray-400/10'
    }
  }

  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesType = !selectedType || selectedType === "all" || item.propertyType === selectedType

    return matchesSearch && matchesType
  })

  const totalProperties = items.length
  const totalValue = items.reduce((sum, item) => sum + item.price, 0)
  const availableProperties = items.filter(item => item.status === 'available').length
  const underContractProperties = items.filter(item => item.status === 'under-contract').length

  const generatePDF = async (item: InventoryItem) => {
    if (!JsPDF) return

    setIsGenerating(item._id)
    try {
      const doc = new JsPDF()
      
      // Add property details to PDF
      doc.setFontSize(20)
      doc.text('Property Details', 20, 20)
      
      doc.setFontSize(12)
      doc.text(`Address: ${item.address}`, 20, 40)
      doc.text(`Type: ${item.propertyType}`, 20, 50)
      doc.text(`Price: $${item.price.toLocaleString()}`, 20, 60)
      doc.text(`Bedrooms: ${item.bedrooms}`, 20, 70)
      doc.text(`Bathrooms: ${item.bathrooms}`, 20, 80)
      doc.text(`Area: ${item.area} sqft`, 20, 90)
      doc.text(`Year Built: ${item.yearBuilt}`, 20, 100)
      doc.text(`Status: ${item.status}`, 20, 110)
      
      if (item.description) {
        doc.text('Description:', 20, 130)
        doc.setFontSize(10)
        const splitDescription = doc.splitTextToSize(item.description, 170)
        doc.text(splitDescription, 20, 140)
      }

      // Save the PDF
      doc.save(`property-${item._id}.pdf`)
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate PDF",
      })
    } finally {
      setIsGenerating(null)
    }
  }

  const toggleFavorite = async (item: InventoryItem) => {
    try {
      const response = await fetch(`/api/inventory/${item._id}/favorite`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: !item.isFavorite }),
      })

      if (!response.ok) throw new Error()

      toast({
        title: "Success",
        description: `Property ${item.isFavorite ? 'removed from' : 'added to'} favorites`,
      })

      fetchItems()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update favorites",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 animate-pulse">
        <div className="h-8 w-48 bg-gray-800 rounded mb-6"></div>
        <div className="grid grid-cols-4 gap-6 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-800 rounded"></div>
          ))}
        </div>
        <div className="h-96 bg-gray-800 rounded"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-100">Property Inventory</h1>
        <Button 
          onClick={() => router.push('/user/inventory/add')}
          className="bg-red-500 hover:bg-red-600"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Property
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="flex items-center p-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-400/10 mr-4">
              <Home className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-400">Total Properties</p>
              <h2 className="text-2xl font-bold text-gray-100">{totalProperties}</h2>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="flex items-center p-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-400/10 mr-4">
              <Home className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-400">Total Value</p>
              <h2 className="text-2xl font-bold text-gray-100">
                ${totalValue.toLocaleString()}
              </h2>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="flex items-center p-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-yellow-400/10 mr-4">
              <Home className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-400">Available</p>
              <h2 className="text-2xl font-bold text-gray-100">{availableProperties}</h2>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="flex items-center p-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-400/10 mr-4">
              <Home className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-400">Under Contract</p>
              <h2 className="text-2xl font-bold text-gray-100">{underContractProperties}</h2>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search properties..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-700 border-gray-600 text-gray-100"
            />
          </div>
        </div>
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-[180px] bg-gray-700 border-gray-600 text-gray-100">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent className="bg-gray-700 border-gray-600">
            <SelectItem value="all">All Types</SelectItem>
            {propertyTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-100">Property Listings</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700">
                <TableHead className="text-gray-400">Property</TableHead>
                <TableHead className="text-gray-400">Type</TableHead>
                <TableHead className="text-gray-400">Beds/Baths</TableHead>
                <TableHead className="text-gray-400">Price</TableHead>
                <TableHead className="text-gray-400">Status</TableHead>
                <TableHead className="text-gray-400">Last Updated</TableHead>
                <TableHead className="text-gray-400 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <MotionTableRow
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <TableCell 
                    colSpan={7} 
                    className="text-center text-gray-400 py-4"
                  >
                    No properties found
                  </TableCell>
                </MotionTableRow>
              ) : (
                filteredItems.map((item, index) => (
                  <MotionTableRow 
                    key={item._id}
                    className="border-gray-700"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.01, backgroundColor: "rgba(0,0,0,0.02)" }}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-100">{item.address}</div>
                          <div className="text-sm text-gray-400">{item.area} sqft</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-300">{item.propertyType}</TableCell>
                    <TableCell className="text-gray-300">{item.bedrooms} / {item.bathrooms}</TableCell>
                    <TableCell className="text-gray-300">${item.price.toLocaleString()}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {format(new Date(item.lastUpdated), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/user/inventory/${item._id}`)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4 text-gray-400" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => generatePDF(item)}
                          disabled={isGenerating === item._id}
                          className="h-8 w-8 p-0"
                        >
                          {isGenerating === item._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Share2 className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleFavorite(item)}
                          className="h-8 w-8 p-0"
                        >
                          {item.isFavorite ? (
                            <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                          ) : (
                            <HeartOff className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/user/inventory/${item._id}/edit`)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit2 className="h-4 w-4 text-gray-400" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setItemToDelete(item)}
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

      <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
        <AlertDialogContent className="bg-gray-800 text-gray-100">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This action cannot be undone. This will permanently remove the property
              {itemToDelete && ` at "${itemToDelete.address}"`} from inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-600 hover:bg-gray-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={() => itemToDelete && handleDelete(itemToDelete)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 