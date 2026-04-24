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

vi.mock("@/lib/sheets", () => ({
  readIndex: readIndexMock,
  parseIndexCampaigns: parseIndexMock,
  readChildSheet: readChildMock,
}));

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

  it("expose la sous-navigation Campaigns", async () => {
    parseIndexMock.mockReturnValueOnce([]);
    const html = renderToStaticMarkup(
      await SuiviDetaillePage({ searchParams: Promise.resolve({}) })
    );
    expect(html).toContain("data-testid=\"campaigns-subnav\"");
    expect(html).toContain("Suivi détaillé");
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
           "web_quality_score", "web_quality_signals"],
          ["l_1", "c_1", "Acme", "acme.fr", "Paris", "85", "", "hi@acme.fr", "", "Jean",
           "CEO", "SaaS", "11-50", "no", "", "", "", "", "new", "", ""],
        ];
      }
      return [["lead_id", "campaign_id", "nom", "site", "score", "rejection_reason", "processed_at"]];
    });

    const html = renderToStaticMarkup(
      await SuiviDetaillePage({ searchParams: Promise.resolve({ c: "c_1" }) })
    );
    expect(html).toContain("Acme");
    expect(html).toContain("hi@acme.fr");
    expect(html).toContain("Qualifiés");
    expect(html).toContain("Rejetés");
  });
});
