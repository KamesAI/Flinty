import Link from "next/link";
import {
  buildDataDashboardModel,
  type AnalyticsPeriod,
  type AnalyticsStatusGroup,
} from "@/lib/analytics";
import {
  getAnalyticsDailySnapshots,
  getMeetings,
  getSheetData,
  parseCampaigns,
  parseLeads,
} from "@/lib/sheets";

type DataTab = "business" | "marketing" | "commercial";

const PERIOD_OPTIONS: Array<{ value: AnalyticsPeriod; label: string }> = [
  { value: "7d", label: "7 jours" },
  { value: "30d", label: "30 jours" },
  { value: "90d", label: "90 jours" },
  { value: "all", label: "Tout" },
];

const STATUS_OPTIONS: Array<{ value: AnalyticsStatusGroup; label: string }> = [
  { value: "all", label: "Toutes" },
  { value: "active", label: "Actives" },
  { value: "archived", label: "Archivées" },
];

const TAB_OPTIONS: Array<{ value: DataTab; label: string; description: string }> = [
  {
    value: "business",
    label: "Business",
    description: "Pilotage global des campagnes, volumes et rendement.",
  },
  {
    value: "marketing",
    label: "Marketing",
    description: "Ouvertures, réponses, templates et segments.",
  },
  {
    value: "commercial",
    label: "Commercial",
    description: "Réponses en attente, rendez-vous et priorisation.",
  },
];

function KpiCard({
  label,
  value,
  sublabel,
}: {
  label: string;
  value: string | number;
  sublabel: string;
}) {
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5">
      <p className="text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-3">{label}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
      <p className="text-sm text-zinc-500 mt-2">{sublabel}</p>
    </div>
  );
}

function buildParams(current: {
  tab: DataTab;
  period: AnalyticsPeriod;
  statusGroup: AnalyticsStatusGroup;
  campaignId?: string;
}) {
  const params = new URLSearchParams();
  params.set("tab", current.tab);
  params.set("period", current.period);
  params.set("status_group", current.statusGroup);
  if (current.campaignId) {
    params.set("campaign_id", current.campaignId);
  }
  return params.toString();
}

