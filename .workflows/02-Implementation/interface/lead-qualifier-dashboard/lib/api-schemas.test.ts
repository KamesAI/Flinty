import { describe, it, expect } from "vitest";
import { generateIcpBodySchema, postCampaignBodySchema } from "./api-schemas";

describe("postCampaignBodySchema", () => {
  const base = {
    nom: "Ma campagne",
    secteur: "SaaS",
    localisation: "Paris",
    offre_kames: "Audit",
    icp_md: "# ICP",
    score_minimum: 60,
  };

  it("accepte un payload valide", () => {
    const r = postCampaignBodySchema.safeParse(base);
    expect(r.success).toBe(true);
  });

  it("accepte un objectif de leads qualifiés", () => {
    const r = postCampaignBodySchema.safeParse({
      ...base,
      target_qualified_leads: 50,
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.target_qualified_leads).toBe(50);
    }
  });

  it("accepte des champs de scraping séparés de l'ICP", () => {
    const r = postCampaignBodySchema.safeParse({
      ...base,
      search_terms: "plomberie, électricité, menuiserie",
      search_locations: "Bordeaux, Mérignac, Pessac",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.search_terms).toBe("plomberie, électricité, menuiserie");
      expect(r.data.search_locations).toBe("Bordeaux, Mérignac, Pessac");
    }
  });

  it("rejette icp_md vide ou blanc", () => {
    expect(postCampaignBodySchema.safeParse({ ...base, icp_md: "" }).success).toBe(
      false
    );
    expect(postCampaignBodySchema.safeParse({ ...base, icp_md: "   " }).success).toBe(
      false
    );
  });

  it("rejette score_minimum hors 0–100", () => {
    expect(
      postCampaignBodySchema.safeParse({ ...base, score_minimum: 101 }).success
    ).toBe(false);
  });

  it("rejette un objectif de leads qualifiés hors bornes", () => {
    expect(
      postCampaignBodySchema.safeParse({ ...base, target_qualified_leads: 9 }).success
    ).toBe(false);
    expect(
      postCampaignBodySchema.safeParse({ ...base, target_qualified_leads: 501 }).success
    ).toBe(false);
  });
});

describe("generateIcpBodySchema", () => {
  it("exige 8 réponses", () => {
    expect(
      generateIcpBodySchema.safeParse({ answers: Array(7).fill("x") }).success
    ).toBe(false);
    expect(
      generateIcpBodySchema.safeParse({ answers: Array(8).fill("a") }).success
    ).toBe(true);
  });
});
