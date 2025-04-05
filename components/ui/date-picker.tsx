import { forwardRef } from 'react'
import ReactDatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { cn } from '@/lib/utils'
import { Button } from './button'
import { Calendar } from 'lucide-react'

export interface DatePickerProps {
  selected: Date | null
  onChange: (date: Date | null) => void
  placeholderText?: string
  className?: string
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  ({ selected, onChange, placeholderText, className }, ref) => {
    return (
      <ReactDatePicker
        selected={selected}
        onChange={onChange}
        placeholderText={placeholderText}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        customInput={
          <Button variant="outline" className="w-[240px] pl-3 text-left font-normal">
            {selected ? selected.toLocaleDateString() : placeholderText}
            <Calendar className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        }
      />
    )
  }
) 