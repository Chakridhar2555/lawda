import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

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
        { projection: { role: 1, permissions: 1 } }
      );

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Default permissions for non-admin users
    const defaultPermissions = {
      dashboard: true,
      leads: true,
      calendar: true,
      email: true,
      settings: true,
      inventory: true,
      favorites: true,
      mls: true
    };

    // Admin users have all permissions
    const permissions = user.role === 'admin'
      ? defaultPermissions
      : user.permissions || defaultPermissions;

    return NextResponse.json({
      permissions,
      role: user.role
    });
  } catch (error) {
    console.error('Error checking permissions:', error);
    return NextResponse.json(
      { error: 'Failed to check permissions' },
      { status: 500 }
    );
  }
} 