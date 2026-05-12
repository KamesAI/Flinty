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
      getMeetings(),
      getAnalyticsDailySnapshots(),
    ]);

    const indexCampaigns = parseIndexCampaigns(indexRows);
    const campaigns = indexCampaigns.map(indexCampaignToCampaign);
    const leads = await getAllLeadsV3(indexCampaigns);

    model = buildDataDashboardModel({
      campaigns,
      leads,
      meetings,
      snapshots,
      statusGroup: "all",
      period,
    });
  } catch {
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
    />
  );
}
