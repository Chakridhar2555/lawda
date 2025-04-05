"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { formatDate } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"

interface Showing {
  propertyAddress: string
  date: string
  feedback: string
  interested: boolean
}

export function PropertyShowing({ showings = [], onAddShowing }: { 
  showings: Showing[]
  onAddShowing: (showing: Showing) => void 
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [newShowing, setNewShowing] = useState<Showing>({
    propertyAddress: "",
    date: new Date().toISOString(),
    feedback: "",
    interested: false
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAddShowing(newShowing)
    setIsOpen(false)
    setNewShowing({
      propertyAddress: "",
      date: new Date().toISOString(),
      feedback: "",
      interested: false
    })
  }

  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        className="w-full"
        onClick={() => setIsOpen(true)}
      >
        Schedule Showing
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Property Showing</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Property Address</Label>
              <Input
                value={newShowing.propertyAddress}
                onChange={(e) => setNewShowing({...newShowing, propertyAddress: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Date and Time</Label>
              <div className="flex gap-2">
                <Input
                  type="datetime-local"
                  value={new Date(newShowing.date).toISOString().slice(0, 16)}
                  onChange={(e) => setNewShowing({...newShowing, date: new Date(e.target.value).toISOString()})}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Feedback</Label>
              <Textarea
                value={newShowing.feedback}
                onChange={(e) => setNewShowing({...newShowing, feedback: e.target.value})}
                placeholder="Client's feedback about the property..."
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={newShowing.interested}
                onCheckedChange={(checked) => setNewShowing({...newShowing, interested: checked})}
              />
              <Label>Client Interested</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="submit">Add Showing</Button>
            </div>
          </form>
          <div className="mt-4 space-y-4">
            <h3 className="font-semibold">Previous Showings</h3>
            {showings.map((showing, index) => (
              <div key={index} className="border-b pb-2">
                <div className="font-medium">{showing.propertyAddress}</div>
                <div className="text-sm text-gray-500">
                  {formatDate(showing.date, 'MMM d, yyyy h:mm a')}
                </div>
                <div className="text-sm mt-1">{showing.feedback}</div>
                <div className="text-sm text-blue-600">
                  {showing.interested ? "Client interested" : "Client not interested"}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
} 