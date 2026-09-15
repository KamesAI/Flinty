import { Bot, CalendarCheck, Check, Eye, Inbox, LineChart, Minus, Target, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  COMPARISON_COMPETITORS,
  COMPARISON_DISCLAIMER,
  COMPARISON_ROWS,
  type ComparisonCell,
} from "@/lib/marketing-content";
import { Reveal } from "@/components/marketing/Reveal";
import { SectionBadge } from "@/components/marketing/SectionBadge";

const ROW_ICONS: Record<string, LucideIcon> = {
  setter: Bot,
  scoring: Target,
  booking: CalendarCheck,
  validation: Eye,
  inbox: Inbox,
  cost: LineChart,
};

function CompetitorStatus({ value }: { value: ComparisonCell }) {
  if (value === "yes") return <Check className="h-3 w-3 text-primary" />;
  if (value === "partial") return <Minus className="h-3 w-3 text-warning" />;
  return <X className="h-3 w-3 text-muted-foreground/50" />;
}

export function ComparisonSection() {
  return (
    <section className="border-y border-border bg-secondary/40">
      <div className="container py-20">
        <Reveal className="mx-auto mb-12 max-w-2xl text-center">
          <SectionBadge>Flinty vs les alternatives</SectionBadge>
          <h2 className="mt-5 font-flinty text-3xl text-foreground sm:text-4xl">
            Pourquoi Flinty va plus loin que les outils d&apos;outreach.
          </h2>
          <p className="mt-4 text-muted-foreground">
            La plupart des outils s&apos;arrêtent au message envoyé. Flinty mène la conversation
            jusqu&apos;au rendez-vous booké, AI Setter inclus.
          </p>
        </Reveal>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {COMPARISON_ROWS.map((row, index) => {
            const Icon = ROW_ICONS[row.id] ?? Check;
            return (
              <Reveal key={row.id} delay={index * 0.08} className="h-full">
                <div className="card-premium flex h-full flex-col p-6">
                  <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </span>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">{row.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{row.description}</p>
                  <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1.5 border-t border-border pt-4">
                    {COMPARISON_COMPETITORS.map((competitor) => (
                      <span
                        key={competitor.id}
                        title={row.competitorNotes?.[competitor.id]}
                        className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground"
                      >
                        <CompetitorStatus value={row.competitors[competitor.id]} />
                        {competitor.name}
                      </span>
                    ))}
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

        <Reveal>
          <p className="mt-6 text-xs text-muted-foreground">{COMPARISON_DISCLAIMER}</p>
        </Reveal>
      </div>
    </section>
  );
}
