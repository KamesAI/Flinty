import { describe, expect, it } from "vitest";
import {
  CHILD_QUALIFIED_HEADER,
  CHILD_CONVERSATIONS_HEADER,
  quoteSheetNameForA1,
  childSheetA1Range,
  isUnableToParseRangeError,
  parseIndexCampaigns,
  parseLeadsV3,
  indexCampaignToCampaign,
} from "./sheets";
import { CONVERSATIONS_HEADER } from "./conversations";

describe("CHILD_QUALIFIED_HEADER", () => {
  it("contient les 27 colonnes v3 + 5 colonnes v4", () => {
    expect(CHILD_QUALIFIED_HEADER).toHaveLength(32);
  });

  it("commence par lead_id et campaign_id", () => {
    expect(CHILD_QUALIFIED_HEADER[0]).toBe("lead_id");
    expect(CHILD_QUALIFIED_HEADER[1]).toBe("campaign_id");
  });

  it("contient les 5 nouvelles colonnes v4 à la fin", () => {
    const v4Cols = ["linkedin_url", "source_channel", "statut_li", "reply_intent", "reply_at"];
    const tail = [...CHILD_QUALIFIED_HEADER].slice(-5);
    expect(tail).toEqual(v4Cols);
  });
});

describe("CHILD_CONVERSATIONS_HEADER", () => {
  it("est identique à CONVERSATIONS_HEADER de conversations.ts", () => {
    expect([...CHILD_CONVERSATIONS_HEADER]).toEqual([...CONVERSATIONS_HEADER]);
  });

  it("contient 9 colonnes", () => {
    expect(CHILD_CONVERSATIONS_HEADER).toHaveLength(9);
  });
});

describe("quoteSheetNameForA1", () => {
  it("entoure le nom d'apostrophes simples", () => {
    expect(quoteSheetNameForA1("Leads_Qualified")).toBe("'Leads_Qualified'");
  });

  it("échappe les apostrophes internes en les doublant", () => {
    expect(quoteSheetNameForA1("it's a tab")).toBe("'it''s a tab'");
  });

  it("gère les noms sans caractères spéciaux", () => {
    expect(quoteSheetNameForA1("Config")).toBe("'Config'");
  });
});

describe("childSheetA1Range", () => {
  it("construit la plage A1 complète", () => {
    expect(childSheetA1Range("Leads_Qualified", "A1:AB5000")).toBe(
      "'Leads_Qualified'!A1:AB5000"
    );
  });

  it("gère les noms avec apostrophe", () => {
    expect(childSheetA1Range("it's", "A:B")).toBe("'it''s'!A:B");
  });
});

describe("isUnableToParseRangeError", () => {
  it("détecte l'erreur Sheets 'Unable to parse range'", () => {
    expect(
      isUnableToParseRangeError(new Error("Unable to parse range: cmp_abc_Qualified"))
    ).toBe(true);
  });

  it("retourne false pour d'autres erreurs", () => {
    expect(isUnableToParseRangeError(new Error("Network timeout"))).toBe(false);
  });

  it("retourne false pour les non-Error", () => {
    expect(isUnableToParseRangeError("string error")).toBe(false);
    expect(isUnableToParseRangeError(null)).toBe(false);
  });
});

describe("parseIndexCampaigns", () => {
  const HEADER = [
    "campaign_id", "nom", "sheet_id", "sheet_url", "secteur",
    "localisation", "offre_kames", "statut", "date_création",
    "total_leads_raw", "total_leads_qualified", "emails_envoyés", "taux_réponse",
  ];

  it("parse correctement une ligne de campagne", () => {
    const rows = [
      HEADER,
      [
        "cmp_abc", "Plombiers Paris", "sheet_xyz",
        "https://docs.google.com/spreadsheets/d/sheet_xyz",
        "Plomberie", "Paris", "Automatisation IA", "active",
        "2026-05-01", "120", "45", "40", "12.5",
      ],
    ];
    const campaigns = parseIndexCampaigns(rows);
    expect(campaigns).toHaveLength(1);
    expect(campaigns[0]).toMatchObject({
      campaign_id: "cmp_abc",
      nom: "Plombiers Paris",
      sheet_id: "sheet_xyz",
      secteur: "Plomberie",
      statut: "active",
      total_leads_raw: "120",
      total_leads_qualified: "45",
      taux_réponse: "12.5",
    });
  });

  it("ignore les lignes sans campaign_id", () => {
    const rows = [HEADER, ["", "Orphelin", "", "", "", "", "", "active", "", "", "", "", ""]];
    expect(parseIndexCampaigns(rows)).toHaveLength(0);
  });

  it("retourne vide si pas de données", () => {
    expect(parseIndexCampaigns([])).toHaveLength(0);
    expect(parseIndexCampaigns([HEADER])).toHaveLength(0);
  });

  it("tolère les colonnes manquantes avec des valeurs par défaut", () => {
    const rows = [HEADER, ["cmp_short"]];
    const [c] = parseIndexCampaigns(rows);
    expect(c.campaign_id).toBe("cmp_short");
    expect(c.sheet_id).toBe("");
    expect(c.taux_réponse).toBe("0");
    expect(c.statut).toBe("paused");
  });
});

describe("parseLeadsV3", () => {
  it("retourne vide si pas de lignes", () => {
    expect(parseLeadsV3([])).toHaveLength(0);
  });

  it("ignore les lignes sans lead_id", () => {
    const rows = [
      ["lead_id", "campaign_id"],
      ["", "cmp_abc"],
    ];
    expect(parseLeadsV3(rows)).toHaveLength(0);
  });

  it("parse les colonnes v3 de base", () => {
    // Tableau sparse : indices non définis = undefined → les ?? fonctionnent
    const row: string[] = [];
    row[0] = "lead_001";
    row[1] = "cmp_abc";
    row[5] = "85";               // score
    row[24] = "test@example.com"; // email_gerant (prioritaire dans parseLeadsV3)
    row[18] = "sent";             // statut_email
    const leads = parseLeadsV3([["header"], row]);
    expect(leads[0].lead_id).toBe("lead_001");
    expect(leads[0].campaign_id).toBe("cmp_abc");
    expect(leads[0].score).toBe("85");
    expect(leads[0].email).toBe("test@example.com");
    expect(leads[0].statut_email).toBe("sent");
  });
});

describe("indexCampaignToCampaign", () => {
  it("convertit IndexCampaign en Campaign avec taux_ouverture=0", () => {
    const indexCampaign = {
      campaign_id: "cmp_abc",
      nom: "Test",
      sheet_id: "sid",
      sheet_url: "https://docs.google.com/spreadsheets/d/sid",
      secteur: "Tech",
      localisation: "Paris",
      offre_kames: "IA",
      statut: "active" as const,
      date_création: "2026-05-01",
      total_leads_raw: "100",
      total_leads_qualified: "30",
      emails_envoyés: "25",
      taux_réponse: "8",
    };
    const campaign = indexCampaignToCampaign(indexCampaign);
    expect(campaign.taux_ouverture).toBe("0");
    expect(campaign.campaign_id).toBe("cmp_abc");
    expect(campaign.statut).toBe("active");
  });
});
