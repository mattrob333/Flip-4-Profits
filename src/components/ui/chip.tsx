import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

// Filter / category chip. Pressed = light fill with dark ink.
export const chipClass = cn(
  "flex-none inline-flex items-center gap-2 h-11 px-4 rounded-lg whitespace-nowrap",
  "bg-s2 shadow-ring text-t2 font-semibold text-[15px]",
  "transition-[color,box-shadow] duration-150 hover:text-t1 hover:shadow-ring-h",
  "aria-pressed:bg-t1 aria-pressed:text-s0 aria-pressed:shadow-none aria-pressed:hover:text-s0",
  "data-[state=on]:bg-t1 data-[state=on]:text-s0 data-[state=on]:shadow-none",
);

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

export const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(({ className, asChild, type, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return <Comp ref={ref} className={cn(chipClass, className)} {...(asChild ? {} : { type: type ?? "button" })} {...props} />;
});
Chip.displayName = "Chip";
