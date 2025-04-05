import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

export async function POST(request: Request) {
  try {
    const { token, type } = await request.json();

    if (!token || !type) {
      return NextResponse.json(
        { error: 'Token and type are required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as {
      userId: string;
    };

    // Check token in database based on type
    let tokenDoc;
    switch (type) {
      case 'password-reset':
        tokenDoc = await db.collection('passwordResetTokens').findOne({
          token,
          userId: new ObjectId(decoded.userId),
          expiresAt: { $gt: new Date() }
        });
        break;
      case 'email-verification':
        tokenDoc = await db.collection('emailVerificationTokens').findOne({
          token,
          userId: new ObjectId(decoded.userId),
          expiresAt: { $gt: new Date() }
        });
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid token type' },
          { status: 400 }
        );
    }

    if (!tokenDoc) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 400 }
      );
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error('Error checking token:', error);
    return NextResponse.json(
      { error: 'Failed to check token' },
      { status: 500 }
    );
  }
} 