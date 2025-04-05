import * as React from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface CustomSelectProps<T extends string> {
  value: T | null
  onValueChange: (value: T | null) => void
  placeholder?: string
  options: readonly T[]
  className?: string
  label?: string
  renderOption?: (value: T) => React.ReactNode
}

export function CustomSelect<T extends string>({
  value,
  onValueChange,
  placeholder = "All",
  options,
  className,
  label,
  renderOption = (value) => value
}: CustomSelectProps<T>) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-gray-700">{label}</label>
      )}
      <Select
        value={value || undefined}
        onValueChange={(val: string) => onValueChange(val as T)}
      >
        <SelectTrigger className={className}>
          <SelectValue placeholder={placeholder}>
            {value ? renderOption(value) : placeholder}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {renderOption(option)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
} 