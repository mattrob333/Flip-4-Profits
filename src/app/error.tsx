"use client";

import { useRouter } from "next/navigation";
import { startTransition, useEffect } from "react";
import { ErrorPanel } from "@/components/ErrorPanel";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <ErrorPanel
      reset={() =>
        startTransition(() => {
          router.refresh();
          reset();
        })
      }
    />
  );
}
