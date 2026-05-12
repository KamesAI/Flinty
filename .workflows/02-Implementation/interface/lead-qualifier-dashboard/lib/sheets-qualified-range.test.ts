import { afterEach, describe, expect, it, vi } from "vitest";
import * as sheets from "./sheets";

afterEach(() => {
  vi.clearAllMocks();
});

describe("quoteSheetNameForA1", () => {
  it("entoure d’apostrophes le nom d’onglet", () => {
    expect(sheets.quoteSheetNameForA1("Leads_Qualified")).toBe(
      "'Leads_Qualified'"
    );
  });

  it("double les apostrophes internes", () => {
    expect(sheets.quoteSheetNameForA1("C'est la vie")).toBe("'C''est la vie'");
  });
});

describe("childSheetA1Range", () => {
  it("construit une plage A1 avec onglet quoté", () => {
    expect(sheets.childSheetA1Range("c_1_Qualified", "A1:AB10")).toBe(
      "'c_1_Qualified'!A1:AB10"
    );
  });
});

describe("isUnableToParseRangeError", () => {
  it("reconnaît le message Google Sheets", () => {
    expect(
      sheets.isUnableToParseRangeError(
        new Error("Unable to parse range: 'x'!A1:Z1")
      )
    ).toBe(true);
  });

  it("retourne false pour les autres erreurs", () => {
    expect(
      sheets.isUnableToParseRangeError(new Error("Permission denied"))
    ).toBe(false);
  });
});

describe("readChildQualifiedLeads (read injecté, sans appel Google)", () => {
  it("réessaie sur Leads_Qualified quand l’appel moderne lève parse range", async () => {
    const readChild = vi
      .fn()
      .mockRejectedValueOnce(
        new Error("Unable to parse range: 'cmp_x_Qualified'!A1:AB1")
      )
      .mockResolvedValueOnce([["a", "b"]]);

    const rows = await sheets.readChildQualifiedLeads(
      "sid-1",
      "cmp_x",
      "A1:AB2",
      readChild
    );

    expect(readChild).toHaveBeenCalledTimes(2);
    expect(readChild.mock.calls[0]).toEqual([
      "sid-1",
      "'cmp_x_Qualified'!A1:AB2",
    ]);
    expect(readChild.mock.calls[1]).toEqual([
      "sid-1",
      "'Leads_Qualified'!A1:AB2",
    ]);
    expect(rows).toEqual([["a", "b"]]);
  });

  it("propage l’erreur si ce n’est pas un échec de parse A1 (premier appel)", async () => {
    const readChild = vi.fn().mockRejectedValue(new Error("Network down"));

    await expect(
      sheets.readChildQualifiedLeads("s", "c", "A1:Z1", readChild)
    ).rejects.toThrow("Network down");
    expect(readChild).toHaveBeenCalledTimes(1);
  });
});
