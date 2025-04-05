"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"

const defaultPermissions = {
  dashboard: false,
  leads: false,
  calendar: false,
  email: false,
  settings: false,
  inventory: false,
  favorites: false,
  mls: false
}

type Permissions = {
  [K in keyof typeof defaultPermissions]: boolean;
};

export default function AddUserPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    role: "user",
    username: "",
    password: "",
    permissions: defaultPermissions as Permissions
  })

  const handlePermissionChange = (key: keyof Permissions, value: boolean) => {
    setUserData({
      ...userData,
      permissions: {
        ...userData.permissions,
        [key]: value
      }
    })
  }

  const isAdmin = userData.role === "admin" || userData.role === "Administrator"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      // If role is admin, set all permissions to true
      const permissions = isAdmin ? 
        Object.keys(defaultPermissions).reduce((acc, key) => ({ ...acc, [key]: true }), {}) :
        userData.permissions

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...userData, permissions }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create user')
      }

      const { user } = await response.json()
      
      toast({
        title: "Success",
        description: "User created successfully. Now set their permissions.",
      })

      // Redirect to permissions page
      router.push(`/users/permissions?userId=${user._id}`)
    } catch (error) {
      console.error('Error creating user:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create user. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Add New User</h1>
        <Card>
          <CardHeader>
            <CardTitle>User Details</CardTitle>
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
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password"
                    type="password"
                    required
                    value={userData.password}
                    onChange={(e) => setUserData({ ...userData, password: e.target.value })}
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

              {/* Permissions Section */}
              <div className="space-y-4">
                <div className="border-t pt-4">
                  <h3 className="text-lg font-medium mb-4">Permissions</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {(Object.entries(defaultPermissions) as [keyof Permissions, boolean][]).map(([key, _]) => (
                      <div key={key} className="flex items-center space-x-2">
                        <Checkbox
                          id={key}
                          checked={isAdmin || userData.permissions[key]}
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
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading}
                >
                  {isLoading ? "Creating..." : "Create User"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
} 