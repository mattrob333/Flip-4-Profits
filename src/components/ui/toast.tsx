"use client";

// Receipt-style toasts (role=status). Max 2 on screen. Optional action (Undo, See it).
import * as React from "react";
import Link from "next/link";
import { Button } from "./button";
import { cn } from "@/lib/utils";

type Action = { label: string; onClick?: () => void; href?: string };
type Toast = { id: number; msg: string; tone: "info" | "good" | "error"; action?: Action };
type ToastFn = (msg: string, opts?: { tone?: Toast["tone"]; action?: Action }) => void;

const Ctx = React.createContext<ToastFn>(() => {});
export const useToast = () => React.useContext(Ctx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<Toast[]>([]);
  const next = React.useRef(1);
  const remove = React.useCallback((id: number) => setItems((xs) => xs.filter((x) => x.id !== id)), []);
  const toast = React.useCallback<ToastFn>(
    (msg, opts = {}) => {
      const id = next.current++;
      setItems((xs) => [...xs, { id, msg, tone: opts.tone ?? "info", action: opts.action }].slice(-2));
      setTimeout(() => remove(id), opts.action ? 6000 : 4000);
    },
    [remove],
  );
  return (
    <Ctx.Provider value={toast}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={cn("toast", t.tone)}>
            <span className="tbar" aria-hidden="true" />
            <p>{t.msg}</p>
            {t.action &&
              (t.action.href ? (
                <Button asChild variant="secondary" size="sm" className="min-h-10">
                  <Link href={t.action.href} onClick={() => remove(t.id)}>
                    {t.action.label}
                  </Link>
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  className="min-h-10"
                  onClick={() => {
                    t.action?.onClick?.();
                    remove(t.id);
                  }}
                >
                  {t.action.label}
                </Button>
              ))}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
