import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/sheets", () => ({
  readIndex: vi.fn(async () => []),
  parseIndexCampaigns: vi.fn(() => []),
  indexCampaignToCampaign: vi.fn((campaign) => campaign),
}));

import CampaignsOverviewPage from "./page";

describe("CampaignsOverviewPage", () => {
  it("affiche le CTA de creation au-dessus du kanban vide", async () => {
    const html = renderToStaticMarkup(await CampaignsOverviewPage());

    expect(html).toContain("Nouvelle campagne");
    expect(html).not.toContain("Créer votre première campagne");
  });

  it("utilise des classes de texte compatibles avec le theme du dashboard", async () => {
    const html = renderToStaticMarkup(await CampaignsOverviewPage());

    expect(html).toContain("font-flinty text-3xl font-extrabold tracking-tight text-black");
    expect(html).toContain("text-[var(--dashboard-text-secondary)]");
    expect(html).not.toContain("text-3xl font-bold text-white");
  });

  it("reprend la structure Lovable avec onglets et colonnes réduites", async () => {
    const html = renderToStaticMarkup(await CampaignsOverviewPage());

    expect(html).toContain("En cours");
    expect(html).toContain("Archivées");
    expect(html).toContain("Brouillon");
    expect(html).toContain("En pause");
    expect(html).not.toContain("Terminées");
    expect(html).not.toContain("Arrêtées");
    expect(html).not.toContain("Échouées");
  });

  it("affiche des boutons d'action alignés sur le style Lovable", async () => {
    const html = renderToStaticMarkup(await CampaignsOverviewPage());

    expect(html).toContain("data-testid=\"campaigns-subheader\"");
    expect(html).toContain("data-testid=\"campaigns-actions\"");
    expect(html).toContain("lucide lucide-archive");
    expect(html).toContain("lucide lucide-plus");
    expect(html).toContain("h-[40px]");
    expect(html).toContain("rounded-[14px]");
    expect(html).toContain("text-[14px]");
    expect(html).toContain("bg-primary");
    expect(html).toContain("border-[#E5EAF3] bg-white");
  });
});
