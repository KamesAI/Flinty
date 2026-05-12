"use client";

import React from "react";
import { useEffect, useRef } from "react";
import { motion, useInView, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, LucideIcon } from "lucide-react";
import { cn } from "@/components/lib/utils";

interface KpiCardProps {
  label: string;
  value: number;
  suffix?: string;
  decimals?: number;
  delta: number;
  deltaLabel?: string;
  sublabel?: string;
  icon: LucideIcon;
  spark?: number[];
  index?: number;
}

function CountUp({ to, decimals = 0, suffix = "" }: { to: number; decimals?: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 60, damping: 18, mass: 0.6 });
  const display = useTransform(spring, (v) => v.toFixed(decimals));

  useEffect(() => {
    if (inView) mv.set(to);
  }, [inView, mv, to]);

  useEffect(() => {
    return display.on("change", (latest) => {
      if (ref.current) ref.current.textContent = `${latest}${suffix}`;
    });
  }, [display, suffix]);

  return <span ref={ref} className="tabular-nums">0{suffix}</span>;
}

function Sparkline({ data }: { data: number[] }) {
  if (!data.length) return null;
  const w = 92;
  const h = 34;
  const topPadding = 6;
  const bottomPadding = 5;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = w / (data.length - 1 || 1);
  const drawHeight = h - topPadding - bottomPadding;
  const points = data
    .map((value, index) => {
      const normalized = (value - min) / range;
      const y = h - bottomPadding - normalized * drawHeight;
      return `${index * step},${y}`;
    })
    .join(" ");

  return (
    <svg width={w} height={h} className="overflow-visible shrink-0" data-kpi-sparkline="true">
      <polyline
        points={points}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function KpiCard({
  label,
  value,
  suffix = "",
  decimals = 0,
  delta,
  deltaLabel = "vs last week",
  sublabel,
  icon: Icon,
  spark = [],
  index = 0,
}: KpiCardProps) {
  const positive = delta >= 0;
  const bottomLabel = sublabel ?? deltaLabel;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -2 }}
      className="card-premium group p-5"
    >
      {/* radial accent */}
      <div className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-primary/10 blur-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div
            data-kpi-icon-variant="default"
            className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary ring-1 ring-inset ring-primary/20"
          >
            <Icon className="size-[15px]" />
          </div>
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">{label}</div>
        </div>
        <div
          className={cn(
            "flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
            positive
              ? "bg-success/10 text-success"
              : "bg-destructive/10 text-destructive"
          )}
        >
          {positive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
          {Math.abs(delta)}
          {suffix.includes("%") ? "%" : ""}
        </div>
      </div>

      <div className="relative mt-4 flex items-end justify-between">
        <div>
          <div className="text-4xl font-bold tracking-tight text-primary">
            <CountUp to={value} decimals={decimals} suffix={suffix} />
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">{bottomLabel}</div>
        </div>
        <Sparkline data={spark} />
      </div>
    </motion.div>
  );
}
