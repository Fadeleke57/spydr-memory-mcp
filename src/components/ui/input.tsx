import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] selection:bg-[hsl(var(--muted))] dark:bg-input/30 border-[hsl(var(--input))] flex h-9 w-full min-w-0 rounded-md border bg-[hsl(var(--background))] px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-[hsl(var(--ring))] focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className,
        "caret-violet-500 text-[hsl(var(--foreground))]"
      )}
      {...props}
    />
  );
}

export { Input };
