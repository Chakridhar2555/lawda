"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Heart, HeartOff, Share2, Loader2, X, Eye } from "lucide-react"
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
import { dataService, type Property } from "@/lib/data-service"

const propertyTypes = [
  { value: "house", label: "House" },
  { value: "apartment", label: "Apartment" },
  { value: "condo", label: "Condo" },
  { value: "land", label: "Land" },
  { value: "commercial", label: "Commercial" }
]

const propertyStatuses = [
  { value: "available", label: "Available" },
  { value: "pending", label: "Pending" },
  { value: "sold", label: "Sold" }
]

export default function EditPropertyPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<Property>({
    id: params.id,
    propertyName: "",
    propertyType: "house",
    address: "",
    price: "0",
    squareFootage: "0",
    bedrooms: "0",
    bathrooms: "0",
    yearBuilt: new Date().getFullYear().toString(),
    description: "",
    features: "",
    status: "available",
    mainImage: "",
    images: [],
    image360: []
  })

  useEffect(() => {
    try {
    const property = dataService.getProperty(params.id)
    if (property) {
        // Initialize form with all property fields
        setFormData({
          ...property,
          id: params.id, // Ensure ID is set
          propertyName: property.propertyName || "",
          propertyType: property.propertyType || "house",
          address: property.address || "",
          price: property.price || "0",
          squareFootage: property.squareFootage || "0",
          bedrooms: property.bedrooms || "0",
          bathrooms: property.bathrooms || "0",
          yearBuilt: property.yearBuilt || new Date().getFullYear().toString(),
          description: property.description || "",
          features: property.features || "",
          status: property.status || "available",
          mainImage: property.mainImage || "",
          images: property.images || [],
          image360: property.image360 || []
        })
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Property not found",
      })
      router.push("/user/inventory")
    }
    } catch (error) {
      console.error("Error loading property:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load property",
      })
      router.push("/user/inventory")
    }
  }, [params.id, router, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Ensure all required fields are present
      const updatedProperty: Property = {
        ...formData,
        id: params.id,
        propertyName: formData.propertyName.trim(),
        propertyType: formData.propertyType,
        address: formData.address.trim(),
        price: formData.price,
        squareFootage: formData.squareFootage,
        bedrooms: formData.bedrooms,
        bathrooms: formData.bathrooms,
        yearBuilt: formData.yearBuilt,
        description: formData.description.trim(),
        features: formData.features.trim(),
        status: formData.status,
        mainImage: formData.mainImage || "",
        images: formData.images || [],
        image360: formData.image360 || []
      }

      dataService.updateProperty(params.id, updatedProperty)

      toast({
        title: "Success",
        description: "Property updated successfully",
      })

      router.push("/user/inventory")
    } catch (error) {
      console.error("Error updating property:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update property",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'main' | 'additional' | '360') => {
    const files = Array.from(e.target.files || [])
    
    files.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData(prev => {
          if (type === 'main') {
            return { ...prev, mainImage: reader.result as string }
          } else if (type === 'additional') {
            return { ...prev, images: [...prev.images, reader.result as string] }
          } else {
            return { ...prev, image360: [...prev.image360, reader.result as string] }
          }
        })
      }
      reader.readAsDataURL(file)
    })
  }

  if (!formData.address) {
    return (
      <div className="p-6 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-gray-100"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-100">Edit Property</h1>
        </div>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-100">Property Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="propertyName" className="text-gray-100">Property Name</Label>
                <Input
                  id="propertyName"
                  value={formData.propertyName}
                  onChange={(e) => setFormData({ ...formData, propertyName: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-gray-100"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="propertyType" className="text-gray-100">Property Type</Label>
                <Select
                  value={formData.propertyType}
                  onValueChange={(value: Property['propertyType']) => 
                    setFormData({ ...formData, propertyType: value })
                  }
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-100">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    {propertyTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-gray-100">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-gray-100"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price" className="text-gray-100">Price</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-gray-100"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="squareFootage" className="text-gray-100">Square Footage</Label>
                <Input
                  id="squareFootage"
                  type="number"
                  value={formData.squareFootage}
                  onChange={(e) => setFormData({ ...formData, squareFootage: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-gray-100"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bedrooms" className="text-gray-100">Bedrooms</Label>
                <Input
                  id="bedrooms"
                  type="number"
                  value={formData.bedrooms}
                  onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-gray-100"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bathrooms" className="text-gray-100">Bathrooms</Label>
                <Input
                  id="bathrooms"
                  type="number"
                  value={formData.bathrooms}
                  onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-gray-100"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="yearBuilt" className="text-gray-100">Year Built</Label>
                <Input
                  id="yearBuilt"
                  type="number"
                  value={formData.yearBuilt}
                  onChange={(e) => setFormData({ ...formData, yearBuilt: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-gray-100"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="text-gray-100">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: Property['status']) => 
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-100">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    {propertyStatuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-gray-100">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-gray-700 border-gray-600 text-gray-100 min-h-[100px]"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="features" className="text-gray-100">Features</Label>
              <Textarea
                id="features"
                value={formData.features}
                onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                className="bg-gray-700 border-gray-600 text-gray-100 min-h-[100px]"
                required
              />
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Property Images</h3>
              
              <div>
                <Label>Main Property Image</Label>
                <div className="flex items-center gap-4 mt-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'main')}
                    className="bg-gray-700 border-gray-600"
                  />
                  {formData.mainImage && (
                    <div className="relative w-20 h-20">
                      <Image
                        src={formData.mainImage}
                        alt="Main property image"
                        fill
                        className="object-cover rounded-lg"
                      />
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute -top-2 -right-2 h-6 w-6"
                        onClick={() => setFormData({ ...formData, mainImage: "" })}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label>Additional Images</Label>
                <div className="flex items-start gap-4 mt-2">
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleImageUpload(e, 'additional')}
                    className="bg-gray-700 border-gray-600"
                  />
                  <div className="flex flex-wrap gap-2">
                    {formData.images?.map((image, index) => (
                      <div key={index} className="relative w-20 h-20">
                        <Image
                          src={image}
                          alt={`Property image ${index + 1}`}
                          fill
                          className="object-cover rounded-lg"
                        />
                        <Button
                          size="icon"
                          variant="destructive"
                          className="absolute -top-2 -right-2 h-6 w-6"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              images: formData.images?.filter((_, i) => i !== index)
                            });
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <Label>360° Views</Label>
                <div className="flex items-start gap-4 mt-2">
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleImageUpload(e, '360')}
                    className="bg-gray-700 border-gray-600"
                  />
                  <div className="flex flex-wrap gap-2">
                    {formData.image360?.map((image, index) => (
                      <div key={index} className="relative w-20 h-20">
                        <Image
                          src={image}
                          alt={`360° view ${index + 1}`}
                          fill
                          className="object-cover rounded-lg"
                        />
                        <Button
                          size="icon"
                          variant="destructive"
                          className="absolute -top-2 -right-2 h-6 w-6"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              image360: formData.image360?.filter((_, i) => i !== index)
                            });
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <div className="absolute bottom-2 right-2 bg-black/50 rounded-full p-1">
                          <Eye className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/user/inventory")}
                className="border-gray-600 hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-red-500 hover:bg-red-600" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 