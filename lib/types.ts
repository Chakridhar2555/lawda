export interface Permission {
  moduleId: string;
  moduleName: string;
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface UserRole {
  id: string;
  name: string;
  permissions: Permission[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  username: string;
  password: string;
  permissions: Permission[];
}

export interface Showing {
  id: string
  date: Date
  time: string
  property: string
  notes?: string
  status: 'scheduled' | 'completed' | 'cancelled'
  leadName?: string
  leadId?: string
}

export interface Task {
  id: string;
  title: string;
  date: string;  // ISO date string format
  description?: string;
  status: 'pending' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
}

export interface CallHistory {
  date: string;  // ISO date string format
  duration: number;
  recording?: string;
}

export interface PropertyPreferences {
  budget: {
    min: number;
    max: number;
  };
  propertyType: string[]; // ['detached', 'semi-detached', 'townhouse', 'condo']
  bedrooms: number;
  bathrooms: number;
  locations: string[]; // Preferred neighborhoods/cities
  features: string[]; // ['garage', 'basement', 'pool', etc]
}

export interface Document {
  type: string; // 'id', 'preApproval', 'offer', 'agreement'
  name: string;
  url: string;
  dateUploaded: string;
}

export interface Offer {
  propertyAddress: string;
  offerAmount: number;
  offerDate: string;
  status: string; // 'pending', 'accepted', 'rejected', 'countered'
  conditions: string[];
  closingDate?: string;
}

export interface Lead {
  _id: string;
  name: string;
  email: string;
  phone: string;
  date: string;
  status?: string;
  property?: string;
  notes?: string;
  tasks?: Task[];
  callHistory?: CallHistory[];
  showings?: Showing[];
  assignedTo?: string;
  location?: string;
  leadStatus?: 'hot' | 'warm' | 'cold' | 'mild';
  leadType?: 'Pre construction' | 'resale' | 'seller' | 'buyer';
  leadSource?: 'google ads' | 'meta' | 'refferal' | 'linkedin' | 'youtube';
  leadResponse?: 'active' | 'inactive' | 'not answering' | 'not actively answering' | 'always responding';
  clientType?: 'Investor' | 'custom buyer' | 'first home buyer' | 'seasonal investor' | 'commercial buyer';
  leadConversion?: 'converted' | 'not-converted';
  language?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  religion?: string;
  age?: number;
  realtorAssociation?: {
    name: string;
    membershipNumber: string;
    joinDate: string;
  };
  closedSales?: {
    count: number;
    totalValue: number;
    lastClosedDate: string;
  };
  propertyPreferences?: PropertyPreferences;
  updatedAt?: string;
  createdAt?: string;
} 