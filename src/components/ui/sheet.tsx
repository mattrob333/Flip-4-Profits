"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";

// Bottom sheet on phones, centered dialog from 768px up (styles: .backdrop / .sheet).
// With `overlayClassName="takeover-bd"` + `className="takeover"` it fills the viewport (the SOLD moment).
// Radix gives focus trap, Esc to close, and focus return.
export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;
export const SheetTitle = DialogPrimitive.Title;
export const SheetDescription = DialogPrimitive.Description;

export const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { overlayClassName?: string }
>(({ className, overlayClassName, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className={cn("backdrop", overlayClassName)}>
      <DialogPrimitive.Content ref={ref} className={cn("sheet", className)} {...props}>
        <div className="grab" aria-hidden="true" />
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Overlay>
  </DialogPrimitive.Portal>
));
SheetContent.displayName = "SheetContent";
