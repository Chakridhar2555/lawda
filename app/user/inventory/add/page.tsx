"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, Loader2, X, Eye } from "lucide-react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"

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

export default function AddPropertyPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    address: "",
    description: "",
    propertyType: "",
    bedrooms: 0,
    bathrooms: 0,
    price: 0,
    status: "available",
    area: 0,
    yearBuilt: new Date().getFullYear(),
    features: [] as string[],
    mainImage: "",
    images: [] as string[],
    image360: [] as string[]
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error()

      toast({
        title: "Success",
        description: "Property added successfully",
      })

      router.push("/user/inventory")
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add property",
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

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Inventory
        </Button>
        <h1 className="text-2xl font-bold text-gray-100">Add New Property</h1>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
                className="bg-gray-700 border-gray-600 mt-2"
              />
            </div>

            <div>
              <Label htmlFor="propertyType">Property Type</Label>
              <Select
                value={formData.propertyType}
                onValueChange={(value) => setFormData({ ...formData, propertyType: value })}
              >
                <SelectTrigger className="bg-gray-700 border-gray-600 mt-2">
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

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger className="bg-gray-700 border-gray-600 mt-2">
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

            <div>
              <Label htmlFor="bedrooms">Bedrooms</Label>
              <Input
                id="bedrooms"
                type="number"
                value={formData.bedrooms}
                onChange={(e) => setFormData({ ...formData, bedrooms: parseInt(e.target.value) })}
                required
                min={0}
                className="bg-gray-700 border-gray-600 mt-2"
              />
            </div>

            <div>
              <Label htmlFor="bathrooms">Bathrooms</Label>
              <Input
                id="bathrooms"
                type="number"
                value={formData.bathrooms}
                onChange={(e) => setFormData({ ...formData, bathrooms: parseFloat(e.target.value) })}
                required
                min={0}
                step={0.5}
                className="bg-gray-700 border-gray-600 mt-2"
              />
            </div>

            <div>
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                required
                min={0}
                className="bg-gray-700 border-gray-600 mt-2"
              />
            </div>

            <div>
              <Label htmlFor="area">Area (sqft)</Label>
              <Input
                id="area"
                type="number"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: parseInt(e.target.value) })}
                required
                min={0}
                className="bg-gray-700 border-gray-600 mt-2"
              />
            </div>

            <div>
              <Label htmlFor="yearBuilt">Year Built</Label>
              <Input
                id="yearBuilt"
                type="number"
                value={formData.yearBuilt}
                onChange={(e) => setFormData({ ...formData, yearBuilt: parseInt(e.target.value) })}
                required
                min={1800}
                max={new Date().getFullYear()}
                className="bg-gray-700 border-gray-600 mt-2"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-gray-700 border-gray-600 mt-2 min-h-[100px]"
            />
          </div>

          <div>
            <Label htmlFor="features">Features</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              <Input
                id="features"
                placeholder="Add feature and press Enter"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const input = e.target as HTMLInputElement;
                    const feature = input.value.trim();
                    if (feature) {
                      setFormData({
                        ...formData,
                        features: [...formData.features, feature]
                      });
                      input.value = '';
                    }
                  }
                }}
                className="bg-gray-700 border-gray-600"
              />
              {formData.features.map((feature, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {feature}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        features: formData.features.filter((_, i) => i !== index)
                      });
                    }}
                  />
                </Badge>
              ))}
            </div>
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
              onClick={() => router.back()}
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
                'Save Property'
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
} 