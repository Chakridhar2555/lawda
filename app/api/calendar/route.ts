import { NextResponse } from 'next/server';
import { getUpcomingEvents, createCalendarEvent } from '@/lib/calendar';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accessToken = searchParams.get('accessToken');

    if (!accessToken) {
      return NextResponse.json({ error: 'Access token is required' }, { status: 400 });
    }

    const events = await getUpcomingEvents(accessToken);
    return NextResponse.json(events);
  } catch (error) {
    console.error('Calendar API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch calendar events' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { accessToken, event } = await request.json();

    if (!accessToken || !event) {
      return NextResponse.json({ error: 'Access token and event details are required' }, { status: 400 });
    }

    const newEvent = await createCalendarEvent(accessToken, event);
    return NextResponse.json(newEvent);
  } catch (error) {
    console.error('Calendar API Error:', error);
    return NextResponse.json({ error: 'Failed to create calendar event' }, { status: 500 });
  }
} 