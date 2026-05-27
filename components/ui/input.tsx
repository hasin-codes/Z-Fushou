import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-lg border border-white/[0.04] bg-[#141418] px-3 py-1 text-sm text-white transition-all placeholder:text-white/20 focus-visible:border-indigo-500/50 focus-visible:ring-1 focus-visible:ring-indigo-500/20 disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Input }
