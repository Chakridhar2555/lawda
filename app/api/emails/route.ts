import { NextResponse } from 'next/server';
import { emailService } from '@/lib/email-service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const emails = await emailService.getLatestEmails(limit);
    return NextResponse.json(emails);
  } catch (error) {
    console.error('Error fetching emails:', error);
    return NextResponse.json(
      { error: 'Failed to fetch emails' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { to, subject, body, attachments } = await request.json();
    await emailService.sendEmail(to, subject, body, attachments);
    return NextResponse.json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
} 