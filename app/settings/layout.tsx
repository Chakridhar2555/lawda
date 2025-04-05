"use client"

import { DashboardLayout } from "@/components/layout"

interface SettingsLayoutProps {
  children: React.ReactNode
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        {children}
      </div>
    </DashboardLayout>
  )
} 