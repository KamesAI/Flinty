import Link from "next/link";
import { notFound } from "next/navigation";
import { getCampaignById } from "@/lib/campaigns";
import { readChildSheet } from "@/lib/sheets";
import { KanbanBoard } from "../KanbanBoard";
import { CampaignTabNav } from "../CampaignTabNav";
import type { KanbanLead } from "../kanban-columns";

function parseKanbanLeads(rows: string[][]): KanbanLead[] {
  return rows.map((r) => ({
    lead_id: r[0] ?? "",
    nom: r[2] ?? "",
    ville: r[4] ?? "",
    score: r[5] ?? "0",
    secteur: r[6] ?? "",
    poste: r[7] ?? "",
    site: r[8] ?? "",
    téléphone: r[9] ?? "",
    email: r[10] ?? "",
    personalized_hook: r[17] ?? "",
    statut_email: r[18] ?? "new",
  }));
}

export default async function KanbanPage({
  params,
}: {
  params: Promise<{ campaign_id: string }>;
}) {
  const { campaign_id } = await params;

  const resolved = await getCampaignById(campaign_id);
  if (!resolved) notFound();

  const { campaign, sheetId } = resolved;

  const rows = await readChildSheet(sheetId, `${campaign_id}_Qualified!A2:S`);
  const leads = parseKanbanLeads(rows);

  return (
    <div className="p-4 sm:p-8">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-zinc-500">
        <Link href="/dashboard" className="transition-colors hover:text-white">
          Campagnes
        </Link>
        <span>/</span>
        <Link
          href={`/dashboard/campaigns/${campaign_id}`}
          className="transition-colors hover:text-white"
        >
          {campaign.nom}
        </Link>
        <span>/</span>
        <span className="text-white">Kanban</span>
      </div>

      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">{campaign.nom}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {campaign.offre_kames} · {campaign.secteur} · {campaign.localisation}
          </p>
        </div>
        <span className="text-xs text-zinc-500">{leads.length} lead{leads.length !== 1 ? "s" : ""}</span>
      </div>

      <CampaignTabNav campaignId={campaign_id} />

      <KanbanBoard leads={leads} campaignId={campaign_id} sheetId={sheetId} />
    </div>
  );
}
