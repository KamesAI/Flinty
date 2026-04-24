import { cacheGet, cacheSet, DEFAULT_TTL_MS } from "./cache";
import { readIndex } from "./sheets";
import type { Campaign } from "./types";

export type { Campaign };

export type CampaignByIdResult = {
  campaign: Campaign;
  sheetId: string;
  sheetUrl: string;
};

function campaignByIdCacheKey(id: string): string {
  return `campaignById:${id}`;
}

export function parseIndexCampaigns(rows: string[][]): Campaign[] {
  if (rows.length <= 1) return [];
  const [, ...data] = rows;
  return data.map((r) => ({
    campaign_id: r[0] ?? "",
    nom: r[1] ?? "",
    sheet_id: r[2] ?? "",
    sheet_url: r[3] ?? "",
    secteur: r[4] ?? "",
    localisation: r[5] ?? "",
    offre_kames: r[6] ?? "",
    statut: (r[7] as Campaign["statut"]) || "new",
    date_création: r[8] ?? "",
    total_leads_raw: r[9] ?? "0",
    total_leads_qualified: r[10] ?? "0",
    emails_envoyés: r[11] ?? "0",
    taux_réponse: r[12] ?? "0",
  }));
}

export async function listCampaigns(): Promise<Campaign[]> {
  const rows = await readIndex();
  return parseIndexCampaigns(rows);
}

export async function getCampaignById(
  id: string
): Promise<CampaignByIdResult | null> {
  const cached = cacheGet<CampaignByIdResult>(campaignByIdCacheKey(id));
  if (cached) return cached;

  const rows = await readIndex();
  const campaigns = parseIndexCampaigns(rows);
  const match = campaigns.find((c) => c.campaign_id === id);
  if (!match) return null;

  const result: CampaignByIdResult = {
    campaign: match,
    sheetId: match.sheet_id,
    sheetUrl: match.sheet_url,
  };
  cacheSet(campaignByIdCacheKey(id), result, DEFAULT_TTL_MS);
  return result;
}
