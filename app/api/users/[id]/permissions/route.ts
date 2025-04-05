import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { permissions } = await request.json();
    const { id } = params;

    const { db } = await connectToDatabase();
    
    // Update user permissions
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(id) },
      { $set: { permissions, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating permissions:', error);
    return NextResponse.json(
      { error: 'Failed to set permissions' },
      { status: 500 }
    );
  }
} 