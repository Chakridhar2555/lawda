'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { DashboardLayout } from "@/components/layout";
import {
  ArrowLeft,
  Building,
  DollarSign,
  Home,
  MapPin,
  Ruler,
  Hash,
  Loader2,
  Upload,
  X,
  Image as ImageIcon,
  Camera,
  Eye
} from "lucide-react";
import { dataService, type Property } from '@/lib/data-service';

export default function EditPropertyPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [mainImage, setMainImage] = useState<string>('');
  const [propertyImages, setPropertyImages] = useState<string[]>([]);
  const [images360, setImages360] = useState<string[]>([]);
  const [formData, setFormData] = useState<Omit<Property, 'id'>>({
    propertyName: '',
    propertyType: 'house',
    address: '',
    price: '',
    squareFootage: '',
    bedrooms: '',
    bathrooms: '',
    yearBuilt: '',
    description: '',
    features: '',
    status: 'available',
    images: [],
    image360: []
  });

  useEffect(() => {
    fetchProperty();
  }, [params.id]);

  const fetchProperty = async () => {
    try {
      const property = dataService.getProperty(params.id);
      if (property) {
        setFormData({
          propertyName: property.propertyName,
          propertyType: property.propertyType,
          address: property.address,
          price: property.price,
          squareFootage: property.squareFootage,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          yearBuilt: property.yearBuilt,
          description: property.description,
          features: property.features,
          status: property.status,
          images: property.images || [],
          image360: property.image360 || []
        });
        setMainImage(property.mainImage || '');
        setPropertyImages(property.images || []);
        setImages360(property.image360 || []);
      }
    } catch (error) {
      console.error('Error fetching property:', error);
      router.push('/inventory');
    }
  };

  const handleInputChange = (field: keyof Property, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMainImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setMainImage(base64String);
        setFormData(prev => ({ ...prev, mainImage: base64String }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePropertyImagesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          setPropertyImages(prev => [...prev, base64String]);
          setFormData(prev => ({ ...prev, images: [...prev.images, base64String] }));
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handle360ImagesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          setImages360(prev => [...prev, base64String]);
          setFormData(prev => ({ ...prev, image360: [...prev.image360, base64String] }));
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removePropertyImage = (index: number) => {
    setPropertyImages(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const remove360Image = (index: number) => {
    setImages360(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      image360: prev.image360.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      
      // Update property using data service
      dataService.updateProperty(params.id, {
        ...formData,
        id: params.id,
        mainImage,
        images: propertyImages,
        image360: images360,
      });
      
      // Navigate back to inventory
      router.push('/inventory');
    } catch (error) {
      console.error('Error updating property:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Inventory
          </Button>
          <h1 className="text-2xl font-bold">Edit Property</h1>
        </div>

        <Card className="p-6">
          <div className="space-y-6">
            <div>
              <Label htmlFor="propertyType">Property Type</Label>
              <select
                id="propertyType"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                value={formData.propertyType}
                onChange={(e) => handleInputChange('propertyType', e.target.value as Property['propertyType'])}
              >
                <option value="house">House</option>
                <option value="apartment">Apartment</option>
                <option value="condo">Condo</option>
                <option value="land">Land</option>
                <option value="commercial">Commercial</option>
              </select>
            </div>

            <div>
              <Label htmlFor="propertyName">Property Name</Label>
              <div className="relative">
                <Home className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <Input
                  id="propertyName"
                  value={formData.propertyName}
                  onChange={(e) => handleInputChange('propertyName', e.target.value)}
                  placeholder="Enter property name"
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Enter property address"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    placeholder="Enter price"
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="squareFootage">Square Footage</Label>
                <div className="relative">
                  <Ruler className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <Input
                    id="squareFootage"
                    type="number"
                    value={formData.squareFootage}
                    onChange={(e) => handleInputChange('squareFootage', e.target.value)}
                    placeholder="Enter square footage"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bedrooms">Bedrooms</Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <Input
                    id="bedrooms"
                    type="number"
                    value={formData.bedrooms}
                    onChange={(e) => handleInputChange('bedrooms', e.target.value)}
                    placeholder="Number of bedrooms"
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="bathrooms">Bathrooms</Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <Input
                    id="bathrooms"
                    type="number"
                    value={formData.bathrooms}
                    onChange={(e) => handleInputChange('bathrooms', e.target.value)}
                    placeholder="Number of bathrooms"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="yearBuilt">Year Built</Label>
              <div className="relative">
                <Building className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <Input
                  id="yearBuilt"
                  type="number"
                  value={formData.yearBuilt}
                  onChange={(e) => handleInputChange('yearBuilt', e.target.value)}
                  placeholder="Year built"
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter property description"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="features">Features</Label>
              <Textarea
                id="features"
                value={formData.features}
                onChange={(e) => handleInputChange('features', e.target.value)}
                placeholder="Enter property features (e.g., garage, pool, renovated kitchen)"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value as Property['status'])}
              >
                <option value="available">Available</option>
                <option value="pending">Pending</option>
                <option value="sold">Sold</option>
              </select>
            </div>

            {/* Image Upload Section */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Property Images</h2>
              
              {/* Main Image Upload */}
              <div>
                <Label htmlFor="mainImage">Main Property Image</Label>
                <div className="mt-2">
                  <div className="flex items-center gap-4">
                    <Input
                      id="mainImage"
                      type="file"
                      accept="image/*"
                      onChange={handleMainImageUpload}
                      className="hidden"
                    />
                    <Label
                      htmlFor="mainImage"
                      className="flex items-center justify-center w-32 h-32 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary"
                    >
                      {mainImage ? (
                        <Image
                          src={mainImage}
                          alt="Main property image"
                          width={128}
                          height={128}
                          className="object-cover rounded-lg"
                        />
                      ) : (
                        <div className="flex flex-col items-center">
                          <ImageIcon className="w-8 h-8 text-gray-400" />
                          <span className="mt-2 text-sm text-gray-500">Main Image</span>
                        </div>
                      )}
                    </Label>
                  </div>
                </div>
              </div>

              {/* Property Images Upload */}
              <div>
                <Label htmlFor="propertyImages">Additional Property Images</Label>
                <div className="mt-2">
                  <div className="flex flex-wrap gap-4">
                    {propertyImages.map((img, index) => (
                      <div key={index} className="relative">
                        <Image
                          src={img}
                          alt={`Property image ${index + 1}`}
                          width={128}
                          height={128}
                          className="object-cover rounded-lg"
                        />
                        <Button
                          size="icon"
                          variant="destructive"
                          className="absolute -top-2 -right-2 w-6 h-6"
                          onClick={() => removePropertyImage(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Input
                      id="propertyImages"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePropertyImagesUpload}
                      className="hidden"
                    />
                    <Label
                      htmlFor="propertyImages"
                      className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary"
                    >
                      <Camera className="w-8 h-8 text-gray-400" />
                      <span className="mt-2 text-sm text-gray-500">Add Photos</span>
                    </Label>
                  </div>
                </div>
              </div>

              {/* 360° Images Upload */}
              <div>
                <Label htmlFor="360images">360° Views</Label>
                <div className="mt-2">
                  <div className="flex flex-wrap gap-4">
                    {images360.map((img, index) => (
                      <div key={index} className="relative">
                        <Image
                          src={img}
                          alt={`360° view ${index + 1}`}
                          width={128}
                          height={128}
                          className="object-cover rounded-lg"
                        />
                        <Button
                          size="icon"
                          variant="destructive"
                          className="absolute -top-2 -right-2 w-6 h-6"
                          onClick={() => remove360Image(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                        <div className="absolute bottom-2 right-2 bg-black/50 rounded-full p-1">
                          <Eye className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    ))}
                    <Input
                      id="360images"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handle360ImagesUpload}
                      className="hidden"
                    />
                    <Label
                      htmlFor="360images"
                      className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary"
                    >
                      <Eye className="w-8 h-8 text-gray-400" />
                      <span className="mt-2 text-sm text-gray-500">Add 360° Views</span>
                    </Label>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isLoading}>
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
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
} 