import React from "react";
import { readIndex, parseIndexCampaigns, readChildSheet } from "@/lib/sheets";
import {
  parseQualifiedLeadsDetailed,
  parseRejectedLeads,
  type QualifiedLeadDetailed,
  type RejectedLead,
} from "@/lib/sheets-detailed";
import { CampaignsSubNav } from "../CampaignsSubNav";
import { DetailedLeadsView } from "./DetailedLeadsView";

interface PageProps {
  searchParams: Promise<{ c?: string }>;
}

export default async function SuiviDetaillePage({ searchParams }: PageProps) {
  const { c } = await searchParams;
  const selectedCampaignId = c?.trim() || null;

  let campaigns: { campaign_id: string; nom: string }[] = [];
  let qualifiedLeads: QualifiedLeadDetailed[] = [];
  let rejectedLeads: RejectedLead[] = [];
  let error: string | null = null;
  let selectedSheetId: string | null = null;

  try {
    const indexRows = await readIndex();
    const indexCampaigns = parseIndexCampaigns(indexRows);
    campaigns = indexCampaigns
      .filter((c) => c.statut !== "archived")
      .map((c) => ({ campaign_id: c.campaign_id, nom: c.nom }));

    if (selectedCampaignId) {
      const selected = indexCampaigns.find((c) => c.campaign_id === selectedCampaignId);
      if (!selected) {
        error = `Campagne "${selectedCampaignId}" introuvable.`;
      } else if (!selected.sheet_id) {
        error = "Cette campagne n'a pas encore de Google Sheet associé.";
      } else {
        selectedSheetId = selected.sheet_id;
      }
    }
  } catch (e) {
    error = "Google Sheets non configuré. Renseigne les credentials dans .env.local.";
  }

  if (selectedSheetId && selectedCampaignId) {
    try {
      const [qualifiedRows, rejectedRows] = await Promise.all([
        readChildSheet(selectedSheetId, `${selectedCampaignId}_Qualified!A:U`),
        readChildSheet(selectedSheetId, `${selectedCampaignId}_Rejected!A:G`),
      ]);
      qualifiedLeads = parseQualifiedLeadsDetailed(qualifiedRows);
      rejectedLeads = parseRejectedLeads(rejectedRows);
    } catch (e) {
      error = "Impossible de lire les onglets de la campagne. Vérifie les permissions du Service Account.";
    }
  }

  return (
    <div className="px-1 py-2 sm:px-2 sm:py-3">
      <div className="mb-6">
        <div className="max-w-2xl">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#006596]">
            Campaigns
          </p>
          <h1 className="font-flinty text-3xl font-extrabold tracking-tight text-black">
            Suivi détaillé
          </h1>
        </div>
        <p className="mt-3 text-sm text-[var(--dashboard-text-secondary)] sm:text-base">
          Tableau Airtable-like de tous les leads d&apos;une campagne, synchronisés depuis Google Sheets.
        </p>
      </div>

      <CampaignsSubNav />

      <DetailedLeadsView
        campaigns={campaigns}
        selectedCampaignId={selectedCampaignId}
        qualifiedLeads={qualifiedLeads}
        rejectedLeads={rejectedLeads}
        error={error}
      />
    </div>
  );
}