export default async function DataPage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string;
    period?: string;
    status_group?: string;
    campaign_id?: string;
  }>;
}) {
  const params = await searchParams;
  const tab = (params.tab as DataTab | undefined) ?? "business";
  const period = (params.period as AnalyticsPeriod | undefined) ?? "30d";
  const statusGroup = (params.status_group as AnalyticsStatusGroup | undefined) ?? "all";
  const campaignId = params.campaign_id;

  let campaigns: Awaited<ReturnType<typeof parseCampaigns>> = [];
  let model: ReturnType<typeof buildDataDashboardModel> | null = null;
  let error = false;

  try {
    const [campaignRows, leadRows, meetings, snapshots] = await Promise.all([
      getSheetData("Campagnes!A:L"),
      getSheetData("Leads_Qualified!A:P"),
      getMeetings(),
      getAnalyticsDailySnapshots(),
    ]);

    campaigns = parseCampaigns(campaignRows);
    const leads = parseLeads(leadRows);
    model = buildDataDashboardModel({
      campaigns,
      leads,
      meetings,
      snapshots,
      selectedCampaignId: campaignId,
      statusGroup,
      period,
    });
  } catch {
    error = true;
  }

  const queryState = {
    tab,
    period,
    statusGroup,
    campaignId,
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase text-orange-500 mb-2">
            Data
          </p>
          <h1 className="text-3xl font-bold text-white">Tour de contrôle analytique</h1>
          <p className="text-sm text-zinc-500 mt-2 max-w-3xl">
            Lecture consolidée des axes business, marketing et commercial à partir de Google Sheets,
            des meetings et des snapshots analytics journaliers.
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3">
          <p className="text-[11px] uppercase tracking-widest text-zinc-500 mb-1">
            Base analytique
          </p>
          <p className="text-sm text-white font-medium">`Analytics_Daily` + données live</p>
        </div>
      </div>

      <section className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-medium text-white">Filtres Data</p>
            <p className="text-sm text-zinc-500 mt-1">
              Période, statut et campagne pour garder la page utile même avec des données mixtes.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {PERIOD_OPTIONS.map((option) => (
              <Link
                key={option.value}
                href={`/dashboard/data?${buildParams({ ...queryState, period: option.value })}`}
                className={`rounded-full px-3 py-1.5 text-xs transition-colors ${
                  period === option.value
                    ? "bg-orange-500/15 text-orange-300"
                    : "bg-zinc-900 text-zinc-400 hover:text-white"
                }`}
              >
                {option.label}
              </Link>
            ))}
          </div>
        </div>

        <form method="GET" className="grid gap-4 md:grid-cols-4">
          <input type="hidden" name="tab" value={tab} />
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-2">
              Statut
            </label>
            <select
              name="status_group"
              defaultValue={statusGroup}
              className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-2">
              Campagne
            </label>
            <select
              name="campaign_id"
              defaultValue={campaignId ?? ""}
              className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
            >
              <option value="">Toutes les campagnes</option>
              {campaigns.map((campaign) => (
                <option key={campaign.campaign_id} value={campaign.campaign_id}>
                  {campaign.nom}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-2">
              Période
            </label>
            <select
              name="period"
              defaultValue={period}
              className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
            >
              {PERIOD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full px-4 py-2.5 rounded-lg bg-gradient-to-r from-orange-500 to-pink-500 text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Appliquer les filtres
            </button>
          </div>
        </form>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {TAB_OPTIONS.map((option) => (
          <Link
            key={option.value}
            href={`/dashboard/data?${buildParams({ ...queryState, tab: option.value })}`}
            className={`rounded-2xl border p-5 transition-colors ${
              tab === option.value
                ? "border-orange-500/40 bg-zinc-950"
                : "border-zinc-800 bg-black hover:border-zinc-700"
            }`}
          >
            <p className="text-sm font-semibold text-white">{option.label}</p>
            <p className="text-sm text-zinc-500 mt-2">{option.description}</p>
          </Link>
        ))}
      </section>

      {error || !model ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <p className="text-sm text-zinc-400">
            Impossible de charger les KPIs depuis Google Sheets. L’onglet reste accessible, mais
            aucune agrégation n’a pu être construite pour le moment.
          </p>
        </div>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Campagnes"
              value={model.globalKpis.totalCampaigns}
              sublabel={`${model.globalKpis.activeCampaigns} actives · ${model.globalKpis.archivedCampaigns} archivées`}
            />
            <KpiCard
              label="Leads qualifiés"
              value={model.globalKpis.qualifiedLeads}
              sublabel={`${model.globalKpis.rawLeads} leads raw dans le scope`}
            />
            <KpiCard
              label="Réponse"
              value={`${model.globalKpis.replyRate}%`}
              sublabel={`${model.globalKpis.repliesPending} réponses / clics en attente`}
            />
            <KpiCard
              label="Booking"
              value={`${model.globalKpis.bookingRate}%`}
              sublabel={`${model.globalKpis.upcomingMeetings} rendez-vous planifiés`}
            />
          </section>

          {tab === "business" ? (
            <section className="space-y-6">
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
                <div className="mb-4">
                  <p className="text-sm font-medium text-white">Vue Business</p>
                  <p className="text-sm text-zinc-500 mt-1">
                    Classement des campagnes et lecture du rendement global actif vs archivé.
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-zinc-500 border-b border-zinc-800">
                        <th className="pb-3 font-medium">Campagne</th>
                        <th className="pb-3 font-medium">Statut</th>
                        <th className="pb-3 font-medium">Leads qualifiés</th>
                        <th className="pb-3 font-medium">Emails</th>
                        <th className="pb-3 font-medium">Réponse</th>
                        <th className="pb-3 font-medium">Booking</th>
                      </tr>
                    </thead>
                    <tbody>
                      {model.businessRows.map((row) => (
                        <tr key={row.campaignId} className="border-b border-zinc-900">
                          <td className="py-3 text-white">{row.campaignName}</td>
                          <td className="py-3 text-zinc-400">{row.status}</td>
                          <td className="py-3 text-zinc-300">{row.qualifiedLeads}</td>
                          <td className="py-3 text-zinc-300">{row.emailsSent}</td>
                          <td className="py-3 text-zinc-300">{row.replyRate}%</td>
                          <td className="py-3 text-zinc-300">{row.bookingRate}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          ) : null}

          {tab === "marketing" ? (
            <section className="space-y-6">
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
                  <div className="mb-4">
                    <p className="text-sm font-medium text-white">Performance par campagne</p>
                    <p className="text-sm text-zinc-500 mt-1">
                      Lecture marketing des ouvertures, réponses et bookings.
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-zinc-500 border-b border-zinc-800">
                          <th className="pb-3 font-medium">Campagne</th>
                          <th className="pb-3 font-medium">Ouverture</th>
                          <th className="pb-3 font-medium">Réponse</th>
                          <th className="pb-3 font-medium">Booking</th>
                        </tr>
                      </thead>
                      <tbody>
                        {model.marketingRows.map((row) => (
                          <tr key={row.campaignId} className="border-b border-zinc-900">
                            <td className="py-3 text-white">{row.campaignName}</td>
                            <td className="py-3 text-zinc-300">{row.openRate}%</td>
                            <td className="py-3 text-zinc-300">{row.replyRate}%</td>
                            <td className="py-3 text-zinc-300">{row.bookingRate}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
                  <div className="mb-4">
                    <p className="text-sm font-medium text-white">Meilleurs templates</p>
                    <p className="text-sm text-zinc-500 mt-1">
                      Basé sur `Analytics_Daily` quand la donnée de template existe.
                    </p>
                  </div>
                  {model.topTemplates.length > 0 ? (
                    <div className="space-y-3">
                      {model.topTemplates.map((template) => (
                        <div
                          key={template.templateKey}
                          className="rounded-xl border border-zinc-800 bg-black px-4 py-3 flex items-center justify-between gap-3"
                        >
                          <span className="text-sm text-white">{template.templateKey}</span>
                          <span className="text-xs rounded-full bg-orange-500/15 px-2.5 py-1 text-orange-300">
                            {template.replies} replies
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-zinc-800 bg-black px-4 py-6">
                      <p className="text-sm text-zinc-400">
                        Aucune performance template exploitable pour l’instant. La source sera
                        enrichie au fil des snapshots analytics.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
                <div className="mb-4">
                  <p className="text-sm font-medium text-white">Performance par segment</p>
                  <p className="text-sm text-zinc-500 mt-1">
                    Segment principal calculé à partir du secteur des leads qualifiés.
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-zinc-500 border-b border-zinc-800">
                        <th className="pb-3 font-medium">Segment</th>
                        <th className="pb-3 font-medium">Leads qualifiés</th>
                        <th className="pb-3 font-medium">Replies</th>
                        <th className="pb-3 font-medium">Meetings</th>
                      </tr>
                    </thead>
                    <tbody>
                      {model.segmentRows.map((row) => (
                        <tr key={row.segment} className="border-b border-zinc-900">
                          <td className="py-3 text-white">{row.segment}</td>
                          <td className="py-3 text-zinc-300">{row.qualifiedLeads}</td>
                          <td className="py-3 text-zinc-300">{row.replies}</td>
                          <td className="py-3 text-zinc-300">{row.meetings}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          ) : null}

          {tab === "commercial" ? (
            <section className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <KpiCard
                  label="Réponses à traiter"
                  value={model.globalKpis.repliesPending}
                  sublabel="Leads replied ou clicked à prioriser"
                />
                <KpiCard
                  label="Meetings à venir"
                  value={model.globalKpis.upcomingMeetings}
                  sublabel="Rendez-vous planifiés dans le scope"
                />
                <KpiCard
                  label="Taux d'ouverture"
                  value={`${model.globalKpis.openRate}%`}
                  sublabel="Indicateur global de traction campagne"
                />
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
                <div className="mb-4">
                  <p className="text-sm font-medium text-white">Priorités commerciales</p>
                  <p className="text-sm text-zinc-500 mt-1">
                    Campagnes à traiter selon le volume de réponses en attente et les meetings à venir.
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-zinc-500 border-b border-zinc-800">
                        <th className="pb-3 font-medium">Campagne</th>
                        <th className="pb-3 font-medium">Réponses en attente</th>
                        <th className="pb-3 font-medium">Meetings</th>
                        <th className="pb-3 font-medium">Leads replied</th>
                      </tr>
                    </thead>
                    <tbody>
                      {model.commercialRows.map((row) => (
                        <tr key={row.campaignId} className="border-b border-zinc-900">
                          <td className="py-3 text-white">{row.campaignName}</td>
                          <td className="py-3 text-zinc-300">{row.pendingReplies}</td>
                          <td className="py-3 text-zinc-300">{row.upcomingMeetings}</td>
                          <td className="py-3 text-zinc-300">{row.repliedLeads}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
