import { CalendarCheck, Mail, MessageSquare, TrendingUp } from "lucide-react";

const KPIS = [
  { icon: TrendingUp, label: "Taux de réponse", value: "51 %" },
  { icon: CalendarCheck, label: "RDV bookés ce mois", value: "12" },
  { icon: MessageSquare, label: "Conversations actives", value: "34" },
];

const KANBAN = [
  { title: "En discussion", tone: "bg-primary/10 text-primary", cards: ["Marc — Agence SEO", "Léa — Cabinet RH"] },
  { title: "Créneau proposé", tone: "bg-warning/15 text-warning", cards: ["Sophie — SaaS RH"] },
  { title: "RDV booké", tone: "bg-success/15 text-success", cards: ["Jules — E-commerce", "Nina — Formation"] },
];

export function HeroMockup() {
  return (
    <div className="card-premium mx-auto w-full max-w-2xl p-4 sm:p-6" aria-hidden="true">
      <div className="mb-4 flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
        <span className="ml-3 text-xs text-muted-foreground">app.flinty.fr — Campagne « Agences B2B »</span>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-3">
        {KPIS.map((kpi) => (
          <div key={kpi.label} className="rounded-lg border border-border bg-card p-3">
            <kpi.icon className="mb-1.5 h-4 w-4 text-primary" />
            <p className="text-lg font-bold tabular-nums text-foreground">{kpi.value}</p>
            <p className="text-[11px] leading-tight text-muted-foreground">{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {KANBAN.map((col) => (
          <div key={col.title} className="rounded-lg bg-muted/60 p-2.5">
            <span className={`mb-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${col.tone}`}>
              {col.title}
            </span>
            <div className="space-y-2">
              {col.cards.map((card) => (
                <div key={card} className="rounded-md border border-border bg-card p-2 text-[11px] text-foreground shadow-sm">
                  <Mail className="mb-1 h-3 w-3 text-muted-foreground" />
                  {card}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
