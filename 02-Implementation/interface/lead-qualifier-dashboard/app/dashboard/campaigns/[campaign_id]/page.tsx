import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ChevronRight } from "lucide-react";
import {
  readIndex,
  parseIndexCampaigns,
  indexCampaignToCampaign,
  readChildSheet,
} from "@/lib/sheets";
import { ActionButtons } from "./ActionButtons";
import { CampaignStatsHeader } from "./CampaignStatsHeader";
import { KanbanBoard } from "./KanbanBoard";
import type { KanbanLead } from "./kanban-columns";

function parseKanbanLeads(rows: string[][]): KanbanLead[] {
  return rows
    .filter((r) => r[0])
    .map((r) => ({
      lead_id:          r[0]  ?? "",
      nom:              r[2]  ?? "",
      ville:            r[4]  ?? "",
      score:            r[5]  ?? "0",
      site:             r[3]  ?? "",
      email:            r[7]  ?? "",
      téléphone:        r[8]  ?? "",
      secteur:          r[11] ?? "",
      poste:            r[10] ?? "",
      personalized_hook: r[17] ?? "",
      statut_email:     r[18] ?? "new",
    }));
}

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ campaign_id: string }>;
}) {
  const { campaign_id } = await params;

  const indexRows = await readIndex();
  const indexCampaign = parseIndexCampaigns(indexRows).find((c) => c.campaign_id === campaign_id);
  if (!indexCampaign) notFound();

  const campaign = indexCampaignToCampaign(indexCampaign);

  const leadRows = indexCampaign.sheet_id
    ? await readChildSheet(indexCampaign.sheet_id, `${campaign_id}_Qualified!A2:S`)
    : [];
  const leads = parseKanbanLeads(leadRows);

  const qualified = parseInt(campaign.total_leads_qualified || "0", 10) || 0;
  const emailsSent = parseInt(campaign.emails_envoyés || "0", 10) || 0;
  const openRate = parseFloat(campaign.taux_ouverture || "0") || 0;
  const replyRate = parseFloat(campaign.taux_réponse || "0") || 0;

  return (
    <div className="px-1 py-2 sm:px-2 sm:py-3">
      {/* Breadcrumb */}
      <nav className="mb-5 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link
          href="/dashboard/campaigns/overview"
          className="transition-colors hover:text-foreground"
        >
          Campagnes
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="truncate text-foreground">{campaign.nom}</span>
      </nav>

      <CampaignStatsHeader
        campaignId={campaign_id}
        name={campaign.nom}
        subtitle={`${campaign.offre_kames || "Prospection"} · ${campaign.secteur} · ${campaign.localisation}`}
        status={campaign.statut}
        qualified={qualified}
        emailsSent={emailsSent}
        openRate={openRate}
        replyRate={replyRate}
        sheetUrl={indexCampaign.sheet_url}
      />

      {/* Action bar */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-slate-200 bg-white/60 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/dashboard/campaigns/suivi-detaille?c=${encodeURIComponent(campaign_id)}`}
            className="inline-flex h-[34px] items-center gap-1.5 rounded-[10px] border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700 transition-colors hover:border-primary/30 hover:text-primary"
          >
            Voir en tableau détaillé
            <ArrowRight className="size-3.5" />
          </Link>
          <a
            href={`/api/campaigns/${campaign_id}/export?format=csv`}
            className="inline-flex h-[34px] items-center rounded-[10px] border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700 transition-colors hover:border-slate-300"
          >
            Export CSV
          </a>
          <a
            href={`/api/campaigns/${campaign_id}/export?format=json`}
            className="inline-flex h-[34px] items-center rounded-[10px] border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700 transition-colors hover:border-slate-300"
          >
            Export JSON
          </a>
          <a
            href={`/api/campaigns/${campaign_id}/export?format=instantly`}
            className="inline-flex h-[34px] items-center rounded-[10px] border border-primary/25 bg-primary/5 px-3 text-[13px] font-medium text-primary transition-colors hover:bg-primary/10"
          >
            Instantly
          </a>
        </div>
        <ActionButtons campaignId={campaign_id} />
      </div>

      {/* Kanban */}
      <div className="mt-5">
        <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
          Pipeline des leads
        </h2>
        <KanbanBoard
          leads={leads}
          campaignId={campaign_id}
          sheetId={indexCampaign.sheet_id ?? ""}
        />
      </div>
    </div>
  );
}
