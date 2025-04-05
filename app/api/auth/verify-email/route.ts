import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as {
      userId: string;
    };

    // Find verification token in database
    const verificationToken = await db.collection('emailVerificationTokens').findOne({
      token,
      userId: new ObjectId(decoded.userId),
      expiresAt: { $gt: new Date() }
    });

    if (!verificationToken) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 400 }
      );
    }

    // Update user's email verification status
    await db.collection('users').updateOne(
      { _id: new ObjectId(decoded.userId) },
      { $set: { emailVerified: true, updatedAt: new Date() } }
    );

    // Delete used token
    await db.collection('emailVerificationTokens').deleteOne({ _id: verificationToken._id });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error verifying email:', error);
    return NextResponse.json(
      { error: 'Failed to verify email' },
      { status: 500 }
    );
  }
} 