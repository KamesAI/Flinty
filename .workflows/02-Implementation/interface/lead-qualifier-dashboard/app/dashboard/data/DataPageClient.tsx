"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import {
  Users,
  Mail,
  Eye,
  MessageSquare,
  CalendarCheck,
  Bell,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Linkedin,
  DollarSign,
  Bot,
} from "lucide-react";
import type { CostMonitoringSummary } from "../../../lib/cost-monitoring";

const ACCENT = "hsl(var(--primary))";
const TRACK = "hsl(var(--border))";

type AnalyticsPeriod = "7d" | "30d" | "90d" | "all";

type CampaignStatus =
  | "active"
  | "paused"
  | "generating"
  | "scheduled"
  | "completed"
  | "archived";

interface CampaignRow {
  campaignId: string;
  campaignName: string;
  status: CampaignStatus;
  secteur: string;
  localisation: string;
  rawLeads: number;
  qualifiedLeads: number;
  emailsSent: number;
  openRate: number;
  replyRate: number;
  bookingRate: number;
  meetingRate?: number;
}

interface FunnelEmail {
  leadsSourced: number;
  leadsQualified: number;
  emailsSent: number;
  replies: number;
  meetings: number;
}

interface FunnelLI {
  profilesSourced: number;
  invited: number;
  accepted: number;
  dmSent: number;
  replied: number;
  meetings: number;
}

export interface DataPageClientProps {
  globalKpis: {
    totalCampaigns: number;
    activeCampaigns: number;
    rawLeads: number;
    qualifiedLeads: number;
    emailsSent: number;
    openRate: number;
    clickRate: number;
    replyRate: number;
    bookingRate: number;
    repliesPending: number;
    upcomingMeetings: number;
    // v4
    meetingRate?: number;
    setterResponseRate?: number;
    connectionRateLI?: number;
    costPerMeeting?: number;
    attributionRdv?: { email: number; linkedin: number; unknown: number };
  };
  campaignRows: CampaignRow[];
  topTemplates: Array<{ templateKey: string; replies: number }>;
  period: AnalyticsPeriod;
  funnelEmail?: FunnelEmail;
  funnelLI?: FunnelLI;
  costSummary?: CostMonitoringSummary | null;
}

function classify(metric: "open" | "reply" | "booking", value: number) {
  if (metric === "open") {
    if (value > 35) return "good";
    if (value >= 20) return "ok";
    return "bad";
  }
  if (metric === "reply") {
    if (value > 6) return "good";
    if (value >= 3) return "ok";
    return "bad";
  }
  if (value > 4) return "good";
  if (value >= 2) return "ok";
  return "bad";
}

const dotColor: Record<string, string> = {
  good: "#22C55E",
  ok: "hsl(var(--primary))",
  bad: "#EF4444",
};

function above(value: number, lower: number, upper: number) {
  if (value >= upper) return "au-dessus de";
  if (value < lower) return "sous";
  return "dans";
}

function CountUp({
  value,
  decimals = 0,
  suffix = "",
  duration = 1.2,
  className = "",
}: {
  value: number;
  decimals?: number;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => v.toFixed(decimals));
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    const controls = animate(mv, value, { duration, ease: "easeOut" });
    const unsub = rounded.on("change", (v) => setDisplay(v));
    return () => {
      controls.stop();
      unsub();
    };
  }, [value, duration, mv, rounded]);

  return (
    <span className={className}>
      {display}
      {suffix}
    </span>
  );
}

function Ring({ value, size = 56, stroke = 5 }: { value: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const offset = c - (pct / 100) * c;

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        style={{ stroke: TRACK, fill: "none" }}
        strokeWidth={stroke}
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        style={{ stroke: ACCENT, fill: "none" }}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />
    </svg>
  );
}

function HealthArc({ score }: { score: number }) {
  const size = 180;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score));
  const offset = c - (pct / 100) * c;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          style={{ stroke: TRACK, fill: "none" }}
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          style={{ stroke: ACCENT, fill: "none" }}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <CountUp value={score} className="text-4xl font-semibold text-primary tabular-nums" />
        <span className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">
          Health score
        </span>
      </div>
    </div>
  );
}

