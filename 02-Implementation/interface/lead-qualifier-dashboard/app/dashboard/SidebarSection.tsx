"use client";
import { useState } from "react";
import Link from "next/link";

interface Campaign {
  campaign_id: string;
  nom: string;
  statut: string;
}

const STATUS_DOT: Record<string, string> = {
  active:     "bg-green-500",
  generating: "bg-green-500",
  scheduled:  "bg-yellow-500",
  paused:     "bg-zinc-500",
};

export function SidebarSection({
  title,
  campaigns,
  defaultOpen = true,
}: {
  title: string;
  campaigns: Campaign[];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full px-2 mb-1 group"
      >
        <span className="text-sm text-zinc-300 group-hover:text-white transition-colors">
          {title}
        </span>
        <span className="text-zinc-700 group-hover:text-zinc-500 text-xs transition-colors">
          {open ? "▾" : "▸"}
        </span>
      </button>
      {open && (
        <div className="space-y-0.5">
          {campaigns.map((c) => (
            <Link
              key={c.campaign_id}
              href={`/dashboard/campaigns/${c.campaign_id}`}
              className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-zinc-900 transition-colors group"
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[c.statut] ?? "bg-zinc-500"}`} />
              <span className="text-zinc-400 group-hover:text-white text-xs truncate">{c.nom}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
