import type { Showing } from "@/lib/types"
import Calendar from "@/app/components/calendar-wrapper"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

export interface ShowingCalendarProps {
  showings: Showing[];
  onAddShowing: (showing: Showing) => Promise<void>;
  onUpdateShowing?: (showingId: string, updates: Partial<Showing>) => Promise<void>;
  onDateSelect?: (date: Date | undefined) => void;
}

export function ShowingCalendar({
  showings,
  onAddShowing,
  onUpdateShowing,
  onDateSelect
}: ShowingCalendarProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newShowing, setNewShowing] = useState<Partial<Showing>>({
    status: 'scheduled',
  });

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      if (onDateSelect) {
        onDateSelect(date);
      }
    }
  };

  const handleAddShowingClick = () => {
    // Prepare the showing object
    const showing: Showing = {
      id: Date.now().toString(),
      date: selectedDate,
      time: newShowing.time || "12:00",
      property: newShowing.property || "",
      notes: newShowing.notes,
      status: newShowing.status || 'scheduled'
    };

    // Call the parent's onAddShowing
    onAddShowing(showing);

    // Reset form and close dialog
    setNewShowing({ status: 'scheduled' });
    setIsDialogOpen(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Calendar</h3>
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-medium hidden md:block">
            Showings for {selectedDate.toLocaleDateString()}
          </h3>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#ef4444] hover:bg-[#dc2626] text-white">
                <Plus className="h-4 w-4 mr-2" />
                Schedule Showing
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[800px] max-h-[85vh] overflow-y-auto p-6">
              <DialogHeader className="mb-4 pb-2 border-b">
                <DialogTitle className="text-xl">Schedule a Showing</DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left column - Calendar */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="showing-date" className="text-base font-medium">Select Date</Label>
                    <div className="border rounded-md p-3 bg-white">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={handleDateSelect}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Right column - Form fields */}
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="showing-time" className="text-base font-medium">Time</Label>
                    <Input
                      id="showing-time"
                      type="time"
                      value={newShowing.time || ''}
                      onChange={(e) => setNewShowing({ ...newShowing, time: e.target.value })}
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="showing-property" className="text-base font-medium">Property</Label>
                    <Input
                      id="showing-property"
                      value={newShowing.property || ''}
                      onChange={(e) => setNewShowing({ ...newShowing, property: e.target.value })}
                      placeholder="Enter property address"
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="showing-status" className="text-base font-medium">Status</Label>
                    <Select
                      value={newShowing.status}
                      onValueChange={(value) => setNewShowing({ ...newShowing, status: value as Showing['status'] })}
                    >
                      <SelectTrigger id="showing-status" className="h-10">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="showing-notes" className="text-base font-medium">Notes</Label>
                    <Textarea
                      id="showing-notes"
                      value={newShowing.notes || ''}
                      onChange={(e) => setNewShowing({ ...newShowing, notes: e.target.value })}
                      placeholder="Add any additional notes"
                      className="h-20 resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-4 flex justify-end border-t">
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddShowingClick}
                    className="bg-[#ef4444] hover:bg-[#dc2626] text-white px-6"
                  >
                    Schedule Showing
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar Section */}
        <div className="w-full">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date: Date | undefined) => date && setSelectedDate(date)}
            showings={showings}
            onAddShowing={onAddShowing}
            onUpdateShowing={onUpdateShowing}
          />
        </div>

        {/* Showings List Section */}
        <div className="space-y-4">
          {showings
            ?.filter(showing => {
              const showingDate = new Date(showing.date);
              return (
                showingDate.getDate() === selectedDate.getDate() &&
                showingDate.getMonth() === selectedDate.getMonth() &&
                showingDate.getFullYear() === selectedDate.getFullYear()
              );
            })
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map((showing) => (
              <div key={showing.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{showing.property}</p>
                  <p className="text-sm text-gray-500">
                    {showing.time}
                  </p>
                  {showing.notes && (
                    <p className="text-sm text-gray-600 mt-1">{showing.notes}</p>
                  )}
                </div>
                <Badge variant={showing.status === 'scheduled' ? 'default' : 'secondary'}>
                  {showing.status}
                </Badge>
              </div>
            ))}
          {!showings?.filter(showing => {
            const showingDate = new Date(showing.date);
            return (
              showingDate.getDate() === selectedDate.getDate() &&
              showingDate.getMonth() === selectedDate.getMonth() &&
              showingDate.getFullYear() === selectedDate.getFullYear()
            );
          }).length && (
              <p className="text-gray-500 text-center">No showings scheduled for this date</p>
            )}
        </div>
      </div>
    </div>
  );
} 