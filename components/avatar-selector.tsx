'use client';

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Check } from "lucide-react"

interface AvatarSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (avatarUrl: string) => void
  isAdmin?: boolean
}

// Admin avatars use big-smile style for cheerful looks
const adminAvatars = [
  "https://api.dicebear.com/7.x/big-smile/svg?seed=admin1&backgroundColor=b6e3f4",
  "https://api.dicebear.com/7.x/big-smile/svg?seed=admin2&backgroundColor=d1d4f9",
  "https://api.dicebear.com/7.x/big-smile/svg?seed=admin3&backgroundColor=c0aede",
  "https://api.dicebear.com/7.x/big-smile/svg?seed=admin4&backgroundColor=b6e3f4",
  "https://api.dicebear.com/7.x/big-smile/svg?seed=admin5&backgroundColor=ffd5dc",
  "https://api.dicebear.com/7.x/big-smile/svg?seed=admin6&backgroundColor=c0aede",
  "https://api.dicebear.com/7.x/big-smile/svg?seed=admin7&backgroundColor=d1d4f9",
  "https://api.dicebear.com/7.x/big-smile/svg?seed=admin8&backgroundColor=b6e3f4",
  "https://api.dicebear.com/7.x/big-smile/svg?seed=admin9&backgroundColor=ffd5dc",
  "https://api.dicebear.com/7.x/big-smile/svg?seed=admin10&backgroundColor=c0aede"
]

// User avatars use big-smile style for friendly looks
const userAvatars = [
  "https://api.dicebear.com/7.x/big-smile/svg?seed=user1&backgroundColor=b6e3f4",
  "https://api.dicebear.com/7.x/big-smile/svg?seed=user2&backgroundColor=d1d4f9",
  "https://api.dicebear.com/7.x/big-smile/svg?seed=user3&backgroundColor=c0aede",
  "https://api.dicebear.com/7.x/big-smile/svg?seed=user4&backgroundColor=b6e3f4",
  "https://api.dicebear.com/7.x/big-smile/svg?seed=user5&backgroundColor=ffd5dc",
  "https://api.dicebear.com/7.x/big-smile/svg?seed=user6&backgroundColor=c0aede",
  "https://api.dicebear.com/7.x/big-smile/svg?seed=user7&backgroundColor=d1d4f9",
  "https://api.dicebear.com/7.x/big-smile/svg?seed=user8&backgroundColor=b6e3f4",
  "https://api.dicebear.com/7.x/big-smile/svg?seed=user9&backgroundColor=ffd5dc",
  "https://api.dicebear.com/7.x/big-smile/svg?seed=user10&backgroundColor=c0aede",
  "https://api.dicebear.com/7.x/big-smile/svg?seed=user11&backgroundColor=b6e3f4",
  "https://api.dicebear.com/7.x/big-smile/svg?seed=user12&backgroundColor=d1d4f9",
  "https://api.dicebear.com/7.x/big-smile/svg?seed=user13&backgroundColor=c0aede",
  "https://api.dicebear.com/7.x/big-smile/svg?seed=user14&backgroundColor=b6e3f4",
  "https://api.dicebear.com/7.x/big-smile/svg?seed=user15&backgroundColor=ffd5dc",
  "https://api.dicebear.com/7.x/big-smile/svg?seed=user16&backgroundColor=c0aede",
  "https://api.dicebear.com/7.x/big-smile/svg?seed=user17&backgroundColor=d1d4f9",
  "https://api.dicebear.com/7.x/big-smile/svg?seed=user18&backgroundColor=b6e3f4",
  "https://api.dicebear.com/7.x/big-smile/svg?seed=user19&backgroundColor=ffd5dc",
  "https://api.dicebear.com/7.x/big-smile/svg?seed=user20&backgroundColor=c0aede"
]

export function AvatarSelector({ open, onOpenChange, onSelect, isAdmin = false }: AvatarSelectorProps) {
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<{[key: string]: boolean}>({})
  const [imagesLoaded, setImagesLoaded] = useState<{[key: string]: boolean}>({})
  const avatars = isAdmin ? adminAvatars : userAvatars

  // Preload images when component mounts
  useEffect(() => {
    if (open) {
      avatars.forEach(avatar => {
        const img = new Image()
        img.onload = () => {
          setImagesLoaded(prev => ({ ...prev, [avatar]: true }))
        }
        img.onerror = () => {
          setLoadError(prev => ({ ...prev, [avatar]: true }))
        }
        img.src = avatar
      })
    }
  }, [open, avatars])

  const handleSelect = () => {
    if (selectedAvatar) {
      onSelect(selectedAvatar)
      onOpenChange(false)
      setSelectedAvatar(null)
    }
  }

  const handleImageError = (avatar: string) => {
    setLoadError(prev => ({ ...prev, [avatar]: true }))
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen)
      if (!isOpen) {
        setSelectedAvatar(null)
        setLoadError({})
        setImagesLoaded({})
      }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choose an Avatar</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-5 gap-4 py-4">
          {avatars.map((avatar) => (
            <button
              key={avatar}
              className="relative group"
              onClick={() => setSelectedAvatar(avatar)}
            >
              <Avatar className={`w-16 h-16 ring-2 ring-offset-2 transition-all ${
                selectedAvatar === avatar 
                  ? "ring-primary" 
                  : "ring-transparent hover:ring-primary/50"
              }`}>
                <AvatarImage 
                  src={avatar} 
                  alt="Avatar option" 
                  onError={() => handleImageError(avatar)}
                  className={imagesLoaded[avatar] ? 'opacity-100' : 'opacity-0'}
                />
                <AvatarFallback>
                  {loadError[avatar] ? '!' : imagesLoaded[avatar] ? '' : 'Loading...'}
                </AvatarFallback>
              </Avatar>
              {selectedAvatar === avatar && (
                <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-1">
                  <Check className="w-4 h-4" />
                </div>
              )}
            </button>
          ))}
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => {
            onOpenChange(false)
            setSelectedAvatar(null)
            setLoadError({})
            setImagesLoaded({})
          }}>
            Cancel
          </Button>
          <Button onClick={handleSelect} disabled={!selectedAvatar}>
            Select Avatar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 