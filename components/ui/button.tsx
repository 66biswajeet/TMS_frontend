import type * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/lib/utils"

const buttonVariants = ({ variant = "default", size = "default" }: { variant?: string; size?: string }) => {
  const baseClasses =
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive active:scale-[0.98] hover:shadow-md hover:-translate-y-0.5 group"

  const variantClasses = {
    default:
      "btn-primary shadow-sm hover:shadow-lg active:shadow-sm hover:scale-[1.02] active:scale-[0.98] [&_svg]:group-hover:scale-110 [&_svg]:transition-transform [&_svg]:duration-200",
    destructive:
      "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 hover:shadow-lg hover:scale-[1.02] focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 active:bg-destructive/95 [&_svg]:group-hover:scale-110 [&_svg]:transition-transform [&_svg]:duration-200",
    outline:
      "border border-border bg-background shadow-sm hover:bg-accent hover:text-accent-foreground hover:shadow-lg hover:border-accent hover:scale-[1.02] dark:bg-input/30 dark:border-input dark:hover:bg-input/50 [&_svg]:group-hover:scale-110 [&_svg]:transition-transform [&_svg]:duration-200",
    secondary:
      "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 hover:shadow-lg hover:scale-[1.02] [&_svg]:group-hover:scale-110 [&_svg]:transition-transform [&_svg]:duration-200",
    ghost:
      "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 hover:shadow-sm hover:scale-[1.02] [&_svg]:group-hover:scale-110 [&_svg]:transition-transform [&_svg]:duration-200",
    link: "text-primary underline-offset-4 hover:underline hover:text-primary/80",
  }

  const sizeClasses = {
    default: "h-10 px-4 py-2 has-[>svg]:px-3 text-sm sm:text-base",
    sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5 text-xs sm:text-sm",
    lg: "h-12 rounded-lg px-6 has-[>svg]:px-4 text-base sm:text-lg",
    icon: "size-10 sm:size-12",
  }

  return cn(
    baseClasses,
    variantClasses[variant as keyof typeof variantClasses],
    sizeClasses[size as keyof typeof sizeClasses],
  )
}

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  asChild?: boolean
}) {
  const Comp = asChild ? Slot : "button"

  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size }), className)} {...props} />
}

export { Button, buttonVariants }
