import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium transition-all duration-300 md-focus-ring disabled:pointer-events-none disabled:opacity-50 active:scale-95 group",
  {
    variants: {
      variant: {
        default:
          "bg-md-primary text-md-on-primary shadow-sm hover:bg-md-primary/90 hover:shadow-md",
        tonal:
          "bg-md-secondary-container text-md-on-secondary-container shadow-sm hover:bg-md-secondary-container/90 hover:shadow-md",
        outline:
          "border border-md-outline bg-transparent text-md-primary hover:bg-md-primary/5 hover:border-md-primary",
        ghost: "text-md-primary hover:bg-md-primary/10",
        fab: "bg-md-tertiary text-white shadow-md hover:shadow-xl rounded-2xl h-14 w-14",
      },
      size: {
        default: "h-10 px-6 py-2",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-8 text-base",
        icon: "h-10 w-10",
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
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        suppressHydrationWarning
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
