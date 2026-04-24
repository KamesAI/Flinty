"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Table2 } from "lucide-react";
import { cn } from "@/components/lib/utils";

const tabs = [
  { href: "/dashboard/campaigns/overview",       label: "Overview",       icon: LayoutGrid },
  { href: "/dashboard/campaigns/suivi-detaille", label: "Suivi détaillé", icon: Table2 },
];

export function CampaignsSubNav() {
  const pathname = usePathname() ?? "";

  return (
    <div
      data-testid="campaigns-subnav"
      className="mb-6 flex items-center gap-1 rounded-[12px] border border-slate-200 bg-white/70 p-1 w-fit shadow-[0_1px_3px_rgba(15,23,42,0.04)]"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-[9px] px-3 py-1.5 text-[13px] font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-slate-100 hover:text-foreground"
            )}
          >
            <Icon className="size-[14px]" strokeWidth={2.1} />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
