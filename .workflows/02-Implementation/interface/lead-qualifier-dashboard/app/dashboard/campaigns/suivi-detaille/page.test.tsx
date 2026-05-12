import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const { readIndexMock, parseIndexMock, readChildMock } = vi.hoisted(() => ({
  readIndexMock: vi.fn(async () => [] as string[][]),
  parseIndexMock: vi.fn(() => [] as Array<{
    campaign_id: string;
    nom: string;
    sheet_id: string;
    statut: string;
  }>),
  readChildMock: vi.fn(async () => [] as string[][]),
}));

vi.mock("@/lib/sheets", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/sheets")>();
  return {
    ...actual,
    readIndex: readIndexMock,
    parseIndexCampaigns: parseIndexMock,
    readChildSheet: readChildMock,
    readChildQualifiedLeads: (sheetId: string, campaignId: string, a1: string) =>
      readChildMock(
        sheetId,
        actual.childSheetA1Range(`${campaignId}_Qualified`, a1)
      ),
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/dashboard/campaigns/suivi-detaille",
}));

import SuiviDetaillePage from "./page";

describe("SuiviDetaillePage", () => {
  it("affiche l'empty state quand aucune campagne n'est sélectionnée", async () => {
    parseIndexMock.mockReturnValueOnce([
      { campaign_id: "c_1", nom: "Campagne A", sheet_id: "sid-1", statut: "active" },
    ]);
    const html = renderToStaticMarkup(
      await SuiviDetaillePage({ searchParams: Promise.resolve({}) })
    );
    expect(html).toContain("Sélectionne une campagne");
    expect(html).toContain("Campagne A");
  });

  it("affiche un message d'erreur quand la campagne demandée est introuvable", async () => {
    parseIndexMock.mockReturnValueOnce([
      { campaign_id: "c_1", nom: "Campagne A", sheet_id: "sid-1", statut: "active" },
    ]);
    const html = renderToStaticMarkup(
      await SuiviDetaillePage({ searchParams: Promise.resolve({ c: "c_inconnue" }) })
    );
    expect(html).toContain("introuvable");
  });

  it("lit les onglets Qualified et Rejected quand une campagne est sélectionnée", async () => {
    parseIndexMock.mockReturnValueOnce([
      { campaign_id: "c_1", nom: "Campagne A", sheet_id: "sid-1", statut: "active" },
    ]);
    readChildMock.mockImplementation(async (_sheetId, range) => {
      if (range.includes("_Qualified")) {
        return [
          ["lead_id", "campaign_id", "nom", "site", "ville", "score", "score_reason", "email",
           "téléphone", "prénom", "poste", "secteur", "taille_equipe", "has_ia_services",
           "hiring_signals", "growth_stage", "buying_signal", "personalized_hook", "statut_email",
           "web_quality_score", "web_quality_signals", "societe", "prenom_gerant", "nom_gerant",
           "email_gerant", "email_type", "email_confidence"],
          ["l_1", "c_1", "Acme", "acme.fr", "Paris", "85", "", "hi@acme.fr", "", "Jean",
           "CEO", "SaaS", "11-50", "no", "", "", "", "Hook Acme", "new", "", "",
           "Acme", "Jean", "Martin", "jean.martin@acme.fr", "nominatif_gerant", "high"],
        ];
      }
      return [["lead_id", "campaign_id", "nom", "site", "score", "rejection_reason", "processed_at"]];
    });

    const html = renderToStaticMarkup(
      await SuiviDetaillePage({ searchParams: Promise.resolve({ c: "c_1" }) })
    );
    expect(html).toContain("Acme");
    expect(html).toContain("jean.martin@acme.fr");
    expect(html).toContain("Martin");
    expect(html).toContain("Qualifiés");
    expect(html).toContain("Rejetés");
    expect(readChildMock).toHaveBeenCalledWith("sid-1", "'c_1_Qualified'!A1:AB5000");
  });
});
