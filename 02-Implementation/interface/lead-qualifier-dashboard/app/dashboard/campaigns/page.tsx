import Link from "next/link";
import { getSheetData, parseCampaigns, parseLeads } from "@/lib/sheets";
import type { CampaignRowProps } from "../CampaignRow";
import { CampaignList } from "../CampaignList";

export default async function CampaignesPage() {
  let campaigns: Awaited<ReturnType<typeof parseCampaigns>> = [];
  let leads: Awaited<ReturnType<typeof parseLeads>> = [];
  let error = false;

  try {
    const [campRows, leadRows] = await Promise.all([
      getSheetData("Campagnes!A:L"),
      getSheetData("Leads_Qualified!A:P"),
    ]);
    campaigns = parseCampaigns(campRows);
    leads = parseLeads(leadRows);
  } catch {
    error = true;
  }

  const totalLeadsQualified = leads.length;
  const totalEmailsSent = leads.filter((l) =>
    ["contacted", "relance_1", "relance_2", "opened", "clicked", "replied", "bounced"].includes(l.statut_email)
  ).length;
  const repliedCount = leads.filter((l) => l.statut_email === "replied").length;
  const avgOpen = campaigns.length
    ? Math.round(
        campaigns.reduce((s, c) => s + parseFloat(c.taux_ouverture || "0"), 0) /
          campaigns.length
      )
    : 0;

  const campaignRows: CampaignRowProps[] = campaigns.map((campaign) => ({
    href: `/dashboard/campaigns/${campaign.campaign_id}`,
    name: campaign.nom,
    subtitle: `${campaign.secteur} · ${campaign.offre_kames || "Prospection"} · ${campaign.localisation}`,
    status:
      campaign.statut === "active"
        ? "active"
        : campaign.statut === "completed"
          ? "completed"
          : campaign.statut === "paused"
            ? "paused"
            : "inactive",
    stats: {
      raw: parseInt(campaign.total_leads_raw || "0", 10) || 0,
      qualified: parseInt(campaign.total_leads_qualified || "0", 10) || 0,
      contacted: parseInt(campaign.emails_envoyés || "0", 10) || 0,
      replies:
        Math.round(
          ((parseFloat(campaign.taux_réponse || "0") || 0) *
            (parseInt(campaign.emails_envoyés || "0", 10) || 0)) /
            100
        ) || 0,
    },
    openRate: parseFloat(campaign.taux_ouverture || "0") || 0,
    replyRate: parseFloat(campaign.taux_réponse || "0") || 0,
    isGenerating: campaign.statut === "generating",
  }));

  return (
    <div className="p-4 sm:p-8">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase text-[#FFA318] mb-1">
            Campagnes
          </p>
          <h1 className="text-3xl font-bold text-white">
            Toutes les campagnes
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            {campaigns.length} campagne{campaigns.length !== 1 ? "s" : ""} au total
          </p>
        </div>
        <Link
          href="/dashboard/campaigns/new"
          className="group relative inline-flex items-center justify-center"
        >
          <span className="pointer-events-none absolute inset-x-5 inset-y-1.5 rounded-full bg-orange-500/30 blur-xl transition-opacity duration-300 group-hover:opacity-90" />
          <span className="relative inline-flex rounded-full bg-gradient-to-r from-orange-500 via-orange-400 to-white p-[1px]">
            <span className="inline-flex min-w-[170px] items-center justify-center rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white transition-colors duration-300 group-hover:text-zinc-100">
              Nouvelle campagne
            </span>
          </span>
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Campagnes", value: campaigns.length },
          { label: "Leads qualifiés", value: totalLeadsQualified },
          { label: "Emails envoyés", value: totalEmailsSent },
          { label: "Taux ouverture moy.", value: `${avgOpen}%` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
            <p className="text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-1">
              {label}
            </p>
            <p className="text-2xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Erreur GSheet */}
      {error && (
        <div className="mb-6 border border-zinc-700 bg-zinc-900/50 rounded-lg px-4 py-3">
          <p className="text-zinc-400 text-sm">
            ⚠️ Google Sheets non configuré — renseigner les credentials dans{" "}
            <code className="text-orange-400 text-xs">.env.local</code>
          </p>
        </div>
      )}

      {/* Liste */}
      {campaignRows.length === 0 ? (
        <div className="text-center py-24 text-zinc-600">
          <p className="text-base mb-4">Aucune campagne créée</p>
          <Link
            href="/dashboard/campaigns/new"
            className="group relative inline-flex items-center justify-center"
          >
            <span className="pointer-events-none absolute inset-x-5 inset-y-1.5 rounded-full bg-orange-500/30 blur-xl transition-opacity duration-300 group-hover:opacity-90" />
            <span className="relative inline-flex rounded-full bg-gradient-to-r from-orange-500 via-orange-400 to-white p-[1px]">
              <span className="inline-flex min-w-[220px] items-center justify-center rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white transition-colors duration-300 group-hover:text-zinc-100">
                Créer votre première campagne
              </span>
            </span>
          </Link>
        </div>
      ) : (
        <CampaignList campaigns={campaignRows} />
      )}
    </div>
  );
}
