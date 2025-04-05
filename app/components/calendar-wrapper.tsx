"use client"

import { CalendarGrid } from "../../components/calendar/calendar-grid"
import type { Showing } from "@/lib/types"

interface CalendarWrapperProps {
  mode?: string;
  selected: Date;
  onSelect: (date: Date | undefined) => void;
  className?: string;
  showings?: Showing[];
  onAddShowing?: (showing: Showing) => Promise<void>;
  onUpdateShowing?: (showingId: string, updates: Partial<Showing>) => Promise<void>;
}

export default function Calendar({
  selected,
  onSelect,
  className,
  showings = [],
  onAddShowing,
  onUpdateShowing
}: CalendarWrapperProps) {
  // Convert showings to events format expected by CalendarGrid
  const events = showings.map(showing => ({
    id: showing.id,
    title: showing.property,
    date: new Date(showing.date),
    description: showing.notes || '',
    time: showing.time,
    type: 'viewing' as const,
    location: showing.property,
    notes: showing.notes,
  }));

  return (
    <CalendarGrid
      selectedDate={selected}
      onDateChange={(date) => onSelect(date)}
      events={events}
    />
  );
} 