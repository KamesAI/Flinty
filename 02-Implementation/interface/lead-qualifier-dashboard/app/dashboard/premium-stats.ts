import type { LucideIcon } from "lucide-react";
import { CalendarDays, Layers3, MailOpen, TrendingUp } from "lucide-react";

export interface PremiumStatsCard {
  label: string;
  value: string;
  sublabel: string;
  icon: LucideIcon;
}

export function buildPremiumStatsCards(input: {
  campaignsCount: number;
  repliedCount: number;
  avgOpenRate: number;
  meetingsCount: number;
}): PremiumStatsCard[] {
  return [
    {
      label: "Campagnes",
      value: String(input.campaignsCount),
      sublabel: "au total",
      icon: Layers3,
    },
    {
      label: "Emails recus",
      value: String(input.repliedCount),
      sublabel: `${input.repliedCount} a repondre`,
      icon: MailOpen,
    },
    {
      label: "Taux d'ouverture",
      value: `${input.avgOpenRate}%`,
      sublabel: "moyenne globale",
      icon: TrendingUp,
    },
    {
      label: "Meetings",
      value: String(input.meetingsCount),
      sublabel: "sur la semaine en cours",
      icon: CalendarDays,
    },
  ];
}
