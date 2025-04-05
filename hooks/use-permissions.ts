import { useEffect, useState } from 'react'
import type { Permission } from '@/lib/types'

export function usePermissions(moduleId: string) {
  const [permissions, setPermissions] = useState<Permission | null>(null)

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('user')
    if (!userData) return

    const user = JSON.parse(userData)
    
    // Check if user is admin first
    if (user.role === 'Administrator' || user.role === 'admin') {
      setPermissions({
        moduleId,
        moduleName: moduleId,
        canView: true,
        canAdd: true,
        canEdit: true,
        canDelete: true
      })
      return
    }

    // For non-admin users, check their specific permissions
    const hasPermission = user.permissions?.[moduleId] ?? false
    setPermissions({
      moduleId,
      moduleName: moduleId,
      canView: hasPermission,
      canAdd: hasPermission,
      canEdit: hasPermission,
      canDelete: hasPermission
    })
  }, [moduleId])

  return {
    canView: permissions?.canView ?? false,
    canAdd: permissions?.canAdd ?? false,
    canEdit: permissions?.canEdit ?? false,
    canDelete: permissions?.canDelete ?? false,
  }
} 