"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Send,
  Users,
  MailOpen,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  MousePointerClick,
  TrendingUp,
  Target,
  Inbox,
  Zap,
} from "lucide-react";

// ─── Utility ────────────────────────────────────────────────────────────────

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

// ============================================================================
// VIBE 1 — "Refined Midnight"
// Compact dark cards, colored icon badges, monospace numbers, trend chips
// ============================================================================

const VIBE1_DATA = [
  { label: "Campaigns", value: "12", trend: 8, icon: Layers, color: "blue" as const },
  { label: "Qualified Leads", value: "1,402", trend: 12.5, icon: Users, color: "emerald" as const },
  { label: "Emails Sent", value: "28.4k", trend: -2.4, icon: Send, color: "violet" as const },
  { label: "Open Rate", value: "42.8%", trend: 0.5, icon: MailOpen, color: "amber" as const },
];

const v1Colors = {
  blue: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  emerald: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  violet: "text-violet-400 bg-violet-400/10 border-violet-400/20",
  amber: "text-amber-400 bg-amber-400/10 border-amber-400/20",
};

function Vibe1Card({ stat, index }: { stat: (typeof VIBE1_DATA)[0]; index: number }) {
  const Icon = stat.icon;
  const isPos = stat.trend > 0;
  const isNeg = stat.trend < 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className="relative group overflow-hidden bg-[#0A0A0A] border border-white/[0.06] rounded-lg p-4 hover:border-white/[0.12] transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn("p-1.5 rounded-md border", v1Colors[stat.color])}>
          <Icon size={14} strokeWidth={2.5} />
        </div>
        <div className={cn(
          "flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full border",
          isPos && "text-emerald-400 bg-emerald-400/5 border-emerald-400/10",
          isNeg && "text-rose-400 bg-rose-400/5 border-rose-400/10",
          !isPos && !isNeg && "text-zinc-500 bg-zinc-500/5 border-zinc-500/10",
        )}>
          {isPos && <ArrowUpRight size={10} />}
          {isNeg && <ArrowDownRight size={10} />}
          {!isPos && !isNeg && <Minus size={10} />}
          {Math.abs(stat.trend)}%
        </div>
      </div>
      <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">{stat.label}</p>
      <h3 className="text-xl font-semibold tracking-tight text-zinc-100 font-mono mt-0.5">{stat.value}</h3>
      <div className="mt-4 h-[1px] w-full bg-white/[0.03] overflow-hidden">
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: "0%" }}
          transition={{ delay: index * 0.1 + 0.5, duration: 1 }}
          className={cn(
            "h-full w-full opacity-30",
            stat.color === "blue" && "bg-blue-500",
            stat.color === "emerald" && "bg-emerald-500",
            stat.color === "violet" && "bg-violet-500",
            stat.color === "amber" && "bg-amber-500",
          )}
        />
      </div>
    </motion.div>
  );
}

