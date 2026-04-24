import { describe, expect, it } from "vitest";
import {
  filterQualifiedLeads,
  sortQualifiedLeads,
  type QualifiedLeadFilters,
  type SortState,
} from "./detailed-leads-filters";
import type { QualifiedLeadDetailed } from "@/lib/sheets-detailed";

function lead(overrides: Partial<QualifiedLeadDetailed>): QualifiedLeadDetailed {
  return {
    lead_id: "l",
    campaign_id: "c",
    nom: "Acme",
    site: "acme.fr",
    ville: "Paris",
    score: "50",
    score_reason: "",
    email: "contact@acme.fr",
    téléphone: "",
    prénom: "Jean",
    poste: "CEO",
    secteur: "SaaS",
    taille_equipe: "11-50",
    has_ia_services: "no",
    hiring_signals: "",
    growth_stage: "",
    buying_signal: "",
    personalized_hook: "",
    statut_email: "new",
    web_quality_score: "",
    web_quality_signals: "",
    ...overrides,
  };
}

const emptyFilters: QualifiedLeadFilters = {
  query: "",
  statuses: [],
  secteurs: [],
  minScore: 0,
  maxScore: 100,
};

describe("filterQualifiedLeads", () => {
  it("sans filtre, retourne tous les leads", () => {
    const leads = [lead({ lead_id: "a" }), lead({ lead_id: "b" })];
    expect(filterQualifiedLeads(leads, emptyFilters)).toHaveLength(2);
  });

  it("filtre par recherche texte sur nom / prénom / email / site (insensible à la casse)", () => {
    const leads = [
      lead({ lead_id: "1", nom: "Alpha", email: "a@alpha.fr" }),
      lead({ lead_id: "2", prénom: "Béatrice" }),
      lead({ lead_id: "3", site: "zeta.com" }),
    ];
    expect(filterQualifiedLeads(leads, { ...emptyFilters, query: "alpha" }).map((l) => l.lead_id)).toEqual(["1"]);
    expect(filterQualifiedLeads(leads, { ...emptyFilters, query: "BÉA" }).map((l) => l.lead_id)).toEqual(["2"]);
    expect(filterQualifiedLeads(leads, { ...emptyFilters, query: "zeta" }).map((l) => l.lead_id)).toEqual(["3"]);
  });

  it("filtre par statut email (liste)", () => {
    const leads = [
      lead({ lead_id: "1", statut_email: "new" }),
      lead({ lead_id: "2", statut_email: "opened" }),
      lead({ lead_id: "3", statut_email: "replied" }),
    ];
    expect(
      filterQualifiedLeads(leads, { ...emptyFilters, statuses: ["opened", "replied"] }).map((l) => l.lead_id)
    ).toEqual(["2", "3"]);
  });

  it("filtre par secteur (liste)", () => {
    const leads = [
      lead({ lead_id: "1", secteur: "SaaS" }),
      lead({ lead_id: "2", secteur: "E-commerce" }),
    ];
    expect(
      filterQualifiedLeads(leads, { ...emptyFilters, secteurs: ["E-commerce"] }).map((l) => l.lead_id)
    ).toEqual(["2"]);
  });

  it("filtre par plage de score (inclusif)", () => {
    const leads = [
      lead({ lead_id: "1", score: "40" }),
      lead({ lead_id: "2", score: "70" }),
      lead({ lead_id: "3", score: "90" }),
    ];
    expect(
      filterQualifiedLeads(leads, { ...emptyFilters, minScore: 50, maxScore: 80 }).map((l) => l.lead_id)
    ).toEqual(["2"]);
  });

  it("combine plusieurs filtres (AND)", () => {
    const leads = [
      lead({ lead_id: "1", score: "80", secteur: "SaaS", statut_email: "opened" }),
      lead({ lead_id: "2", score: "80", secteur: "SaaS", statut_email: "new" }),
      lead({ lead_id: "3", score: "40", secteur: "SaaS", statut_email: "opened" }),
    ];
    expect(
      filterQualifiedLeads(leads, {
        query: "",
        statuses: ["opened"],
        secteurs: ["SaaS"],
        minScore: 60,
        maxScore: 100,
      }).map((l) => l.lead_id)
    ).toEqual(["1"]);
  });
});

describe("sortQualifiedLeads", () => {
  it("retourne la même liste quand sortBy est null", () => {
    const leads = [lead({ lead_id: "b" }), lead({ lead_id: "a" })];
    expect(sortQualifiedLeads(leads, { by: null, dir: "asc" }).map((l) => l.lead_id)).toEqual(["b", "a"]);
  });

  it("trie par score numérique asc/desc", () => {
    const leads = [
      lead({ lead_id: "a", score: "20" }),
      lead({ lead_id: "b", score: "95" }),
      lead({ lead_id: "c", score: "60" }),
    ];
    const asc: SortState = { by: "score", dir: "asc" };
    const desc: SortState = { by: "score", dir: "desc" };
    expect(sortQualifiedLeads(leads, asc).map((l) => l.lead_id)).toEqual(["a", "c", "b"]);
    expect(sortQualifiedLeads(leads, desc).map((l) => l.lead_id)).toEqual(["b", "c", "a"]);
  });

  it("trie par champ texte alphabétiquement (nom)", () => {
    const leads = [
      lead({ lead_id: "a", nom: "Charlie" }),
      lead({ lead_id: "b", nom: "alpha" }),
      lead({ lead_id: "c", nom: "Bravo" }),
    ];
    expect(
      sortQualifiedLeads(leads, { by: "nom", dir: "asc" }).map((l) => l.lead_id)
    ).toEqual(["b", "c", "a"]);
  });

  it("ne mute pas le tableau d'entrée", () => {
    const leads = [lead({ lead_id: "a", score: "10" }), lead({ lead_id: "b", score: "90" })];
    const copy = [...leads];
    sortQualifiedLeads(leads, { by: "score", dir: "desc" });
    expect(leads).toEqual(copy);
  });
});
