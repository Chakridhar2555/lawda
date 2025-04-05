"use client"

import { useState, useEffect, Suspense } from "react"
import { DashboardLayout } from "@/components/layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useSearchParams, useRouter } from 'next/navigation'
import { useToast } from "@/components/ui/use-toast"

interface Permission {
  moduleId: string;
  moduleName: string;
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

const defaultModules = [
  { id: "dashboard", name: "Dashboard" },
  { id: "lead", name: "Lead Management" },
  { id: "inventory", name: "Inventory" },
  { id: "calendar", name: "Calendar" },
  { id: "users", name: "Users" },
  { id: "settings", name: "Settings" },
  { id: "favorites", name: "Favorites" },
  { id: "inbox", name: "Inbox" },
  { id: "mls", name: "MLS" }
]

// Separate the content into a client component
function PermissionsContent() {
  const searchParams = useSearchParams()
  const userId = searchParams.get('userId')
  const [permissions, setPermissions] = useState<Permission[]>([])
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (!userId) {
      router.push('/users')
      return
    }

    // Initialize permissions
    setPermissions(
      defaultModules.map(module => ({
        moduleId: module.id,
        moduleName: module.name,
        canView: false,
        canAdd: false,
        canEdit: false,
        canDelete: false,
      }))
    )
  }, [userId, router])

  const handlePermissionChange = (
    moduleId: string,
    permission: 'canView' | 'canAdd' | 'canEdit' | 'canDelete',
    value: boolean
  ) => {
    setPermissions(permissions.map(p => 
      p.moduleId === moduleId ? { ...p, [permission]: value } : p
    ))
  }

  const handleSavePermissions = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/permissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ permissions }),
      })

      if (!response.ok) {
        throw new Error('Failed to save permissions')
      }

      const result = await response.json()
      
      // Store permissions in localStorage (in a real app, this would be handled differently)
      const userPermissions = JSON.parse(localStorage.getItem('userPermissions') || '[]')
      localStorage.setItem('userPermissions', JSON.stringify([
        ...userPermissions.filter((p: any) => p.userId !== userId),
        { userId, permissions: result.permissions }
      ]))

      toast({
        title: "Success",
        description: "Permissions saved successfully.",
      })

      router.push('/users')
    } catch (error) {
      console.error('Error saving permissions:', error)
      toast({
        title: "Error",
        description: "Failed to save permissions. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">User Permissions</h1>
        <Button 
          onClick={handleSavePermissions}
          className="bg-[#ef4444] hover:bg-[#dc2626] text-white"
        >
          Save Changes
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Module Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Module Name</TableHead>
                <TableHead>View</TableHead>
                <TableHead>Add</TableHead>
                <TableHead>Edit</TableHead>
                <TableHead>Delete</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {permissions.map((module) => (
                <TableRow key={module.moduleId}>
                  <TableCell>{module.moduleName}</TableCell>
                  <TableCell>
                    <Checkbox 
                      checked={module.canView}
                      onCheckedChange={(checked) => 
                        handlePermissionChange(module.moduleId, 'canView', !!checked)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Checkbox 
                      checked={module.canAdd}
                      onCheckedChange={(checked) => 
                        handlePermissionChange(module.moduleId, 'canAdd', !!checked)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Checkbox 
                      checked={module.canEdit}
                      onCheckedChange={(checked) => 
                        handlePermissionChange(module.moduleId, 'canEdit', !!checked)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Checkbox 
                      checked={module.canDelete}
                      onCheckedChange={(checked) => 
                        handlePermissionChange(module.moduleId, 'canDelete', !!checked)
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

// Wrap the content in Suspense
export default function PermissionsPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">Loading permissions...</div>
        </div>
      }>
        <PermissionsContent />
      </Suspense>
    </DashboardLayout>
  )
} 