function Vibe1() {
  return (
    <div className="bg-[#030303] p-6 rounded-xl">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[10px] font-bold text-emerald-500/80 uppercase tracking-[0.2em]">Live Feed</span>
      </div>
      <h2 className="text-sm font-medium text-zinc-400 mb-4">Campaign Performance Overview</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {VIBE1_DATA.map((s, i) => <Vibe1Card key={s.label} stat={s} index={i} />)}
      </div>
      <div className="mt-4 flex items-center justify-between text-[10px] text-zinc-600 font-medium px-1">
        <span>SOURCE: GOOGLE_SHEETS_V4 · LAST_SYNC: JUST NOW</span>
        <span className="hover:text-zinc-400 cursor-pointer flex items-center gap-1">
          VIEW ANALYTICS <ArrowUpRight size={10} />
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// VIBE 2 — "Glassmorphism"
// Frosted cards with backdrop-blur, orange glow on accent card, progress bar
// ============================================================================

const VIBE2_DATA = [
  { label: "Active Campaigns", value: "12", icon: Layers, isAccent: false },
  { label: "Qualified Leads", value: "1,402", trend: "+12.5%", icon: Users, isAccent: true },
  { label: "Emails Sent", value: "28.4k", icon: Send, isAccent: false },
  { label: "Open Rate", value: "42.8%", trend: "+0.5%", icon: MousePointerClick, isAccent: false },
];

function Vibe2Card({ stat, index }: { stat: (typeof VIBE2_DATA)[0]; index: number }) {
  const Icon = stat.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group relative"
    >
      {stat.isAccent && (
        <div className="absolute -inset-0.5 rounded-xl bg-[#f97316] opacity-20 blur-xl transition-opacity group-hover:opacity-30" />
      )}
      <div className={cn(
        "relative h-full overflow-hidden rounded-xl border px-4 py-4 transition-all duration-300 backdrop-blur-md",
        stat.isAccent
          ? "border-[#f97316]/30 bg-black/40 shadow-[inset_0_0_12px_rgba(249,115,22,0.1)]"
          : "border-white/10 bg-white/[0.03] hover:border-white/20",
      )}>
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <span className={cn("text-[11px] font-medium uppercase tracking-wider", stat.isAccent ? "text-[#f97316]/80" : "text-zinc-500")}>
              {stat.label}
            </span>
            <div className="flex items-baseline gap-2">
              <h3 className="text-xl font-semibold tracking-tight text-white">{stat.value}</h3>
              {stat.trend && (
                <div className="flex items-center gap-0.5 text-[10px] font-medium text-emerald-400">
                  <TrendingUp size={10} /><span>{stat.trend}</span>
                </div>
              )}
            </div>
          </div>
          <div className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg border transition-colors",
            stat.isAccent ? "border-[#f97316]/20 bg-[#f97316]/10 text-[#f97316]" : "border-white/5 bg-white/5 text-zinc-400",
          )}>
            <Icon size={16} strokeWidth={2} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function Vibe2() {
  return (
    <div className="bg-[#0A0A0B] p-6 rounded-xl">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Performance Overview</h2>
          <p className="text-sm text-zinc-400 mt-1">Global aggregate metrics for current outreach.</p>
        </div>
        <button className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-zinc-300 hover:bg-white/10">
          View Analytics <ArrowUpRight size={12} />
        </button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {VIBE2_DATA.map((s, i) => <Vibe2Card key={s.label} stat={s} index={i} />)}
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-6 flex items-center gap-4 rounded-lg border border-white/5 bg-white/[0.01] px-4 py-2"
      >
        <div className="text-[10px] font-medium uppercase tracking-tighter text-zinc-600 whitespace-nowrap">Monthly Quota</div>
        <div className="relative h-1 w-full overflow-hidden rounded-full bg-zinc-900">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "68%" }}
            transition={{ duration: 1.5, ease: "circOut", delay: 0.8 }}
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#f97316]/50 to-[#f97316]"
          />
        </div>
        <div className="text-[10px] font-mono text-zinc-500">68%</div>
      </motion.div>
    </div>
  );
}

// ============================================================================
// VIBE 3 — "Editorial / Typographic"
// Huge numbers, grid with thin dividers, monochrome + surgical orange accent
// ============================================================================

const VIBE3_DATA = [
  { label: "ACTIVE CAMPAIGNS", value: "12", description: "Total live outbound sequences", icon: Layers, isAccent: false },
  { label: "QUALIFIED LEADS", value: "1,402", description: "Positive intent detected", trend: "+12.5%", icon: Target, isAccent: true },
  { label: "EMAILS SENT", value: "28.4k", description: "Rolling 30-day window", icon: Inbox, isAccent: false },
  { label: "OPEN RATE", value: "42.8%", description: "Average across all threads", trend: "+0.5%", icon: Zap, isAccent: false },
];

