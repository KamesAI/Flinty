import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CampaignStatsHeader } from "./CampaignStatsHeader";

const baseProps = {
  campaignId: "c_1",
  name: "Flinty — Marketing Paris 04/2026",
  subtitle: "Audit IA · Marketing · Paris",
  status: "active" as const,
  qualified: 42,
  emailsSent: 30,
  openRate: 58.3,
  replyRate: 12.1,
  rawLeads: 20,
  sheetUrl: "https://docs.google.com/sheets/d/abc",
};

describe("CampaignStatsHeader", () => {
  it("affiche le nom et le sous-titre", () => {
    const html = renderToStaticMarkup(<CampaignStatsHeader {...baseProps} />);
    expect(html).toContain("Flinty — Marketing Paris 04/2026");
    expect(html).toContain("Audit IA · Marketing · Paris");
  });

  it("affiche les 4 KPIs avec leurs valeurs formatées", () => {
    const html = renderToStaticMarkup(<CampaignStatsHeader {...baseProps} />);
    expect(html).toContain("42"); // qualified
    expect(html).toContain("30"); // emails sent
    expect(html).toContain("58.3"); // open rate
    expect(html).toContain("12.1"); // reply rate
  });

  it("formate '0' correctement (plutôt que '—' ou vide)", () => {
    const html = renderToStaticMarkup(
      <CampaignStatsHeader {...baseProps} qualified={0} emailsSent={0} openRate={0} replyRate={0} />
    );
    // should show 0 in the KPI cards
    const zeroCount = (html.match(/>0</g) ?? []).length;
    expect(zeroCount).toBeGreaterThanOrEqual(2);
  });

  it("affiche un badge de statut (active / paused / draft)", () => {
    const html = renderToStaticMarkup(<CampaignStatsHeader {...baseProps} status="active" />);
    expect(html.toLowerCase()).toContain("active");

    const htmlPaused = renderToStaticMarkup(<CampaignStatsHeader {...baseProps} status="paused" />);
    expect(htmlPaused.toLowerCase()).toContain("pause");
  });

  it("affiche que la génération raw est en cours quand le statut est generating", () => {
    const html = renderToStaticMarkup(
      <CampaignStatsHeader {...baseProps} status="generating" rawLeads={0} qualified={0} />
    );

    expect(html).toContain("Génération raw en cours");
    expect(html).toContain("Qualification : —");
  });

  it("affiche Leads raw générés avec compteur quand la génération raw est terminée (active)", () => {
    const html = renderToStaticMarkup(
      <CampaignStatsHeader {...baseProps} status="active" rawLeads={142} qualified={0} />
    );

    expect(html).toContain("Leads raw générés");
    expect(html).toContain("142");
    expect(html).toContain("Qualification : en attente");
  });

  it("affiche Leads raw générés · 0 quand actif et aucun lead raw (callback avec 0)", () => {
    const html = renderToStaticMarkup(
      <CampaignStatsHeader {...baseProps} status="active" rawLeads={0} qualified={0} />
    );

    expect(html).toContain("Leads raw générés");
    expect(html).toMatch(/Leads raw générés ·\s*0/);
  });

  it("affiche la pastille Leads qualifiés avec coche quand qualified > 0", () => {
    const html = renderToStaticMarkup(
      <CampaignStatsHeader {...baseProps} status="active" rawLeads={20} qualified={7} />
    );

    expect(html).toContain("Leads qualifiés");
    expect(html).toContain("7");
  });

  it("inclut un lien vers le Google Sheet quand sheetUrl est fourni", () => {
    const html = renderToStaticMarkup(<CampaignStatsHeader {...baseProps} />);
    expect(html).toContain("docs.google.com/sheets/d/abc");
  });

  it("n'affiche pas le lien GSheet quand sheetUrl est vide", () => {
    const html = renderToStaticMarkup(
      <CampaignStatsHeader {...baseProps} sheetUrl="" />
    );
    expect(html).not.toContain("docs.google.com/sheets");
  });

  it("utilise le thème light (bg-white, pas de text-white)", () => {
    const html = renderToStaticMarkup(<CampaignStatsHeader {...baseProps} />);
    expect(html).toContain("bg-white");
    expect(html).not.toContain("text-white");
    expect(html).not.toContain("bg-zinc-900");
  });
});
