import { NextResponse } from "next/server";
import {
  buildCostMonitoringSummary,
  DEFAULT_COST_PER_MEETING_THRESHOLD_USD,
} from "@/lib/cost-monitoring";
import { sendCostThresholdEmail } from "@/lib/cost-alerts";
import {
  getCostTrackingRows,
  getGlobalConfig,
  getMeetings,
  indexCampaignToCampaign,
  parseIndexCampaigns,
  readIndex,
} from "@/lib/sheets";

export const dynamic = "force-dynamic";

function toThreshold(value: string | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : DEFAULT_COST_PER_MEETING_THRESHOLD_USD;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const workspaceId = url.searchParams.get("workspace_id")?.trim();

  if (!workspaceId) {
    return NextResponse.json({ error: "workspace_id requis" }, { status: 400 });
  }

  try {
    const [indexRows, costRows, meetings, config] = await Promise.all([
      readIndex(),
      getCostTrackingRows(),
      getMeetings(),
      getGlobalConfig(),
    ]);
    const campaigns = parseIndexCampaigns(indexRows).map(indexCampaignToCampaign);
    const thresholdUsd = toThreshold(config.alert_cost_per_meeting_threshold);

    const summary = buildCostMonitoringSummary({
      rows: costRows,
      campaigns,
      meetings,
      workspaceId,
      thresholdUsd,
    });

    if (summary.alert.triggered) {
      await sendCostThresholdEmail(summary).catch((error) => {
        console.error("[monitoring/costs] cost alert email failed:", error);
      });
    }

    return NextResponse.json(summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
