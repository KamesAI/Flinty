"use client";

import { useState, useTransition } from "react";
import { CheckCircle2 } from "lucide-react";

export function WarmupPositiveButton({
  leadId,
  turnId,
  alreadyTagged,
}: {
  leadId: string;
  turnId: string;
  alreadyTagged: boolean;
}) {
  const [done, setDone] = useState(alreadyTagged);
  const [isPending, startTransition] = useTransition();

  function markPositive() {
    startTransition(async () => {
      const res = await fetch(`/api/replies/${leadId}/warmup-positive`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ turn_id: turnId }),
      });
      if (res.ok) setDone(true);
    });
  }

  return (
    <button
      type="button"
      onClick={markPositive}
      disabled={isPending || done}
      className="inline-flex h-9 items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100 disabled:opacity-60"
    >
      <CheckCircle2 className="size-4" />
      {done ? "Reply positive taggée" : "Marquer reply positive"}
    </button>
  );
}
