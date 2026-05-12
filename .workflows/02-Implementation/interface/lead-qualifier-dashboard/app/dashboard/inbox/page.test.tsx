import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.stubGlobal("React", React);

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { children: React.ReactNode }) => (
    <a href={String(href)} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/sheets", () => ({
  QUALIFIED_SHEET_RANGE_WITH_HEADER: "A1:AB5000",
  getAllEmailEvents: vi.fn(async () => {
    throw new Error("Email_Events unavailable");
  }),
  getMeetings: vi.fn(async () => {
    throw new Error("Meetings unavailable");
  }),
  parseIndexCampaigns: vi.fn(() => [
    {
      campaign_id: "cmp_missing",
      nom: "Campagne incomplète",
      sheet_id: "sheet-id",
      sheet_url: "",
      secteur: "SaaS",
      localisation: "Paris",
      offre_kames: "Flinty",
      statut: "active",
      date_création: "2026-05-12",
      total_leads_raw: "0",
      total_leads_qualified: "0",
      emails_envoyés: "0",
      taux_réponse: "0",
    },
  ]),
  readChildQualifiedLeads: vi.fn(async () => {
    throw new Error("Unable to parse range");
  }),
  readIndex: vi.fn(async () => [["campaign_id"], ["cmp_missing"]]),
}));

import InboxPage from "./page";

describe("InboxPage", () => {
  it("affiche une inbox vide sans crasher si les feuilles conversationnelles sont absentes", async () => {
    const html = renderToStaticMarkup(
      await InboxPage({ searchParams: Promise.resolve({}) })
    );

    expect(html).toContain("Conversations");
    expect(html).toContain("Aucune réponse en attente.");
  });
});
