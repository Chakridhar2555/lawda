import { cn } from "@/lib/utils"

interface FormLayoutProps {
  children: React.ReactNode
  title: string
  description?: string
  actions?: React.ReactNode
}

export function FormLayout({
  children,
  title,
  description,
  actions
}: FormLayoutProps) {
  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 p-4">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      {/* Form Content */}
      <div className="space-y-8">
        {children}
      </div>

      {/* Form Actions */}
      {actions && (
        <div className="flex flex-col gap-3 pt-6 border-t">
          {actions}
        </div>
      )}
    </div>
  )
} 