import type { IndexCampaign, WorkspaceRow } from "@/lib/sheets";
import type { Meeting } from "@/lib/meetings";

// ——— Onglet ApiKeys (Index) ———

export const API_KEYS_SHEET_NAME = "ApiKeys";
export const API_KEYS_HEADER = ["api_key", "workspace_id", "label", "created_at"] as const;

export interface ApiKeyRow {
  api_key: string;
  workspace_id: string;
  label: string;
  created_at: string;
}

export function parseApiKeyRows(rows: string[][]): ApiKeyRow[] {
  if (!rows.length) return [];
  const [, ...data] = rows;
  return data
    .filter((r) => (r[0] ?? "").trim())
    .map((r) => ({
      api_key: r[0] ?? "",
      workspace_id: r[1] ?? "",
      label: r[2] ?? "",
      created_at: r[3] ?? "",
    }));
}

export function resolveWorkspaceIdFromRows(apiKey: string, rows: string[][]): string | null {
  const trimmed = apiKey.trim();
  if (!trimmed) return null;
  const match = parseApiKeyRows(rows).find((row) => row.api_key === trimmed);
  return match?.workspace_id || null;
}

// ——— Isolation par workspace ———

export function filterCampaignsByWorkspace(
  campaigns: IndexCampaign[],
  workspaceId: string
): IndexCampaign[] {
  return campaigns.filter((campaign) => campaign.workspace_id === workspaceId);
}

export interface PublicCampaign {
  campaign_id: string;
  nom: string;
  statut: string;
  total_leads_qualified: string;
  emails_envoyés: string;
  taux_réponse: string;
}

/** Projection publique d'une campagne — ne jamais exposer sheet_id/sheet_url. */
export function toPublicCampaign(campaign: IndexCampaign): PublicCampaign {
  return {
    campaign_id: campaign.campaign_id,
    nom: campaign.nom,
    statut: campaign.statut,
    total_leads_qualified: campaign.total_leads_qualified,
    emails_envoyés: campaign.emails_envoyés,
    taux_réponse: campaign.taux_réponse,
  };
}

export function filterMeetingsByWorkspace(
  meetings: Meeting[],
  campaigns: IndexCampaign[],
  workspaceId: string
): Meeting[] {
  const campaignIds = new Set(
    filterCampaignsByWorkspace(campaigns, workspaceId).map((c) => c.campaign_id)
  );
  return meetings.filter((meeting) => campaignIds.has(meeting.campaign_id));
}

// ——— Webhooks CRM outbound (HubSpot-compatible) ———

export type CrmEvent = "lead_qualified" | "meeting_booked";

const CRM_EVENTS: readonly CrmEvent[] = ["lead_qualified", "meeting_booked"];

export interface CrmConfig {
  webhookUrl: string;
  events: CrmEvent[];
}

/** Lit `crm_webhook_url` + `crm_events` (CSV) depuis la Config enfant. */
export function parseCrmConfig(config: Record<string, string>): CrmConfig {
  const webhookUrl = (config.crm_webhook_url ?? "").trim();
  if (!webhookUrl) return { webhookUrl: "", events: [] };
  const events = (config.crm_events ?? "")
    .split(",")
    .map((event) => event.trim())
    .filter((event): event is CrmEvent => (CRM_EVENTS as readonly string[]).includes(event));
  return { webhookUrl, events };
}

export interface CrmLeadPayload {
  email: string;
  name: string;
  score: number | null;
  company: string;
  linkedin_url: string;
}

export interface CrmPayload {
  event: CrmEvent;
  timestamp: string;
  workspace_id: string;
  campaign_id: string;
  lead: CrmLeadPayload;
}

export function buildCrmPayload(input: {
  event: CrmEvent;
  timestamp: string;
  workspaceId: string;
  campaignId: string;
  lead: CrmLeadPayload;
}): CrmPayload {
  return {
    event: input.event,
    timestamp: input.timestamp,
    workspace_id: input.workspaceId,
    campaign_id: input.campaignId,
    lead: input.lead,
  };
}

/**
 * POSTe le payload vers le webhook CRM de la campagne si l'event est souscrit.
 * Ne throw jamais — l'échec d'un CRM externe ne doit pas casser le pipeline.
 */
export async function dispatchCrmEvent(input: {
  config: Record<string, string>;
  payload: CrmPayload;
  fetchImpl?: typeof fetch;
}): Promise<boolean> {
  const { webhookUrl, events } = parseCrmConfig(input.config);
  if (!webhookUrl || !events.includes(input.payload.event)) return false;
  const fetchImpl = input.fetchImpl ?? fetch;
  try {
    await fetchImpl(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input.payload),
    });
    return true;
  } catch {
    return false;
  }
}
