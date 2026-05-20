import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi, beforeEach } from "vitest";

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

vi.mock("@/lib/replies", () => ({
  listSetterDraftQueue: vi.fn(async () => []),
  listEscalatedSetterThreads: vi.fn(async () => []),
}));

vi.mock("@/lib/sheets", () => ({
  getMeetings: vi.fn(async () => []),
}));

import InboxPage from "./page";
import { listEscalatedSetterThreads, listSetterDraftQueue } from "@/lib/replies";
import { getMeetings } from "@/lib/sheets";

describe("InboxPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listSetterDraftQueue).mockResolvedValue([]);
    vi.mocked(listEscalatedSetterThreads).mockResolvedValue([]);
    vi.mocked(getMeetings).mockResolvedValue([]);
  });

  it("affiche une inbox de validation vide sans crasher", async () => {
    const html = renderToStaticMarkup(
      await InboxPage({ searchParams: Promise.resolve({}) })
    );

    expect(html).toContain("Inbox Setter");
    expect(html).toContain("À valider");
    expect(html).toContain("Aucun draft Setter à valider.");
  });

  it("affiche un draft Setter à valider avec dernier message prospect", async () => {
    vi.mocked(listSetterDraftQueue).mockResolvedValueOnce([
      {
        lead: {
          lead_id: "lead_1",
          campaign_id: "cmp_1",
          nom: "Dupont",
          prénom: "Jeanne",
          poste: "CEO",
          secteur: "SaaS",
          email: "jeanne@example.com",
          téléphone: "",
          score: "88",
          site: "",
          ville: "Paris",
          taille_equipe: "10",
          has_ia_services: "false",
          statut_email: "replied",
          resend_email_id: "",
        },
        campaign: {
          campaign_id: "cmp_1",
          nom: "Campagne Test",
          sheet_id: "sheet_1",
          sheet_url: "",
          secteur: "SaaS",
          localisation: "Paris",
          offre_kames: "Audit",
          statut: "active",
          date_création: "2026-05-15",
          total_leads_raw: "0",
          total_leads_qualified: "0",
          emails_envoyés: "0",
          taux_réponse: "0",
        },
        draft: {
          turn_id: "turn_draft",
          lead_id: "lead_1",
          channel: "email",
          role: "setter",
          content: "Merci Jeanne, partante pour en parler mardi ?",
          sent_at: "2026-05-15T10:00:00.000Z",
          intent: "interested",
          validated_by: "",
          edited_from_draft: "false",
        },
        lastProspectTurn: {
          turn_id: "turn_prospect",
          lead_id: "lead_1",
          channel: "email",
          role: "prospect",
          content: "Oui, ça peut m'intéresser.",
          sent_at: "2026-05-15T09:58:00.000Z",
          intent: "",
          validated_by: "",
          edited_from_draft: "false",
        },
        thread: [],
      },
    ]);

    const html = renderToStaticMarkup(
      await InboxPage({ searchParams: Promise.resolve({ tab: "validate" }) })
    );

    expect(html).toContain("Jeanne Dupont");
    expect(html).toContain("Oui, ça peut m");
    expect(html).toContain("Email");
    expect(html).toContain("Merci Jeanne");
    expect(html).toContain("Draft Setter");
  });

  it("affiche l'empty state bookings", async () => {
    const html = renderToStaticMarkup(
      await InboxPage({ searchParams: Promise.resolve({ tab: "bookings" }) })
    );

    expect(html).toContain("Aucun booking à afficher.");
  });

  it("affiche les threads escaladés dans l'onglet À répondre", async () => {
    vi.mocked(listEscalatedSetterThreads).mockResolvedValueOnce([
      {
        lead: {
          lead_id: "lead_2",
          campaign_id: "cmp_1",
          nom: "Martin",
          prénom: "Sofia",
          poste: "CMO",
          secteur: "Retail",
          email: "sofia@example.com",
          téléphone: "",
          score: "91",
          site: "",
          ville: "Lyon",
          taille_equipe: "50",
          has_ia_services: "false",
          statut_email: "replied",
          resend_email_id: "",
        },
        campaign: {
          campaign_id: "cmp_1",
          nom: "Campagne Test",
          sheet_id: "sheet_1",
          sheet_url: "",
          secteur: "Retail",
          localisation: "Lyon",
          offre_kames: "Audit",
          statut: "active",
          date_création: "2026-05-15",
          total_leads_raw: "0",
          total_leads_qualified: "0",
          emails_envoyés: "0",
          taux_réponse: "0",
        },
        escalatedTurn: {
          turn_id: "turn_escalated",
          lead_id: "lead_2",
          channel: "email",
          role: "setter",
          content: "Je préfère escalader ce cas.",
          sent_at: "2026-05-15T11:00:00.000Z",
          intent: "objection_trust",
          validated_by: "escalated:Thomas:cas sensible",
          edited_from_draft: "false",
        },
        lastProspectTurn: {
          turn_id: "turn_prospect_2",
          lead_id: "lead_2",
          channel: "linkedin",
          role: "prospect",
          content: "Avant de répondre, envoyez-moi des preuves.",
          sent_at: "2026-05-15T10:55:00.000Z",
          intent: "objection_trust",
          validated_by: "",
          edited_from_draft: "false",
        },
        thread: [],
      },
    ]);

    const html = renderToStaticMarkup(
      await InboxPage({ searchParams: Promise.resolve({ tab: "reply" }) })
    );

    expect(html).toContain("Sofia Martin");
    expect(html).toContain("Avant de répondre");
    expect(html).toContain("LinkedIn");
    expect(html).toContain("objection_trust");
    expect(html).toContain("cas sensible");
  });

  it("groupe les bookings par semaine", async () => {
    vi.mocked(getMeetings).mockResolvedValueOnce([
      {
        meeting_id: "meeting_1",
        lead_id: "lead_1",
        campaign_id: "cmp_1",
        source: "calendly",
        title: "Démo",
        start_at: "2026-05-18T10:00:00.000Z",
        end_at: "2026-05-18T10:30:00.000Z",
        timezone: "Europe/Paris",
        status: "scheduled",
        booking_url: "",
        attendee_name: "Jeanne Dupont",
        attendee_email: "jeanne@example.com",
        metadata: "",
      },
      {
        meeting_id: "meeting_2",
        lead_id: "lead_2",
        campaign_id: "cmp_1",
        source: "calendly",
        title: "Call",
        start_at: "2026-05-25T14:00:00.000Z",
        end_at: "2026-05-25T14:30:00.000Z",
        timezone: "Europe/Paris",
        status: "scheduled",
        booking_url: "",
        attendee_name: "Sofia Martin",
        attendee_email: "sofia@example.com",
        metadata: "",
      },
    ]);

    const html = renderToStaticMarkup(
      await InboxPage({ searchParams: Promise.resolve({ tab: "bookings" }) })
    );

    expect(html).toContain("Semaine du 18 mai 2026");
    expect(html).toContain("Semaine du 25 mai 2026");
    expect(html).toContain("Jeanne Dupont");
    expect(html).toContain("Sofia Martin");
  });
});
