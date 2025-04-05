'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  MapPin,
  Bed,
  Bath,
  Square,
  Home,
  Info,
  Mail,
  Phone,
  Share2,
  Ruler,
  Car,
  Trees,
  Building2,
  CalendarDays,
  Heart,
  HeartOff,
  ArrowLeft,
  FileDown,
  Loader2
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';

interface PropertyField {
  key: string;
  icon: React.ReactNode;
  label: string;
  suffix?: string;
  prefix?: string;
}

interface PropertyGroups {
  [key: string]: PropertyField[];
}

export default function UserPropertyDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }

    const user = JSON.parse(userData);
    if (!user.permissions?.mls) {
      router.push('/user/dashboard');
      return;
    }

    fetchPropertyDetails();
    checkIfFavorite();
  }, [params.id]);

  const fetchPropertyDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`/api/mls/${params.id}`);

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      setProperty(response.data);
    } catch (error) {
      console.error('Error fetching property details:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch property details');
    } finally {
      setLoading(false);
    }
  };

  const checkIfFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    setIsFavorite(favorites.some((fav: any) => fav.ListingKey === params.id));
  };

  const toggleFavorite = async () => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) return;
      
      const user = JSON.parse(userData);
      
      // Update database
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user._id,
          property: property
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update favorites');
      }

      const result = await response.json();
      const isNowFavorite = result.action === 'added';

      // Update localStorage
      const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
      let updatedFavorites;
      
      if (isNowFavorite) {
        updatedFavorites = [...favorites, property];
        toast.success('Added to favorites');
      } else {
        updatedFavorites = favorites.filter((fav: any) => fav.ListingKey !== params.id);
        toast.success('Removed from favorites');
      }
      
      localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
      setIsFavorite(isNowFavorite);
    } catch (error) {
      console.error('Error updating favorites:', error);
      toast.error('Failed to update favorites');
    }
  };

  const generatePDF = async () => {
    try {
      setGeneratingPDF(true);
      
      const doc = new jsPDF();
      let yPos = 20; // Starting Y position
      
      // Helper function to format currency
      const formatCurrency = (value: number): string => {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(value);
      };

      // Helper function to format date
      const formatDate = (dateString: string): string => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      };
      
      // Helper function to add a section
      const addSection = (title: string, details: [string, any][], startY: number) => {
        // Check if section has any non-empty values
        const hasData = details.some(([_, value]) => 
          value !== undefined && value !== null && value !== ''
        );
        
        if (!hasData) return startY; // Skip section if no data
        
        doc.setFontSize(16);
        doc.setTextColor(220, 38, 38);
        doc.text(title, 20, startY);
        
        let currentY = startY + 15;
        doc.setFontSize(11);
        doc.setTextColor(60, 60, 60);
        
        details.forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            let formattedValue: string;
            
            // Format different types of values
            if (typeof value === 'number') {
              if (key.toLowerCase().includes('price')) {
                formattedValue = formatCurrency(value);
              } else if (key.toLowerCase().includes('area') || key.toLowerCase().includes('size')) {
                formattedValue = `${value.toLocaleString()} sqft`;
              } else {
                formattedValue = value.toLocaleString();
              }
            } else if (typeof value === 'boolean') {
              formattedValue = value ? 'Yes' : 'No';
            } else if (typeof value === 'string' && (
              key.toLowerCase().includes('date') || 
              key.toLowerCase().includes('timestamp')
            )) {
              formattedValue = formatDate(value);
            } else {
              formattedValue = String(value);
            }
            
            // Handle long text with wrapping
            if (formattedValue.length > 50) {
              const words = formattedValue.split(' ');
              let line = '';
              let firstLine = true;
              
              words.forEach(word => {
                if ((line + word).length > 50) {
                  doc.text(firstLine ? `${key}:` : '', 25, currentY);
                  doc.text(line, firstLine ? 100 : 100, currentY);
                  line = word + ' ';
                  currentY += 7;
                  firstLine = false;
                } else {
                  line += word + ' ';
                }
              });
              
              if (line) {
                doc.text(firstLine ? `${key}:` : '', 25, currentY);
                doc.text(line, firstLine ? 100 : 100, currentY);
                currentY += 7;
              }
            } else {
              doc.text(`${key}:`, 25, currentY);
              doc.text(formattedValue, 100, currentY);
              currentY += 7;
            }
          }
        });
        
        return currentY + 10; // Return next Y position with padding
      };

      // Property Header
      doc.setFontSize(24);
      doc.setTextColor(220, 38, 38);
      doc.text("Property Report", 20, yPos);
      
      yPos = 40;
      doc.setFontSize(18);
      doc.setTextColor(0, 0, 0);
      doc.text(property.UnparsedAddress, 20, yPos);
      
      yPos = 50;
      doc.setFontSize(12);
      doc.text([
        property.City,
        property.StateOrProvince,
        property.PostalCode
      ].filter(Boolean).join(", "), 20, yPos);

      yPos += 20;

      // Create sections from all available data
      const sections = {
        "Property Overview": [
          ["List Price", property.ListPrice],
          ["Status", property.StandardStatus],
          ["Property Type", property.PropertyType],
          ["Year Built", property.YearBuilt],
          ["Living Area", property.LivingArea],
          ["Lot Size", property.LotSizeArea && property.LotSizeUnits ? 
            `${property.LotSizeArea} ${property.LotSizeUnits}` : undefined],
          ["Price per Sq Ft", property.ListPrice && property.LivingArea ? 
            Math.round(property.ListPrice / property.LivingArea) : undefined]
        ],

        "Interior Features": [
          ["Bedrooms", property.BedroomsTotal],
          ["Bathrooms", property.BathroomsTotalInteger],
          ["Total Rooms", property.RoomCount],
          ["Basement", property.BasementArea ? 
            `${property.BasementArea} sqft${property.BasementFinished ? ' (Finished)' : ''}` : undefined],
          ["Interior Features", property.InteriorFeatures],
          ["Appliances", property.Appliances],
          ["Flooring", property.Flooring]
        ],

        "Exterior & Construction": [
          ["Construction", property.Construction],
          ["Architectural Style", property.ArchitecturalStyle],
          ["Exterior Features", property.ExteriorFeatures],
          ["Patio/Porch", property.PatioAndPorchFeatures],
          ["Pool", property.Pool],
          ["Foundation", property.Foundation],
          ["Roof Material", property.RoofMaterial]
        ],

        "Systems & Utilities": [
          ["Cooling System", property.CoolingSystem],
          ["Heating System", property.HeatingSystem],
          ["Utilities", property.Utilities],
          ["Water Source", property.WaterSource],
          ["Electric System", property.ElectricSystem],
          ["Sewer System", property.SewerSystem],
          ["Security Features", property.SecurityFeatures]
        ],

        "Parking & Community": [
          ["Garage Spaces", property.GarageSpaces],
          ["Total Parking", property.ParkingTotal],
          ["Parking Features", property.ParkingFeatures],
          ["Community Features", property.CommunityFeatures],
          ["Community Name", property.CommunityName],
          ["View", property.View],
          ["Pets", property.Pets]
        ],

        "Financial Details": [
          ["Association Fee", property.AssociationFee],
          ["Fee Includes", property.AssociationFeeIncludes],
          ["Tax Amount (Annual)", property.TaxAnnualAmount],
          ["Tax Year", property.TaxYear]
        ],

        "Listing Information": [
          ["MLS Listing Key", property.ListingKey],
          ["List Date", property.ListingContractDate],
          ["Days on Market", property.DaysOnMarket],
          ["Last Modified", property.ModificationTimestamp],
          ["Original Entry", property.OriginalEntryTimestamp]
        ]
      };

      // Add each section to the PDF
      Object.entries(sections).forEach(([title, details]) => {
        if (yPos > 250) { // Add new page if near bottom
          doc.addPage();
          yPos = 20;
        }
        yPos = addSection(title, details as [string, any][], yPos);
      });

      // Add footer with timestamp
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      const footerText = "Generated by Get Home Realty MLS System";
      const timestamp = new Date().toLocaleString();
      const footerWidth = doc.getStringUnitWidth(footerText) * 10;
      const pageWidth = doc.internal.pageSize.width;
      doc.text(footerText, (pageWidth - footerWidth) / 2, 280);
      doc.text(`Generated on: ${timestamp}`, 20, 285);
      doc.text(`MLS Listing Key: ${property.ListingKey}`, 20, 290);

      // Save the PDF
      doc.save(`property-${property.ListingKey}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    } finally {
      setGeneratingPDF(false);
    }
  };

  const formatValue = (value: any) => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'number') return value.toLocaleString();
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return value;
  };

  const propertyFields: PropertyField[] = [
    // Basic Info
    { key: 'ListPrice', icon: <Home className="h-4 w-4" />, label: 'List Price', prefix: '$' },
    { key: 'BedroomsTotal', icon: <Bed className="h-4 w-4" />, label: 'Bedrooms' },
    { key: 'BathroomsTotalInteger', icon: <Bath className="h-4 w-4" />, label: 'Bathrooms' },
    { key: 'LivingArea', icon: <Square className="h-4 w-4" />, label: 'Living Area', suffix: 'sqft' },
    { key: 'PropertyType', icon: <Home className="h-4 w-4" />, label: 'Property Type' },
    { key: 'PropertySubType', icon: <Home className="h-4 w-4" />, label: 'Property Sub Type' },
    { key: 'StandardStatus', icon: <Info className="h-4 w-4" />, label: 'Status' },
    { key: 'PropertyCondition', icon: <Info className="h-4 w-4" />, label: 'Condition' },

    // Location Details
    { key: 'UnparsedAddress', icon: <MapPin className="h-4 w-4" />, label: 'Address' },
    { key: 'City', icon: <MapPin className="h-4 w-4" />, label: 'City' },
    { key: 'StateOrProvince', icon: <MapPin className="h-4 w-4" />, label: 'State' },
    { key: 'PostalCode', icon: <MapPin className="h-4 w-4" />, label: 'Postal Code' },
    { key: 'CountyOrParish', icon: <MapPin className="h-4 w-4" />, label: 'County' },
    { key: 'MLSAreaMajor', icon: <MapPin className="h-4 w-4" />, label: 'MLS Area' },
    { key: 'Subdivision', icon: <MapPin className="h-4 w-4" />, label: 'Subdivision' },

    // Property Details
    { key: 'YearBuilt', icon: <Building2 className="h-4 w-4" />, label: 'Year Built' },
    { key: 'LotSizeArea', icon: <Ruler className="h-4 w-4" />, label: 'Lot Size', suffix: 'sqft' },
    { key: 'LotSizeUnits', icon: <Ruler className="h-4 w-4" />, label: 'Lot Size Units' },
    { key: 'StoriesTotal', icon: <Building2 className="h-4 w-4" />, label: 'Stories' },
    { key: 'RoomsTotal', icon: <Home className="h-4 w-4" />, label: 'Total Rooms' },
    { key: 'BedroomsTotal', icon: <Bed className="h-4 w-4" />, label: 'Total Bedrooms' },
    { key: 'BedroomsPossible', icon: <Bed className="h-4 w-4" />, label: 'Possible Bedrooms' },
    { key: 'BathroomsTotalInteger', icon: <Bath className="h-4 w-4" />, label: 'Total Bathrooms' },
    { key: 'BathroomsFull', icon: <Bath className="h-4 w-4" />, label: 'Full Bathrooms' },
    { key: 'BathroomsHalf', icon: <Bath className="h-4 w-4" />, label: 'Half Bathrooms' },
    { key: 'BathroomsThreeQuarter', icon: <Bath className="h-4 w-4" />, label: '3/4 Bathrooms' },

    // Parking & Garage
    { key: 'ParkingTotal', icon: <Car className="h-4 w-4" />, label: 'Total Parking' },
    { key: 'GarageSpaces', icon: <Car className="h-4 w-4" />, label: 'Garage Spaces' },
    { key: 'CarportSpaces', icon: <Car className="h-4 w-4" />, label: 'Carport Spaces' },
    { key: 'CoveredSpaces', icon: <Car className="h-4 w-4" />, label: 'Covered Spaces' },
    { key: 'ParkingFeatures', icon: <Car className="h-4 w-4" />, label: 'Parking Features' },

    // Construction & Structure
    { key: 'ConstructionMaterials', icon: <Building2 className="h-4 w-4" />, label: 'Construction Materials' },
    { key: 'Foundation', icon: <Building2 className="h-4 w-4" />, label: 'Foundation' },
    { key: 'Roof', icon: <Home className="h-4 w-4" />, label: 'Roof' },
    { key: 'RoofMaterial', icon: <Home className="h-4 w-4" />, label: 'Roof Material' },
    { key: 'ExteriorFeatures', icon: <Home className="h-4 w-4" />, label: 'Exterior Features' },
    { key: 'InteriorFeatures', icon: <Home className="h-4 w-4" />, label: 'Interior Features' },
    { key: 'Flooring', icon: <Square className="h-4 w-4" />, label: 'Flooring' },

    // Systems & Utilities
    { key: 'Heating', icon: <Home className="h-4 w-4" />, label: 'Heating' },
    { key: 'HeatingYN', icon: <Home className="h-4 w-4" />, label: 'Has Heating' },
    { key: 'Cooling', icon: <Home className="h-4 w-4" />, label: 'Cooling' },
    { key: 'CoolingYN', icon: <Home className="h-4 w-4" />, label: 'Has Cooling' },
    { key: 'WaterSource', icon: <Home className="h-4 w-4" />, label: 'Water Source' },
    { key: 'SewerSeptic', icon: <Home className="h-4 w-4" />, label: 'Sewer/Septic' },
    { key: 'Electric', icon: <Home className="h-4 w-4" />, label: 'Electric' },
    { key: 'Utilities', icon: <Home className="h-4 w-4" />, label: 'Utilities' },

    // Financial Details
    { key: 'OriginalListPrice', icon: <Home className="h-4 w-4" />, label: 'Original Price', prefix: '$' },
    { key: 'PricePerSquareFoot', icon: <Square className="h-4 w-4" />, label: 'Price/SqFt', prefix: '$' },
    { key: 'TaxAssessedValue', icon: <Home className="h-4 w-4" />, label: 'Tax Assessment', prefix: '$' },
    { key: 'TaxAnnualAmount', icon: <Home className="h-4 w-4" />, label: 'Annual Tax', prefix: '$' },
    { key: 'AssociationFee', icon: <Home className="h-4 w-4" />, label: 'HOA Fee', prefix: '$', suffix: '/month' },
    { key: 'AssociationFeeFrequency', icon: <Home className="h-4 w-4" />, label: 'HOA Fee Frequency' },
    { key: 'AssociationName', icon: <Home className="h-4 w-4" />, label: 'Association Name' },

    // Listing Details
    { key: 'ListingKey', icon: <Info className="h-4 w-4" />, label: 'MLS #' },
    { key: 'ListAgentFullName', icon: <Info className="h-4 w-4" />, label: 'Listing Agent' },
    { key: 'ListAgentEmail', icon: <Mail className="h-4 w-4" />, label: 'Agent Email' },
    { key: 'ListAgentPhone', icon: <Phone className="h-4 w-4" />, label: 'Agent Phone' },
    { key: 'ListOfficeName', icon: <Building2 className="h-4 w-4" />, label: 'Listing Office' },

    // Dates
    { key: 'ListDate', icon: <CalendarDays className="h-4 w-4" />, label: 'List Date' },
    { key: 'ModificationTimestamp', icon: <CalendarDays className="h-4 w-4" />, label: 'Last Updated' },
    { key: 'ContractStatusChangeDate', icon: <CalendarDays className="h-4 w-4" />, label: 'Status Change Date' },
    { key: 'CloseDate', icon: <CalendarDays className="h-4 w-4" />, label: 'Close Date' }
  ];

  // Group the fields by category
  const propertyGroups: PropertyGroups = {
    'Basic Info': propertyFields.slice(0, 8),
    'Location': propertyFields.slice(8, 15),
    'Property Details': propertyFields.slice(15, 26),
    'Parking & Garage': propertyFields.slice(26, 31),
    'Construction & Structure': propertyFields.slice(31, 38),
    'Systems & Utilities': propertyFields.slice(38, 46),
    'Financial Details': propertyFields.slice(46, 54),
    'Listing Details': propertyFields.slice(54, 59),
    'Important Dates': propertyFields.slice(59)
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="animate-pulse">Loading property details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] gap-4">
        <div className="text-destructive">{error}</div>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] gap-4">
        <div>Property not found</div>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="group self-start"
        >
          <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
          Back to Listings
        </Button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Property Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Property Header */}
          <Card className="overflow-hidden">
            <div className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-2xl font-semibold mb-2">
                    ${formatValue(property.ListPrice)}
                  </h1>
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 flex-shrink-0 mt-1" />
                    <div>
                      <div className="break-words">{property.UnparsedAddress}</div>
                      <div>
                        {[property.City, property.StateOrProvince, property.PostalCode]
                          .filter(Boolean)
                          .join(', ')}
                      </div>
                    </div>
                  </div>
                </div>
                <Badge variant={property.StandardStatus === 'Active' ? 'default' : 'secondary'}>
                  {property.StandardStatus || 'Unknown'}
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-secondary/20 rounded-lg">
                    <Bed className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Bedrooms</div>
                    <div className="font-medium">{formatValue(property.BedroomsTotal)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-secondary/20 rounded-lg">
                    <Bath className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Bathrooms</div>
                    <div className="font-medium">{formatValue(property.BathroomsTotalInteger)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-secondary/20 rounded-lg">
                    <Square className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Living Area</div>
                    <div className="font-medium">{formatValue(property.LivingArea)} sqft</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-secondary/20 rounded-lg">
                    <Home className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Property Type</div>
                    <div className="font-medium">{formatValue(property.PropertyType)}</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Description */}
          {property.PublicRemarks && (
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Description</h2>
                <p className="whitespace-pre-line text-muted-foreground">{property.PublicRemarks}</p>
              </div>
            </Card>
          )}

          {/* Property Details */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-6">Property Details</h2>
              <div className="space-y-8">
                {Object.entries(propertyGroups).map(([groupName, fields]) => (
                  <div key={groupName}>
                    <h3 className="text-sm font-medium text-muted-foreground mb-4">{groupName}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-8">
                      {fields.map((field) => (
                        property[field.key] && (
                          <div key={field.key} className="flex items-center gap-3">
                            <div className="p-2 bg-secondary/20 rounded-lg">
                              {field.icon}
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">{field.label}</div>
                              <div className="font-medium">
                                {field.prefix && field.prefix}{formatValue(property[field.key])}{field.suffix && ` ${field.suffix}`}
                              </div>
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Features */}
          {(property.InteriorFeatures || property.ExteriorFeatures) && (
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-6">Features</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {property.InteriorFeatures && (
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground mb-3">Interior Features</h3>
                      <ul className="space-y-2">
                        {typeof property.InteriorFeatures === 'string' 
                          ? property.InteriorFeatures.split(',').map((feature: string) => (
                            <li key={feature.trim()} className="flex items-center gap-2">
                              <div className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                              <span className="text-sm">{feature.trim()}</span>
                            </li>
                          ))
                          : <li className="text-sm text-muted-foreground">No interior features listed</li>
                        }
                      </ul>
                    </div>
                  )}
                  {property.ExteriorFeatures && (
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground mb-3">Exterior Features</h3>
                      <ul className="space-y-2">
                        {typeof property.ExteriorFeatures === 'string'
                          ? property.ExteriorFeatures.split(',').map((feature: string) => (
                            <li key={feature.trim()} className="flex items-center gap-2">
                              <div className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                              <span className="text-sm">{feature.trim()}</span>
                            </li>
                          ))
                          : <li className="text-sm text-muted-foreground">No exterior features listed</li>
                        }
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right Column - Contact and Additional Info */}
        <div className="space-y-6">
          {/* Action Buttons */}
          <Card>
            <div className="p-6 space-y-4">
              <Button 
                className="w-full"
                variant={isFavorite ? "default" : "outline"}
                onClick={toggleFavorite}
              >
                {isFavorite ? (
                  <>
                    <Heart className="h-4 w-4 mr-2 fill-current" />
                    Saved to Favorites
                  </>
                ) : (
                  <>
                    <Heart className="h-4 w-4 mr-2" />
                    Save to Favorites
                  </>
                )}
              </Button>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => {
                  const shareUrl = window.location.href;
                  if (navigator.share) {
                    navigator.share({
                      title: `Property at ${property.UnparsedAddress}`,
                      text: `Check out this property: ${property.UnparsedAddress}`,
                      url: shareUrl
                    }).catch(() => {
                      navigator.clipboard.writeText(shareUrl);
                      toast.success('Link copied to clipboard');
                    });
                  } else {
                    navigator.clipboard.writeText(shareUrl);
                    toast.success('Link copied to clipboard');
                  }
                }}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share Property
              </Button>
              <Button 
                className="w-full"
                variant="outline"
                onClick={generatePDF}
                disabled={generatingPDF}
              >
                {generatingPDF ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <FileDown className="h-4 w-4 mr-2" />
                    Download PDF
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Contact Card */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
              <div className="space-y-4">
                {property.ListAgentFullName && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-secondary/20 rounded-lg">
                      <Info className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Listing Agent</div>
                      <div className="font-medium">{property.ListAgentFullName}</div>
                    </div>
                  </div>
                )}
                {property.ListAgentEmail && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-secondary/20 rounded-lg">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Email</div>
                      <div className="font-medium">{property.ListAgentEmail}</div>
                    </div>
                  </div>
                )}
                {property.ListAgentPhone && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-secondary/20 rounded-lg">
                      <Phone className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Phone</div>
                      <div className="font-medium">{property.ListAgentPhone}</div>
                    </div>
                  </div>
                )}
                {property.ListOfficeName && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-secondary/20 rounded-lg">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Office</div>
                      <div className="font-medium">{property.ListOfficeName}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
} 