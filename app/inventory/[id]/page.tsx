'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Building,
  DollarSign,
  Home,
  MapPin,
  Ruler,
  Hash,
  Pencil,
  Save,
  Loader2,
  Share2
} from "lucide-react";

interface Property {
  id: string;
  address: string;
  type: string;
  price: string;
  status: "For Sale" | "For Rent" | "Sold" | "Rented";
  description?: string;
  features?: string;
  squareFootage?: string;
  bedrooms?: string;
  bathrooms?: string;
  yearBuilt?: string;
}

export default function PropertyDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [property, setProperty] = useState<Property | null>(null);

  useEffect(() => {
    // Fetch property details from localStorage
    const properties = JSON.parse(localStorage.getItem('properties') || '[]');
    const foundProperty = properties.find((p: Property) => p.id === params.id);
    if (foundProperty) {
      setProperty(foundProperty);
    }
  }, [params.id]);

  const handleInputChange = (field: keyof Property, value: string) => {
    if (property) {
      setProperty({ ...property, [field]: value });
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      // Get all properties
      const properties = JSON.parse(localStorage.getItem('properties') || '[]');
      // Update the property
      const updatedProperties = properties.map((p: Property) =>
        p.id === property?.id ? property : p
      );
      // Save back to localStorage
      localStorage.setItem('properties', JSON.stringify(updatedProperties));
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving property:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!property) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Inventory
            </Button>
          </div>
          <Card className="p-6">
            <p className="text-center text-gray-500">Property not found</p>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Inventory
            </Button>
            <h1 className="text-2xl font-bold">Property Details</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditing(!isEditing)}
              disabled={isSaving}
            >
              <Pencil className="h-4 w-4 mr-2" />
              {isEditing ? 'Cancel Edit' : 'Edit Property'}
            </Button>
            {isEditing && (
              <Button
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        <Card className="p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label htmlFor="address">Address</Label>
                {isEditing ? (
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    <Input
                      id="address"
                      value={property.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                ) : (
                  <div className="flex items-center mt-1 text-lg">
                    <MapPin className="h-5 w-5 mr-2 text-gray-500" />
                    {property.address}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="price">Price</Label>
                {isEditing ? (
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    <Input
                      id="price"
                      value={property.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                ) : (
                  <div className="flex items-center mt-1 text-lg">
                    <DollarSign className="h-5 w-5 mr-2 text-gray-500" />
                    {property.price}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="type">Property Type</Label>
                {isEditing ? (
                  <div className="relative">
                    <Home className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    <select
                      id="type"
                      value={property.type}
                      onChange={(e) => handleInputChange('type', e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background"
                    >
                      <option value="House">House</option>
                      <option value="Apartment">Apartment</option>
                      <option value="Condo">Condo</option>
                      <option value="Townhouse">Townhouse</option>
                    </select>
                  </div>
                ) : (
                  <div className="flex items-center mt-1 text-lg">
                    <Home className="h-5 w-5 mr-2 text-gray-500" />
                    {property.type}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                {isEditing ? (
                  <select
                    id="status"
                    value={property.status}
                    onChange={(e) => handleInputChange('status', e.target.value as Property['status'])}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  >
                    <option value="For Sale">For Sale</option>
                    <option value="For Rent">For Rent</option>
                    <option value="Sold">Sold</option>
                    <option value="Rented">Rented</option>
                  </select>
                ) : (
                  <div className="mt-1">
                    <Badge variant="outline">{property.status}</Badge>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label htmlFor="squareFootage">Square Footage</Label>
                {isEditing ? (
                  <div className="relative">
                    <Ruler className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    <Input
                      id="squareFootage"
                      value={property.squareFootage}
                      onChange={(e) => handleInputChange('squareFootage', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                ) : (
                  <p className="mt-1">{property.squareFootage} sqft</p>
                )}
              </div>

              <div>
                <Label htmlFor="bedrooms">Bedrooms</Label>
                {isEditing ? (
                  <div className="relative">
                    <Hash className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    <Input
                      id="bedrooms"
                      value={property.bedrooms}
                      onChange={(e) => handleInputChange('bedrooms', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                ) : (
                  <p className="mt-1">{property.bedrooms} beds</p>
                )}
              </div>

              <div>
                <Label htmlFor="bathrooms">Bathrooms</Label>
                {isEditing ? (
                  <div className="relative">
                    <Hash className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    <Input
                      id="bathrooms"
                      value={property.bathrooms}
                      onChange={(e) => handleInputChange('bathrooms', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                ) : (
                  <p className="mt-1">{property.bathrooms} baths</p>
                )}
              </div>

              <div>
                <Label htmlFor="yearBuilt">Year Built</Label>
                {isEditing ? (
                  <div className="relative">
                    <Building className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    <Input
                      id="yearBuilt"
                      value={property.yearBuilt}
                      onChange={(e) => handleInputChange('yearBuilt', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                ) : (
                  <p className="mt-1">{property.yearBuilt}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              {isEditing ? (
                <Textarea
                  id="description"
                  value={property.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                />
              ) : (
                <p className="mt-1 text-gray-600">{property.description}</p>
              )}
            </div>

            <div>
              <Label htmlFor="features">Features</Label>
              {isEditing ? (
                <Textarea
                  id="features"
                  value={property.features}
                  onChange={(e) => handleInputChange('features', e.target.value)}
                  rows={4}
                />
              ) : (
                <p className="mt-1 text-gray-600">{property.features}</p>
              )}
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
} 