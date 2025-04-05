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

    if (user.emailVerified) {
      return NextResponse.json(
        { error: 'Email is already verified' },
        { status: 400 }
      );
    }

    // Create verification token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Store token in database
    await db.collection('emailVerificationTokens').insertOne({
      userId: user._id,
      token,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 86400000) // 24 hours
    });

    // Send verification email
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;
    await emailService.sendEmail(
      email,
      'Verify Your Email',
      `Click the following link to verify your email: ${verificationUrl}`,
      `
        <h1>Verify Your Email</h1>
        <p>Click the following link to verify your email:</p>
        <a href="${verificationUrl}">Verify Email</a>
        <p>This link will expire in 24 hours.</p>
      `
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error resending verification email:', error);
    return NextResponse.json(
      { error: 'Failed to resend verification email' },
      { status: 500 }
    );
  }
} 