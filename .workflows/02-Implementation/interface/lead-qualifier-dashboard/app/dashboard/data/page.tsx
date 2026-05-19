import {
  buildDataDashboardModel,
  type AnalyticsPeriod,
} from "../../../lib/analytics";
import {
  getAnalyticsDailySnapshots,
  getMeetings,
  readIndex,
  parseIndexCampaigns,
  getAllLeadsV3,
  indexCampaignToCampaign,
} from "../../../lib/sheets";
import DataPageClient from "./DataPageClient";

export default async function DataPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const params = await searchParams;
  const period = (params.period as AnalyticsPeriod | undefined) ?? "30d";

  let model = null;
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
    />
  );
}
