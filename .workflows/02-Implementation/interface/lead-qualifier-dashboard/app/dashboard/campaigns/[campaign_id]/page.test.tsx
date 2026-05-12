import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CampaignDetailPage from "./page";

vi.mock("@/lib/sheets", () => ({
  indexCampaignToCampaign: vi.fn((campaign) => ({
    campaign_id: campaign.campaign_id,
    nom: campaign.nom,
    secteur: campaign.secteur,
    localisation: campaign.localisation,
    date_création: campaign.date_création,
    offre_kames: campaign.offre_kames,
    statut: campaign.statut,
    total_leads_raw: campaign.total_leads_raw,
    total_leads_qualified: campaign.total_leads_qualified,
    emails_envoyés: campaign.emails_envoyés,
    taux_ouverture: "0",
    taux_réponse: campaign.taux_réponse,
  })),
  parseIndexCampaigns: vi.fn(),
  readChildSheet: vi.fn(),
  readIndex: vi.fn(),
}));

vi.mock("./ActionButtons", () => ({
  ActionButtons: () => <div data-testid="action-buttons" />,
}));

vi.mock("./KanbanBoard", () => ({
  KanbanBoard: ({ leads }: { leads: unknown[] }) => (
    <div data-testid="kanban-board">leads={leads.length}</div>
  ),
}));

import { parseIndexCampaigns, readChildSheet, readIndex } from "@/lib/sheets";

const campaign = {
  campaign_id: "cmp_wbjwwtqy",
  nom: "Sites web artisans Bordeaux",
  sheet_id: "sheet-id",
  sheet_url: "https://docs.google.com/spreadsheets/d/sheet-id",
  secteur: "BTP",
  localisation: "Bordeaux",
  offre_kames: "Sites web",
  statut: "archived" as const,
  date_création: "2026-04-25",
  total_leads_raw: "0",
  total_leads_qualified: "0",
  emails_envoyés: "0",
  taux_réponse: "0",
};

describe("CampaignDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(readIndex).mockResolvedValue([]);
    vi.mocked(parseIndexCampaigns).mockReturnValue([campaign]);
  });

  it("affiche la page même si l'onglet Qualified préfixé n'existe pas encore", async () => {
    vi.mocked(readChildSheet)
      .mockRejectedValueOnce(new Error("Unable to parse range: cmp_wbjwwtqy_Qualified!A2:S"))
      .mockResolvedValueOnce([]);

    const element = await CampaignDetailPage({
      params: Promise.resolve({ campaign_id: "cmp_wbjwwtqy" }),
    });
    const html = renderToStaticMarkup(element);

    expect(html).toContain("Sites web artisans Bordeaux");
    expect(html).toContain("leads=0");
    expect(readChildSheet).toHaveBeenNthCalledWith(2, "sheet-id", "Leads_Qualified!A2:S");
  });
});
