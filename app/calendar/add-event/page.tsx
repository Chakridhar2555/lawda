'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { DashboardLayout } from "@/components/layout";
import { getGeminiResponse } from '@/lib/gemini';
import { format } from 'date-fns';
import {
  CalendarIcon,
  Clock,
  Users,
  MapPin,
  Phone,
  Mail,
  Building,
  Loader2,
  ArrowLeft,
} from "lucide-react";

interface EventFormData {
  title: string;
  date: string;
  time: string;
  type: 'viewing' | 'meeting' | 'open-house' | 'follow-up' | 'call';
  location: string;
  attendees: string;
  contactPhone: string;
  contactEmail: string;
  propertyDetails: string;
  description: string;
  notes: string;
}

export default function AddEventPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '',
    type: 'meeting',
    location: '',
    attendees: '',
    contactPhone: '',
    contactEmail: '',
    propertyDetails: '',
    description: '',
    notes: ''
  });

  const handleInputChange = (field: keyof EventFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getAISuggestions = async () => {
    try {
      setIsLoading(true);
      const prompt = `As a real estate assistant, analyze this event and provide 3 specific suggestions or recommendations:
      Event Type: ${formData.type}
      Title: ${formData.title}
      Property: ${formData.propertyDetails}
      Description: ${formData.description}
      
      Consider: preparation steps, required documents, follow-up tasks, and best practices for real estate ${formData.type}.
      Format suggestions as bullet points.`;

      const response = await getGeminiResponse(prompt, { type: 'calendar' });
      const suggestions = response
        .split('\n')
        .filter(line => line.trim().startsWith('•'))
        .map(line => line.trim().substring(1).trim());
      
      setAiSuggestions(suggestions);
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      
      // Get existing events from localStorage
      const existingEvents = JSON.parse(localStorage.getItem('calendar_events') || '[]');
      
      // Create new event with AI suggestions
      const newEvent = {
        id: Date.now().toString(),
        ...formData,
        date: new Date(formData.date),
        aiSuggestions
      };
      
      // Save updated events
      localStorage.setItem('calendar_events', JSON.stringify([...existingEvents, newEvent]));
      
      // Navigate back to calendar
      router.push('/calendar');
    } catch (error) {
      console.error('Error saving event:', error);
    } finally {
      setIsLoading(false);
    }
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

        <div className="flex gap-6">
          {/* Form Section */}
          <div className="flex-1">
            <Card className="p-6">
              <div className="space-y-6">
                <div>
                  <Label htmlFor="eventType">Event Type</Label>
                  <select
                    id="eventType"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    value={formData.type}
                    onChange={(e) => handleInputChange('type', e.target.value as EventFormData['type'])}
                  >
                    <option value="viewing">Property Viewing</option>
                    <option value="meeting">Client Meeting</option>
                    <option value="open-house">Open House</option>
                    <option value="follow-up">Follow-up</option>
                    <option value="call">Call</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="title">Event Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter event title"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => handleInputChange('date', e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="time">Time</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                      <Input
                        id="time"
                        type="time"
                        value={formData.time}
                        onChange={(e) => handleInputChange('time', e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="location">Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      placeholder="Enter location"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="attendees">Attendees</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    <Input
                      id="attendees"
                      value={formData.attendees}
                      onChange={(e) => handleInputChange('attendees', e.target.value)}
                      placeholder="Enter attendees"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Contact Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.contactPhone}
                        onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                        placeholder="Enter phone number"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email">Contact Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.contactEmail}
                        onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                        placeholder="Enter email"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="property">Property Details</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    <Input
                      id="property"
                      value={formData.propertyDetails}
                      onChange={(e) => handleInputChange('propertyDetails', e.target.value)}
                      placeholder="Enter property details"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Enter event description"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-4">
                  <Button variant="outline" onClick={() => router.back()}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Event'
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Image Section */}
          <div className="w-[400px]">
            <div className="sticky top-8">
              <Image
                src="/assets/860.jpeg"
                alt="Calendar Event"
                width={400}
                height={600}
                className="rounded-lg object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 