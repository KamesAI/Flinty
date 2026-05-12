import { describe, it, expect } from "vitest";
import { groupLeadsByColumn, KANBAN_COLUMNS, COLUMN_PRIMARY_STATUT } from "./kanban-columns";

const lead = (id: string, statut: string) => ({
  lead_id: id,
  nom: `Société ${id}`,
  ville: "Paris",
  score: "75",
  statut_email: statut,
  personalized_hook: `hook ${id}`,
});

describe("KANBAN_COLUMNS", () => {
  it("has exactly 4 columns", () => {
    expect(KANBAN_COLUMNS).toHaveLength(4);
  });

  it("column keys are unique", () => {
    const keys = KANBAN_COLUMNS.map((c) => c.key);
    expect(new Set(keys).size).toBe(4);
  });

  it("column keys are opportunites, contactes, clients, ecartes", () => {
    const keys = KANBAN_COLUMNS.map((c) => c.key);
    expect(keys).toEqual(["opportunites", "contactes", "clients", "ecartes"]);
  });
});

describe("groupLeadsByColumn", () => {
  it("puts 'new' in Opportunités column", () => {
    const result = groupLeadsByColumn([lead("1", "new")]);
    expect(result.opportunites).toHaveLength(1);
    expect(result.opportunites[0].lead_id).toBe("1");
  });

  it("puts 'contacted' in Contactés column", () => {
    const result = groupLeadsByColumn([lead("2", "contacted")]);
    expect(result.contactes).toHaveLength(1);
  });

  it("puts 'relance_1' in Contactés column", () => {
    const result = groupLeadsByColumn([lead("3", "relance_1")]);
    expect(result.contactes).toHaveLength(1);
  });

  it("puts 'relance_2' in Contactés column", () => {
    const result = groupLeadsByColumn([lead("4", "relance_2")]);
    expect(result.contactes).toHaveLength(1);
  });

  it("puts 'opened' in Contactés column", () => {
    const result = groupLeadsByColumn([lead("5", "opened")]);
    expect(result.contactes).toHaveLength(1);
  });

  it("puts 'clicked' in Contactés column", () => {
    const result = groupLeadsByColumn([lead("6", "clicked")]);
    expect(result.contactes).toHaveLength(1);
  });

  it("puts 'replied' in Clients column", () => {
    const result = groupLeadsByColumn([lead("7", "replied")]);
    expect(result.clients).toHaveLength(1);
  });

  it("puts 'bounced' in Écartés column", () => {
    const result = groupLeadsByColumn([lead("8", "bounced")]);
    expect(result.ecartes).toHaveLength(1);
  });

  it("puts 'disqualified' in Écartés column", () => {
    const result = groupLeadsByColumn([lead("9", "disqualified")]);
    expect(result.ecartes).toHaveLength(1);
  });

  it("distributes mixed leads correctly", () => {
    const leads = [
      lead("a", "new"),
      lead("b", "new"),
      lead("c", "contacted"),
      lead("d", "relance_1"),
      lead("e", "opened"),
      lead("f", "clicked"),
      lead("g", "replied"),
      lead("h", "bounced"),
    ];
    const result = groupLeadsByColumn(leads);
    expect(result.opportunites).toHaveLength(2);
    expect(result.contactes).toHaveLength(4);
    expect(result.clients).toHaveLength(1);
    expect(result.ecartes).toHaveLength(1);
  });

  it("returns empty arrays for columns with no leads", () => {
    const result = groupLeadsByColumn([]);
    for (const col of KANBAN_COLUMNS) {
      expect(result[col.key]).toEqual([]);
    }
  });
});

describe("COLUMN_PRIMARY_STATUT", () => {
  it("covers all 4 column keys", () => {
    for (const col of KANBAN_COLUMNS) {
      expect(COLUMN_PRIMARY_STATUT[col.key]).toBeDefined();
    }
  });

  it("maps opportunites → new", () => {
    expect(COLUMN_PRIMARY_STATUT.opportunites).toBe("new");
  });

  it("maps contactes → contacted", () => {
    expect(COLUMN_PRIMARY_STATUT.contactes).toBe("contacted");
  });

  it("maps clients → replied", () => {
    expect(COLUMN_PRIMARY_STATUT.clients).toBe("replied");
  });

  it("maps ecartes → bounced", () => {
    expect(COLUMN_PRIMARY_STATUT.ecartes).toBe("bounced");
  });
});
