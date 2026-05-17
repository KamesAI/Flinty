import { NextResponse } from "next/server";
import { getMeetings } from "@/lib/sheets";
import { listEscalatedSetterThreads, listSetterDraftQueue } from "@/lib/replies";

export async function GET(req: Request) {
  try {
    const campaignId = new URL(req.url).searchParams.get("campaign_id");
    const [items, escalatedThreads, meetings] = await Promise.all([
      listSetterDraftQueue(),
      listEscalatedSetterThreads(),
      getMeetings(),
    ]);
    const filteredDrafts = campaignId
      ? items.filter((item) => item.campaign.campaign_id === campaignId)
      : items;
    const filteredEscalatedThreads = campaignId
      ? escalatedThreads.filter((item) => item.campaign.campaign_id === campaignId)
      : escalatedThreads;
    const filteredMeetings = meetings.filter((meeting) => {
      if (campaignId && meeting.campaign_id !== campaignId) return false;
      return ["booked", "scheduled"].includes(String(meeting.status));
    });

    return NextResponse.json({
      drafts_to_validate: filteredDrafts.length,
      to_validate: filteredDrafts.length,
      to_reply: filteredEscalatedThreads.length,
      bookings: filteredMeetings.length,
      items: filteredDrafts.map((item) => ({
        lead_id: item.lead.lead_id,
        campaign_id: item.campaign.campaign_id,
        turn_id: item.draft.turn_id,
        intent: item.draft.intent,
        sent_at: item.draft.sent_at,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
