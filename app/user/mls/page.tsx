'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CardItem } from '@/components/ui/card-item';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDebounce } from '@/lib/hooks/use-debounce';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Building,
  MapPin,
  Bed,
  Bath,
  Square,
  SlidersHorizontal,
  Search,
  X,
  Filter,
  ChevronDown,
  ArrowUpDown,
  TrendingUp
} from 'lucide-react';
import axios from 'axios';

interface Filters {
  priceMin: number;
  priceMax: number;
  beds: string;
  baths: string;
  propertyType: string;
  status: string;
  sort: string;
}

const MAX_PRICE = 1000000;

const SORT_OPTIONS = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest First' }
];

// Generate min price options with custom increments
const MIN_PRICE_OPTIONS = [
  { value: '0', label: 'No Min' },
  // $0 to $3000 in $500 increments
  ...Array.from({ length: 6 }, (_, i) => ({
    value: (500 * (i + 1)).toString(),
    label: `$${(500 * (i + 1)).toLocaleString()}`
  })),
  // $4000 to $10000 in $1000 increments
  ...Array.from({ length: 7 }, (_, i) => ({
    value: (4000 + 1000 * i).toString(),
    label: `$${(4000 + 1000 * i).toLocaleString()}`
  }))
];

// Generate max price options with custom increments
const MAX_PRICE_OPTIONS = [
  // $10000 to $100000 in $10000 increments
  ...Array.from({ length: 10 }, (_, i) => ({
    value: (10000 * (i + 1)).toString(),
    label: `$${(10000 * (i + 1)).toLocaleString()}`
  })),
  // $200000 to $1000000 in $100000 increments
  ...Array.from({ length: 9 }, (_, i) => ({
    value: (200000 + 100000 * i).toString(),
    label: `$${(200000 + 100000 * i).toLocaleString()}`
  })),
  { value: 'any', label: 'Any Price' }
];

