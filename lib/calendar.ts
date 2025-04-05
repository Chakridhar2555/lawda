import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export type CalendarEvent = {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime: string };
  end: { dateTime: string };
};

export async function getUpcomingEvents(accessToken: string): Promise<CalendarEvent[]> {
  try {
    oauth2Client.setCredentials({ access_token: accessToken });
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime',
    });

    return response.data.items as CalendarEvent[];
  } catch (error) {
    console.error('Calendar API Error:', error);
    throw new Error('Failed to fetch calendar events');
  }
}

export async function createCalendarEvent(
  accessToken: string,
  event: {
    summary: string;
    description?: string;
    start: Date;
    end: Date;
  }
): Promise<CalendarEvent> {
  try {
    oauth2Client.setCredentials({ access_token: accessToken });
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: event.summary,
        description: event.description,
        start: {
          dateTime: event.start.toISOString(),
        },
        end: {
          dateTime: event.end.toISOString(),
        },
      },
    });

    return response.data as CalendarEvent;
  } catch (error) {
    console.error('Calendar API Error:', error);
    throw new Error('Failed to create calendar event');
  }
} 