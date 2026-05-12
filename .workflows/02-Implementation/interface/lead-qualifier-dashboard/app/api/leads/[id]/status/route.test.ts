import { describe, it, expect, vi, beforeEach } from "vitest";
import { PATCH } from "./route";

vi.mock("@/lib/sheets", () => ({
  readChildSheet: vi.fn(),
  updateChildSheetValues: vi.fn(),
}));

import { readChildSheet, updateChildSheetValues } from "@/lib/sheets";

function makePatchRequest(leadId: string, body: object) {
  return new Request(`http://localhost/api/leads/${leadId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("PATCH /api/leads/[id]/status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retourne 400 si statut_email invalide", async () => {
    const res = await PATCH(
      makePatchRequest("lead_1", {
        sheet_id: "sh1",
        campaign_id: "cmp_x",
        statut_email: "not_a_status",
      }),
      { params: Promise.resolve({ id: "lead_1" }) }
    );
    expect(res.status).toBe(400);
    expect(vi.mocked(updateChildSheetValues)).not.toHaveBeenCalled();
  });

  it("retourne 404 si lead_id absent de la colonne A", async () => {
    vi.mocked(readChildSheet).mockResolvedValue([
      ["lead_id"],
      ["other_lead"],
    ]);
    const res = await PATCH(
      makePatchRequest("missing", {
        sheet_id: "sh1",
        campaign_id: "cmp_x",
        statut_email: "opened",
      }),
      { params: Promise.resolve({ id: "missing" }) }
    );
    expect(res.status).toBe(404);
    expect(vi.mocked(updateChildSheetValues)).not.toHaveBeenCalled();
  });

  it("retourne 200 et met à jour la cellule statut_email (colonne S)", async () => {
    vi.mocked(readChildSheet).mockResolvedValue([
      ["lead_id"],
      ["lead_001"],
      ["lead_002"],
    ]);
    const res = await PATCH(
      makePatchRequest("lead_002", {
        sheet_id: "spreadsheet-child-1",
        campaign_id: "cmp_abc",
        statut_email: "clicked",
      }),
      { params: Promise.resolve({ id: "lead_002" }) }
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({ ok: true });
    expect(readChildSheet).toHaveBeenCalledWith(
      "spreadsheet-child-1",
      "cmp_abc_Qualified!A:A"
    );
    expect(updateChildSheetValues).toHaveBeenCalledWith(
      "spreadsheet-child-1",
      "cmp_abc_Qualified!S3",
      [["clicked"]]
    );
  });
});
