'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CardItem } from '@/components/ui/card-item';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  MapPin,
  Bed,
  Bath,
  Square,
  Search,
  Heart,
  Share2,
  X,
  ArrowLeft,
  FileDown,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { useDebounce } from '@/lib/hooks/use-debounce';
import { jsPDF } from 'jspdf';

interface Property {
  ListingKey: string;
  UnparsedAddress: string;
  City: string;
  StateOrProvince: string;
  PostalCode: string;
  ListPrice: number;
  BedroomsTotal: number;
  BathroomsTotalInteger: number;
  LivingArea: number;
  PropertyType: string;
  StandardStatus: string;
}

const SORT_OPTIONS = [
  { value: 'date_desc', label: 'Recently Added' },
  { value: 'date_asc', label: 'Oldest First' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'price_asc', label: 'Price: Low to High' }
];

export default function UserFavoritesPage() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<Property[]>([]);
  const [filteredFavorites, setFilteredFavorites] = useState<Property[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');
  const [generatingPDF, setGeneratingPDF] = useState<string | null>(null);
  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    // Check user permissions
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }

    const user = JSON.parse(userData);
    if (!user.permissions?.favorites) {
      router.push('/user/dashboard');
      return;
    }

    // Load favorites from database
    loadFavorites(user._id);
  }, [router]);

  const loadFavorites = async (userId: string) => {
    try {
      // Get favorites from database
      const response = await fetch(`/api/favorites?userId=${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch favorites');
      }
      const data = await response.json();
      
      // Extract properties from favorites data
      const dbFavorites = data.favorites.map((fav: any) => fav.property);
      
      // Update localStorage with database favorites
      localStorage.setItem('favorites', JSON.stringify(dbFavorites));
      
      // Update state
      setFavorites(dbFavorites);
      setFilteredFavorites(dbFavorites);
    } catch (error) {
      console.error('Error loading favorites:', error);
      // Fallback to localStorage if database fetch fails
      const savedFavorites = localStorage.getItem('favorites');
      if (savedFavorites) {
        const parsedFavorites = JSON.parse(savedFavorites);
        setFavorites(parsedFavorites);
        setFilteredFavorites(parsedFavorites);
      }
    }
  };

  useEffect(() => {
    let filtered = [...favorites];

    // Apply search filter
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      filtered = filtered.filter(property => 
        property.UnparsedAddress.toLowerCase().includes(searchLower) ||
        property.City.toLowerCase().includes(searchLower) ||
        property.StateOrProvince.toLowerCase().includes(searchLower) ||
        property.PostalCode.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price_desc':
          return b.ListPrice - a.ListPrice;
        case 'price_asc':
          return a.ListPrice - b.ListPrice;
        case 'date_asc':
          return 0; // Would need timestamp of when added to implement
        case 'date_desc':
        default:
          return 0; // Most recent first is default
      }
    });

    setFilteredFavorites(filtered);
  }, [favorites, debouncedSearch, sortBy]);

  const removeFavorite = async (listingKey: string) => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) return;
      
      const user = JSON.parse(userData);
      const propertyToRemove = favorites.find(p => p.ListingKey === listingKey);
      
      if (!propertyToRemove) return;

      // Remove from database
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user._id,
          property: propertyToRemove
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to remove favorite');
      }

      // Update local state and storage
      const updatedFavorites = favorites.filter(property => property.ListingKey !== listingKey);
      setFavorites(updatedFavorites);
      localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
      toast.success('Removed from favorites');
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast.error('Failed to remove from favorites');
    }
  };

  const handleShare = async (property: Property) => {
    const shareUrl = `${window.location.origin}/user/mls/${property.ListingKey}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: property.UnparsedAddress,
          text: `Check out this property: ${property.UnparsedAddress}`,
          url: shareUrl
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Link copied to clipboard');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const formatValue = (value: any) => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'number') return value.toLocaleString();
    return value;
  };

  const generatePDF = async (property: Property) => {
    try {
      setGeneratingPDF(property.ListingKey);

      // Fetch complete property details from API
      const response = await fetch(`/api/mls/${property.ListingKey}`);
      if (!response.ok) {
        throw new Error('Failed to fetch property details');
      }
      const fullPropertyData = await response.json();
      
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
      doc.text(fullPropertyData.UnparsedAddress || property.UnparsedAddress, 20, yPos);
      
      yPos = 50;
      doc.setFontSize(12);
      doc.text([
        fullPropertyData.City || property.City,
        fullPropertyData.StateOrProvince || property.StateOrProvince,
        fullPropertyData.PostalCode || property.PostalCode
      ].filter(Boolean).join(", "), 20, yPos);

      yPos += 20;

      // Create sections from all available data
      const sections = {
        "Property Overview": [
          ["List Price", fullPropertyData.ListPrice],
          ["Status", fullPropertyData.StandardStatus],
          ["Property Type", fullPropertyData.PropertyType],
          ["Year Built", fullPropertyData.YearBuilt],
          ["Living Area", fullPropertyData.LivingArea],
          ["Lot Size", fullPropertyData.LotSizeArea && fullPropertyData.LotSizeUnits ? 
            `${fullPropertyData.LotSizeArea} ${fullPropertyData.LotSizeUnits}` : undefined],
          ["Price per Sq Ft", fullPropertyData.ListPrice && fullPropertyData.LivingArea ? 
            Math.round(fullPropertyData.ListPrice / fullPropertyData.LivingArea) : undefined]
        ],

        "Interior Features": [
          ["Bedrooms", fullPropertyData.BedroomsTotal],
          ["Bathrooms", fullPropertyData.BathroomsTotalInteger],
          ["Total Rooms", fullPropertyData.RoomCount],
          ["Basement", fullPropertyData.BasementArea ? 
            `${fullPropertyData.BasementArea} sqft${fullPropertyData.BasementFinished ? ' (Finished)' : ''}` : undefined],
          ["Interior Features", fullPropertyData.InteriorFeatures],
          ["Appliances", fullPropertyData.Appliances],
          ["Flooring", fullPropertyData.Flooring]
        ],

        "Exterior & Construction": [
          ["Construction", fullPropertyData.Construction],
          ["Architectural Style", fullPropertyData.ArchitecturalStyle],
          ["Exterior Features", fullPropertyData.ExteriorFeatures],
          ["Patio/Porch", fullPropertyData.PatioAndPorchFeatures],
          ["Pool", fullPropertyData.Pool],
          ["Foundation", fullPropertyData.Foundation],
          ["Roof Material", fullPropertyData.RoofMaterial]
        ],

        "Systems & Utilities": [
          ["Cooling System", fullPropertyData.CoolingSystem],
          ["Heating System", fullPropertyData.HeatingSystem],
          ["Utilities", fullPropertyData.Utilities],
          ["Water Source", fullPropertyData.WaterSource],
          ["Electric System", fullPropertyData.ElectricSystem],
          ["Sewer System", fullPropertyData.SewerSystem],
          ["Security Features", fullPropertyData.SecurityFeatures]
        ],

        "Parking & Community": [
          ["Garage Spaces", fullPropertyData.GarageSpaces],
          ["Total Parking", fullPropertyData.ParkingTotal],
          ["Parking Features", fullPropertyData.ParkingFeatures],
          ["Community Features", fullPropertyData.CommunityFeatures],
          ["Community Name", fullPropertyData.CommunityName],
          ["View", fullPropertyData.View],
          ["Pets", fullPropertyData.Pets]
        ],

        "Financial Details": [
          ["Association Fee", fullPropertyData.AssociationFee],
          ["Fee Includes", fullPropertyData.AssociationFeeIncludes],
          ["Tax Amount (Annual)", fullPropertyData.TaxAnnualAmount],
          ["Tax Year", fullPropertyData.TaxYear]
        ],

        "Listing Information": [
          ["MLS Listing Key", fullPropertyData.ListingKey],
          ["List Date", fullPropertyData.ListingContractDate],
          ["Days on Market", fullPropertyData.DaysOnMarket],
          ["Last Modified", fullPropertyData.ModificationTimestamp],
          ["Original Entry", fullPropertyData.OriginalEntryTimestamp]
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
      doc.text(`MLS Listing Key: ${fullPropertyData.ListingKey || property.ListingKey}`, 20, 290);

      // Save the PDF
      doc.save(`property-${property.ListingKey}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    } finally {
      setGeneratingPDF(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Favorite Properties</h1>
            <p className="text-muted-foreground">{filteredFavorites.length} saved properties</p>
          </div>
          <div className="flex items-center gap-4">
            <Select
              value={sortBy}
              onValueChange={setSortBy}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search your favorites..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1 h-7 w-7"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Properties Grid */}
        {filteredFavorites.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              {searchQuery ? 'No matching properties found' : 'No favorite properties yet'}
            </div>
            <Button onClick={() => router.push('/user/mls')}>
              Browse MLS Listings
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredFavorites.map((property) => (
              <CardItem
                key={property.ListingKey}
                onClick={() => router.push(`/user/mls/${property.ListingKey}`)}
                header={
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold truncate">
                      ${formatValue(property.ListPrice)}
                    </h3>
                    <Badge>
                      {property.StandardStatus || 'Unknown'}
                    </Badge>
                  </div>
                }
                footer={
                  <div className="flex gap-2">
                    <Button 
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/user/mls/${property.ListingKey}`);
                      }}
                    >
                      View Details
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare(property);
                      }}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        generatePDF(property);
                      }}
                      disabled={generatingPDF === property.ListingKey}
                    >
                      {generatingPDF === property.ListingKey ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <FileDown className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFavorite(property.ListingKey);
                      }}
                    >
                      <Heart className="h-4 w-4 fill-current" />
                    </Button>
                  </div>
                }
              >
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 flex-shrink-0 mt-1" />
                    <div className="text-sm">
                      <div className="font-medium truncate">{property.UnparsedAddress || 'No Address'}</div>
                      <div className="text-muted-foreground truncate">
                        {[property.City, property.StateOrProvince, property.PostalCode]
                          .filter(Boolean)
                          .join(', ')}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      <Bed className="h-4 w-4" />
                      <span>{formatValue(property.BedroomsTotal)} bd</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Bath className="h-4 w-4" />
                      <span>{formatValue(property.BathroomsTotalInteger)} ba</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Square className="h-4 w-4" />
                      <span>{formatValue(property.LivingArea)} sqft</span>
                    </div>
                  </div>
                </div>
              </CardItem>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 