"use client";

import { useState } from "react";
import { SidebarSection } from "./SidebarSection";

interface Campaign {
  campaign_id: string;
  nom: string;
  statut: string;
}

export function SidebarCampaignsGroup({
  activeCampaigns,
  otherCampaigns,
}: {
  activeCampaigns: Campaign[];
  otherCampaigns: Campaign[];
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="flex-1 overflow-y-auto p-3">
      <button
        onClick={() => setOpen((current) => !current)}
        className="group flex items-center justify-between w-full px-3 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-900 text-sm transition-colors"
      >
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full shrink-0 bg-orange-500" />
          Campagnes
        </span>
        <span className="text-zinc-700 group-hover:text-zinc-500 text-xs transition-colors">
          {open ? "▾" : "▸"}
        </span>
      </button>

      {open && (
        <div className="mt-3 pl-3">
          {activeCampaigns.length > 0 && (
            <SidebarSection
              title="Actives"
              campaigns={activeCampaigns}
              defaultOpen={true}
            />
          )}
          {otherCampaigns.length > 0 && (
            <SidebarSection
              title="Archivées"
              campaigns={otherCampaigns}
              defaultOpen={false}
            />
          )}
        </div>
      )}
    </div>
  );
}
