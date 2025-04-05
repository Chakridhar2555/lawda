"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
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
import { 
  Building,
  DollarSign,
  MapPin,
  Plus,
  Share2,
  Loader2,
  Eye,
  Heart,
  HeartOff,
  Edit2,
  Trash2
} from "lucide-react"
import { dataService, type Property } from '@/lib/data-service'
import type { jsPDF } from 'jspdf'

// This ensures the jsPDF import is only loaded on the client side
let JsPDF: typeof jsPDF
if (typeof window !== 'undefined') {
  import('jspdf').then((module) => {
    JsPDF = module.default
  })
}

export default function InventoryPage() {
  const router = useRouter()
  const [inventory, setInventory] = useState<Property[]>([])
  const [isGenerating, setIsGenerating] = useState<string | null>(null)
  const [itemToDelete, setItemToDelete] = useState<Property | null>(null)

  useEffect(() => {
    // Initial load of inventory
    loadInventory()

    // Subscribe to inventory changes
    dataService.subscribe('properties', loadInventory)

    // Cleanup subscription
    return () => {
      dataService.unsubscribe('properties', loadInventory)
    }
  }, [])

  const loadInventory = () => {
    const properties = dataService.getProperties()
    setInventory(properties)
  }

  const getStatusColor = (status: Property['status']) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'sold':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const generatePDF = async (property: Property) => {
    try {
      setIsGenerating(property.id)
      
      if (!JsPDF) {
        const module = await import('jspdf')
        JsPDF = module.default
      }
      
      // Create new PDF document
      const doc = new JsPDF()
      
      // Add title
      doc.setFontSize(20)
      doc.text(property.propertyName || property.address, 20, 20)
      
      // Add property type and status
      doc.setFontSize(12)
      doc.text(`Type: ${property.propertyType}`, 20, 30)
      doc.text(`Status: ${property.status}`, 20, 37)
      
      // Add main details
      doc.text(`Price: ${property.price}`, 20, 47)
      doc.text(`Address: ${property.address}`, 20, 54)
      doc.text(`Square Footage: ${property.squareFootage} sqft`, 20, 61)
      doc.text(`Bedrooms: ${property.bedrooms}`, 20, 68)
      doc.text(`Bathrooms: ${property.bathrooms}`, 20, 75)
      doc.text(`Year Built: ${property.yearBuilt}`, 20, 82)
      
      // Add description
      doc.setFontSize(14)
      doc.text('Description:', 20, 92)
      doc.setFontSize(12)
      const descriptionLines = doc.splitTextToSize(property.description, 170)
      doc.text(descriptionLines, 20, 99)
      
      // Add features
      const yPos = 99 + (descriptionLines.length * 7)
      doc.setFontSize(14)
      doc.text('Features:', 20, yPos)
      doc.setFontSize(12)
      const featureLines = doc.splitTextToSize(property.features, 170)
      doc.text(featureLines, 20, yPos + 7)

      // Add footer
      doc.setFontSize(10)
      doc.text('Generated on: ' + new Date().toLocaleDateString(), 20, 280)
      
      // Save the PDF
      doc.save(`${property.address.replace(/\s+/g, '_')}_details.pdf`)
      
    } catch (error) {
      console.error('Error generating PDF:', error)
    } finally {
      setIsGenerating(null)
    }
  }

  const toggleFavorite = (property: Property) => {
    if (property.isFavorite) {
      dataService.removeFavorite(property.id)
    } else {
      dataService.addFavorite(property)
    }
    // Refresh inventory to update UI
    loadInventory()
  }

  const handleDelete = async (property: Property) => {
    try {
      // Delete property using data service
      dataService.deleteProperty(property.id)
      
      // Refresh inventory
      loadInventory()
    } catch (error) {
      console.error('Error deleting property:', error)
    } finally {
      setItemToDelete(null)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Inventory</h1>
          <Button
            onClick={() => router.push('/inventory/add')}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Property
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Property Listings</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property Name</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory.map((property) => (
                  <TableRow key={property.id}>
                    <TableCell>{property.propertyName}</TableCell>
                    <TableCell>{property.address}</TableCell>
                    <TableCell>{property.propertyType}</TableCell>
                    <TableCell>{property.price}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(property.status)}>{property.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => router.push(`/inventory/${property.id}`)}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => generatePDF(property)}
                          disabled={isGenerating === property.id}
                        >
                          {isGenerating === property.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Share2 className="h-4 w-4 mr-1" />
                          )}
                          Share
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleFavorite(property)}
                        >
                          {property.isFavorite ? (
                            <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                          ) : (
                            <HeartOff className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/inventory/${property.id}/edit`)}
                        >
                          <Edit2 className="h-4 w-4 text-gray-400" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setItemToDelete(property)}
                          className="hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {inventory.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No properties found. Add your first property to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the property
              {itemToDelete && ` "${itemToDelete.propertyName || itemToDelete.address}"`}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => itemToDelete && handleDelete(itemToDelete)}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  )
}

