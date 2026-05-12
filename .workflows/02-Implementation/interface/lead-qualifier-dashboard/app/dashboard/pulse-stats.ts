export type PulseStatIcon = "layers" | "inbox" | "trend" | "calendar";

export interface PulseStat {
  icon: PulseStatIcon;
  label: string;
  value: string;
  sublabel: string;
  accent?: boolean;
}

export function buildPulseStats(input: {
  campaignsCount: number;
  repliedCount: number;
  avgOpenRate: number;
  meetingsCount: number;
}): PulseStat[] {
  return [
    { icon: "layers", label: "Campagnes actives", value: `${input.campaignsCount}`, sublabel: "au total", accent: true },
    { icon: "inbox", label: "Emails recus", value: String(input.repliedCount), sublabel: `${input.repliedCount} a repondre` },
    { icon: "trend", label: "Taux d'ouverture", value: `${input.avgOpenRate}%`, sublabel: "moyenne globale" },
    { icon: "calendar", label: "Meetings", value: String(input.meetingsCount), sublabel: "sur la semaine en cours" },
  ];
}
