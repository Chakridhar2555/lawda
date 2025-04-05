"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { DashboardLayout } from "@/components/layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, UserCog, Key, Shield, History, UserCircle, Mail } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { routes } from "@/lib/routes"

interface Permissions {
  dashboard: boolean;
  leads: boolean;
  calendar: boolean;
  email: boolean;
  settings: boolean;
  inventory: boolean;
  favorites: boolean;
  mls: boolean;
}

interface User {
  _id: string;
  id: string;
  name: string;
  email: string;
  username: string;
  role: string;
  permissions: Permissions;
}

const defaultPermissions: Permissions = {
  dashboard: false,
  leads: false,
  calendar: false,
  email: false,
  settings: false,
  inventory: false,
  favorites: false,
  mls: false
}

export default function EditUserPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [userData, setUserData] = useState<User | null>(null)

  useEffect(() => {
    fetchUser()
  }, [params.userId])

  const fetchUser = async () => {
    try {
      const response = await fetch(`/api/users/${params.userId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch user')
      }
      const data = await response.json()
      setUserData({
        ...data,
        permissions: data.permissions || defaultPermissions
      })
    } catch (error) {
      console.error('Error fetching user:', error)
      toast({
        title: "Error",
        description: "Failed to fetch user data",
        variant: "destructive",
      })
      router.push('/users')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      // If role is admin, set all permissions to true
      const isAdmin = userData?.role === "admin" || userData?.role === "Administrator"
      const permissions = isAdmin ? 
        Object.keys(defaultPermissions).reduce((acc, key) => ({ ...acc, [key]: true }), {}) :
        userData?.permissions

      const response = await fetch(`/api/users/${params.userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...userData, permissions }),
      })

      if (!response.ok) {
        throw new Error('Failed to update user')
      }

      toast({
        title: "Success",
        description: "User updated successfully.",
      })

      router.push('/users')
    } catch (error) {
      console.error('Error updating user:', error)
      toast({
        title: "Error",
        description: "Failed to update user. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePermissionChange = (permission: string, value: boolean) => {
    if (!userData) return
    setUserData({
      ...userData,
      permissions: {
        ...userData.permissions,
        [permission]: value
      }
    })
  }

  if (!userData) return null

  const isAdmin = userData.role === "admin" || userData.role === "Administrator"

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Users
            </Button>
            <h1 className="text-2xl font-semibold">Edit User</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <UserCog className="h-4 w-4 mr-2" />
                  User Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => router.push(routes.userPermissions(userData.id))}>
                  <Shield className="h-4 w-4 mr-2" />
                  Permissions
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push(routes.userSecurity(userData.id))}>
                  <Key className="h-4 w-4 mr-2" />
                  Security
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push(routes.userActivity(userData.id))}>
                  <History className="h-4 w-4 mr-2" />
                  Activity
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push(`mailto:${userData.email}`)}>
                  <Mail className="h-4 w-4 mr-2" />
                  Email User
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <Card>
          <CardHeader className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 ring-2 ring-offset-2 ring-gray-100">
                <AvatarImage 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userData?.email || userData?.username || 'default'}`}
                  alt={userData?.name || 'User'}
                />
                <AvatarFallback className="bg-red-100 text-red-600 font-medium">
                  {userData?.name?.split(' ').map(n => n[0]?.toUpperCase()).join('') || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>{userData.name}</CardTitle>
                <p className="text-sm text-gray-500">{userData.email}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name"
                  required
                  value={userData.name}
                  onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email"
                  type="email"
                  required
                  value={userData.email}
                  onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input 
                  id="username"
                  required
                  value={userData.username}
                  onChange={(e) => setUserData({ ...userData, username: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select 
                  value={userData.role}
                  onValueChange={(value) => setUserData({ ...userData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              </div>

              <div className="space-y-4">
                <div className="border-t pt-4">
                  <h3 className="text-lg font-medium mb-4">Permissions</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(userData.permissions).map(([key, value]) => (
                      <div key={key} className="flex items-center space-x-2">
                        <Checkbox
                          id={key}
                          checked={isAdmin ? true : value}
                          onCheckedChange={(checked) => handlePermissionChange(key, !!checked)}
                          disabled={isAdmin}
                        />
                        <Label 
                          htmlFor={key}
                          className={`capitalize ${isAdmin ? 'text-gray-500' : ''}`}
                        >
                          {key}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {isAdmin && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Administrator role has all permissions enabled by default
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <Button 
                  type="submit" 
                  disabled={isLoading}
                >
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
} 