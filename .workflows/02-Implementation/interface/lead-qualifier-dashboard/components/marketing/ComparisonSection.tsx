import { Check, Minus, X } from "lucide-react";

import {
  COMPARISON_COMPETITORS,
  COMPARISON_DISCLAIMER,
  COMPARISON_ROWS,
  type ComparisonCell,
} from "@/lib/marketing-content";
import { Reveal } from "@/components/marketing/Reveal";
import { SectionBadge } from "@/components/marketing/SectionBadge";

function CellIcon({ value, note }: { value: ComparisonCell; note?: string }) {
  if (value === "yes") {
    return (
      <span className="mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
        <Check className="h-3.5 w-3.5 text-primary" />
      </span>
    );
  }
  if (value === "partial") {
    return (
      <span className="inline-flex flex-col items-center gap-0.5">
        <span className="flex items-center gap-1 text-xs font-medium text-warning">
          <Minus className="h-3.5 w-3.5" />
          Partiel
        </span>
        {note && <span className="text-[11px] leading-tight text-muted-foreground">{note}</span>}
      </span>
    );
  }
  return <X className="mx-auto h-4 w-4 text-muted-foreground/50" />;
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

        <Reveal>
          <div className="card-premium overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="p-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Fonctionnalité
                  </th>
                  <th className="bg-primary/5 p-4 text-center text-xs font-semibold uppercase tracking-wider text-primary">
                    Flinty
                  </th>
                  {COMPARISON_COMPETITORS.map((competitor) => (
                    <th
                      key={competitor.id}
                      className="p-4 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground"
                    >
                      {competitor.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.id} className="border-b border-border last:border-0">
                    <td className="p-4 text-foreground">{row.feature}</td>
                    <td className="bg-primary/5 p-4 text-center">
                      <span className="inline-flex flex-col items-center gap-1">
                        <CellIcon value="yes" />
                        <span className="text-[11px] leading-tight text-muted-foreground">
                          {row.flintyNote}
                        </span>
                      </span>
                    </td>
                    {COMPARISON_COMPETITORS.map((competitor) => (
                      <td key={competitor.id} className="p-4 text-center">
                        <CellIcon
                          value={row.competitors[competitor.id]}
                          note={row.competitorNotes?.[competitor.id]}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">{COMPARISON_DISCLAIMER}</p>
        </Reveal>
      </div>
    </section>
  );
}
