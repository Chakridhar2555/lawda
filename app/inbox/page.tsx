"use client"

import { DashboardLayout } from "@/components/layout"
import { Inbox } from "@/components/inbox"

export default function InboxPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Email Inbox</h1>
        <Inbox />
      </div>
    </DashboardLayout>
  )
}

