import * as React from "react";
import { cn } from "@/lib/utils";

// Dollar input: "$" prefix, decimal keyboard, 16px+ text, red border when wrong.
export interface MoneyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  invalid?: boolean;
  boxClassName?: string;
}

export const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(
  ({ invalid, boxClassName, className, ...props }, ref) => (
    <div className={cn("money-in", invalid && "err", boxClassName)}>
      <span aria-hidden="true">$</span>
      <input
        ref={ref}
        inputMode="decimal"
        autoComplete="off"
        aria-invalid={invalid || undefined}
        className={className}
        {...props}
      />
    </div>
  ),
);
MoneyInput.displayName = "MoneyInput";

/** Error text that sits right under a field. */
export function FieldError({ id, children }: { id?: string; children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <span id={id} className="err-t" role="alert">
      {children}
    </span>
  );
}