export default function UserMLSPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [totalPages, setTotalPages] = useState(1);
  const [totalProperties, setTotalProperties] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [showPriceFilter, setShowPriceFilter] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [showActiveFilters, setShowActiveFilters] = useState(false);

  const [activeFilters, setActiveFilters] = useState<Filters>({
    priceMin: 0,
    priceMax: MAX_PRICE,
    beds: 'any',
    baths: 'any',
    propertyType: 'any',
    status: 'any',
    sort: 'popular'
  });

  const [pendingFilters, setPendingFilters] = useState<Filters>({
    priceMin: 0,
    priceMax: MAX_PRICE,
    beds: 'any',
    baths: 'any',
    propertyType: 'any',
    status: 'any',
    sort: 'popular'
  });

  // First useEffect to handle permission check
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }

    const user = JSON.parse(userData);
    if (!user.permissions?.mls) {
      router.push('/user/dashboard');
    }
  }, [router]);

  // Second useEffect to handle data fetching
  useEffect(() => {
    fetchProperties();
  }, [page, activeFilters, debouncedSearch]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        ...(debouncedSearch && { search: debouncedSearch }),
        ...Object.entries(activeFilters).reduce((acc, [key, value]) => {
          if (key === 'sort' && value !== 'default') {
            acc[key] = value;
          } else if (value !== 'any' && value !== 0 && value !== MAX_PRICE) {
            acc[key] = value.toString();
          }
          return acc;
        }, {} as Record<string, string>)
      });

      const response = await axios.get(`/api/mls?${params}`);

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      setProperties(response.data.properties);
      setTotalProperties(response.data.total);
      setTotalPages(Math.ceil(response.data.total / response.data.pageSize));
    } catch (error) {
      console.error('Error fetching properties:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch properties');
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (value: any) => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'number') return value.toLocaleString();
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return value;
  };

  const handleFilterChange = (key: keyof Filters, value: any) => {
    setPendingFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    setActiveFilters(pendingFilters);
    setPage(1);
    setIsMobileFiltersOpen(false);
    setShowActiveFilters(true);
  };

  const clearFilters = () => {
    const defaultFilters = {
      priceMin: 0,
      priceMax: MAX_PRICE,
      beds: 'any',
      baths: 'any',
      propertyType: 'any',
      status: 'any',
      sort: 'popular'
    };
    setPendingFilters(defaultFilters);
    setActiveFilters(defaultFilters);
    setShowActiveFilters(false);
    setPage(1);
  };

  const getActiveFilterCount = () => {
    return Object.entries(activeFilters).filter(([key, value]) => {
      if (key === 'priceMin' && value > 0) return true;
      if (key === 'priceMax' && value < MAX_PRICE) return true;
      if (value !== 'any' && value !== 0) return true;
      return false;
    }).length;
  };

  const renderActiveFilters = () => {
    const filters = [];
    
    if (activeFilters.priceMin > 0 || activeFilters.priceMax < MAX_PRICE) {
      filters.push(
        <Badge key="price" variant="secondary" className="text-xs">
          ${formatValue(activeFilters.priceMin)} - ${formatValue(activeFilters.priceMax)}
        </Badge>
      );
    }
    
    if (activeFilters.beds !== 'any') {
      filters.push(
        <Badge key="beds" variant="secondary" className="text-xs">
          {activeFilters.beds}+ beds
        </Badge>
      );
    }
    
    if (activeFilters.baths !== 'any') {
      filters.push(
        <Badge key="baths" variant="secondary" className="text-xs">
          {activeFilters.baths}+ baths
        </Badge>
      );
    }
    
    if (activeFilters.propertyType !== 'any') {
      filters.push(
        <Badge key="type" variant="secondary" className="text-xs">
          {activeFilters.propertyType}
        </Badge>
      );
    }
    
    if (activeFilters.status !== 'any') {
      filters.push(
        <Badge key="status" variant="secondary" className="text-xs">
          {activeFilters.status}
        </Badge>
      );
    }

    return filters;
  };

  const renderFilters = () => (
    <div className="space-y-6">
      {/* Search */}
      <div className="space-y-2">
        <Label>Search Properties</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by address, city, or ZIP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Sort */}
      <div className="space-y-2">
        <Label>Sort By</Label>
        <Select
          value={pendingFilters.sort}
          onValueChange={(value) => handleFilterChange('sort', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Default" />
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

      {/* Price Range */}
      <div className="space-y-2">
        <Label>Min Price</Label>
        <Select
          value={pendingFilters.priceMin.toString()}
          onValueChange={(value) => handleFilterChange('priceMin', Number(value))}
        >
          <SelectTrigger>
            <SelectValue placeholder="No Min" />
          </SelectTrigger>
          <SelectContent>
            {MIN_PRICE_OPTIONS.map(option => (
              <SelectItem 
                key={option.value} 
                value={option.value}
                disabled={Number(option.value) >= pendingFilters.priceMax}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Max Price</Label>
        <Select
          value={pendingFilters.priceMax.toString()}
          onValueChange={(value) => handleFilterChange('priceMax', value === 'any' ? MAX_PRICE : Number(value))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Any Price" />
          </SelectTrigger>
          <SelectContent>
            {MAX_PRICE_OPTIONS.map(option => (
              <SelectItem 
                key={option.value} 
                value={option.value}
                disabled={option.value !== 'any' && Number(option.value) <= pendingFilters.priceMin}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Bedrooms */}
      <div className="space-y-2">
        <Label>Bedrooms</Label>
        <Select
          value={pendingFilters.beds}
          onValueChange={(value) => handleFilterChange('beds', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any</SelectItem>
            <SelectItem value="1">1+</SelectItem>
            <SelectItem value="2">2+</SelectItem>
            <SelectItem value="3">3+</SelectItem>
            <SelectItem value="4">4+</SelectItem>
            <SelectItem value="5">5+</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bathrooms */}
      <div className="space-y-2">
        <Label>Bathrooms</Label>
        <Select
          value={pendingFilters.baths}
          onValueChange={(value) => handleFilterChange('baths', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any</SelectItem>
            <SelectItem value="1">1+</SelectItem>
            <SelectItem value="2">2+</SelectItem>
            <SelectItem value="3">3+</SelectItem>
            <SelectItem value="4">4+</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Property Type */}
      <div className="space-y-2">
        <Label>Property Type</Label>
        <Select
          value={pendingFilters.propertyType}
          onValueChange={(value) => handleFilterChange('propertyType', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any</SelectItem>
            <SelectItem value="Residential">Residential</SelectItem>
            <SelectItem value="Condo">Condo</SelectItem>
            <SelectItem value="Townhouse">Townhouse</SelectItem>
            <SelectItem value="MultiFamily">Multi-Family</SelectItem>
            <SelectItem value="Land">Land</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Status */}
      <div className="space-y-2">
        <Label>Status</Label>
        <Select
          value={pendingFilters.status}
          onValueChange={(value) => handleFilterChange('status', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Sold">Sold</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2">
        <Button 
          className="flex-1"
          onClick={applyFilters}
        >
          Apply Filters
        </Button>
        <Button 
          variant="outline" 
          onClick={clearFilters}
        >
          Clear
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">MLS Listings</h1>
          <p className="text-muted-foreground">{totalProperties} properties found</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Sort Dropdown (Desktop) */}
          <div className="hidden lg:block">
            <Select
              value={activeFilters.sort}
              onValueChange={(value) => {
                setActiveFilters(prev => ({ ...prev, sort: value }));
                setPage(1);
              }}
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

          {/* Mobile Filter Button */}
          <Sheet open={isMobileFiltersOpen} onOpenChange={setIsMobileFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="lg:hidden">
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {getActiveFilterCount() > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {getActiveFilterCount()}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-[440px]">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              {renderFilters()}
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Active Filters Summary */}
      {showActiveFilters && getActiveFilterCount() > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 flex-wrap">
          {renderActiveFilters()}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearFilters}
            className="h-6"
          >
            Clear all
          </Button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Desktop Filters */}
        <div className="hidden lg:block w-[300px] flex-shrink-0">
          <div className="sticky top-6">
            <div className="bg-card rounded-lg border p-6">
              <h3 className="font-semibold mb-4">Filters</h3>
              {renderFilters()}
            </div>
          </div>
        </div>

        {/* Properties Grid */}
        <div className="flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {loading ? (
              <div className="col-span-full text-center py-8">
                <div className="animate-pulse">Loading properties...</div>
              </div>
            ) : error ? (
              <div className="col-span-full text-center py-8 text-destructive">
                {error}
              </div>
            ) : properties.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <p className="text-muted-foreground">No properties found</p>
              </div>
            ) : (
              properties.map((property: any) => (
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
                    <Button className="w-full">View Details</Button>
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
              ))
            )}
          </div>

          {/* Pagination */}
          {!loading && !error && properties.length > 0 && totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <div className="flex flex-wrap gap-2 justify-center">
                <Button
                  variant="outline"
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 