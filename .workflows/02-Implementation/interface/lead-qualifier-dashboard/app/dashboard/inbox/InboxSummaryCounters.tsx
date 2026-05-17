"use client";

import { useEffect, useState } from "react";

type CountKey = "validate" | "reply" | "bookings";

interface InboxSummaryCountersProps {
  initialCounts: Record<CountKey, number>;
  campaignId?: string;
}

export function InboxSummaryCounters({ initialCounts, campaignId }: InboxSummaryCountersProps) {
  const [counts, setCounts] = useState(initialCounts);

  useEffect(() => {
    let cancelled = false;

    async function refreshCounts() {
      const params = new URLSearchParams();
      if (campaignId) params.set("campaign_id", campaignId);
      const response = await fetch(`/api/inbox/summary?${params.toString()}`, { cache: "no-store" });
      if (!response.ok) return;
      const payload = await response.json();
      if (cancelled) return;
      setCounts({
        validate: Number(payload.drafts_to_validate ?? payload.to_validate ?? initialCounts.validate),
        reply: Number(payload.to_reply ?? initialCounts.reply),
        bookings: Number(payload.bookings ?? initialCounts.bookings),
      });
    }

    const timer = window.setInterval(refreshCounts, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [campaignId, initialCounts.bookings, initialCounts.reply, initialCounts.validate]);

  return (
    <div
      className="grid grid-cols-3 gap-2 rounded-lg border border-border bg-white p-2 text-center shadow-sm"
      data-polling-interval="60000"
    >
      <div className="px-3 py-2">
        <p className="text-lg font-bold text-slate-950">{counts.validate}</p>
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Drafts</p>
      </div>
      <div className="border-x border-border px-3 py-2">
        <p className="text-lg font-bold text-slate-950">{counts.reply}</p>
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Manuel</p>
      </div>
      <div className="px-3 py-2">
        <p className="text-lg font-bold text-slate-950">{counts.bookings}</p>
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Bookings</p>
      </div>
    </div>
  );
}
