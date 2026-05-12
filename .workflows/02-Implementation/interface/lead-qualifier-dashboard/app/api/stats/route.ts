import { NextResponse } from "next/server";
import { buildDataDashboardModel, type AnalyticsPeriod, type AnalyticsStatusGroup } from "@/lib/analytics";
import {
  getAnalyticsDailySnapshots,
  getMeetings,
  readIndex,
  parseIndexCampaigns,
  getAllLeadsV3,
  indexCampaignToCampaign,
} from "@/lib/sheets";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const period = (searchParams.get("period") as AnalyticsPeriod | null) ?? "30d";
  const statusGroup =
    (searchParams.get("status_group") as AnalyticsStatusGroup | null) ?? "all";
  const campaignId = searchParams.get("campaign_id") ?? undefined;

  const [indexRows, meetings, snapshots] = await Promise.all([
    readIndex(),
    getMeetings(),
    getAnalyticsDailySnapshots(),
  ]);

  const indexCampaigns = parseIndexCampaigns(indexRows);
  const campaigns = indexCampaigns.map(indexCampaignToCampaign);
  const leads = await getAllLeadsV3(indexCampaigns);

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
