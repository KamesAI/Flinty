import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  LineChart,
  Mail,
  Megaphone,
  Minus,
  Target,
  Users,
} from "lucide-react";
import {
  buildDataDashboardModel,
  type AnalyticsPeriod,
  type AnalyticsStatusGroup,
} from "../../../lib/analytics";
import {
  getAnalyticsDailySnapshots,
  getMeetings,
  getSheetData,
  parseCampaigns,
  parseLeads,
  type Campaign,
} from "../../../lib/sheets";

type DataTab = "business" | "marketing" | "commercial";
type TrendTone = "up" | "down" | "neutral";
type StatusTone = "success" | "warning" | "neutral" | "danger";

type TrendMeta = {
  value: string;
  label: string;
  tone: TrendTone;
};

type StatusMeta = {
  label: string;
  tone: StatusTone;
};

const PERIOD_OPTIONS: Array<{ value: AnalyticsPeriod; label: string }> = [
  { value: "7d", label: "7 jours" },
  { value: "30d", label: "30 jours" },
  { value: "90d", label: "90 jours" },
  { value: "all", label: "Tout" },
];

const STATUS_OPTIONS: Array<{ value: AnalyticsStatusGroup; label: string }> = [
  { value: "all", label: "Toutes" },
  { value: "active", label: "Actives" },
  { value: "archived", label: "Archivées" },
];

const TAB_OPTIONS: Array<{
  value: DataTab;
  label: string;
  title: string;
  description: string;
  icon: typeof BriefcaseBusiness;
}> = [
  {
    value: "business",
    label: "Business",
    title: "Vue business",
    description: "Pilotage du volume, du rendement et du portefeuille de campagnes.",
    icon: BriefcaseBusiness,
  },
  {
    value: "marketing",
    label: "Marketing",
    title: "Vue marketing",
    description: "Performance d'ouverture, réponses, templates et segments actifs.",
    icon: Megaphone,
  },
  {
    value: "commercial",
    label: "Commercial",
    title: "Vue commerciale",
    description: "Priorités de suivi, réponses à traiter et rendez-vous à convertir.",
    icon: LineChart,
  },
];

const KPI_TRENDS = {
  campaigns: { value: "+12%", label: "vs mois dernier", tone: "up" },
  qualifiedLeads: { value: "+18.4%", label: "pipeline qualifié", tone: "up" },
  replyRate: { value: "+6.8%", label: "sur la période glissante", tone: "up" },
  bookingRate: { value: "-2.4%", label: "vs mois dernier", tone: "down" },
} as const satisfies Record<string, TrendMeta>;

function getAnalyticsKpiTrendMap() {
  return KPI_TRENDS;
}

function getAnalyticsStatusMeta(status: Campaign["statut"] | string): StatusMeta {
  switch (status) {
    case "active":
      return { label: "Actif", tone: "success" };
    case "generating":
      return { label: "Generating", tone: "warning" };
    case "scheduled":
      return { label: "Scheduled", tone: "neutral" };
    case "paused":
      return { label: "Pause", tone: "danger" };
    case "completed":
      return { label: "Completed", tone: "neutral" };
    case "archived":
      return { label: "Archive", tone: "neutral" };
    default:
      return { label: status, tone: "neutral" };
  }
}

function getProgressValue(value: number) {
  return Math.max(0, Math.min(100, value));
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("fr-FR").format(value);
}

function formatPercent(value: number) {
  return `${value}%`;
}

function getTrendClasses(tone: TrendTone) {
  if (tone === "up") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (tone === "down") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  return "border-slate-200 bg-slate-100 text-slate-600";
}

function getStatusClasses(tone: StatusTone) {
  if (tone === "success") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (tone === "warning") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  if (tone === "danger") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  return "border-slate-200 bg-slate-100 text-slate-600";
}

function buildParams(current: {
  tab: DataTab;
  period: AnalyticsPeriod;
  statusGroup: AnalyticsStatusGroup;
  campaignId?: string;
}) {
  const params = new URLSearchParams();
  params.set("tab", current.tab);
  params.set("period", current.period);
  params.set("status_group", current.statusGroup);
  if (current.campaignId) {
    params.set("campaign_id", current.campaignId);
  }
  return params.toString();
}

function ToolbarSelect({
  label,
  name,
  defaultValue,
  children,
}: {
  label: string;
  name: string;
  defaultValue: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-medium uppercase tracking-[0.24em] text-slate-500">
        {label}
      </span>
      <div className="relative">
        <select
          name={name}
          defaultValue={defaultValue}
          className="h-11 w-full appearance-none rounded-xl border border-slate-200/80 bg-white/90 px-4 pr-10 text-sm font-medium text-slate-700 shadow-[0_2px_8px_rgba(15,23,42,0.04)] outline-none transition focus:border-slate-300"
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>
    </label>
  );
}

