import Link from "next/link";
import { createEmptyCampaignEmailTemplates } from "@/lib/email-templates";
import { getCampaignEmailTemplates, getSheetData, parseCampaigns } from "@/lib/sheets";
import { TemplatesEditor } from "./TemplatesEditor";

export default async function TemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ campaign_id?: string }>;
}) {
  const { campaign_id } = await searchParams;

  let campaigns: ReturnType<typeof parseCampaigns> = [];
  try {
    const campRows = await getSheetData("Campagnes!A:L");
    campaigns = parseCampaigns(campRows);
  } catch {
    campaigns = [];
  }

  const selectedCampaign =
    campaigns.find((campaign) => campaign.campaign_id === campaign_id) ??
    campaigns.find((campaign) => campaign.statut === "active" || campaign.statut === "generating") ??
    campaigns[0];

  if (!selectedCampaign) {
    return (
      <div className="p-8">
        <p className="text-xs font-semibold tracking-widest uppercase text-orange-400 mb-2">
          Templates email
        </p>
        <h1 className="text-3xl font-bold text-white mb-2">Aucune campagne disponible</h1>
        <p className="text-sm text-zinc-500 mb-6 max-w-xl">
          Cree d&apos;abord une campagne pour pouvoir stocker ses variantes d&apos;emails et
          ses relances.
        </p>
        <Link
          href="/dashboard/campaigns/new"
          className="inline-flex px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-pink-500 text-white font-medium text-sm hover:opacity-90 transition-opacity"
        >
          + Nouvelle campagne
        </Link>
      </div>
    );
  }

  const templates = await getCampaignEmailTemplates(selectedCampaign.campaign_id).catch(() =>
    createEmptyCampaignEmailTemplates(selectedCampaign.campaign_id)
  );

  return (
    <div className="p-8">
      <TemplatesEditor
        key={selectedCampaign.campaign_id}
        campaigns={campaigns.map((campaign) => ({
          campaign_id: campaign.campaign_id,
          nom: campaign.nom,
          secteur: campaign.secteur,
          localisation: campaign.localisation,
        }))}
        selectedCampaignId={selectedCampaign.campaign_id}
        initialTemplates={templates}
      />
    </div>
  );
}
