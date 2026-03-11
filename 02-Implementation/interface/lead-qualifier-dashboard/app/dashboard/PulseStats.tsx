"use client";

import { motion } from "framer-motion";
import { CalendarDays, Inbox, Layers3, TrendingUp } from "lucide-react";
import type { PulseStat, PulseStatIcon } from "./pulse-stats";
import { getPulseStatsThemeTokens } from "./pulse-stats-theme";

const icons: Record<PulseStatIcon, typeof Layers3> = {
  layers: Layers3,
  inbox: Inbox,
  trend: TrendingUp,
  calendar: CalendarDays,
};

export function PulseStats({ stats }: { stats: Array<PulseStat> }) {
  const tokens = getPulseStatsThemeTokens();

  return (
    <section className="relative mb-8 overflow-hidden" style={{ backgroundColor: tokens.surface }}>
      <ul className="relative">
        {stats.map((stat, index) => {
          const Icon = icons[stat.icon];
          return (
            <motion.li
              key={stat.label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05, ease: "easeOut" }}
              className="group grid grid-cols-[auto_1fr_auto] items-center gap-4 px-6 py-4 transition-colors duration-100"
              whileHover={{ backgroundColor: tokens.rowHover }}
            >
              <div
                className="relative flex h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: tokens.iconSurface, color: tokens.iconColor }}
              >
                <span className="absolute h-2 w-2 rounded-full" style={{ backgroundColor: tokens.dot }} />
                <Icon className="relative h-4 w-4" strokeWidth={1.9} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm" style={{ color: tokens.label }}>{stat.label}</p>
                <p className="mt-1 text-xs" style={{ color: tokens.sublabel }}>{stat.sublabel}</p>
              </div>
              <p
                className="text-right text-2xl font-semibold tracking-[-0.03em]"
                style={{ color: stat.accent ? tokens.accent : tokens.value }}
              >
                {stat.value}
              </p>
            </motion.li>
          );
        })}
      </ul>
    </section>
  );
}
