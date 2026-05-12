import React from "react";
import Link from "next/link";
import { Archive, Plus } from "lucide-react";
import {
  readIndex,
  parseIndexCampaigns,
  indexCampaignToCampaign,
  type Campaign,
} from "@/lib/sheets";
import { CampaignKanban } from "../CampaignKanban";

export default async function CampaignsOverviewPage() {
  let campaigns: Campaign[] = [];
  let error = false;

  try {
    const indexRows = await readIndex();
    const indexCampaigns = parseIndexCampaigns(indexRows);
    campaigns = indexCampaigns.map(indexCampaignToCampaign);
  } catch {
    error = true;
  }

  const campaignCards = campaigns.map((campaign) => ({
    id: campaign.campaign_id,
    href: `/dashboard/campaigns/${campaign.campaign_id}`,
    name: campaign.nom,
    segment: `${campaign.secteur} · ${campaign.offre_kames || "Prospection"} · ${campaign.localisation}`,
    rawStatus: campaign.statut,
    qualified: parseInt(campaign.total_leads_qualified || "0", 10) || 0,
    contacted: parseInt(campaign.emails_envoyés || "0", 10) || 0,
    replies:
      Math.round(
        ((parseFloat(campaign.taux_réponse || "0") || 0) *
          (parseInt(campaign.emails_envoyés || "0", 10) || 0)) /
          100,
      ) || 0,
    openRate: parseFloat(campaign.taux_ouverture || "0") || 0,
  }));

  return (
    <div className="px-1 py-2 sm:px-2 sm:py-3">
      <div className="mb-6">
        <div className="max-w-2xl">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#006596]">
            Campaigns
          </p>
          <h1 className="font-flinty text-3xl font-extrabold tracking-tight text-black">
            Campagnes
          </h1>
        </div>
        <div
          data-testid="campaigns-subheader"
          className="mt-3 flex flex-wrap items-center justify-between gap-3"
        >
          <p className="text-sm text-[var(--dashboard-text-secondary)] sm:text-base">
            Vue Kanban de votre pipeline d&apos;outreach.
          </p>
          <div data-testid="campaigns-actions" className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex h-[40px] items-center justify-center gap-1.5 rounded-[14px] border border-[#E5EAF3] bg-white px-[16px] text-[14px] font-medium text-slate-900 shadow-[0_2px_8px_rgba(15,23,42,0.05)] transition-colors hover:bg-white"
            >
              <Archive className="size-[14px] text-slate-800" strokeWidth={2.1} />
              Archiver
            </button>
            <Link
              href="/dashboard/campaigns/new"
              className="inline-flex h-[40px] items-center justify-center gap-1.5 rounded-[14px] bg-primary px-[18px] text-[14px] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Plus className="size-[15px]" strokeWidth={2.2} />
              Nouvelle campagne
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3">
          <p className="text-sm text-[var(--dashboard-text-secondary)]">
            Google Sheets non configuré. Renseigne les credentials dans{" "}
            <code className="text-[#006596] text-xs">.env.local</code>
          </p>
        </div>
      )}

      <CampaignKanban campaigns={campaignCards} />
    </div>
  );
}
