import React from "react";
import {
  ExternalLink,
  MailOpen,
  MessageSquare,
  Send,
  Users,
} from "lucide-react";
import { cn } from "@/components/lib/utils";

type CampaignStatus =
  | "active"
  | "generating"
  | "scheduled"
  | "paused"
  | "completed"
  | "archived"
  | "draft";

interface CampaignStatsHeaderProps {
  campaignId: string;
  name: string;
  subtitle: string;
  status: CampaignStatus;
  qualified: number;
  emailsSent: number;
  openRate: number;
  replyRate: number;
  sheetUrl?: string;
}

const statusConfig: Record<
  CampaignStatus,
  { label: string; classes: string }
> = {
  active:     { label: "Active",      classes: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  generating: { label: "Génération",  classes: "bg-primary/10 text-primary border-primary/25" },
  scheduled:  { label: "Planifiée",   classes: "bg-blue-50 text-blue-700 border-blue-200" },
  paused:     { label: "En pause",    classes: "bg-amber-50 text-amber-700 border-amber-200" },
  completed:  { label: "Terminée",    classes: "bg-slate-100 text-slate-700 border-slate-200" },
  archived:   { label: "Archivée",    classes: "bg-slate-100 text-slate-500 border-slate-200" },
  draft:      { label: "Brouillon",   classes: "bg-slate-100 text-slate-600 border-slate-200" },
};

export function CampaignStatsHeader({
  name,
  subtitle,
  status,
  qualified,
  emailsSent,
  openRate,
  replyRate,
  sheetUrl,
}: CampaignStatsHeaderProps) {
  const cfg = statusConfig[status] ?? statusConfig.draft;

  return (
    <div
      data-testid="campaign-stats-header"
      className="rounded-[18px] border border-slate-200 bg-white p-5 shadow-[0_2px_10px_rgba(15,23,42,0.04)]"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-flinty text-3xl font-extrabold tracking-tight text-slate-900">
              {name}
            </h1>
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                cfg.classes
              )}
            >
              {cfg.label}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        {sheetUrl ? (
          <a
            href={sheetUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-[34px] items-center gap-1.5 rounded-[10px] border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-900"
          >
            <ExternalLink className="size-3.5" />
            Ouvrir le Google Sheet
          </a>
        ) : null}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard
          icon={<Users className="size-4" />}
          label="Leads qualifiés"
          value={qualified.toString()}
        />
        <KpiCard
          icon={<Send className="size-4" />}
          label="Emails envoyés"
          value={emailsSent.toString()}
        />
        <KpiCard
          icon={<MailOpen className="size-4" />}
          label="Taux d'ouverture"
          value={`${openRate}`}
          suffix="%"
        />
        <KpiCard
          icon={<MessageSquare className="size-4" />}
          label="Taux de réponse"
          value={`${replyRate}`}
          suffix="%"
        />
      </div>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  suffix,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  suffix?: string;
}) {
  return (
    <div className="rounded-[14px] border border-slate-200 bg-slate-50/60 px-4 py-3">
      <div className="mb-1 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        <span className="text-primary">{icon}</span>
        {label}
      </div>
      <div className="font-flinty text-2xl font-extrabold tabular-nums text-slate-900">
        <span>{value}</span>
        {suffix ? (
          <span className="ml-0.5 text-base font-semibold text-muted-foreground">
            {suffix}
          </span>
        ) : null}
      </div>
    </div>
  );
}
