import { NextResponse } from 'next/server';
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// GET /api/favorites
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const favorites = user.favorites || [];
    const favoriteItems = await db.collection('inventory')
      .find({ _id: { $in: favorites.map((id: string) => new ObjectId(id)) } })
      .toArray();

    return NextResponse.json(favoriteItems);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json(
      { error: 'Failed to fetch favorites' },
      { status: 500 }
    );
  }
}

// POST /api/favorites
export async function POST(request: Request) {
  try {
    const { userId, property } = await request.json();
    
    if (!userId || !property) {
      return NextResponse.json(
        { error: 'User ID and property are required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Check if already exists
    const existing = await db.collection("favorites").findOne({
      userId: userId,
      "property.ListingKey": property.ListingKey
    });

    if (existing) {
      // Remove favorite
      await db.collection("favorites").deleteOne({
        userId: userId,
        "property.ListingKey": property.ListingKey
      });
      return NextResponse.json({ success: true, action: 'removed' });
    } else {
      // Add favorite
      await db.collection("favorites").insertOne({
        userId: userId,
        property: property,
        createdAt: new Date().toISOString()
      });
      return NextResponse.json({ success: true, action: 'added' });
    }
  } catch (error: any) {
    console.error('Error updating favorites:', error);
    return NextResponse.json(
      { error: 'Failed to update favorites' },
      { status: 500 }
    );
  }
} 