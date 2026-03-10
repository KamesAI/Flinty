import { NextResponse } from "next/server";
import { buildDataDashboardModel, type AnalyticsPeriod, type AnalyticsStatusGroup } from "@/lib/analytics";
import { getAnalyticsDailySnapshots, getMeetings, getSheetData, parseCampaigns, parseLeads } from "@/lib/sheets";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const period = (searchParams.get("period") as AnalyticsPeriod | null) ?? "30d";
  const statusGroup =
    (searchParams.get("status_group") as AnalyticsStatusGroup | null) ?? "all";
  const campaignId = searchParams.get("campaign_id") ?? undefined;

  const [campRows, leadRows, meetings, snapshots] = await Promise.all([
    getSheetData("Campagnes!A:L"),
    getSheetData("Leads_Qualified!A:P"),
    getMeetings(),
    getAnalyticsDailySnapshots(),
  ]);
  const campaigns = parseCampaigns(campRows);
  const leads = parseLeads(leadRows);
  const model = buildDataDashboardModel({
    campaigns,
    leads,
    meetings,
    snapshots,
    selectedCampaignId: campaignId,
    statusGroup,
    period,
  });

  return NextResponse.json(model);
}
