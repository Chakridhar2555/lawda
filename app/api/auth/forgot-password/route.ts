import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import jwt from 'jsonwebtoken';
import { emailService } from '@/lib/email-service';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const user = await db.collection('users').findOne({ email });

    if (!user) {
      // Return success even if user doesn't exist to prevent email enumeration
      return NextResponse.json({ success: true });
    }

    // Create password reset token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    // Store token in database
    await db.collection('passwordResetTokens').insertOne({
      userId: user._id,
      token,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000) // 1 hour
    });

    // Send password reset email
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
    await emailService.sendEmail(
      email,
      'Password Reset Request',
      `Click the following link to reset your password: ${resetUrl}`,
      `
        <h1>Password Reset Request</h1>
        <p>Click the following link to reset your password:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
      `
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing password reset request:', error);
    return NextResponse.json(
      { error: 'Failed to process password reset request' },
      { status: 500 }
    );
  }
} 