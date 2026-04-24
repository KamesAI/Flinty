import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { TemplatesEditor } from "./TemplatesEditor";
import { createEmptyCampaignEmailTemplates } from "@/lib/email-templates";

(globalThis as { React?: typeof React }).React = React;

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe("TemplatesEditor", () => {
  it("aligne l'en-tete sur la page campagnes (overline, titre, sous-titre)", () => {
    const templates = createEmptyCampaignEmailTemplates("camp-1");
    const html = renderToStaticMarkup(
      <TemplatesEditor
        campaigns={[
          {
            campaign_id: "camp-1",
            nom: "Campagne Alpha",
            secteur: "SaaS",
            localisation: "Paris",
          },
        ]}
        selectedCampaignId="camp-1"
        initialTemplates={templates}
      />
    );

    expect(html).toContain("tracking-[0.22em]");
    expect(html).toContain("text-[#006596]");
    expect(html).toContain("font-flinty");
    expect(html).toContain("text-[var(--dashboard-text-secondary)]");
    expect(html).toContain("sm:text-base");
    expect(html).toContain("data-testid=\"templates-subheader\"");
    expect(html).toContain("Gere ici les emails J0");
    expect(html).not.toContain("Templates email");
  });

  it("affiche une seule variante J0 a la fois au chargement", () => {
    const templates = createEmptyCampaignEmailTemplates("camp-1");
    const html = renderToStaticMarkup(
      <TemplatesEditor
        campaigns={[
          {
            campaign_id: "camp-1",
            nom: "Campagne Alpha",
            secteur: "SaaS",
            localisation: "Paris",
          },
        ]}
        selectedCampaignId="camp-1"
        initialTemplates={templates}
      />
    );

    expect(html).toContain("Variante A");
    expect(html).toContain("Variante B");
    expect(html).toContain("Variante C");
    expect(html.match(/ID interne/g)?.length ?? 0).toBe(1);
  });

  it("utilise des cartes variante et section a fond blanc", () => {
    const templates = createEmptyCampaignEmailTemplates("camp-1");
    const html = renderToStaticMarkup(
      <TemplatesEditor
        campaigns={[
          {
            campaign_id: "camp-1",
            nom: "Campagne Alpha",
            secteur: "SaaS",
            localisation: "Paris",
          },
        ]}
        selectedCampaignId="camp-1"
        initialTemplates={templates}
      />
    );

    expect(html).toContain("border-zinc-200 bg-white");
    expect(html).not.toContain("rgba(17,77,155,0.42)");
  });

  it("utilise des surfaces blanches ou zinc-50 pour les panneaux internes", () => {
    const templates = createEmptyCampaignEmailTemplates("camp-1");
    const html = renderToStaticMarkup(
      <TemplatesEditor
        campaigns={[
          {
            campaign_id: "camp-1",
            nom: "Campagne Alpha",
            secteur: "SaaS",
            localisation: "Paris",
          },
        ]}
        selectedCampaignId="camp-1"
        initialTemplates={templates}
      />
    );

    expect(html).toContain("border-zinc-200 bg-zinc-50");
    expect(html).not.toContain("rgba(14,26,60,0.78)");
    expect(html).not.toContain("rgba(9,18,42,0.58)");
    expect(html).not.toContain("bg-zinc-950/75");
    expect(html).not.toContain("bg-zinc-950/70");
    expect(html).not.toContain("overflow-hidden rounded-[22px] border border-zinc-800 bg-black");
  });

  it("affiche la selection de campagne sans card enveloppante et avec un titre noir", () => {
    const templates = createEmptyCampaignEmailTemplates("camp-1");
    const html = renderToStaticMarkup(
      <TemplatesEditor
        campaigns={[
          {
            campaign_id: "camp-1",
            nom: "Campagne Alpha",
            secteur: "SaaS",
            localisation: "Paris",
          },
        ]}
        selectedCampaignId="camp-1"
        initialTemplates={templates}
      />
    );

    expect(html).toContain("text-xl font-semibold text-black");
    expect(html).not.toContain("rounded-3xl border p-6 shadow-[0_16px_40px_rgba(2,8,23,0.35)]");
  });

  it("place le sous-titre J0 sous Sequence J0, sans badge 3 variantes, titre en text-primary et onglets compacts", () => {
    const templates = createEmptyCampaignEmailTemplates("camp-1");
    const html = renderToStaticMarkup(
      <TemplatesEditor
        campaigns={[
          {
            campaign_id: "camp-1",
            nom: "Campagne Alpha",
            secteur: "SaaS",
            localisation: "Paris",
          },
        ]}
        selectedCampaignId="camp-1"
        initialTemplates={templates}
      />
    );

    expect(html).not.toContain("3 variantes testables");
    const j0Context = html.slice(html.indexOf("Sequence J0"));
    expect(j0Context.indexOf("Prise de contact · SaaS · Paris")).toBeLessThan(
      j0Context.indexOf("Campagne Alpha")
    );
    expect(html).toContain("text-xl font-semibold text-primary md:text-2xl");
    expect(html).not.toContain("min-w-[132px]");
    expect(html).toContain("px-2.5 py-1.5");
    expect(html).toContain("bg-primary/20");
    expect(html).toContain("data-[state=active]:bg-primary");
  });

  it("affiche un bouton Apercu email a droite des variantes sans rendre le preview au chargement", () => {
    const templates = createEmptyCampaignEmailTemplates("camp-1");
    const html = renderToStaticMarkup(
      <TemplatesEditor
        campaigns={[
          {
            campaign_id: "camp-1",
            nom: "Campagne Alpha",
            secteur: "SaaS",
            localisation: "Paris",
          },
        ]}
        selectedCampaignId="camp-1"
        initialTemplates={templates}
      />
    );

    expect(html).toContain("Apercu email");
    expect(html.indexOf("Variante C")).toBeLessThan(html.indexOf("Apercu email"));
    expect(html).not.toContain("Inbox preview");
  });

  it("affiche un bouton CTA / Media optionnel avant Apercu email sans rendre ces mini-cards par defaut", () => {
    const templates = createEmptyCampaignEmailTemplates("camp-1");
    const html = renderToStaticMarkup(
      <TemplatesEditor
        campaigns={[
          {
            campaign_id: "camp-1",
            nom: "Campagne Alpha",
            secteur: "SaaS",
            localisation: "Paris",
          },
        ]}
        selectedCampaignId="camp-1"
        initialTemplates={templates}
      />
    );

    expect(html).toContain("CTA / Media optionnel");
    expect(html.indexOf("CTA / Media optionnel")).toBeLessThan(html.indexOf("Apercu email"));
    expect(html).not.toContain("Libelle CTA");
    expect(html).not.toContain("Type de media");
  });

  it("affiche un bouton Apercu email sur une relance a la place de 1 email a optimiser", () => {
    const templates = createEmptyCampaignEmailTemplates("camp-1");
    const RelanceEditor = TemplatesEditor as React.ComponentType<
      React.ComponentProps<typeof TemplatesEditor> & { initialActiveSection?: string }
    >;
    const html = renderToStaticMarkup(
      <RelanceEditor
        campaigns={[
          {
            campaign_id: "camp-1",
            nom: "Campagne Alpha",
            secteur: "SaaS",
            localisation: "Paris",
          },
        ]}
        selectedCampaignId="camp-1"
        initialTemplates={templates}
        initialActiveSection="j3"
      />
    );

    expect(html).toContain("Sequence Relance J+3");
    expect(html).toContain("Apercu email");
    expect(html).not.toContain("1 email a optimiser");
  });

  it("aligne le select et les deux actions sur une hauteur cohérente", () => {
    const templates = createEmptyCampaignEmailTemplates("camp-1");
    const html = renderToStaticMarkup(
      <TemplatesEditor
        campaigns={[
          {
            campaign_id: "camp-1",
            nom: "Campagne Alpha",
            secteur: "SaaS",
            localisation: "Paris",
          },
        ]}
        selectedCampaignId="camp-1"
        initialTemplates={templates}
      />
    );

    expect(html).toContain("min-w-[280px] h-11");
    expect(html).toContain("group relative inline-flex h-11 items-center justify-center");
    expect(html).toContain("inline-flex h-11 items-center");
  });
});
