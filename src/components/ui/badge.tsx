
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "professional-badge focus-ring",
  {
    variants: {
      variant: {
        default: "bg-primary/20 text-primary ring-primary/30",
        secondary: "bg-secondary/20 text-secondary-foreground ring-secondary/30",
        destructive: "badge-error",
        success: "badge-success",
        warning: "badge-warning",
        info: "badge-info",
        outline: "text-foreground border border-border/50",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