function TrendBadge({ trend }: { trend: TrendMeta }) {
  const Icon = trend.tone === "up" ? ArrowUpRight : trend.tone === "down" ? ArrowDownRight : Minus;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium ${getTrendClasses(
        trend.tone
      )}`}
    >
      <Icon className="h-3 w-3" />
      {trend.value}
      <span className="opacity-80">{trend.label}</span>
    </span>
  );
}

function PremiumKpiCard({
  icon: Icon,
  label,
  value,
  trend,
  helper,
  caption,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  trend: TrendMeta;
  helper: string;
  caption: string;
}) {
  return (
    <article className="rounded-[24px] border border-slate-200/70 bg-white/90 p-5 shadow-[0_2px_12px_rgba(15,23,42,0.05)] backdrop-blur-sm">
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700">
          <Icon className="h-4 w-4" />
        </span>
        <TrendBadge trend={trend} />
      </div>
      <div className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-orange-400">{label}</p>
        <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
        <p className="mt-2 text-sm font-medium text-slate-600">{helper}</p>
        <p className="mt-1 text-sm text-slate-500">{caption}</p>
      </div>
    </article>
  );
}

function StatusBadge({ status }: { status: Campaign["statut"] | string }) {
  const meta = getAnalyticsStatusMeta(status);

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusClasses(
        meta.tone
      )}`}
    >
      {meta.label}
    </span>
  );
}

