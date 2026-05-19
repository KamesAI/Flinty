"use client";

import { motion } from "framer-motion";
import { Flame, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HotLead {
  id: string;
  name: string;
  company: string;
  campaign: string;
  signal: "replied" | "clicked";
  hoursAgo: number;
}

const initials = (n: string) =>
  n.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

interface HotLeadsProps {
  leads?: HotLead[];
}

const defaultLeads: HotLead[] = [];

export function HotLeads({ leads = defaultLeads }: HotLeadsProps) {
  if (leads.length === 0) {
    return (
      <section className="card-premium p-6">
        <div className="mb-5 flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
            <Flame className="size-4" />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Hot leads</div>
            <h2 className="text-base font-semibold tracking-tight text-primary">Recent signals</h2>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">Aucun signal récent.</p>
      </section>
    );
  }

  return (
    <section className="card-premium p-6">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
            <Flame className="size-4" />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Hot leads</div>
            <h2 className="text-base font-semibold tracking-tight text-primary">Recent signals</h2>
          </div>
        </div>
        <button className="group flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-primary">
          All
          <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </button>
      </div>

      <ul className="space-y-1">
        {leads.map((l, i) => (
          <motion.li
            key={l.id}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 + i * 0.04 }}
            className="group flex items-center gap-3 rounded-lg p-2 -mx-2 transition-colors hover:bg-card-elevated"
          >
            <div className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-foreground">
              {initials(l.name)}
              <span
                className={`absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full ring-2 ring-card ${
                  l.signal === "replied" ? "bg-primary animate-pulse-glow" : "bg-muted-foreground"
                }`}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-semibold text-primary">{l.name}</span>
                <span className="text-[10px] text-muted-foreground">·</span>
                <span className="truncate text-xs text-muted-foreground">{l.company}</span>
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                <span>{l.signal === "replied" ? "Replied" : "Clicked"}</span>
                <span className="opacity-50">·</span>
                <span>{l.hoursAgo}h ago</span>
                <span className="opacity-50">·</span>
                <span className="truncate">{l.campaign}</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2.5 text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-primary/10 hover:text-primary"
            >
              View
            </Button>
          </motion.li>
        ))}
      </ul>
    </section>
  );
}
