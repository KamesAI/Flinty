export type CampaignRowStatus = "active" | "inactive" | "paused" | "completed";

export interface CampaignRowStats {
  raw: number;
  qualified: number;
  contacted: number;
  replies: number;
}

export interface CampaignRowProps {
  name: string;
  subtitle: string;
  status: CampaignRowStatus;
  stats: CampaignRowStats;
  openRate: number;
  replyRate: number;
  isGenerating: boolean;
}

interface CampaignStage {
  key: keyof CampaignRowStats;
  label: string;
  value: number;
  fillPercent: number;
}

interface CampaignConnector {
  from: keyof CampaignRowStats;
  to: keyof CampaignRowStats;
  fillPercent: number;
}

export interface CampaignRowModel {
  status: {
    label: string;
    tone: "active" | "inactive" | "paused" | "completed" | "generating";
  };
  stages: CampaignStage[];
  connectors: CampaignConnector[];
  rates: Array<{ label: string; value: string }>;
}

const STAGE_META: Array<{ key: keyof CampaignRowStats; label: string }> = [
  { key: "raw", label: "Raw" },
  { key: "qualified", label: "Qualifiés" },
  { key: "contacted", label: "Contactés" },
  { key: "replies", label: "Réponses" },
];

const STATUS_META: Record<
  CampaignRowStatus,
  { label: string; tone: CampaignRowModel["status"]["tone"] }
> = {
  active: { label: "Active", tone: "active" },
  inactive: { label: "Inactive", tone: "inactive" },
  paused: { label: "En pause", tone: "paused" },
  completed: { label: "Terminée", tone: "completed" },
};

function clampPercent(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  return Math.min(100, Math.round(value * 10) / 10);
}

export function formatCampaignRate(value: number) {
  return `${new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 1,
    maximumFractionDigits: 1,
  }).format(value)}%`;
}

export function buildCampaignRowModel({
  status,
  stats,
  openRate,
  replyRate,
  isGenerating,
}: CampaignRowProps): CampaignRowModel {
  const max = Math.max(...Object.values(stats), 1);
  const stages = STAGE_META.map(({ key, label }) => ({
    key,
    label,
    value: stats[key],
    fillPercent: clampPercent((stats[key] / max) * 100),
  }));

  const connectors = stages.slice(0, -1).map((stage, index) => ({
    from: stage.key,
    to: stages[index + 1].key,
    fillPercent: stages[index + 1].fillPercent,
  }));

  return {
    status: isGenerating
      ? { label: "En cours", tone: "generating" }
      : STATUS_META[status],
    stages,
    connectors,
    rates: [
      { label: "Ouverture", value: formatCampaignRate(openRate) },
      { label: "Réponse", value: formatCampaignRate(replyRate) },
    ],
  };
}
