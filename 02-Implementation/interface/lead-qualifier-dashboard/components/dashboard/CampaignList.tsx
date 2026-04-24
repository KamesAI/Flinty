"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/components/lib/utils";

export type CampaignRowStatus = "active" | "inactive" | "paused" | "completed";

export interface CampaignRowProps {
  href: string;
  name: string;
  subtitle: string;
  status: CampaignRowStatus;
  stats: { raw: number; qualified: number; contacted: number; replies: number };
  openRate: number;
  replyRate: number;
  isGenerating: boolean;
}

const statusStyles: Record<CampaignRowStatus | "generating", string> = {
  active: "border-success/30 bg-success/10 text-success",
  paused: "border-muted-foreground/20 bg-muted text-muted-foreground",
  completed: "border-muted-foreground/20 bg-muted text-muted-foreground",
  inactive: "border-muted-foreground/20 bg-muted text-muted-foreground",
  generating: "border-primary/30 bg-primary/10 text-primary",
};

function Bar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="h-full rounded-full bg-gradient-primary"
      />
    </div>
  );
}

interface CampaignListProps {
  campaigns: CampaignRowProps[];
}

export function CampaignList({ campaigns }: CampaignListProps) {
  const maxRaw = Math.max(...campaigns.map((c) => c.stats.raw), 1);
  const statusKey = (c: CampaignRowProps): keyof typeof statusStyles =>
    c.isGenerating ? "generating" : c.status;

  return (
    <section className="card-premium overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-6 py-5">
        <div>
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
            Main campaigns
          </div>
          <h2 className="text-lg font-semibold tracking-tight text-primary">Pipeline overview</h2>
        </div>
        <Link
          href="/dashboard/campaigns"
          className="group flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          View all
          <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <div className="px-6 py-10 text-center text-sm text-muted-foreground">
          Aucune campagne active.
        </div>
      ) : (
        <div className="divide-y divide-border">
          {campaigns.map((c, i) => (
            <motion.div
              key={c.href}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.15 + i * 0.05 }}
              whileHover={{ backgroundColor: "hsl(var(--card-elevated))" }}
              className="group cursor-pointer px-6 py-5 transition-colors"
            >
              <Link href={c.href} className="block">
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-sm font-semibold text-foreground">{c.name}</h3>
                      <Badge variant="outline" className={cn("text-[10px]", statusStyles[statusKey(c)])}>
                        {c.isGenerating && (
                          <span className="mr-1 size-1.5 animate-pulse rounded-full bg-current" />
                        )}
                        {c.isGenerating ? "generating" : c.status}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{c.subtitle}</p>
                  </div>
                  <ArrowUpRight className="size-4 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 group-hover:text-primary" />
                </div>

                <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
                  {[
                    { label: "Raw", value: c.stats.raw, accent: false },
                    { label: "Qualified", value: c.stats.qualified, accent: false },
                    { label: "Contacted", value: c.stats.contacted, accent: false },
                    { label: "Replies", value: c.stats.replies, accent: true },
                    { label: "Open rate", value: c.openRate, suffix: "%", accent: false },
                    { label: "Reply rate", value: c.replyRate, suffix: "%", accent: true },
                  ].map((m) => (
                    <div key={m.label}>
                      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        {m.label}
                      </div>
                      <div
                        className={cn(
                          "mt-1 text-base font-semibold tabular-nums",
                          m.accent && m.value > 0 ? "text-primary" : "text-foreground"
                        )}
                      >
                        {m.value}{m.suffix}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <Bar value={c.stats.qualified} max={maxRaw} />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}
