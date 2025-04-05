'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Card } from "@/components/ui/card";

interface Event {
  id: string;
  title: string;
  date: Date;
  time: string;
  type: 'viewing' | 'meeting' | 'open-house' | 'follow-up' | 'call';
  description: string;
  location?: string;
}

export default function EventsList() {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    const savedEvents = localStorage.getItem('calendar_events');
    if (savedEvents) {
      const parsedEvents = JSON.parse(savedEvents).map((event: any) => ({
        ...event,
        date: new Date(event.date)
      }));
      // Sort events by date
      parsedEvents.sort((a: Event, b: Event) => a.date.getTime() - b.date.getTime());
      setEvents(parsedEvents);
    }
  }, []);

  if (events.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-center text-gray-500">No events scheduled yet</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Scheduled Events</h2>
      <div className="space-y-4">
        {events.map((event) => (
          <div key={event.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{event.title}</h3>
                <p className="text-sm text-gray-600">
                  {format(event.date, 'MMMM d, yyyy')} at {event.time}
                </p>
                {event.location && (
                  <p className="text-sm text-gray-600 mt-1">📍 {event.location}</p>
                )}
              </div>
              <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-700">
                {event.type}
              </span>
            </div>
            {event.description && (
              <p className="text-sm text-gray-600 mt-2">{event.description}</p>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
} 