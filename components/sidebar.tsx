"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { 
  LayoutDashboard, 
  Users, 
  UserPlus,
  UserCircle,
  UserCog,
  Heart, 
  Inbox, 
  Package, 
  Calendar, 
  Settings, 
  LogOut,
  Bell,
  Shield,
  BellRing,
  Mail,
  BriefcaseBusiness,
  Send
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { routes } from "@/lib/routes"

interface Notification {
  id: string
  title: string
  message: string
  type: 'lead' | 'showing' | 'document' | 'system'
  date: string
  read: boolean
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<{ name: string; email?: string }>({ name: "User" })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      const storedNotifications = localStorage.getItem('notifications')
      const userData = localStorage.getItem("user")
      
      if (storedNotifications) {
        try {
          setNotifications(JSON.parse(storedNotifications))
        } catch (error) {
          console.error("Error parsing notifications:", error)
          setNotifications([])
        }
      }

      if (userData) {
        try {
          setUser(JSON.parse(userData))
        } catch (error) {
          console.error("Error parsing user data:", error)
        }
      }
    }
  }, [mounted])

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    router.push("/")
  }

  const markAsRead = (notificationId: string) => {
    const updatedNotifications = notifications.map(notification =>
      notification.id === notificationId
        ? { ...notification, read: true }
        : notification
    )
    setNotifications(updatedNotifications)
    localStorage.setItem('notifications', JSON.stringify(updatedNotifications))
  }

  const markAllAsRead = () => {
    const updatedNotifications = notifications.map(notification => ({
      ...notification,
      read: true
    }))
    setNotifications(updatedNotifications)
    localStorage.setItem('notifications', JSON.stringify(updatedNotifications))
  }

  const clearNotifications = () => {
    setNotifications([])
    localStorage.setItem('notifications', '[]')
  }

  const unreadCount = mounted ? notifications.filter(n => !n.read).length : 0

  const sidebarItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: routes.dashboard },
    { icon: Users, label: "Leads", href: routes.leads },
    { icon: Heart, label: "Favorites", href: routes.favorites },
    { icon: Inbox, label: "Inbox", href: routes.inbox },
    { icon: Package, label: "Inventory", href: routes.inventory },
    { icon: Send, label: "Send Notifications", href: routes.sendNotifications },
    { icon: Calendar, label: "Calendar", href: routes.calendar },
    { icon: UserCog, label: "Users", href: routes.users },
    { icon: BellRing, label: "Notifications", href: routes.notifications },
    { icon: Settings, label: "Settings", href: routes.settings },
  ]

  return (
    <div className="w-64 bg-white border-r h-screen p-4 flex flex-col">
      <div className="text-red-500 text-xl font-semibold mb-8">Get Home Realty</div>
      <nav className="space-y-2 flex-grow">
        {sidebarItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors
              ${item.label === "Send Notifications" 
                ? "bg-red-500 text-white hover:bg-red-600" 
                : pathname === item.href 
                  ? "bg-red-100 text-red-500" 
                  : "text-gray-600 hover:bg-gray-100"
              }`}
          >
            <div className="flex items-center space-x-3">
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </div>
            {item.label === "Notifications" && mounted && unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </Link>
        ))}
      </nav>

      <div className="border-t pt-4 mt-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Avatar className="h-8 w-8">
                <AvatarImage 
                  src={mounted ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'default'}` : undefined}
                  alt={user?.name || 'User'}
                />
                <AvatarFallback>{user?.name?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>
              <div className="flex-grow text-left">
                <p className="text-sm font-medium text-gray-700">{user?.name || 'User'}</p>
                <p className="text-xs text-gray-500">View profile</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push(routes.settingsProfile)}>
              <UserCircle className="h-4 w-4 mr-2" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(routes.settingsNotifications)}>
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(routes.settingsSecurity)}>
              <Shield className="h-4 w-4 mr-2" />
              Security
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(routes.settingsEmail)}>
              <Mail className="h-4 w-4 mr-2" />
              Email
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(routes.settingsBusiness)}>
              <BriefcaseBusiness className="h-4 w-4 mr-2" />
              Business
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600">
              <LogOut className="h-4 w-4 mr-2" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

