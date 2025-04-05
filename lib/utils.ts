import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatDate = (dateString: string, formatStr: string = 'MMM d, yyyy') => {
  try {
    if (!dateString) return 'No date'
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Invalid date'
    return format(date, formatStr)
  } catch (error) {
    console.error('Date formatting error:', error)
    return 'Invalid date'
  }
}
