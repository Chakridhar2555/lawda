import { cn } from "@/lib/utils"
import { Card } from "./card"

interface CardItemProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  header?: React.ReactNode
  footer?: React.ReactNode
  media?: React.ReactNode
  badge?: React.ReactNode
}

export function CardItem({
  children,
  className,
  onClick,
  header,
  footer,
  media,
  badge
}: CardItemProps) {
  return (
    <Card 
      className={cn(
        "flex flex-col overflow-hidden",
        onClick && "cursor-pointer hover:border-primary/50 transition-colors",
        className
      )}
      onClick={onClick}
    >
      {/* Media */}
      {media && (
        <div className="relative aspect-video w-full overflow-hidden">
          {media}
          {/* Badge */}
          {badge && (
            <div className="absolute top-2 right-2">
              {badge}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex flex-col flex-1 p-4">
        {/* Header */}
        {header && (
          <div className="mb-4">
            {header}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 space-y-4">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="mt-4 pt-4 border-t">
            {footer}
          </div>
        )}
      </div>
    </Card>
  )
} 