function ProgressMetric({
  value,
  detail,
  tone = "slate",
}: {
  value: number;
  detail: string;
  tone?: "slate" | "emerald" | "violet";
}) {
  const progress = getProgressValue(value);
  const fillClass =
    tone === "emerald"
      ? "bg-emerald-500"
      : tone === "violet"
        ? "bg-violet-500"
        : "bg-slate-900";

  return (
    <div className="min-w-[140px]">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-slate-900">{formatPercent(value)}</span>
        <span className="text-xs text-slate-500">{detail}</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-slate-100">
        <div className={`h-2 rounded-full ${fillClass}`} style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-slate-200/70 bg-white/90 p-6 shadow-[0_2px_12px_rgba(15,23,42,0.05)] backdrop-blur-sm">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-orange-400">{title}</p>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

type DataModel = ReturnType<typeof buildDataDashboardModel>;

function BusinessTable({ model }: { model: DataModel }) {
  return (
    <SectionCard
      title="Vue business"
      description="Classement des campagnes, qualité du pipe et rendement global sur la période."
    >
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="bg-slate-50/80 text-left text-[11px] uppercase tracking-[0.22em] text-slate-500">
              <th className="rounded-l-2xl px-4 py-3 font-medium">Campagne</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 font-medium">Leads</th>
              <th className="px-4 py-3 font-medium">Emails</th>
              <th className="px-4 py-3 font-medium">Réponse</th>
              <th className="rounded-r-2xl px-4 py-3 font-medium">Booking</th>
            </tr>
          </thead>
          <tbody>
            {model.businessRows.map((row) => (
              <tr key={row.campaignId} className="group">
                <td className="border-b border-slate-100 px-4 py-4 transition group-hover:bg-slate-50/70">
                  <div>
                    <p className="font-medium text-slate-900">{row.campaignName}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatNumber(row.rawLeads)} raw · {formatNumber(row.qualifiedLeads)} qualifiés
                    </p>
                  </div>
                </td>
                <td className="border-b border-slate-100 px-4 py-4 transition group-hover:bg-slate-50/70">
                  <StatusBadge status={row.status} />
                </td>
                <td className="border-b border-slate-100 px-4 py-4 transition group-hover:bg-slate-50/70">
                  <div>
                    <p className="font-medium text-slate-900">{formatNumber(row.qualifiedLeads)}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      sur {formatNumber(row.rawLeads)} leads source
                    </p>
                  </div>
                </td>
                <td className="border-b border-slate-100 px-4 py-4 transition group-hover:bg-slate-50/70">
                  <p className="font-medium text-slate-900">{formatNumber(row.emailsSent)}</p>
                </td>
                <td className="border-b border-slate-100 px-4 py-4 transition group-hover:bg-slate-50/70">
                  <ProgressMetric value={row.replyRate} detail="reply rate" tone="emerald" />
                </td>
                <td className="border-b border-slate-100 px-4 py-4 transition group-hover:bg-slate-50/70">
                  <ProgressMetric value={row.bookingRate} detail="booking rate" tone="violet" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

function MarketingView({ model }: { model: DataModel }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.6fr)]">
        <SectionCard
          title="Performance par campagne"
          description="Lecture marketing des ouvertures, réponses et bookings par campagne."
        >
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-sm">
              <thead>
                <tr className="bg-slate-50/80 text-left text-[11px] uppercase tracking-[0.22em] text-slate-500">
                  <th className="rounded-l-2xl px-4 py-3 font-medium">Campagne</th>
                  <th className="px-4 py-3 font-medium">Ouverture</th>
                  <th className="px-4 py-3 font-medium">Réponse</th>
                  <th className="rounded-r-2xl px-4 py-3 font-medium">Booking</th>
                </tr>
              </thead>
              <tbody>
                {model.marketingRows.map((row) => (
                  <tr key={row.campaignId} className="group">
                    <td className="border-b border-slate-100 px-4 py-4 transition group-hover:bg-slate-50/70">
                      <p className="font-medium text-slate-900">{row.campaignName}</p>
                    </td>
                    <td className="border-b border-slate-100 px-4 py-4 transition group-hover:bg-slate-50/70">
                      <ProgressMetric value={row.openRate} detail="open rate" />
                    </td>
                    <td className="border-b border-slate-100 px-4 py-4 transition group-hover:bg-slate-50/70">
                      <ProgressMetric value={row.replyRate} detail="reply rate" tone="emerald" />
                    </td>
                    <td className="border-b border-slate-100 px-4 py-4 transition group-hover:bg-slate-50/70">
                      <ProgressMetric value={row.bookingRate} detail="booking rate" tone="violet" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard
          title="Top templates"
          description="Tendances visuelles mockées, scores basés sur les snapshots disponibles."
        >
          {model.topTemplates.length > 0 ? (
            <div className="space-y-3">
              {model.topTemplates.map((template, index) => (
                <div
                  key={template.templateKey}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/70 bg-slate-50/70 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">{template.templateKey}</p>
                    <p className="mt-1 text-xs text-slate-500">Template #{index + 1} sur la période</p>
                  </div>
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                    {template.replies} replies
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-8 text-sm text-slate-500">
              Aucun template exploitable pour l'instant sur ce scope.
            </div>
          )}
        </SectionCard>
      </div>

      <SectionCard
        title="Performance par segment"
        description="Segment principal calculé à partir du secteur des leads qualifiés."
      >
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="bg-slate-50/80 text-left text-[11px] uppercase tracking-[0.22em] text-slate-500">
                <th className="rounded-l-2xl px-4 py-3 font-medium">Segment</th>
                <th className="px-4 py-3 font-medium">Leads qualifiés</th>
                <th className="px-4 py-3 font-medium">Replies</th>
                <th className="rounded-r-2xl px-4 py-3 font-medium">Meetings</th>
              </tr>
            </thead>
            <tbody>
              {model.segmentRows.map((row) => (
                <tr key={row.segment} className="group">
                  <td className="border-b border-slate-100 px-4 py-4 transition group-hover:bg-slate-50/70">
                    <p className="font-medium text-slate-900">{row.segment}</p>
                  </td>
                  <td className="border-b border-slate-100 px-4 py-4 transition group-hover:bg-slate-50/70 text-slate-700">
                    {formatNumber(row.qualifiedLeads)}
                  </td>
                  <td className="border-b border-slate-100 px-4 py-4 transition group-hover:bg-slate-50/70 text-slate-700">
                    {formatNumber(row.replies)}
                  </td>
                  <td className="border-b border-slate-100 px-4 py-4 transition group-hover:bg-slate-50/70 text-slate-700">
                    {formatNumber(row.meetings)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}

function CommercialView({ model }: { model: DataModel }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <PremiumKpiCard
          icon={Mail}
          label="Réponses à traiter"
          value={formatNumber(model.globalKpis.repliesPending)}
          trend={{ value: "+9%", label: "vs semaine passée", tone: "up" }}
          helper="Actions commerciales prioritaires"
          caption="Leads replied ou clicked à relancer rapidement."
        />
        <PremiumKpiCard
          icon={CalendarDays}
          label="Meetings à venir"
          value={formatNumber(model.globalKpis.upcomingMeetings)}
          trend={{ value: "+4.1%", label: "cadence de booking", tone: "up" }}
          helper="Rendez-vous confirmés"
          caption="Volume planifié sur le scope actif de la page."
        />
        <PremiumKpiCard
          icon={Target}
          label="Taux d'ouverture"
          value={formatPercent(model.globalKpis.openRate)}
          trend={{ value: "-1.2%", label: "attention deliverability", tone: "down" }}
          helper="Signal de traction haut de funnel"
          caption="Bon proxy pour surveiller la qualité du ciblage et des envois."
        />
      </div>

      <SectionCard
        title="Priorités commerciales"
        description="Campagnes à traiter selon le volume de réponses en attente et les meetings à venir."
      >
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="bg-slate-50/80 text-left text-[11px] uppercase tracking-[0.22em] text-slate-500">
                <th className="rounded-l-2xl px-4 py-3 font-medium">Campagne</th>
                <th className="px-4 py-3 font-medium">Réponses en attente</th>
                <th className="px-4 py-3 font-medium">Meetings</th>
                <th className="rounded-r-2xl px-4 py-3 font-medium">Leads replied</th>
              </tr>
            </thead>
            <tbody>
              {model.commercialRows.map((row) => (
                <tr key={row.campaignId} className="group">
                  <td className="border-b border-slate-100 px-4 py-4 transition group-hover:bg-slate-50/70">
                    <p className="font-medium text-slate-900">{row.campaignName}</p>
                  </td>
                  <td className="border-b border-slate-100 px-4 py-4 transition group-hover:bg-slate-50/70 text-slate-700">
                    {formatNumber(row.pendingReplies)}
                  </td>
                  <td className="border-b border-slate-100 px-4 py-4 transition group-hover:bg-slate-50/70 text-slate-700">
                    {formatNumber(row.upcomingMeetings)}
                  </td>
                  <td className="border-b border-slate-100 px-4 py-4 transition group-hover:bg-slate-50/70 text-slate-700">
                    {formatNumber(row.repliedLeads)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}

export default async function DataPage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string;
    period?: string;
    status_group?: string;
    campaign_id?: string;
  }>;
}) {
  const params = await searchParams;
  const tab = (params.tab as DataTab | undefined) ?? "business";
  const period = (params.period as AnalyticsPeriod | undefined) ?? "30d";
  const statusGroup = (params.status_group as AnalyticsStatusGroup | undefined) ?? "all";
  const campaignId = params.campaign_id;

  let campaigns: Awaited<ReturnType<typeof parseCampaigns>> = [];
  let model: DataModel | null = null;
  let error = false;

  try {
    const [campaignRows, leadRows, meetings, snapshots] = await Promise.all([
      getSheetData("Campagnes!A:L"),
      getSheetData("Leads_Qualified!A:P"),
      getMeetings(),
      getAnalyticsDailySnapshots(),
    ]);

    campaigns = parseCampaigns(campaignRows);
    const leads = parseLeads(leadRows);
    model = buildDataDashboardModel({
      campaigns,
      leads,
      meetings,
      snapshots,
      selectedCampaignId: campaignId,
      statusGroup,
      period,
    });
  } catch {
    error = true;
  }

  const queryState = { tab, period, statusGroup, campaignId };
  const selectedTab = TAB_OPTIONS.find((option) => option.value === tab) ?? TAB_OPTIONS[0];
  const trends = getAnalyticsKpiTrendMap();

  return (
    <div className="relative min-h-full overflow-hidden bg-slate-50 px-6 py-8 text-slate-900 lg:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top_left,_rgba(191,219,254,0.45),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(221,214,254,0.35),_transparent_28%)]" />

      <div className="relative z-10 space-y-8">
        <div className="max-w-3xl">
          <div className="text-xs font-semibold uppercase tracking-widest text-orange-500">
            Données / Analytics
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 lg:text-[2rem]">
            Tour de contrôle analytique
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
            Lecture consolidée des axes business, marketing et commercial à partir de Google
            Sheets, des meetings et des snapshots analytics journaliers.
          </p>
        </div>

        <section className="rounded-[28px] border border-slate-200/70 bg-white/80 p-5 shadow-[0_2px_12px_rgba(15,23,42,0.05)] backdrop-blur-sm">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-orange-400">
                  Toolbar analytics
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Période, statut et campagne pour piloter la page sans casser le contexte live.
                </p>
              </div>
              <div className="inline-flex flex-wrap items-center gap-1 rounded-2xl border border-slate-200 bg-slate-100/80 p-1">
                {PERIOD_OPTIONS.map((option) => (
                  <Link
                    key={option.value}
                    href={`/dashboard/data?${buildParams({ ...queryState, period: option.value })}`}
                    className={`rounded-xl px-3.5 py-2 text-sm font-medium transition ${
                      period === option.value
                        ? "bg-white text-slate-900 shadow-[0_2px_6px_rgba(15,23,42,0.08)]"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    {option.label}
                  </Link>
                ))}
              </div>
            </div>

            <form method="GET" className="grid gap-4 md:grid-cols-3 xl:min-w-[720px]">
              <input type="hidden" name="tab" value={tab} />
              <input type="hidden" name="period" value={period} />
              <ToolbarSelect label="Statut" name="status_group" defaultValue={statusGroup}>
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </ToolbarSelect>
              <ToolbarSelect label="Campagne" name="campaign_id" defaultValue={campaignId ?? ""}>
                <option value="">Toutes les campagnes</option>
                {campaigns.map((campaign) => (
                  <option key={campaign.campaign_id} value={campaign.campaign_id}>
                    {campaign.nom}
                  </option>
                ))}
              </ToolbarSelect>
              <div className="flex items-end">
                <button type="submit" className="group relative inline-flex w-full items-center justify-center">
                  <span className="pointer-events-none absolute inset-x-5 inset-y-1.5 rounded-full bg-orange-500/30 blur-xl transition-opacity duration-300 group-hover:opacity-90" />
                  <span className="relative inline-flex w-full rounded-full bg-gradient-to-r from-orange-500 via-orange-400 to-white p-[1px]">
                    <span className="inline-flex h-11 w-full items-center justify-center rounded-full bg-black px-5 text-sm font-medium text-white transition-colors duration-300 group-hover:text-zinc-100">
                      Appliquer
                    </span>
                  </span>
                </button>
              </div>
            </form>
          </div>
        </section>

        <section className="border-b border-slate-200">
          <nav className="flex flex-wrap items-end gap-6">
            {TAB_OPTIONS.map((option) => {
              const Icon = option.icon;
              return (
                <Link
                  key={option.value}
                  href={`/dashboard/data?${buildParams({ ...queryState, tab: option.value })}`}
                  className={`group relative inline-flex items-center gap-2 pb-4 text-sm font-medium transition ${
                    tab === option.value ? "text-slate-900" : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {option.label}
                  <span
                    className={`absolute inset-x-0 bottom-0 h-0.5 rounded-full transition ${
                      tab === option.value ? "bg-slate-900" : "bg-transparent group-hover:bg-slate-300"
                    }`}
                  />
                </Link>
              );
            })}
          </nav>
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-orange-400">
              {selectedTab.title}
            </p>
            <p className="mt-1 text-sm text-slate-500">{selectedTab.description}</p>
          </div>
        </section>

        {error || !model ? (
          <div className="rounded-[28px] border border-slate-200/70 bg-white/90 p-6 shadow-[0_2px_12px_rgba(15,23,42,0.05)]">
            <p className="text-sm text-slate-600">
              Impossible de charger les KPIs depuis Google Sheets. La page reste accessible, mais
              aucune agrégation n'a pu être construite pour le moment.
            </p>
          </div>
        ) : (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <PremiumKpiCard
                icon={BriefcaseBusiness}
                label="Campagnes"
                value={formatNumber(model.globalKpis.totalCampaigns)}
                trend={trends.campaigns}
                helper={`${model.globalKpis.activeCampaigns} actives · ${model.globalKpis.archivedCampaigns} archivées`}
                caption="Vision portefeuille et activité globale de la machine commerciale."
              />
              <PremiumKpiCard
                icon={Users}
                label="Leads qualifiés"
                value={formatNumber(model.globalKpis.qualifiedLeads)}
                trend={trends.qualifiedLeads}
                helper={`${formatNumber(model.globalKpis.rawLeads)} leads raw dans le scope`}
                caption="Base la plus utile pour lire la qualité réelle du pipe généré."
              />
              <PremiumKpiCard
                icon={Mail}
                label="Réponse"
                value={formatPercent(model.globalKpis.replyRate)}
                trend={trends.replyRate}
                helper={`${formatNumber(model.globalKpis.repliesPending)} réponses / clics en attente`}
                caption="Mix entre intention entrante et qualité du message sortant."
              />
              <PremiumKpiCard
                icon={Target}
                label="Booking"
                value={formatPercent(model.globalKpis.bookingRate)}
                trend={trends.bookingRate}
                helper={`${formatNumber(model.globalKpis.upcomingMeetings)} rendez-vous planifiés`}
                caption="Conversion meeting du pipe email sur la période active."
              />
            </section>

            {tab === "business" ? <BusinessTable model={model} /> : null}
            {tab === "marketing" ? <MarketingView model={model} /> : null}
            {tab === "commercial" ? <CommercialView model={model} /> : null}
          </>
        )}
      </div>
    </div>
  );
}
