
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "professional-button focus-ring relative overflow-hidden group",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-professional hover:bg-primary/90 hover:shadow-professional-lg",
        destructive:
          "bg-destructive text-destructive-foreground shadow-professional hover:bg-destructive/90 hover:shadow-professional-lg",
        outline:
          "border border-border/50 bg-background/50 backdrop-blur-sm hover:bg-accent hover:text-accent-foreground shadow-professional",
        secondary:
          "bg-secondary text-secondary-foreground shadow-professional hover:bg-secondary/80 hover:shadow-professional-lg",
        ghost: "hover:bg-accent/50 hover:text-accent-foreground transition-colors",
        link: "text-primary underline-offset-4 hover:underline",
        success: "bg-green-600 text-white shadow-professional hover:bg-green-700 hover:shadow-professional-lg",
        warning: "bg-yellow-600 text-white shadow-professional hover:bg-yellow-700 hover:shadow-professional-lg",
      },
      size: {
        default: "h-10 px-4 py-2 text-sm",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-md px-8 text-base",
        icon: "h-10 w-10",
        xl: "h-14 px-10 text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 animate-shimmer" />
        )}
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>Loading...</span>
          </div>
        ) : (
          children
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
