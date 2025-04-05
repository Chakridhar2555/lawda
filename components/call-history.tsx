"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { formatDate } from "@/lib/utils"
import { Phone } from "lucide-react"

interface Call {
  date: string
  duration: number
  recording?: string
}

export function CallHistory({ calls = [] }: { calls: Call[] }) {
  const [isOpen, setIsOpen] = useState(false)

  const formatDuration = (duration: number) => {
    try {
      const minutes = Math.floor(duration / 60)
      const seconds = duration % 60
      return `${minutes}:${seconds.toString().padStart(2, '0')}`
    } catch (error) {
      console.error('Error formatting duration:', error)
      return '0:00'
    }
  }

  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        className="w-full"
        onClick={() => setIsOpen(true)}
      >
        View Call History
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Call History</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {calls.length === 0 ? (
              <p className="text-center text-gray-500">No calls recorded yet</p>
            ) : (
              calls.map((call, index) => (
                <div key={index} className="flex justify-between items-center border-b pb-2">
                  <div>
                    <div className="font-medium">
                      {formatDate(call.date, 'MMM d, yyyy h:mm a')}
                    </div>
                    <div className="text-sm text-gray-500">
                      Duration: {formatDuration(call.duration)}
                    </div>
                  </div>
                  {call.recording && (
                    <Button variant="outline" size="sm">
                      Play Recording
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