function Bar({
  value,
  max = 100,
  delay = 0,
  height = 6,
  triggerOnView = false,
}: {
  value: number;
  max?: number;
  delay?: number;
  height?: number;
  triggerOnView?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const shouldAnimate = triggerOnView ? inView : true;

  return (
    <div
      ref={ref}
      className="w-full rounded-full overflow-hidden"
      style={{ height, background: TRACK }}
    >
      <motion.div
        className="h-full rounded-full"
        style={{ background: ACCENT }}
        initial={{ width: 0 }}
        animate={shouldAnimate ? { width: `${pct}%` } : { width: 0 }}
        transition={{ duration: 1, ease: "easeOut", delay }}
      />
    </div>
  );
}

const PERIODS: Array<{ key: AnalyticsPeriod; label: string }> = [
  { key: "7d", label: "7j" },
  { key: "30d", label: "30j" },
  { key: "90d", label: "90j" },
  { key: "all", label: "Tout" },
];

export default function DataPageClient({
  globalKpis,
  campaignRows,
  topTemplates,
  period,
  funnelEmail,
  funnelLI,
  costSummary,
}: DataPageClientProps) {
  const {
    qualifiedLeads, emailsSent, openRate, replyRate, bookingRate, repliesPending, upcomingMeetings,
    meetingRate = 0, setterResponseRate = 0, connectionRateLI = 0, costPerMeeting = 0,
    attributionRdv = { email: 0, linkedin: 0, unknown: 0 },
  } = globalKpis;

  const subtitle = useMemo(() => {
    if (replyRate > 8) return "Vos campagnes performent au-dessus de la moyenne du secteur. Continuez.";
    if (replyRate < 3) return "Le taux de réponse est sous le seuil optimal. Revoyez vos objets email.";
    if (bookingRate > 5) return "Excellent taux de booking — votre closing est efficace.";
    return "Vue globale sur la période sélectionnée.";
  }, [replyRate, bookingRate]);

  const healthScore = useMemo(() => {
    const openN = Math.min(100, (openRate / 50) * 100);
    const replyN = Math.min(100, (replyRate / 10) * 100);
    const bookN = Math.min(100, (bookingRate / 6) * 100);
    return Math.round(openN * 0.4 + replyN * 0.4 + bookN * 0.2);
  }, [openRate, replyRate, bookingRate]);

  const kpis = [
    { icon: Users, label: "Leads qualifiés", value: qualifiedLeads, decimals: 0, suffix: "", ring: false, trend: 12 },
    { icon: Mail, label: "Emails envoyés", value: emailsSent, decimals: 0, suffix: "", ring: false, trend: 8 },
    { icon: Eye, label: "Taux d'ouverture", value: openRate, decimals: 1, suffix: "%", ring: true, trend: 4 },
    { icon: MessageSquare, label: "Taux de réponse", value: replyRate, decimals: 1, suffix: "%", ring: true, trend: -2 },
    { icon: CalendarCheck, label: "Taux de booking", value: bookingRate, decimals: 1, suffix: "%", ring: true, trend: 6 },
  ];

  const showActionBanner = repliesPending > 0 || upcomingMeetings > 0;

  /** La section Campagnes n’affiche pas les campagnes archivées (KPIs globaux inchangés). */
  const campaignRowsVisible = useMemo(
    () => campaignRows.filter((c) => c.status !== "archived"),
    [campaignRows]
  );

  return (
    <div className="px-6 py-8 lg:px-8 space-y-8">
      {/* ── 1. Header ── */}
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
      >
        <div>
          <h1 className="text-[28px] font-semibold leading-tight text-foreground">
            Analyse des campagnes
          </h1>
          <p className="mt-1 text-sm italic text-muted-foreground">{subtitle}</p>
        </div>

        <div className="flex items-center gap-1 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-1">
          {PERIODS.map((p) => {
            const active = p.key === period;
            return (
              <Link
                key={p.key}
                href={`/dashboard/data?period=${p.key}`}
                className={`rounded-full px-3.5 py-1.5 text-xs transition-all ${
                  active
                    ? "border border-primary/30 bg-primary/10 text-primary"
                    : "border border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {p.label}
              </Link>
            );
          })}
        </div>
      </motion.header>

      {/* ── 2. KPI strip ── */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {kpis.map((k, i) => {
          const Icon = k.icon;
          const trendPositive = k.trend > 0;
          const trendNegative = k.trend < 0;
          return (
            <motion.div
              key={k.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.05 }}
              whileHover={{ scale: 1.02 }}
              className="group rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 transition-colors hover:border-primary/20"
            >
              <div className="flex items-start justify-between">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Icon size={18} style={{ color: ACCENT }} />
                </div>
                {k.ring && <Ring value={k.value} />}
              </div>
              <div className="mt-3">
                <CountUp
                  value={k.value}
                  decimals={k.decimals}
                  suffix={k.suffix}
                  className="text-2xl font-semibold text-primary tabular-nums"
                />
                <div className="mt-1 text-[12px] text-muted-foreground">{k.label}</div>
                <div
                  className={`mt-2 inline-flex items-center gap-1 text-[11px] ${
                    trendPositive
                      ? "text-emerald-600"
                      : trendNegative
                        ? "text-red-500"
                        : "text-muted-foreground"
                  }`}
                >
                  {trendPositive ? <TrendingUp size={11} /> : trendNegative ? <TrendingDown size={11} /> : null}
                  {trendPositive ? "+" : ""}
                  {k.trend}% vs période préc.
                </div>
              </div>
            </motion.div>
          );
        })}
      </section>

      {/* ── 3. Email performance insight ── */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6"
      >
        <div className="grid gap-8 lg:grid-cols-[auto_1fr_1fr] lg:items-center">
          {/* Health arc */}
          <div className="flex justify-center lg:justify-start">
            <HealthArc score={healthScore} />
          </div>

          {/* Bars */}
          <div className="space-y-5">
            {[
              { label: "Ouverture", value: openRate, max: 60 },
              { label: "Réponse", value: replyRate, max: 15 },
              { label: "Booking", value: bookingRate, max: 10 },
            ].map((m, i) => (
              <div key={m.label}>
                <div className="mb-1.5 flex items-baseline justify-between">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">
                    {m.label}
                  </span>
                  <CountUp
                    value={m.value}
                    decimals={1}
                    suffix="%"
                    className="text-sm font-medium text-primary tabular-nums"
                  />
                </div>
                <Bar value={m.value} max={m.max} delay={0.2 + i * 0.15} height={6} />
              </div>
            ))}
          </div>

          {/* Commentary */}
          <div className="space-y-3">
            {[
              {
                label: `Ouverture à ${openRate.toFixed(1)}% — ${above(openRate, 35, 45)} la moyenne cold email (35–45%)`,
                cls: classify("open", openRate),
              },
              {
                label: `Réponse à ${replyRate.toFixed(1)}% — ${above(replyRate, 5, 8)} l'objectif B2B (5–8%)`,
                cls: classify("reply", replyRate),
              },
              {
                label: `Booking à ${bookingRate.toFixed(1)}% — ${above(bookingRate, 3, 5)} l'objectif (3–5%)`,
                cls: classify("booking", bookingRate),
              },
            ].map((c, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="flex items-start gap-2.5 text-sm text-foreground/80"
              >
                <span
                  className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                  style={{ background: dotColor[c.cls] }}
                />
                <span>{c.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ── 4. Action banner ── */}
      {showActionBanner && (
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between rounded-xl border-l-4 border-primary bg-[hsl(var(--card))] px-5 py-4 ring-1 ring-primary/10"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Bell size={18} style={{ color: ACCENT }} />
            </div>
            <p className="text-sm text-foreground">
              <span className="font-medium tabular-nums text-primary">{repliesPending}</span> réponses à traiter ·{" "}
              <span className="font-medium tabular-nums text-primary">{upcomingMeetings}</span> meetings à venir
            </p>
          </div>
          <Link
            href="/dashboard/campaigns"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Voir les leads <ArrowRight size={14} />
          </Link>
        </motion.div>
      )}

      {/* ── 5. Campaign cards ── */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Campagnes</h2>
        {campaignRowsVisible.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {campaignRows.length > 0
              ? "Aucune campagne active à afficher (les campagnes archivées sont masquées)."
              : "Aucune campagne sur la période."}
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {campaignRowsVisible.map((c, i) => (
              <CampaignCard key={c.campaignId} c={c} delay={i * 0.05} />
            ))}
          </div>
        )}
      </section>

      {/* ── 6. Top templates ── */}
      {topTemplates.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Templates les plus efficaces
          </h2>
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
            {(() => {
              const max = Math.max(...topTemplates.map((t) => t.replies), 1);
              return topTemplates.slice(0, 5).map((t, i) => (
                <motion.div
                  key={t.templateKey}
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-center gap-4 py-3 border-b border-[hsl(var(--border))] last:border-0"
                >
                  <span className="w-6 text-sm font-semibold text-primary tabular-nums">
                    #{i + 1}
                  </span>
                  <span className="w-40 shrink-0 truncate text-sm text-foreground">
                    {t.templateKey}
                  </span>
                  <div className="flex-1">
                    <Bar
                      value={t.replies}
                      max={max}
                      delay={0.2 + i * 0.08}
                      height={5}
                      triggerOnView
                    />
                  </div>
                  <span className="w-24 text-right text-xs text-primary tabular-nums">
                    {t.replies} réponses
                  </span>
                </motion.div>
              ));
            })()}
          </div>
        </section>
      )}

      {/* ── 7. KPIs v4 ── */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Métriques avancées v4</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: CalendarCheck, label: "Taux meeting", value: meetingRate, suffix: "%", decimals: 1, hint: "meetings / leads qualifiés" },
            { icon: Bot, label: "Setter rate", value: setterResponseRate, suffix: "%", decimals: 1, hint: "replies traitées par le Setter" },
            { icon: Linkedin, label: "Connexion LI", value: connectionRateLI, suffix: "%", decimals: 1, hint: "invitations acceptées" },
            { icon: DollarSign, label: "Coût / meeting", value: costPerMeeting, suffix: "$", decimals: 3, hint: "estimation tokens Anthropic" },
          ].map((k, i) => {
            const Icon = k.icon;
            return (
              <motion.div
                key={k.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.05 }}
                className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="rounded-lg bg-primary/10 p-1.5">
                    <Icon size={14} style={{ color: ACCENT }} />
                  </div>
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{k.label}</span>
                </div>
                <CountUp
                  value={k.value}
                  decimals={k.decimals}
                  suffix={k.suffix}
                  className="text-xl font-semibold text-primary tabular-nums"
                />
                <p className="mt-1 text-[10px] text-muted-foreground">{k.hint}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── 7b. Costs ── */}
      {costSummary && (
        <section>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-foreground">Coûts</h2>
            {costSummary.alert.triggered && (
              <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-medium text-red-600">
                Seuil dépassé
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Tokens mois", value: costSummary.month.anthropicTokens, suffix: "", decimals: 0 },
              { label: "Coût / meeting", value: costSummary.costPerMeetingUsd, suffix: "$", decimals: 2 },
              { label: "Projection mois", value: costSummary.projection.monthlyTotalUsd, suffix: "$", decimals: 2 },
              { label: "Actions Unipile", value: costSummary.month.unipileActions, suffix: "", decimals: 0 },
            ].map((k, i) => (
              <motion.div
                key={k.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.05 }}
                className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4"
              >
                <div className="mb-2 flex items-center gap-2">
                  <div className="rounded-lg bg-primary/10 p-1.5">
                    <DollarSign size={14} style={{ color: ACCENT }} />
                  </div>
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{k.label}</span>
                </div>
                <CountUp
                  value={k.value}
                  decimals={k.decimals}
                  suffix={k.suffix}
                  className="text-xl font-semibold text-primary tabular-nums"
                />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* ── 8. Funnels email + LI ── */}
      <section className="grid gap-4 md:grid-cols-2">
        {/* Funnel email */}
        {funnelEmail && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <Mail size={16} style={{ color: ACCENT }} />
              <h3 className="text-sm font-semibold text-foreground">Funnel Email</h3>
            </div>
            <FunnelBars
              steps={[
                { label: "Sourcés", value: funnelEmail.leadsSourced },
                { label: "Qualifiés", value: funnelEmail.leadsQualified },
                { label: "Contactés", value: funnelEmail.emailsSent },
                { label: "Réponses", value: funnelEmail.replies },
                { label: "Meetings", value: funnelEmail.meetings },
              ]}
            />
          </motion.div>
        )}

        {/* Funnel LI */}
        {funnelLI && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5"
          >
            <div className="flex items-center gap-2 mb-1">
              <Linkedin size={16} style={{ color: ACCENT }} />
              <h3 className="text-sm font-semibold text-foreground">Funnel LinkedIn</h3>
            </div>
            <p className="text-[10px] text-muted-foreground mb-3 italic">
              Données disponibles après activation Unipile
            </p>
            <FunnelBars
              steps={[
                { label: "Sourcés", value: funnelLI.profilesSourced },
                { label: "Invités", value: funnelLI.invited },
                { label: "Acceptés", value: funnelLI.accepted },
                { label: "DM envoyés", value: funnelLI.dmSent },
                { label: "Réponses", value: funnelLI.replied },
                { label: "Meetings", value: funnelLI.meetings },
              ]}
            />
          </motion.div>
        )}
      </section>

      {/* ── 9. Attribution RDV ── */}
      {(attributionRdv.email + attributionRdv.linkedin + attributionRdv.unknown) > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-foreground">Attribution RDV</h2>
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
            <AttributionRdv attribution={attributionRdv} />
          </div>
        </section>
      )}
    </div>
  );
}

function FunnelBars({ steps }: { steps: Array<{ label: string; value: number }> }) {
  const max = Math.max(...steps.map((s) => s.value), 1);
  return (
    <div className="space-y-2">
      {steps.map((s, i) => (
        <div key={s.label} className="flex items-center gap-3">
          <span className="w-20 text-[11px] text-muted-foreground shrink-0">{s.label}</span>
          <div className="flex-1 h-4 rounded overflow-hidden" style={{ background: TRACK }}>
            <motion.div
              className="h-full"
              style={{ background: ACCENT }}
              initial={{ width: 0 }}
              whileInView={{ width: `${(s.value / max) * 100}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: "easeOut", delay: i * 0.08 }}
            />
          </div>
          <span className="w-10 text-right text-xs text-primary tabular-nums shrink-0">{s.value}</span>
        </div>
      ))}
    </div>
  );
}

function AttributionRdv({ attribution }: { attribution: { email: number; linkedin: number; unknown: number } }) {
  const total = attribution.email + attribution.linkedin + attribution.unknown;
  if (total === 0) return null;

  const items = [
    { label: "Email", value: attribution.email, color: ACCENT },
    { label: "LinkedIn", value: attribution.linkedin, color: "#0077B5" },
    ...(attribution.unknown > 0 ? [{ label: "Autre", value: attribution.unknown, color: "hsl(var(--muted-foreground))" }] : []),
  ];

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const pct = total > 0 ? (item.value / total) * 100 : 0;
        return (
          <div key={item.label} className="flex items-center gap-3">
            <span className="w-20 text-[11px] text-muted-foreground shrink-0">{item.label}</span>
            <div className="flex-1 h-4 rounded overflow-hidden" style={{ background: TRACK }}>
              <motion.div
                className="h-full"
                style={{ background: item.color, width: `${pct}%` }}
                initial={{ width: 0 }}
                whileInView={{ width: `${pct}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
            <span className="w-16 text-right text-xs tabular-nums" style={{ color: item.color }}>
              {item.value} <span className="text-muted-foreground">({pct.toFixed(0)}%)</span>
            </span>
          </div>
        );
      })}
      <p className="text-[11px] text-muted-foreground pt-1">Total : {total} RDV</p>
    </div>
  );
}

function CampaignCard({
  c,
  delay,
}: {
  c: CampaignRow;
  delay: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  const statusMap: Record<CampaignStatus, { label: string; cls: string }> = {
    active: { label: "Actif", cls: "bg-emerald-500/15 text-emerald-600" },
    paused: { label: "Pause", cls: "bg-red-500/15 text-red-600" },
    archived: { label: "Archivé", cls: "bg-[hsl(var(--muted))] text-muted-foreground" },
    completed: { label: "Terminé", cls: "bg-[hsl(var(--muted))] text-muted-foreground" },
    generating: { label: "Génération", cls: "bg-primary/10 text-primary" },
    scheduled: { label: "Planifié", cls: "bg-primary/10 text-primary" },
  };
  const status = statusMap[c.status] ?? statusMap.archived;

  const commentary = useMemo(() => {
    if (c.emailsSent === 0) return "En cours de configuration";
    if (c.replyRate > 6) return "Campagne performante — continuez l'envoi";
    if (c.replyRate >= 3) return "Performance correcte — testez un nouvel objet";
    return "Taux faible — vérifiez le ciblage et les templates";
  }, [c.emailsSent, c.replyRate]);

  const max = Math.max(c.rawLeads, 1);
  const funnel = [
    { label: "Raw leads", value: c.rawLeads },
    { label: "Qualifiés", value: c.qualifiedLeads },
    { label: "Contactés", value: c.emailsSent },
    { label: "Réponses", value: Math.round((c.emailsSent * c.replyRate) / 100) },
  ];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -2, boxShadow: "0 10px 30px -10px rgba(0,101,150,0.12)" }}
      className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 transition-colors hover:border-primary/20"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-semibold text-primary">{c.campaignName}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {c.secteur}
            {c.localisation ? ` · ${c.localisation}` : ""}
          </p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${status.cls}`}>
          {status.label}
        </span>
      </div>

      {/* Funnel */}
      <div className="mt-5 space-y-2">
        {funnel.map((f, i) => {
          const pct = (f.value / max) * 100;
          return (
            <div key={f.label} className="flex items-center gap-3">
              <span className="w-20 text-[11px] text-muted-foreground">{f.label}</span>
              <div className="flex-1 h-5 rounded overflow-hidden" style={{ background: TRACK }}>
                <motion.div
                  className="h-full"
                  style={{ background: ACCENT, width: `${pct}%` }}
                  initial={{ width: 0 }}
                  animate={inView ? { width: `${pct}%` } : { width: 0 }}
                  transition={{ duration: 0.9, ease: "easeOut", delay: delay + 0.2 + i * 0.1 }}
                />
              </div>
              <span className="w-12 text-right text-xs text-primary tabular-nums">{f.value}</span>
            </div>
          );
        })}
      </div>

      {/* Pill metrics */}
      <div className="mt-5 flex flex-wrap gap-2">
        {[
          { l: "Ouverture", v: c.openRate },
          { l: "Réponse", v: c.replyRate },
          { l: "Booking", v: c.bookingRate },
        ].map((m) => (
          <div
            key={m.l}
            className="rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-1 text-[11px] text-foreground/80"
          >
            {m.l}{" "}
            <span className="font-medium text-primary tabular-nums">{m.v.toFixed(1)}%</span>
          </div>
        ))}
      </div>

      {/* Commentary */}
      <p className="mt-4 text-[12px] italic text-muted-foreground">{commentary}</p>
    </motion.div>
  );
}
