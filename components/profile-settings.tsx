'use client';

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { AvatarSelector } from "@/components/avatar-selector"
import { useToast } from "@/components/ui/use-toast"

interface ProfileSettingsProps {
  user: {
    name: string
    email: string
    avatar?: string
    role: string
  }
  onUpdateAvatar: (avatarUrl: string) => Promise<void>
}

export function ProfileSettings({ user, onUpdateAvatar }: ProfileSettingsProps) {
  const [isAvatarSelectorOpen, setIsAvatarSelectorOpen] = useState(false)
  const { toast } = useToast()

  const handleAvatarSelect = async (avatarUrl: string) => {
    try {
      await onUpdateAvatar(avatarUrl)
      toast({
        title: "Avatar updated",
        description: "Your profile avatar has been updated successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update avatar. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-6">
        <Avatar className="w-24 h-24">
          <AvatarImage src={user.avatar || "/placeholder-avatar.png"} alt={user.name} />
          <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <Button variant="outline" onClick={() => setIsAvatarSelectorOpen(true)}>
          Change Avatar
        </Button>
      </div>

      <div className="space-y-2">
        <h4 className="font-medium">Name</h4>
        <p className="text-sm text-muted-foreground">{user.name}</p>
      </div>

      <div className="space-y-2">
        <h4 className="font-medium">Email</h4>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </div>

      <div className="space-y-2">
        <h4 className="font-medium">Role</h4>
        <p className="text-sm text-muted-foreground">{user.role}</p>
      </div>

      <AvatarSelector
        open={isAvatarSelectorOpen}
        onOpenChange={setIsAvatarSelectorOpen}
        onSelect={handleAvatarSelect}
        isAdmin={user.role === "Administrator"}
      />
    </div>
  )
} 