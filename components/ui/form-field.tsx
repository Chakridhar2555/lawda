import { cn } from "@/lib/utils"
import { Label } from "./label"

interface FormFieldProps {
  children: React.ReactNode
  label?: string
  description?: string
  error?: string
  className?: string
  required?: boolean
}

export function FormField({
  children,
  label,
  description,
  error,
  className,
  required
}: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className="flex items-baseline gap-1">
          <span>{label}</span>
          {required && (
            <span className="text-destructive text-sm">*</span>
          )}
        </Label>
      )}
      {description && (
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
      <div>
        {children}
      </div>
      {error && (
        <p className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
} 