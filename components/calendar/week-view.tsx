'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addWeeks, subWeeks } from 'date-fns';
import { Clock, ChevronLeft, ChevronRight } from "lucide-react";

interface Event {
  id: string;
  title: string;
  date: Date;
  time: string;
  type: 'viewing' | 'meeting' | 'open-house' | 'follow-up' | 'call';
  description: string;
  location?: string;
}

interface WeekViewProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function WeekView({ selectedDate, onDateChange }: WeekViewProps) {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    const savedEvents = localStorage.getItem('calendar_events');
    if (savedEvents) {
      setEvents(JSON.parse(savedEvents).map((event: any) => ({
        ...event,
        date: new Date(event.date)
      })));
    }
  }, []);

  const getEventTypeColor = (type: Event['type']) => {
    switch (type) {
      case 'viewing': return 'bg-blue-100 text-blue-700';
      case 'meeting': return 'bg-purple-100 text-purple-700';
      case 'open-house': return 'bg-green-100 text-green-700';
      case 'follow-up': return 'bg-yellow-100 text-yellow-700';
      case 'call': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handlePrevWeek = () => {
    onDateChange(subWeeks(selectedDate, 1));
  };

  const handleNextWeek = () => {
    onDateChange(addWeeks(selectedDate, 1));
  };

  // Get the start and end of the week
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 0 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Get events for a specific day
  const getDayEvents = (date: Date) => {
    return events.filter(event => isSameDay(new Date(event.date), date));
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="flex justify-center items-center p-4 border-b">
        <Button variant="ghost" size="icon" onClick={handlePrevWeek}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold px-4">
          {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
        </h2>
        <Button variant="ghost" size="icon" onClick={handleNextWeek}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 divide-x">
        {weekDays.map((day) => (
          <div key={day.toISOString()} className="min-h-[500px]">
            <div className="p-2 text-center border-b bg-gray-50">
              <div className="font-medium">{format(day, 'EEE')}</div>
              <div className={`text-sm ${isSameDay(day, new Date()) ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>
                {format(day, 'd')}
              </div>
            </div>
            <div className="p-2 space-y-2">
              {getDayEvents(day).map((event, index) => (
                <div
                  key={event.id}
                  className={`p-2 rounded text-sm ${getEventTypeColor(event.type)}`}
                >
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{event.time}</span>
                  </div>
                  <div className="font-medium">{event.title}</div>
                  {event.location && (
                    <div className="text-xs truncate">{event.location}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 