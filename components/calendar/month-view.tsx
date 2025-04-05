'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek
} from 'date-fns';
import { Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";

interface Event {
  id: string;
  title: string;
  date: Date;
  time: string;
  type: 'viewing' | 'meeting' | 'open-house' | 'follow-up' | 'call';
  description: string;
  location?: string;
}

interface MonthViewProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function MonthView({ selectedDate, onDateChange }: MonthViewProps) {
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

  const handlePrevMonth = () => {
    onDateChange(subMonths(selectedDate, 1));
  };

  const handleNextMonth = () => {
    onDateChange(addMonths(selectedDate, 1));
  };

  // Get all days in the month including days from previous/next months to fill the calendar
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Get events for a specific day
  const getDayEvents = (date: Date) => {
    return events.filter(event => isSameDay(new Date(event.date), date));
  };

  return (
    <div className="p-4">
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={(date) => date && onDateChange(date)}
        className="rounded-md border"
      />
    </div>
  );
} 