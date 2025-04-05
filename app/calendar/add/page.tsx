'use client';

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface EventFormData {
  title: string;
  date: string;
  time: string;
  type: 'viewing' | 'meeting' | 'open-house' | 'follow-up' | 'call';
  description: string;
  location?: string;
  attendees?: string;
  contactPhone?: string;
  contactEmail?: string;
  propertyDetails?: string;
  notes?: string;
  enableReminder?: boolean;
  status: string;
}

export default function AddEventPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    date: '',
    time: '',
    type: 'meeting',
    description: '',
    enableReminder: true,
    status: 'scheduled'
  });

  // Initialize form with today's date or from URL parameter
  useEffect(() => {
    const today = new Date();
    let formattedDate = today.toISOString().split('T')[0];

    // Check if date is provided in URL (e.g., /calendar/add?date=2023-04-05)
    const dateParam = searchParams.get('date');
    if (dateParam) {
      formattedDate = dateParam;
    }

    // Set default time to current hour rounded up
    const hours = today.getHours();
    const minutes = today.getMinutes() >= 30 ? 30 : 0;
    const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

    setFormData(prev => ({
      ...prev,
      date: formattedDate,
      time: formattedTime
    }));
  }, [searchParams]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Prepare data for API - remove reminder flag as it's not needed in DB
      const { enableReminder, ...dataForApi } = formData;

      // Save to database through API
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataForApi),
      });

      if (!response.ok) {
        throw new Error('Failed to save event');
      }

      // Get the saved event with the _id from the database
      const savedEvent = await response.json();

      // Schedule reminder if enabled and phone number is provided
      if (formData.enableReminder && formData.contactPhone) {
        try {
          // Dynamically import the reminder manager only when needed
          const { reminderManager } = await import('@/lib/reminder-manager');
          await reminderManager.scheduleReminder(
            {
              id: savedEvent._id, // Use the MongoDB id
              title: formData.title,
              date: new Date(formData.date),
              time: formData.time,
              type: formData.type,
              description: formData.description,
              location: formData.location,
              contactPhone: formData.contactPhone,
              contactEmail: formData.contactEmail,
            },
            formData.contactPhone
          );
        } catch (reminderError) {
          console.error('Error scheduling reminder:', reminderError);
          // Continue with save even if reminder fails
        }
      }

      toast({
        title: "Success",
        description: "Event has been saved",
      });

      // Navigate back to calendar
      router.push('/calendar');
    } catch (error) {
      console.error('Error saving event:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save event",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof EventFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Calendar
          </Button>
          <h1 className="text-2xl font-bold">Add New Event</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="title">Event Title</Label>
              <Input
                id="title"
                required
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Event Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleInputChange('type', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewing">Viewing</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="open-house">Open House</SelectItem>
                  <SelectItem value="follow-up">Follow-up</SelectItem>
                  <SelectItem value="call">Call</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                required
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                required
                value={formData.time}
                onChange={(e) => handleInputChange('time', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location || ''}
                onChange={(e) => handleInputChange('location', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="attendees">Attendees</Label>
              <Input
                id="attendees"
                value={formData.attendees || ''}
                onChange={(e) => handleInputChange('attendees', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="contactPhone">Contact Phone</Label>
              <Input
                id="contactPhone"
                type="tel"
                value={formData.contactPhone || ''}
                onChange={(e) => handleInputChange('contactPhone', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactEmail">Contact Email</Label>
              <Input
                id="contactEmail"
                type="email"
                value={formData.contactEmail || ''}
                onChange={(e) => handleInputChange('contactEmail', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="propertyDetails">Property Details</Label>
            <Textarea
              id="propertyDetails"
              value={formData.propertyDetails || ''}
              onChange={(e) => handleInputChange('propertyDetails', e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={2}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="enableReminder"
              checked={formData.enableReminder}
              onCheckedChange={(checked) => handleInputChange('enableReminder', checked === true)}
            />
            <Label htmlFor="enableReminder">
              Enable SMS reminder (15 minutes before event)
            </Label>
          </div>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="border-[#ef4444] text-[#ef4444] hover:bg-[#ef4444] hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#ef4444] hover:bg-[#dc2626] text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Event'}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
} 