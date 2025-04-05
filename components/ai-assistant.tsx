'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  MessageCircle,
  Calendar,
  BrainCircuit,
  X,
  Send,
  Phone,
  Lightbulb,
  Loader2,
  Plus,
  User2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { getGeminiResponse, AssistantContext } from '@/lib/gemini';
import { format } from 'date-fns';

export type CalendarEvent = {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime: string };
  end: { dateTime: string };
};

export function AiAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ type: 'user' | 'ai', content: string }>>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentContext, setCurrentContext] = useState<AssistantContext>({ type: 'general' });
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [showCalendarView, setShowCalendarView] = useState(false);

  // Fetch calendar events when calendar context is activated
  useEffect(() => {
    if (currentContext.type === 'calendar') {
      fetchCalendarEvents();
    }
  }, [currentContext.type]);

  const fetchCalendarEvents = async () => {
    try {
      const accessToken = localStorage.getItem('calendar_token');
      if (!accessToken) {
        setMessages(prev => [...prev, { 
          type: 'ai', 
          content: "Please connect your Google Calendar to view and manage your events." 
        }]);
        return;
      }

      const response = await fetch(`/api/calendar?accessToken=${accessToken}`);
      if (!response.ok) {
        throw new Error('Failed to fetch calendar events');
      }

      const events = await response.json();
      setCalendarEvents(events);
      const eventsMessage = formatEventsMessage(events);
      setMessages(prev => [...prev, { type: 'ai', content: eventsMessage }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        type: 'ai', 
        content: "Please connect your Google Calendar to view and manage your events." 
      }]);
    }
  };

  const formatEventsMessage = (events: CalendarEvent[]) => {
    if (events.length === 0) return "You have no upcoming events.";
    
    return "Your upcoming events:\n" + events.map(event => {
      const start = new Date(event.start.dateTime);
      return `• ${event.summary} - ${format(start, 'MMM d, h:mm a')}`;
    }).join('\n');
  };

  const handleContextButton = (type: AssistantContext['type']) => {
    setCurrentContext({ type });
    setIsOpen(true);
    setShowCalendarView(type === 'calendar');
    
    const contextMessages = {
      strategy: "Hi, I'm Alex! I'm ready to help you with strategy planning. What would you like to know?",
      calendar: "Hi, I'm Alex! I can help you manage your calendar. You can:\n• View upcoming events\n• Create new events\n• Get reminders\nWhat would you like to do?",
      call: "Hi, I'm Alex! I can assist with call management and reminders. How can I help?",
    };
    
    if (type !== 'general') {
      setMessages([{ type: 'ai', content: contextMessages[type] }]);
    } else {
      setMessages([{ 
        type: 'ai', 
        content: "Hi! I'm Alex, your Get Home Realty Assistant. How can I help you today?" 
      }]);
    }
  };

  const handleCreateEvent = async (eventDetails: string) => {
    try {
      // Parse event details using AI
      const parsedEvent = await getGeminiResponse(
        `Parse this event request into JSON format with summary, description, start, and end dates: ${eventDetails}`,
        { type: 'calendar' }
      );
      
      const eventData = JSON.parse(parsedEvent);
      const accessToken = localStorage.getItem('calendar_token');
      
      if (!accessToken) {
        throw new Error('Calendar not connected');
      }

      const response = await fetch('/api/calendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken,
          event: {
            summary: eventData.summary,
            description: eventData.description,
            start: new Date(eventData.start),
            end: new Date(eventData.end),
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create event');
      }

      const newEvent = await response.json();
      setMessages(prev => [...prev, { 
        type: 'ai', 
        content: `✅ Event created: ${newEvent.summary} on ${format(new Date(newEvent.start.dateTime), 'MMM d, h:mm a')}` 
      }]);
      
      // Refresh calendar events
      fetchCalendarEvents();
    } catch (error) {
      setMessages(prev => [...prev, { 
        type: 'ai', 
        content: "Sorry, I couldn't create the event. Please make sure to include event name, date, and time." 
      }]);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    setMessages(prev => [...prev, { type: 'user', content: input }]);
    setIsLoading(true);
    
    try {
      if (currentContext.type === 'calendar' && input.toLowerCase().includes('create')) {
        await handleCreateEvent(input);
      } else {
        const aiResponse = await getGeminiResponse(input, {
          ...currentContext,
          data: currentContext.type === 'calendar' ? { events: calendarEvents } : undefined
        });
        setMessages(prev => [...prev, { type: 'ai', content: aiResponse }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { 
        type: 'ai', 
        content: "I apologize, but I'm having trouble processing your request. Please try again." 
      }]);
    } finally {
      setIsLoading(false);
      setInput('');
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <Card className="w-96 h-[32rem] p-4 flex flex-col shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              {currentContext.type === 'calendar' ? (
                <Calendar className="h-5 w-5 text-red-500" />
              ) : (
                <BrainCircuit className="h-5 w-5 text-red-500" />
              )}
              <div className="flex flex-col">
                <span className="font-bold text-lg text-red-500">Get Home Realty</span>
                <span className="text-sm text-gray-500">
                  {currentContext.type === 'calendar' ? 'Alex - Calendar Assistant' : 'Alex - AI Assistant'}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              {currentContext.type === 'calendar' && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowCalendarView(!showCalendarView)}
                >
                  <Calendar className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-2">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.type === 'ai' && (
                  <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center mr-2">
                    <BrainCircuit className="h-4 w-4 text-white" />
                  </div>
                )}
                <div
                  className={`rounded-2xl p-3 max-w-[80%] ${
                    message.type === 'user'
                      ? 'bg-red-500 text-white ml-12'
                      : 'bg-gray-100 dark:bg-gray-800'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your message..."
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={isLoading}
              className="bg-red-500 hover:bg-red-600"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </Card>
      ) : (
        <div className="flex gap-2">
          <Button
            onClick={() => handleContextButton('strategy')}
            className="bg-red-500 hover:bg-red-600"
          >
            <Lightbulb className="h-4 w-4 mr-2" />
            Strategy
          </Button>
          <Button
            onClick={() => handleContextButton('calendar')}
            className="bg-red-500 hover:bg-red-600"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Calendar
          </Button>
          <Button
            onClick={() => handleContextButton('call')}
            className="bg-red-500 hover:bg-red-600"
          >
            <Phone className="h-4 w-4 mr-2" />
            Call
          </Button>
        </div>
      )}
    </div>
  );
} 