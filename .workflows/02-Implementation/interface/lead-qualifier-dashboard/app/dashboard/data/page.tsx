import {
  buildDataDashboardModel,
  type AnalyticsPeriod,
} from "../../../lib/analytics";
import {
  buildCostMonitoringSummary,
  DEFAULT_COST_PER_MEETING_THRESHOLD_USD,
} from "../../../lib/cost-monitoring";
import {
  getAnalyticsDailySnapshots,
  getMeetings,
  readIndex,
  parseIndexCampaigns,
  getAllLeadsV3,
  indexCampaignToCampaign,
  getCostTrackingRows,
  getGlobalConfig,
} from "../../../lib/sheets";
import DataPageClient from "./DataPageClient";

export default async function DataPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; workspace_id?: string }>;
}) {
  const params = await searchParams;
  const period = (params.period as AnalyticsPeriod | undefined) ?? "30d";
  const workspaceId = params.workspace_id ?? "kames-default";

  let model = null;
  let costSummary = null;
  let error = false;

  try {
    const [indexRows, meetings, snapshots] = await Promise.all([
      readIndex(),
      getMeetings().catch((e) => { console.error("[DataPage] getMeetings failed:", e); return []; }),
      getAnalyticsDailySnapshots().catch((e) => { console.error("[DataPage] getAnalyticsDailySnapshots failed:", e); return []; }),
    ]);

    const indexCampaigns = parseIndexCampaigns(indexRows);
    const campaigns = indexCampaigns.map(indexCampaignToCampaign);
    const leads = await getAllLeadsV3(indexCampaigns).catch((e) => { console.error("[DataPage] getAllLeadsV3 failed:", e); return []; });

    model = buildDataDashboardModel({
      campaigns,
      leads,
      meetings,
      snapshots,
      statusGroup: "all",
      period,
    });

    const [costRows, globalConfig] = await Promise.all([
      getCostTrackingRows().catch((e) => { console.error("[DataPage] getCostTrackingRows failed:", e); return []; }),
      getGlobalConfig().catch((e): Record<string, string> => { console.error("[DataPage] getGlobalConfig failed:", e); return {}; }),
    ]);
    const thresholdUsd = Number(globalConfig.alert_cost_per_meeting_threshold) || DEFAULT_COST_PER_MEETING_THRESHOLD_USD;
    costSummary = buildCostMonitoringSummary({
      rows: costRows,
      campaigns,
      meetings,
      workspaceId,
      thresholdUsd,
    });
  } catch (e) {
    console.error("[DataPage] fatal error:", e);
    error = true;
  }

  if (error || !model) {
    return (
      <div className="px-6 py-8">
        <p className="text-sm text-muted-foreground">
          Impossible de charger les KPIs depuis Google Sheets. Vérifiez la connexion et réessayez.
        </p>
      </div>
    );
  }

  return (
    <DataPageClient
      period={period}
      globalKpis={model.globalKpis}
      campaignRows={model.businessRows}
      topTemplates={model.topTemplates}
      funnelEmail={model.funnelEmail}
      funnelLI={model.funnelLI}
      costSummary={costSummary}
    />
  );
}
