import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-bold tracking-tight whitespace-nowrap transition-all outline-none select-none focus-visible:border-white/20 focus-visible:ring-1 focus-visible:ring-white/10 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-slate-800 text-white hover:bg-slate-700 shadow-sm",
        outline:
          "border-white/[0.08] bg-transparent text-white/70 hover:bg-white/[0.04] hover:text-white hover:border-white/20",
        secondary:
          "bg-white/[0.04] text-white/90 hover:bg-white/[0.08] border border-white/[0.04]",
        ghost:
          "text-white/50 hover:bg-white/[0.04] hover:text-white",
        destructive:
          "bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20",
        link: "text-slate-400 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 gap-2",
        xs: "h-7 px-2.5 text-xs rounded-md",
        sm: "h-8 px-3 text-[13px] rounded-md",
        lg: "h-10 px-5 text-base gap-2.5",
        icon: "size-9",
        "icon-xs": "size-7 rounded-md",
        "icon-sm": "size-8 rounded-md",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
