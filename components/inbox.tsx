"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { Mail, Send, Paperclip, RefreshCw } from "lucide-react"
import { formatDate } from "@/lib/utils"
import type { Email } from "@/lib/email-service"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

interface Lead {
  _id: string
  name: string
  email: string
}

export function Inbox() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const { toast } = useToast();
  const [emailFields, setEmailFields] = useState({
    to: [] as string[],
    cc: [] as string[],
    bcc: [] as string[],
    subject: '',
    body: '',
    attachments: [] as File[],
  });
  const [leads, setLeads] = useState<Lead[]>([]);
  const [openCombobox, setOpenCombobox] = useState(false);
  const [isSendingToAll, setSendingToAll] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const fetchEmails = async () => {
    try {
      setIsLoading(true);
      const userEmail = localStorage.getItem('userEmail');
      if (!userEmail) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "User email not found",
        });
        return;
      }

      const response = await fetch(`/api/emails?email=${userEmail}`);
      if (!response.ok) throw new Error('Failed to fetch emails');
      
      const data = await response.json();
      setEmails(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch emails",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLeads = async () => {
    try {
      const response = await fetch('/api/leads');
      if (!response.ok) throw new Error('Failed to fetch leads');
      const data = await response.json();
      setLeads(data);
    } catch (error) {
      console.error('Error fetching leads:', error);
    }
  };

  useEffect(() => {
    fetchEmails();
    fetchLeads();
  }, []);

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSending(true);
      toast({
        title: "Sending email...",
        description: "Please wait while we send your email.",
      });

      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: emailFields.to,
          cc: emailFields.cc,
          bcc: emailFields.bcc,
          subject: emailFields.subject,
          content: emailFields.body
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send email');
      }

      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);

      setIsComposeOpen(false);
      setEmailFields({
        to: [],
        cc: [],
        bcc: [],
        subject: '',
        body: '',
        attachments: [],
      });
      fetchEmails();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send email",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleSendToAll = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSendingToAll(true);
      let successCount = 0;
      let failCount = 0;

      toast({
        title: "Bulk Email Started",
        description: `Sending email to ${leads.length} leads...`,
      });

      for (const lead of leads) {
        try {
          const response = await fetch('/api/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: lead.email,
              subject: emailFields.subject,
              content: emailFields.body
            }),
          });

          if (response.ok) {
            successCount++;
            if (successCount % 5 === 0) {
              toast({
                title: "Progress Update",
                description: `Sent to ${successCount} out of ${leads.length} leads...`,
              });
            }
          } else {
            failCount++;
          }
        } catch (error) {
          failCount++;
        }
      }

      toast({
        title: "Bulk Email Complete",
        description: `Successfully sent to ${successCount} leads${failCount > 0 ? `, failed for ${failCount} leads` : ''}`,
        variant: failCount > 0 ? "destructive" : "default",
      });
      
      setIsComposeOpen(false);
      setEmailFields({
        to: [],
        cc: [],
        bcc: [],
        subject: '',
        body: '',
        attachments: [],
      });
      fetchEmails();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send bulk emails",
      });
    } finally {
      setSendingToAll(false);
    }
  };

  return (
    <Card>
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg z-50 animate-fade-in-out flex items-center gap-2">
          <Check className="h-4 w-4" />
          Message sent successfully!
        </div>
      )}
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Inbox</CardTitle>
          <div className="flex gap-2">
            <Button 
              onClick={() => setIsComposeOpen(true)}
              className="bg-[#ef4444] hover:bg-[#dc2626] text-white"
            >
              <Mail className="h-4 w-4 mr-2" />
              Compose
            </Button>
            <Button 
              onClick={fetchEmails} 
              variant="outline"
              className="border-[#ef4444] text-[#ef4444] hover:bg-[#ef4444] hover:text-white"
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {emails.map((email) => (
            <div
              key={email.id}
              className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                !email.read ? 'bg-blue-50' : ''
              }`}
              onClick={() => setSelectedEmail(email)}
            >
              <div className="flex justify-between">
                <div className="font-medium">{email.from}</div>
                <div className="text-sm text-gray-500">
                  {formatDate(email.date.toString(), 'MMM d, h:mm a')}
                </div>
              </div>
              <div className="font-medium">{email.subject}</div>
              <div className="text-sm text-gray-500 truncate">{email.body}</div>
            </div>
          ))}
        </div>
      </CardContent>

      {/* Compose Email Dialog */}
      <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Compose Email</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSendEmail} className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="to">To</Label>
                <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openCombobox}
                      className="w-full justify-between border-[#ef4444] text-[#ef4444] hover:bg-[#ef4444] hover:text-white"
                    >
                      {emailFields.to.length > 0
                        ? `${emailFields.to.length} recipient(s) selected`
                        : "Select recipients..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search leads..." />
                      <CommandEmpty>No lead found.</CommandEmpty>
                      <CommandGroup className="max-h-[200px] overflow-y-auto">
                        {leads.map((lead) => (
                          <CommandItem
                            key={lead._id}
                            value={lead.email}
                            onSelect={(currentValue) => {
                              setEmailFields(prev => ({
                                ...prev,
                                to: prev.to.includes(currentValue)
                                  ? prev.to.filter(email => email !== currentValue)
                                  : [...prev.to, currentValue]
                              }));
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={emailFields.to.includes(lead.email)}
                                className="mr-2"
                              />
                              {lead.name} ({lead.email})
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                <Input
                  placeholder="Or type email addresses (comma-separated)"
                  value={emailFields.to.join(', ')}
                  onChange={(e) => {
                    const emails = e.target.value.split(',').map(email => email.trim());
                    setEmailFields(prev => ({ ...prev, to: emails }));
                  }}
                  className="mt-2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cc">CC</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between border-[#ef4444] text-[#ef4444] hover:bg-[#ef4444] hover:text-white"
                    >
                      {emailFields.cc.length > 0
                        ? `${emailFields.cc.length} recipient(s) selected`
                        : "Select CC recipients..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search leads..." />
                      <CommandEmpty>No lead found.</CommandEmpty>
                      <CommandGroup className="max-h-[200px] overflow-y-auto">
                        {leads.map((lead) => (
                          <CommandItem
                            key={lead._id}
                            value={lead.email}
                            onSelect={(currentValue) => {
                              setEmailFields(prev => ({
                                ...prev,
                                cc: prev.cc.includes(currentValue)
                                  ? prev.cc.filter(email => email !== currentValue)
                                  : [...prev.cc, currentValue]
                              }));
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={emailFields.cc.includes(lead.email)}
                                className="mr-2"
                              />
                              {lead.name} ({lead.email})
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                <Input
                  placeholder="Or type CC emails (comma-separated)"
                  value={emailFields.cc.join(', ')}
                  onChange={(e) => {
                    const emails = e.target.value.split(',').map(email => email.trim());
                    setEmailFields(prev => ({ ...prev, cc: emails }));
                  }}
                  className="mt-2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bcc">BCC</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between border-[#ef4444] text-[#ef4444] hover:bg-[#ef4444] hover:text-white"
                    >
                      {emailFields.bcc.length > 0
                        ? `${emailFields.bcc.length} recipient(s) selected`
                        : "Select BCC recipients..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search leads..." />
                      <CommandEmpty>No lead found.</CommandEmpty>
                      <CommandGroup className="max-h-[200px] overflow-y-auto">
                        {leads.map((lead) => (
                          <CommandItem
                            key={lead._id}
                            value={lead.email}
                            onSelect={(currentValue) => {
                              setEmailFields(prev => ({
                                ...prev,
                                bcc: prev.bcc.includes(currentValue)
                                  ? prev.bcc.filter(email => email !== currentValue)
                                  : [...prev.bcc, currentValue]
                              }));
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={emailFields.bcc.includes(lead.email)}
                                className="mr-2"
                              />
                              {lead.name} ({lead.email})
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                <Input
                  placeholder="Or type BCC emails (comma-separated)"
                  value={emailFields.bcc.join(', ')}
                  onChange={(e) => {
                    const emails = e.target.value.split(',').map(email => email.trim());
                    setEmailFields(prev => ({ ...prev, bcc: emails }));
                  }}
                  className="mt-2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="Subject"
                  value={emailFields.subject}
                  onChange={(e) => setEmailFields(prev => ({ ...prev, subject: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Type your message here"
                  value={emailFields.body}
                  onChange={(e) => setEmailFields({ ...emailFields, body: e.target.value })}
                  rows={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="attachments">Attachments</Label>
                <Input
                  id="attachments"
                  type="file"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setEmailFields({ ...emailFields, attachments: files });
                  }}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              {leads.length > 0 && (
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={handleSendToAll}
                  disabled={isSendingToAll || !emailFields.subject || !emailFields.body}
                  className="border-[#ef4444] text-[#ef4444] hover:bg-[#ef4444] hover:text-white"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  {isSendingToAll ? 'Sending...' : `Send to All (${leads.length})`}
                </Button>
              )}
              <Button 
                type="submit"
                disabled={!emailFields.to.length || !emailFields.subject || !emailFields.body || isSending || isSendingToAll}
                className="bg-[#ef4444] hover:bg-[#dc2626] text-white disabled:bg-gray-300"
              >
                <Send className={`h-4 w-4 mr-2 ${isSending ? 'animate-spin' : ''}`} />
                {isSending ? 'Sending...' : 'Send'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Email Dialog */}
      <Dialog open={!!selectedEmail} onOpenChange={() => setSelectedEmail(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedEmail?.subject}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <div className="font-medium">From: {selectedEmail?.from}</div>
              <div className="text-sm text-gray-500">
                {selectedEmail?.date && formatDate(selectedEmail.date.toString(), 'MMM d, yyyy h:mm a')}
              </div>
            </div>
            <div className="whitespace-pre-wrap">{selectedEmail?.body}</div>
            {selectedEmail?.attachments && selectedEmail.attachments.length > 0 && (
              <div className="space-y-2">
                <div className="font-medium">Attachments:</div>
                {selectedEmail?.attachments.map((att, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Paperclip className="h-4 w-4" />
                    <a
                      href={URL.createObjectURL(new Blob([att.content]))}
                      download={att.filename}
                      className="text-blue-500 hover:underline"
                    >
                      {att.filename}
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
} 