import type { Campaign } from "@/lib/sheets";

export type DashboardCampaignRowStatus = "active" | "inactive" | "paused" | "completed";

/** Campagnes encore dans le pipeline opérationnel (KPI « Campagnes actives » sur le dashboard). */
export function isCampaignActiveForDashboardKpi(statut: Campaign["statut"]): boolean {
  return statut !== "archived" && statut !== "completed";
}

/** Liste « Main campaigns » : exclut archivées et terminées. */
export function isCampaignShownInMainCampaignsList(statut: Campaign["statut"]): boolean {
  return isCampaignActiveForDashboardKpi(statut);
}

/** Badge / ligne campagne : generating reste géré par isGenerating sur la carte. */
export function mapCampaignStatutToRowStatus(statut: Campaign["statut"]): DashboardCampaignRowStatus {
  if (statut === "active" || statut === "generating" || statut === "scheduled") {
    return "active";
  }
  if (statut === "completed") return "completed";
  if (statut === "paused") return "paused";
  return "inactive";
}
