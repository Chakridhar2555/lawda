import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';
import { emailService } from '@/lib/email-service';

export async function PUT(request: Request) {
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
    };

    const updates = await request.json();

    // Remove sensitive fields from updates
    delete updates.password;
    delete updates.role;
    delete updates.emailVerified;
    delete updates.createdAt;
    delete updates.updatedAt;

    const { db } = await connectToDatabase();

    // If email is being updated, check if it already exists
    if (updates.email) {
      const existingUser = await db.collection('users').findOne({
        email: updates.email,
        _id: { $ne: new ObjectId(decoded.userId) }
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 400 }
        );
      }

      // If email is changed, set emailVerified to false
      updates.emailVerified = false;
    }

    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(decoded.userId) },
      { $set: { ...updates, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // If email was updated, send verification email
    if (updates.email) {
      const token = jwt.sign(
        { userId: decoded.userId },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      await db.collection('emailVerificationTokens').insertOne({
        userId: new ObjectId(decoded.userId),
        token,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 86400000) // 24 hours
      });

      const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;
      await emailService.sendEmail(
        updates.email,
        'Verify Your Email',
        `Click the following link to verify your email: ${verificationUrl}`,
        `
          <h1>Verify Your Email</h1>
          <p>Click the following link to verify your email:</p>
          <a href="${verificationUrl}">Verify Email</a>
          <p>This link will expire in 24 hours.</p>
        `
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
} 