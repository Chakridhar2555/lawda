import { NextResponse } from 'next/server';
import axios from 'axios';

if (!process.env.MLS_ACCESS_TOKEN) {
  throw new Error('MLS_ACCESS_TOKEN is not defined in environment variables');
}

if (!process.env.MLS_API_URL) {
  throw new Error('MLS_API_URL is not defined in environment variables');
}

interface MLSProperty {
  ListingKey: string;
  StandardStatus: string;
  ListPrice: number;
  UnparsedAddress: string;
  City: string;
  StateOrProvince: string;
  PostalCode: string;
  BedroomsTotal: number;
  BathroomsTotalInteger: number;
  LivingArea: number;
  PropertyType: string;
}

interface Property {
  Id: string;
  ListPrice: number;
  Address: string;
  City: string;
  Province: string;
  PostalCode: string;
  Bedrooms: number;
  Bathrooms: number;
  LivingArea: number;
  PropertyType: string;
  ListingStatus: string;
}

const PAGE_SIZE = 50;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * PAGE_SIZE;
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'default';

    // Build filter conditions
    const filterConditions = [];

    // Search functionality
    if (search) {
      const searchTerms = search.trim().split(' ').filter(Boolean);
      if (searchTerms.length > 0) {
        // Create a single combined search condition for all terms
        const searchConditions = searchTerms.map(term => {
          // Escape any special characters in the search term
          const escapedTerm = term.replace(/'/g, "''");
          
          // Create prioritized search conditions
          return `(
            contains(UnparsedAddress, '${escapedTerm}') or
            contains(City, '${escapedTerm}') or
            contains(StateOrProvince, '${escapedTerm}') or
            contains(PostalCode, '${escapedTerm}') or
            contains(PropertyType, '${escapedTerm}')
          )`;
        });

        // Require all terms to match for better accuracy
        filterConditions.push(`(${searchConditions.join(' and ')})`);
      }
    }

    // Price range
    const priceMin = searchParams.get('priceMin');
    const priceMax = searchParams.get('priceMax');
    if (priceMin && Number(priceMin) > 0) {
      filterConditions.push(`ListPrice ge ${priceMin}`);
    }
    if (priceMax && priceMax !== 'any' && Number(priceMax) < 1000000) {
      filterConditions.push(`ListPrice le ${priceMax}`);
    }

    // Bedrooms
    const beds = searchParams.get('beds');
    if (beds && beds !== 'any') {
      filterConditions.push(`BedroomsTotal ge ${beds}`);
    }

    // Bathrooms
    const baths = searchParams.get('baths');
    if (baths && baths !== 'any') {
      filterConditions.push(`BathroomsTotalInteger ge ${baths}`);
    }

    // Property Type
    const propertyType = searchParams.get('propertyType');
    if (propertyType && propertyType !== 'any') {
      filterConditions.push(`PropertyType eq '${propertyType}'`);
    }

    // Status
    const status = searchParams.get('status');
    if (status && status !== 'any') {
      filterConditions.push(`StandardStatus eq '${status}'`);
    }

    // Construct the query
    const query = [
      '$top=' + PAGE_SIZE,
      '$skip=' + skip,
      '$count=true'  // Always request count for pagination
    ];

    // Add filter if conditions exist
    if (filterConditions.length > 0) {
      query.push('$filter=' + filterConditions.join(' and '));
    }

    // Add sorting
    let orderBy = 'ModificationTimestamp desc';  // Default to newest
    switch (sort) {
      case 'price_desc':
        orderBy = 'ListPrice desc';
        break;
      case 'price_asc':
        orderBy = 'ListPrice asc';
        break;
      case 'newest':
        orderBy = 'ModificationTimestamp desc';
        break;
      case 'popular':
        // For popular, we'll sort by modification timestamp as a proxy for popularity
        orderBy = 'ModificationTimestamp desc';
        break;
    }
    query.push('$orderby=' + orderBy);

    // Construct final URL with all parameters
    const url = `${process.env.MLS_API_URL}?${query.join('&')}`;

    console.log('MLS API Request URL:', url);

    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${process.env.MLS_ACCESS_TOKEN}`,
        'Accept': 'application/json'
      }
    });

    // Log response for debugging
    console.log('MLS API Response:', {
      total: response.data['@odata.count'],
      returned: response.data.value?.length
    });

    // Ensure we have valid data
    if (!response.data || !Array.isArray(response.data.value)) {
      throw new Error('Invalid response format from MLS API');
    }

    // Calculate total pages
    const total = response.data['@odata.count'] || response.data.value.length;
    const totalPages = Math.ceil(total / PAGE_SIZE);

    return NextResponse.json({
      properties: response.data.value,
      total,
      page,
      pageSize: PAGE_SIZE,
      totalPages
    });

  } catch (error: any) {
    console.error('MLS API Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });

    return NextResponse.json(
      {
        error: 'Failed to fetch MLS data',
        details: error.message
      },
      { status: error.response?.status || 500 }
    );
  }
} 