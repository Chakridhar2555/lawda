import { cn } from "@/lib/utils"

interface ListLayoutProps {
  children: React.ReactNode
  title: string
  description?: React.ReactNode
  actions?: React.ReactNode
  filters?: React.ReactNode
  pagination?: React.ReactNode
}

export function ListLayout({
  children,
  title,
  description,
  actions,
  filters,
  pagination
}: ListLayoutProps) {
  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 p-4">
      {/* Header */}
      <div className="space-y-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description && (
            <div className="text-sm text-muted-foreground">{description}</div>
          )}
        </div>

        {/* Actions */}
        {actions && (
          <div className="flex flex-col gap-3">
            {actions}
          </div>
        )}

        {/* Filters */}
        {filters && (
          <div className="space-y-4 pt-4 border-t">
            {filters}
          </div>
        )}
      </div>

      {/* List Content */}
      <div className="space-y-4">
        {children}
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex flex-col items-center gap-4 pt-6 border-t">
          {pagination}
        </div>
      )}
    </div>
  )
} 