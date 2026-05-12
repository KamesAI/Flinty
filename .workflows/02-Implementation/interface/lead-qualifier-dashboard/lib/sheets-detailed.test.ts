import { describe, expect, it } from "vitest";
import {
  parseQualifiedLeadsDetailed,
  parseRejectedLeads,
  type QualifiedLeadDetailed,
  type RejectedLead,
} from "./sheets-detailed";

const qualifiedHeader = [
  "lead_id",
  "campaign_id",
  "nom",
  "site",
  "ville",
  "score",
  "score_reason",
  "email",
  "téléphone",
  "prénom",
  "poste",
  "secteur",
  "taille_equipe",
  "has_ia_services",
  "hiring_signals",
  "growth_stage",
  "buying_signal",
  "personalized_hook",
  "statut_email",
  "web_quality_score",
  "web_quality_signals",
  "societe",
  "prenom_gerant",
  "nom_gerant",
  "email_gerant",
  "email_type",
  "email_confidence",
];

const rejectedHeader = [
  "lead_id",
  "campaign_id",
  "nom",
  "site",
  "score",
  "rejection_reason",
  "processed_at",
];

describe("parseQualifiedLeadsDetailed", () => {
  it("retourne [] quand aucune ligne", () => {
    expect(parseQualifiedLeadsDetailed([])).toEqual([]);
  });

  it("parse les 27 colonnes d'un onglet Qualified v4", () => {
    const row = [
      "l_001", "c_001", "Acme Corp", "acme.fr", "Paris",
      "82", "Belle équipe IA", "contact@acme.fr", "+33 1 23 45 67 89", "Jean",
      "CEO", "SaaS", "11-50", "yes", "hiring Product",
      "growth", "strong buy", "Leur dernière levée...", "opened",
      "75", "Site premium, blog actif",
      "Acme Corp", "Jean", "Dupont", "jean.dupont@acme.fr", "nominatif_gerant", "high",
    ];
    const [lead] = parseQualifiedLeadsDetailed([qualifiedHeader, row]);
    const expected: QualifiedLeadDetailed = {
      lead_id: "l_001",
      campaign_id: "c_001",
      nom: "Acme Corp",
      site: "acme.fr",
      ville: "Paris",
      score: "82",
      score_reason: "Belle équipe IA",
      email: "contact@acme.fr",
      téléphone: "+33 1 23 45 67 89",
      prénom: "Jean",
      poste: "CEO",
      secteur: "SaaS",
      taille_equipe: "11-50",
      has_ia_services: "yes",
      hiring_signals: "hiring Product",
      growth_stage: "growth",
      buying_signal: "strong buy",
      personalized_hook: "Leur dernière levée...",
      statut_email: "opened",
      web_quality_score: "75",
      web_quality_signals: "Site premium, blog actif",
      societe: "Acme Corp",
      prenom_gerant: "Jean",
      nom_gerant: "Dupont",
      email_gerant: "jean.dupont@acme.fr",
      email_type: "nominatif_gerant",
      email_confidence: "high",
    };
    expect(lead).toEqual(expected);
  });

  it("conserve un fallback clair pour les anciennes feuilles A:U", () => {
    const [lead] = parseQualifiedLeadsDetailed([
      qualifiedHeader.slice(0, 21),
      [
        "l_001", "c_001", "Acme Corp", "acme.fr", "Paris", "82",
        "Belle équipe IA", "contact@acme.fr", "+33 1 23 45 67 89", "Jean",
        "CEO", "SaaS", "11-50", "yes", "hiring Product", "growth",
        "strong buy", "Leur dernière levée...", "opened", "75", "Site premium",
      ],
    ]);

    expect(lead.societe).toBe("Acme Corp");
    expect(lead.prenom_gerant).toBe("Jean");
    expect(lead.nom_gerant).toBe("");
    expect(lead.email_gerant).toBe("contact@acme.fr");
  });

  it("filtre les lignes vides (pas de lead_id)", () => {
    const rows = [
      qualifiedHeader,
      ["l_1", "c_1", "Alpha", "", "", "50", "", "", "", "", "", "", "", "", "", "", "", "", "new", "", "", "", "", "", "", "", ""],
      ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
      ["l_2", "c_1", "Beta", "", "", "70", "", "", "", "", "", "", "", "", "", "", "", "", "clicked", "", "", "", "", "", "", "", ""],
    ];
    const leads = parseQualifiedLeadsDetailed(rows);
    expect(leads).toHaveLength(2);
    expect(leads.map((l) => l.lead_id)).toEqual(["l_1", "l_2"]);
  });

  it("remplit des chaînes vides pour les cellules manquantes", () => {
    const [lead] = parseQualifiedLeadsDetailed([
      qualifiedHeader,
      ["l_1", "c_1", "Gamma"], // colonnes tronquées
    ]);
    expect(lead.email).toBe("");
    expect(lead.score).toBe("0");
    expect(lead.statut_email).toBe("new");
  });
});

describe("parseRejectedLeads", () => {
  it("retourne [] quand aucune ligne", () => {
    expect(parseRejectedLeads([])).toEqual([]);
  });

  it("parse les 7 colonnes d'un onglet Rejected", () => {
    const row = [
      "l_010", "c_001", "ZZ Corp", "zz.fr", "22", "Score trop bas", "2026-04-20T12:00:00Z",
    ];
    const [lead] = parseRejectedLeads([rejectedHeader, row]);
    const expected: RejectedLead = {
      lead_id: "l_010",
      campaign_id: "c_001",
      nom: "ZZ Corp",
      site: "zz.fr",
      score: "22",
      rejection_reason: "Score trop bas",
      processed_at: "2026-04-20T12:00:00Z",
    };
    expect(lead).toEqual(expected);
  });

  it("filtre les lignes vides (pas de lead_id)", () => {
    const rows = [
      rejectedHeader,
      ["l_1", "c_1", "Alpha", "", "10", "Spam", ""],
      ["", "", "", "", "", "", ""],
      ["l_2", "c_1", "Beta", "", "20", "Hors cible", ""],
    ];
    expect(parseRejectedLeads(rows)).toHaveLength(2);
  });
});
