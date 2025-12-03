import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-slate-950 dark:focus-visible:ring-slate-300",
  {
    variants: {
      variant: {
        default:
          "bg-blue-500/80 text-white border border-blue-400/50 hover:bg-blue-500/90 dark:bg-blue-600/60 dark:hover:bg-blue-500/70 backdrop-blur-md shadow-sm",
        destructive:
          "bg-red-500/80 text-white border border-red-400/50 hover:bg-red-600/90 dark:bg-red-900/60 dark:hover:bg-red-800/70 backdrop-blur-md shadow-sm",
        outline:
          "border border-slate-200 bg-white/50 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-950/50 dark:hover:bg-slate-800 dark:hover:text-slate-50 backdrop-blur-md",
        secondary:
          "bg-white/50 text-gray-800 border border-white/40 hover:bg-white/70 dark:bg-white/10 dark:text-white dark:border-white/10 dark:hover:bg-white/20 backdrop-blur-md",
        ghost:
          "hover:bg-black/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white",
        link: "text-slate-900 underline-offset-4 hover:underline dark:text-slate-50",
        shimmer: "relative overflow-hidden bg-slate-800 text-white border border-slate-700 hover:bg-slate-700 dark:bg-black/40 dark:border-white/10 dark:hover:bg-white/5 backdrop-blur-md",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-11 rounded-2xl px-8",
        icon: "h-10 w-10 rounded-full",
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
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
