import {
  QUALIFIED_SHEET_RANGE_WITH_HEADER,
  parseIndexCampaigns,
  parseLeadsV3,
  readChildQualifiedLeads,
  readIndex,
} from "@/lib/sheets";
import { readCampaignConfig } from "@/lib/replies";
import { buildCrmPayload, dispatchCrmEvent, parseCrmConfig } from "@/lib/public-api";

async function findCampaign(campaignId: string) {
  const campaigns = parseIndexCampaigns(await readIndex());
  return campaigns.find((campaign) => campaign.campaign_id === campaignId) ?? null;
}

/**
 * Notifie le CRM (webhook outbound) d'un lot de leads qualifiés.
 * Fire-and-forget : ne throw jamais, retourne le nombre d'events envoyés.
 */
export async function notifyLeadsQualifiedSafe(campaignId: string): Promise<number> {
  try {
    const campaign = await findCampaign(campaignId);
    if (!campaign?.sheet_id) return 0;

    const config = await readCampaignConfig(campaign.sheet_id, campaignId);
    const crm = parseCrmConfig(config);
    if (!crm.webhookUrl || !crm.events.includes("lead_qualified")) return 0;

    const rows = await readChildQualifiedLeads(
      campaign.sheet_id,
      campaignId,
      QUALIFIED_SHEET_RANGE_WITH_HEADER
    );
    const leads = parseLeadsV3(rows);

    let sent = 0;
    for (const lead of leads) {
      const score = Number(lead.score);
      const ok = await dispatchCrmEvent({
        config,
        payload: buildCrmPayload({
          event: "lead_qualified",
          timestamp: new Date().toISOString(),
          workspaceId: campaign.workspace_id,
          campaignId,
          lead: {
            email: lead.email,
            name: [lead.prénom, lead.nom].filter(Boolean).join(" "),
            score: Number.isFinite(score) ? score : null,
            company: lead.site,
            linkedin_url: "",
          },
        }),
      });
      if (ok) sent += 1;
    }
    return sent;
  } catch {
    return 0;
  }
}

/**
 * Notifie le CRM qu'un meeting vient d'être booké (Calendly).
 * Fire-and-forget : ne throw jamais.
 */
export async function notifyMeetingBookedSafe(input: {
  campaignId: string;
  sheetId: string;
  inviteeEmail: string;
  inviteeName: string;
}): Promise<boolean> {
  try {
    const campaign = await findCampaign(input.campaignId);
    const config = await readCampaignConfig(input.sheetId, input.campaignId);
    return dispatchCrmEvent({
      config,
      payload: buildCrmPayload({
        event: "meeting_booked",
        timestamp: new Date().toISOString(),
        workspaceId: campaign?.workspace_id ?? "kames-default",
        campaignId: input.campaignId,
        lead: {
          email: input.inviteeEmail,
          name: input.inviteeName,
          score: null,
          company: "",
          linkedin_url: "",
        },
      }),
    });
  } catch {
    return false;
  }
}
