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
} from "lucide-react";

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
  };
  campaignRows: CampaignRow[];
  topTemplates: Array<{ templateKey: string; replies: number }>;
  period: AnalyticsPeriod;
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
        <CountUp value={score} className="text-4xl font-semibold text-foreground" />
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
}: DataPageClientProps) {
  const { qualifiedLeads, emailsSent, openRate, replyRate, bookingRate, repliesPending, upcomingMeetings } =
    globalKpis;

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
          const trendUp = k.trend >= 0;
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
                  className="text-2xl font-semibold text-foreground tabular-nums"
                />
                <div className="mt-1 text-[12px] text-muted-foreground">{k.label}</div>
                <div
                  className={`mt-2 inline-flex items-center gap-1 text-[11px] ${
                    trendUp ? "text-emerald-500" : "text-red-500"
                  }`}
                >
                  {trendUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  {trendUp ? "+" : ""}
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
                    className="text-sm font-medium text-foreground tabular-nums"
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
              <span className="font-medium">{repliesPending}</span> réponses à traiter ·{" "}
              <span className="font-medium">{upcomingMeetings}</span> meetings à venir
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
        <div className="grid gap-4 md:grid-cols-2">
          {campaignRows.map((c, i) => (
            <CampaignCard key={c.campaignId} c={c} delay={i * 0.05} />
          ))}
        </div>
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
                  <span className="w-24 text-right text-xs text-muted-foreground tabular-nums">
                    {t.replies} réponses
                  </span>
                </motion.div>
              ));
            })()}
          </div>
        </section>
      )}
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
    active: { label: "Actif", cls: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
    paused: { label: "Pause", cls: "bg-red-500/15 text-red-600 dark:text-red-400" },
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
          <h3 className="truncate text-[15px] font-semibold text-foreground">{c.campaignName}</h3>
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
              <span className="w-12 text-right text-xs text-foreground tabular-nums">{f.value}</span>
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
            {m.l} <span className="font-medium text-foreground">{m.v.toFixed(1)}%</span>
          </div>
        ))}
      </div>

      {/* Commentary */}
      <p className="mt-4 text-[12px] italic text-muted-foreground">{commentary}</p>
    </motion.div>
  );
}
