export interface CampaignOverviewInput {
  nom: string;
  secteur: string;
  localisation: string;
  statut: "active" | "generating" | "scheduled" | "paused" | "completed" | "archived";
  total_leads_raw: string;
  total_leads_qualified: string;
  emails_envoyés: string;
  taux_ouverture: string;
  taux_réponse: string;
}

export interface CampaignOverviewModel {
  subtitle: string;
  funnelStats: Array<{ label: string; value: number }>;
  rateStats: Array<{ label: string; value: string }>;
  statusLabel: string;
  statusTone: "info" | "success" | "warning" | "muted";
}

function toSafeInt(value: string) {
  return Number.parseInt(value || "0", 10) || 0;
}

function toSafeFloat(value: string) {
  return Number.parseFloat(value || "0") || 0;
}

export function buildCampaignOverviewModel(
  campaign: CampaignOverviewInput
): CampaignOverviewModel {
  const emailsSent = toSafeInt(campaign.emails_envoyés);
  const replyRate = toSafeFloat(campaign.taux_réponse);
  const repliedCount = Math.round((replyRate * emailsSent) / 100);

  const statusMap = {
    active: { label: "Actif", tone: "success" as const },
    generating: { label: "Generation...", tone: "info" as const },
    scheduled: { label: "Planifie", tone: "warning" as const },
    paused: { label: "Pause", tone: "muted" as const },
    completed: { label: "Complete", tone: "success" as const },
    archived: { label: "Archive", tone: "muted" as const },
  };

  const status = statusMap[campaign.statut] ?? statusMap.paused;

  return {
    subtitle: `Automatisation IA · ${campaign.secteur} · ${campaign.localisation}`,
    funnelStats: [
      { label: "Raw", value: toSafeInt(campaign.total_leads_raw) },
      { label: "Qualifies", value: toSafeInt(campaign.total_leads_qualified) },
      { label: "Contactes", value: emailsSent },
      { label: "Reponses", value: repliedCount },
    ],
    rateStats: [
      { label: "Ouverture", value: `${campaign.taux_ouverture}%` },
      { label: "Reponse", value: `${campaign.taux_réponse}%` },
    ],
    statusLabel: status.label,
    statusTone: status.tone,
  };
}
