import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex items-center justify-center gap-1.5 rounded-md border border-transparent px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all focus-visible:ring-1 focus-visible:ring-white/20",
  {
    variants: {
      variant: {
        default: "bg-slate-500/10 text-slate-400 border-slate-500/20",
        secondary:
          "bg-white/[0.04] text-white/60 border-white/[0.08]",
        destructive:
          "bg-rose-500/10 text-rose-500 border-rose-500/20",
        outline:
          "border-white/[0.1] text-white/70 bg-transparent hover:bg-white/[0.04] hover:text-white",
        ghost:
          "hover:bg-white/[0.04] text-white/50 hover:text-white border-transparent",
        link: "text-slate-400 underline-offset-4 hover:underline bg-transparent border-transparent p-0 h-auto",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
