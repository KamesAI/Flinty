import type { LucideIcon } from "lucide-react";
import { CalendarDays, Layers3, Mail, Target } from "lucide-react";

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
      label: "Campagnes actives",
      value: String(input.campaignsCount),
      sublabel: "au total",
      icon: Layers3,
    },
    {
      label: "Leads qualifiés",
      value: String(input.repliedCount),
      sublabel: "cette semaine",
      icon: Target,
    },
    {
      label: "Taux d'ouverture",
      value: `${input.avgOpenRate}%`,
      sublabel: "moyenne globale",
      icon: Mail,
    },
    {
      label: "Meetings bookés",
      value: String(input.meetingsCount),
      sublabel: "sur la semaine",
      icon: CalendarDays,
    },
  ];
}
