"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function CampaignTabNav({ campaignId }: { campaignId: string }) {
  const pathname = usePathname();
  const leadsHref = `/dashboard/campaigns/${campaignId}`;
  const kanbanHref = `/dashboard/campaigns/${campaignId}/kanban`;

  const tabs = [
    { label: "Leads", href: leadsHref, active: !pathname.endsWith("/kanban") },
    { label: "Kanban", href: kanbanHref, active: pathname.endsWith("/kanban") },
  ];

  return (
    <div className="mb-6 flex gap-1 border-b border-zinc-800">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={[
            "px-4 py-2 text-sm font-medium transition-colors",
            tab.active
              ? "border-b-2 border-[#059669] text-[#059669] -mb-px"
              : "text-zinc-500 hover:text-white",
          ].join(" ")}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
