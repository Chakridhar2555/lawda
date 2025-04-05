import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { db } = await connectToDatabase();
    const { id } = params;

    const reminder = await db.collection('reminders').findOne({ _id: new ObjectId(id) });
    if (!reminder) {
      return NextResponse.json(
        { error: 'Reminder not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(reminder);
  } catch (error) {
    console.error('Error fetching reminder:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reminder' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { db } = await connectToDatabase();
    const { id } = params;
    const updates = await request.json();

    const reminder = await db.collection('reminders').findOne({ _id: new ObjectId(id) });
    if (!reminder) {
      return NextResponse.json(
        { error: 'Reminder not found' },
        { status: 404 }
      );
    }

    // If scheduledTime is being updated, cancel the old message and create a new one
    if (updates.scheduledTime && reminder.twilioMessageId) {
      // Cancel the old message
      await client.messages(reminder.twilioMessageId).update({ status: 'canceled' });

      // Create a new scheduled message
      const scheduledMessage = await client.messages.create({
        body: reminder.message,
        to: reminder.phoneNumber,
        from: process.env.TWILIO_PHONE_NUMBER,
        scheduleType: 'fixed',
        sendAt: new Date(updates.scheduledTime)
      });

      // Update the reminder with the new Twilio message ID
      updates.twilioMessageId = scheduledMessage.sid;
    }

    const result = await db.collection('reminders').updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...updates, updatedAt: new Date() } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating reminder:', error);
    return NextResponse.json(
      { error: 'Failed to update reminder' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { db } = await connectToDatabase();
    const { id } = params;

    const reminder = await db.collection('reminders').findOne({ _id: new ObjectId(id) });
    if (!reminder) {
      return NextResponse.json(
        { error: 'Reminder not found' },
        { status: 404 }
      );
    }

    // Cancel the Twilio message if it exists
    if (reminder.twilioMessageId) {
      await client.messages(reminder.twilioMessageId).update({ status: 'canceled' });
    }

    const result = await db.collection('reminders').deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting reminder:', error);
    return NextResponse.json(
      { error: 'Failed to delete reminder' },
      { status: 500 }
    );
  }
} 