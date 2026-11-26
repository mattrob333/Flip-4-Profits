"use client";

// Shown when a screen can't load. Money is in the database, so nothing is lost.
import * as React from "react";
import { Button } from "./ui/button";
import { TriIcon } from "./Icons";

export function ErrorPanel({ reset, what = "this screen" }: { reset: () => void; what?: string }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="banner" role="alert">
        <span className="ic">
          <TriIcon size={20} />
        </span>
        <p>
          Couldn&apos;t load {what}.<small>Your money is safe. Nothing was bought or sold.</small>
        </p>
        <Button variant="secondary" size="sm" onClick={reset}>
          Try again
        </Button>
      </div>
    </div>
  );
}
