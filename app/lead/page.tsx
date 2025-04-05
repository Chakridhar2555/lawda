"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout"
import { LeadListing } from "@/components/lead-listing"
import { LeadForm } from "@/components/lead-form"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function LeadPage() {
  const [isFormOpen, setIsFormOpen] = useState(false)

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold">Lead Management</h1>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Lead
          </Button>
        </div>
        <LeadListing />
        <LeadForm open={isFormOpen} onClose={() => setIsFormOpen(false)} />
      </div>
    </DashboardLayout>
  )
}

