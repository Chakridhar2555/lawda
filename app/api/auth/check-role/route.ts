import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

// Mark this route as dynamic
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as {
      userId: string;
      role: string;
    };

    const { db } = await connectToDatabase();
    const user = await db.collection('users')
      .findOne(
        { _id: new ObjectId(decoded.userId) },
        { projection: { role: 1 } }
      );

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      role: user.role,
      isAdmin: user.role === 'admin'
    });
  } catch (error) {
    console.error('Error checking role:', error);
    return NextResponse.json(
      { error: 'Failed to check role' },
      { status: 500 }
    );
  }
} 