function Vibe3Card({ stat, index }: { stat: (typeof VIBE3_DATA)[0]; index: number }) {
  const Icon = stat.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className={cn(
        "relative group bg-[#050505] p-6 min-h-[200px] flex flex-col justify-between transition-colors duration-500",
        stat.isAccent ? "hover:bg-zinc-900/40" : "hover:bg-zinc-900/20",
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className={cn(
            "text-[10px] font-mono tracking-[0.15em] font-medium",
            stat.isAccent ? "text-blue-500" : "text-zinc-500",
          )}>
            {stat.label}
          </p>
          <p className="text-[11px] text-zinc-600 leading-tight mt-1 max-w-[120px]">{stat.description}</p>
        </div>
        <div className={cn(
          "p-2 rounded-full border transition-all",
          stat.isAccent ? "border-blue-500/20 text-blue-500 bg-blue-500/5" : "border-zinc-800 text-zinc-600",
        )}>
          <Icon size={14} strokeWidth={1.5} />
        </div>
      </div>
      <h2 className={cn(
        "text-6xl font-light tracking-tighter tabular-nums mt-4",
        stat.isAccent ? "text-blue-500" : "text-zinc-100",
      )}>
        {stat.value}
      </h2>
      <div className="flex items-center justify-between border-t border-zinc-800/50 pt-3 mt-3">
        {stat.trend && (
          <span className={cn(
            "text-[10px] font-mono px-1.5 py-0.5 rounded-sm",
            stat.isAccent ? "bg-blue-500/10 text-blue-400" : "bg-zinc-800 text-zinc-400",
          )}>
            {stat.trend}
          </span>
        )}
        <span className="text-[9px] text-zinc-700 uppercase tracking-widest">Vs Previous Period</span>
      </div>
      {stat.isAccent && <div className="absolute inset-0 pointer-events-none border border-blue-500/10" />}
      <div className={cn(
        "absolute bottom-0 left-0 h-[1px] bg-blue-500 transition-all duration-700",
        stat.isAccent ? "w-full" : "w-0 group-hover:w-full",
      )} />
    </motion.div>
  );
}

function Vibe3() {
  return (
    <div className="bg-[#050505] p-6 rounded-xl">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-800/50 pb-6">
        <div>
          <span className="text-[10px] font-mono tracking-[0.2em] text-blue-500 uppercase mb-2 block">Performance Overview</span>
          <h1 className="text-3xl font-light tracking-tight text-zinc-100">
            Outbound <span className="italic text-zinc-500">Intelligence</span>
          </h1>
        </div>
        <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Last Updated: Just Now</div>
      </header>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-zinc-800/30 border border-zinc-800/30 rounded-sm overflow-hidden">
        {VIBE3_DATA.map((s, i) => <Vibe3Card key={s.label} stat={s} index={i} />)}
      </div>
    </div>
  );
}

// ============================================================================
// VIBES SELECTION PAGE
// ============================================================================

export default function VibesSelection() {
  return (
    <div className="min-h-screen bg-black text-white font-sans p-8">
      <div className="max-w-6xl mx-auto space-y-16">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-white mb-2">Choix du Design System</h1>
          <p className="text-sm text-zinc-500">Dis-moi quel vibe tu préfères — "vibe 1", "vibe 2" ou "vibe 3"</p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Vibe 1</span>
            <div className="h-px flex-1 bg-zinc-800" />
            <span className="text-[10px] font-mono text-zinc-600">Refined Midnight — Colored badges, monospace, trend chips</span>
          </div>
          <Vibe1 />
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Vibe 2</span>
            <div className="h-px flex-1 bg-zinc-800" />
            <span className="text-[10px] font-mono text-zinc-600">Glassmorphism — Frosted cards, orange glow, quota bar</span>
          </div>
          <Vibe2 />
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Vibe 3</span>
            <div className="h-px flex-1 bg-zinc-800" />
            <span className="text-[10px] font-mono text-zinc-600">Editorial — Huge numbers, grid dividers, surgical orange</span>
          </div>
          <Vibe3 />
        </div>
      </div>
    </div>
  );
}
