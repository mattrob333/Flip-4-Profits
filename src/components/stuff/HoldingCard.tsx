"use client";

// One thing you hold: what you paid vs what it should sell for, the potential
// profit, condition notes, a Bought → Listed → Sold track, and Sell.
import * as React from "react";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/money-input";
import { useToast } from "@/components/ui/toast";
import { ArrowIcon, CheckIcon } from "@/components/Icons";
import { ProductImage } from "@/components/ProductImage";
import { listedAction, notesAction } from "@/app/actions";
import { money, signed } from "@/lib/money";
import type { HoldingView } from "@/lib/ledger";

const NOTES_MAX = 500;

export function HoldingCard({ item: h, onSell }: { item: HoldingView; onSell: () => void }) {
  const toast = useToast();
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(h.notes);
  const [err, setErr] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [listedBusy, setListedBusy] = React.useState(false);
  const potential = h.estSellCents - h.estFeesCents - h.buyCents;
  const notesId = `notes-${h.id}`;

  async function saveNotes(e: React.FormEvent) {
    e.preventDefault();
    if (draft.trim().length > NOTES_MAX) {
      setErr(`Keep notes under ${NOTES_MAX} letters.`);
      return;
    }
    setSaving(true);
    const res = await notesAction(h.id, draft);
    setSaving(false);
    if (!res.ok) return setErr(res.error);
    setErr(null);
    setEditing(false);
    toast("Notes saved.");
  }

  async function toggleListed() {
    setListedBusy(true);
    const res = await listedAction(h.id, !h.listed);
    setListedBusy(false);
    if (!res.ok) return toast(res.error, { tone: "error" });
    toast(!h.listed ? "Marked as listed. Next step: sell it." : "Moved back to not listed.");
  }

  return (
    <article className="hold" aria-label={h.title}>
      <div className="hold-top">
        <ProductImage kind={h.thumb} photoUrl={h.photoUrl} size={96} />
        <div className="min-w-0">
          <h3>{h.title}</h3>
          <div className="meta">
            Paid {money(h.buyCents)} · bought{" "}
            {h.daysHeld <= 0 ? "today" : h.daysHeld === 1 ? "yesterday" : `${h.daysHeld} days ago`}
          </div>
          {editing ? (
            <form onSubmit={saveNotes} className="mt-2 flex flex-col gap-2">
              <label htmlFor={notesId} className="text-[14px] font-semibold text-t2">
                Condition notes
              </label>
              <textarea
                id={notesId}
                value={draft}
                maxLength={NOTES_MAX + 50}
                className={err ? "err" : ""}
                aria-invalid={!!err || undefined}
                aria-describedby={err ? notesId + "-err" : notesId + "-help"}
                placeholder="Does it work? Any scratches? Battery OK?"
                onChange={(e) => {
                  setDraft(e.target.value);
                  if (err) setErr(null);
                }}
                autoFocus
              />
              {err ? (
                <FieldError id={notesId + "-err"}>{err}</FieldError>
              ) : (
                <span id={notesId + "-help"} className="cap">
                  Buyers ask about this. {NOTES_MAX - draft.trim().length} letters left.
                </span>
              )}
              <div className="flex gap-2">
                <Button type="submit" variant="secondary" size="sm" disabled={saving}>
                  Save notes
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="shadow-none bg-transparent text-t2"
                  onClick={() => {
                    setDraft(h.notes);
                    setErr(null);
                    setEditing(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <>
              <p className="note">{h.notes || "No notes yet. Check how it works and write down anything a buyer would ask."}</p>
              <button type="button" className="note-edit" onClick={() => setEditing(true)}>
                {h.notes ? "Edit notes" : "Add notes"}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="spread">
        <div className="pb">
          <span className="pb-l">You paid</span>
          <span className="num">{money(h.buyCents)}</span>
        </div>
        <span className="sp-arrow">
          <ArrowIcon />
        </span>
        <div className="pb sell">
          <span className="pb-l">Usually sells for</span>
          <span className="num">{money(h.estSellCents)}</span>
        </div>
      </div>
      <div className="pot">
        <span className="lbl">could make</span>
        <span className={"num proj" + (potential < 0 ? " neg" : "")}>{signed(potential)}</span>
        <span className="cap">
          if it sells for {money(h.estSellCents)}
          {h.estFeesCents ? ` after ${money(h.estFeesCents)} fees` : ""}
        </span>
      </div>
      <ol className="track" aria-label="Progress">
        <li className="on">
          <span className="st" />
          Bought
        </li>
        <li className={h.listed ? "on" : ""}>
          <span className="st" />
          Listed
        </li>
        <li>
          <span className="st" />
          Sold
        </li>
      </ol>
      <div className="acts">
        <Button variant="secondary" aria-pressed={h.listed} onClick={toggleListed} disabled={listedBusy}>
          {h.listed ? (
            <>
              <CheckIcon /> Listed
            </>
          ) : (
            "Mark as listed"
          )}
        </Button>
        <Button onClick={onSell}>Sell</Button>
      </div>
    </article>
  );
}
