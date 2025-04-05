// Create a new file for centralized route management
export const routes = {
  // Main routes
  dashboard: '/dashboard',
  leads: '/leads',
  favorites: '/favorites',
  inbox: '/inbox',
  inventory: '/inventory',
  calendar: '/calendar',
  users: '/users',
  notifications: '/notifications',
  sendNotifications: '/send-notifications',
  settings: '/settings',

  // User related routes
  userProfile: (userId: string) => `/users/${userId}`,
  userPermissions: (userId: string) => `/users/${userId}/permissions`,
  userSecurity: (userId: string) => `/users/${userId}/security`,
  userActivity: (userId: string) => `/users/${userId}/activity`,

  // Property related
  property: (propertyId: string) => `/properties/${propertyId}`,
  propertyEdit: (propertyId: string) => `/properties/${propertyId}/edit`,
  propertyShowings: (propertyId: string) => `/properties/${propertyId}/showings`,

  // Lead related
  lead: (leadId: string) => `/leads/${leadId}`,
  leadEdit: (leadId: string) => `/leads/${leadId}/edit`,
  leadActivity: (leadId: string) => `/leads/${leadId}/activity`,

  // Settings related
  settingsProfile: '/settings/profile',
  settingsNotifications: '/settings/notifications',
  settingsSecurity: '/settings/security',
  settingsEmail: '/settings/email',
  settingsBusiness: '/settings/business',
} 