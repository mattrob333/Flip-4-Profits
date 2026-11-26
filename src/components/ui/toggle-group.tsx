"use client";

import * as React from "react";
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { cn } from "@/lib/utils";

// Segmented single-choice control (chart range, min score). Uses the .seg look unless a class is given.
export const ToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root>
>(({ className, ...props }, ref) => <ToggleGroupPrimitive.Root ref={ref} className={cn(className ?? "seg")} {...props} />);
ToggleGroup.displayName = "ToggleGroup";

export const ToggleGroupItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item>
>(({ className, ...props }, ref) => <ToggleGroupPrimitive.Item ref={ref} className={cn(className)} {...props} />);
ToggleGroupItem.displayName = "ToggleGroupItem";
