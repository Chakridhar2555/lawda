"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout"
import { ProfileSettings } from "@/components/profile-settings"
import { useToast } from "@/components/ui/use-toast"

export default function ProfilePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState({
    name: "",
    email: "",
    avatar: "",
    role: ""
  })

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/users/profile')
        if (!response.ok) {
          throw new Error('Failed to fetch profile')
        }
        const data = await response.json()
        setUser(data)
      } catch (error) {
        console.error('Error fetching profile:', error)
        toast({
          title: "Error",
          description: "Failed to load profile. Please try again.",
          variant: "destructive",
        })
      }
    }

    fetchProfile()
  }, [toast])

  const handleUpdateAvatar = async (avatarUrl: string) => {
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...user,
          avatar: avatarUrl
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update avatar')
      }

      setUser(prev => ({ ...prev, avatar: avatarUrl }))
    } catch (error) {
      console.error('Error updating avatar:', error)
      throw error
    }
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">Profile Settings</h1>
        <ProfileSettings user={user} onUpdateAvatar={handleUpdateAvatar} />
      </div>
    </DashboardLayout>
  )
} 