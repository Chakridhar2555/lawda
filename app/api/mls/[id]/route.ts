import { NextResponse } from 'next/server';
import axios from 'axios';

if (!process.env.MLS_ACCESS_TOKEN) {
  throw new Error('MLS_ACCESS_TOKEN is not defined in environment variables');
}

if (!process.env.MLS_API_URL) {
  throw new Error('MLS_API_URL is not defined in environment variables');
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get the full property details without any field selection
    const url = `${process.env.MLS_API_URL}('${params.id}')`;
    console.log('MLS API Request URL:', url);

    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${process.env.MLS_ACCESS_TOKEN}`,
        'Accept': 'application/json'
      }
    });

    // Log response for debugging
    console.log('MLS API Response:', {
      url: url,
      status: response.status,
      data: response.data
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    // Enhanced error logging
    const errorDetails = {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      headers: error.config?.headers
    };
    console.error('MLS API Error:', errorDetails);

    return NextResponse.json(
      {
        error: 'Failed to fetch property details',
        details: errorDetails
      },
      { status: error.response?.status || 500 }
    );
  }
} 