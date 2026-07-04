import Link from "next/link";
import { createEmptyCampaignEmailTemplates } from "@/lib/email-templates";
import {
  getCampaignEmailTemplates,
  readIndex,
  parseIndexCampaigns,
  indexCampaignToCampaign,
  type Campaign,
} from "@/lib/sheets";
import { TemplatesEditor } from "./TemplatesEditor";

export default async function TemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ campaign_id?: string }>;
}) {
  const { campaign_id } = await searchParams;

  let campaigns: Campaign[] = [];
  try {
    const indexRows = await readIndex();
    campaigns = parseIndexCampaigns(indexRows).map(indexCampaignToCampaign);
  } catch {
    campaigns = [];
  }

  const selectedCampaign =
    campaigns.find((campaign) => campaign.campaign_id === campaign_id) ??
    campaigns.find((campaign) => campaign.statut === "active" || campaign.statut === "generating") ??
    campaigns[0];

  if (!selectedCampaign) {
    return (
      <div className="px-1 py-2 sm:px-2 sm:py-3">
        <div className="mb-8">
          <div className="max-w-2xl">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#059669]">
              Emailing
            </p>
            <h1 className="font-flinty text-3xl font-extrabold tracking-tight text-black">
              Aucune campagne disponible
            </h1>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[var(--dashboard-text-secondary)] sm:text-base">
              Cree d&apos;abord une campagne pour pouvoir stocker ses variantes d&apos;emails et
              ses relances.
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/campaigns/new"
          className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
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
    <div className="px-1 py-2 sm:px-2 sm:py-3">
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
