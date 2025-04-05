import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export async function DELETE(request: Request) {
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

    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const user = await db.collection('users').findOne({
      _id: new ObjectId(decoded.userId)
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 400 }
      );
    }

    // Delete user's data
    await Promise.all([
      // Delete user
      db.collection('users').deleteOne({ _id: new ObjectId(decoded.userId) }),
      // Delete user's tokens
      db.collection('passwordResetTokens').deleteMany({ userId: new ObjectId(decoded.userId) }),
      db.collection('emailVerificationTokens').deleteMany({ userId: new ObjectId(decoded.userId) }),
      // Delete user's reminders
      db.collection('reminders').deleteMany({ userId: new ObjectId(decoded.userId) }),
      // Delete user's favorites
      db.collection('users').updateOne(
        { _id: new ObjectId(decoded.userId) },
        { $set: { favorites: [] } }
      )
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
} 