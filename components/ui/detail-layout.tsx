import { cn } from "@/lib/utils"
import { Button } from "./button"
import { ChevronLeft } from "lucide-react"
import { useRouter } from "next/navigation"

interface DetailLayoutProps {
  children: React.ReactNode
  title: string
  description?: string
  actions?: React.ReactNode
  backUrl?: string
  tabs?: React.ReactNode
}

export function DetailLayout({
  children,
  title,
  description,
  actions,
  backUrl,
  tabs
}: DetailLayoutProps) {
  const router = useRouter()

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 p-4">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-col gap-4">
          {backUrl && (
            <Button
              variant="ghost"
              size="sm"
              className="-ml-2 w-fit"
              onClick={() => router.push(backUrl)}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          )}
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        {actions && (
          <div className="flex flex-col gap-3">
            {actions}
          </div>
        )}

        {/* Tabs */}
        {tabs && (
          <div className="border-b">
            {tabs}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-6">
        {children}
      </div>
    </div>
  )
} 