import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Chunky "lip" buttons (Duolingo) instead of glow. Yellow = do something. Never green.
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 min-h-12 px-5 rounded-[14px] select-none",
    "font-display font-extrabold text-[15px] leading-none tracking-[.04em] uppercase [font-stretch:112%]",
    "transition-[transform,box-shadow,background-color] duration-150 ease-out",
    "enabled:active:translate-y-[2px] enabled:active:scale-[.96] [&:is(a):active]:translate-y-[2px] [&:is(a):active]:scale-[.96]",
    "disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        go: "bg-accent text-ink hover:bg-[#ffda5c] disabled:hover:bg-accent shadow-[0_4px_0_var(--lip)] enabled:active:shadow-[0_2px_0_var(--lip)] [&:is(a):active]:shadow-[0_2px_0_var(--lip)]",
        secondary:
          "bg-s2 text-t1 font-body [font-stretch:100%] normal-case tracking-normal font-semibold text-base hover:bg-s3 aria-pressed:shadow-[inset_0_0_0_1.5px_var(--t2)]",
      },
      size: {
        default: "",
        big: "min-h-14 text-[17px] w-full",
        scout: "min-h-[60px] text-[18px]",
        sm: "min-h-11 px-3.5 text-[15px]",
      },
    },
    defaultVariants: { variant: "go", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, type, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...(asChild ? {} : { type: type ?? "button" })}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
