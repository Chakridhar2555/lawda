import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import twilio from 'twilio';

// Initialize Twilio client only on server side
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function POST(request: Request) {
  try {
    const { db } = await connectToDatabase();
    const { userId, phoneNumber, message, scheduledTime } = await request.json();

    if (!userId || !phoneNumber || !message || !scheduledTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create reminder in database
    const reminder = await db.collection('reminders').insertOne({
      userId: new ObjectId(userId),
      phoneNumber,
      message,
      scheduledTime: new Date(scheduledTime),
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Schedule SMS using Twilio
    const scheduledMessage = await client.messages.create({
      body: message,
      to: phoneNumber,
      from: process.env.TWILIO_PHONE_NUMBER,
      scheduleType: 'fixed',
      sendAt: new Date(scheduledTime)
    });

    // Update reminder with Twilio message ID
    await db.collection('reminders').updateOne(
      { _id: reminder.insertedId },
      { $set: { twilioMessageId: scheduledMessage.sid } }
    );

    return NextResponse.json({ id: reminder.insertedId });
  } catch (error) {
    console.error('Error creating reminder:', error);
    return NextResponse.json(
      { error: 'Failed to create reminder' },
      { status: 500 }
    );
  }
}

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
    const reminders = await db.collection('reminders')
      .find({ userId: new ObjectId(userId) })
      .sort({ scheduledTime: 1 })
      .toArray();

    return NextResponse.json(reminders);
  } catch (error) {
    console.error('Error fetching reminders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reminders' },
      { status: 500 }
    );
  }
} 