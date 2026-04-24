import { describe, it, expect } from "vitest";
import {
  csvRfc4180Cell,
  qualifiedLeadsToCsv,
  qualifiedLeadsToInstantlyCsv,
  qualifiedLeadsToJson,
} from "./campaign-export";
import type { QualifiedLead } from "./qualified-leads";

const SAMPLE: QualifiedLead = {
  lead_id: "l1",
  campaign_id: "c1",
  nom: 'Acme "Test"',
  site: "https://acme.fr",
  ville: "Paris",
  score: "80",
  score_reason: "Signal IA",
  email: "a@acme.fr",
  téléphone: "01",
  prénom: "Jean",
  poste: "CEO",
  secteur: "SaaS",
  taille_equipe: "10-50",
  has_ia_services: "true",
  hiring_signals: "recrute",
  growth_stage: "scale",
  buying_signal: "budget",
  personalized_hook: 'Hello "world"',
  statut_email: "new",
  web_quality_score: "72",
  web_quality_signals: "fast",
};

describe("campaign-export", () => {
  it("csvRfc4180Cell échappe guillemets selon RFC 4180", () => {
    expect(csvRfc4180Cell('dire "oui"')).toBe('"dire ""oui"""');
  });

  it("qualifiedLeadsToCsv — 16 colonnes PRD + BOM UTF-8", () => {
    const csv = qualifiedLeadsToCsv([SAMPLE]);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    const lines = csv.replace(/^\uFEFF/, "").split(/\r?\n/);
    expect(lines[0]).toContain('"score_reason"');
    expect(lines[0]).toContain('"web_quality_score"');
    expect(lines[1]).toContain('Acme ""Test""');
  });

  it("qualifiedLeadsToInstantlyCsv — en-têtes Instantly + filtre sans email", () => {
    const noEmail: QualifiedLead = { ...SAMPLE, email: "  ", lead_id: "l2" };
    const csv = qualifiedLeadsToInstantlyCsv([SAMPLE, noEmail]);
    const lines = csv.replace(/^\uFEFF/, "").split(/\r?\n/);
    expect(lines[0]).toContain("Email");
    expect(lines[0]).toContain("Personalization");
    expect(lines.length).toBe(2);
  });

  it("qualifiedLeadsToJson — parse JSON.stringify valide", () => {
    const j = qualifiedLeadsToJson([SAMPLE]);
    const parsed = JSON.parse(j) as QualifiedLead[];
    expect(parsed).toHaveLength(1);
    expect(parsed[0]?.personalized_hook).toBe(SAMPLE.personalized_hook);
  });
});
