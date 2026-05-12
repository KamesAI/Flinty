import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";

const mSheets = vi.hoisted(() => ({
  readChildQualifiedLeads: vi.fn(),
}));

vi.mock("@/lib/campaigns", () => ({
  getCampaignById: vi.fn(),
}));
vi.mock("@/lib/sheets", () => ({
  readChildQualifiedLeads: mSheets.readChildQualifiedLeads,
  QUALIFIED_SHEET_RANGE_DATA_ROWS: "A2:AB5000",
}));

import { getCampaignById } from "@/lib/campaigns";
import { readChildQualifiedLeads } from "@/lib/sheets";

const MOCK_ROW = [
  "lead_001",
  "cmp_x",
  "Agence Alpha",
  "alpha.fr",
  "Paris",
  "82",
  "Fort signal",
  "contact@alpha.fr",
  "01",
  "Julie",
  "DG",
  "Marketing",
  "10-50",
  "true",
  "recrute",
  "growth",
  "budget",
  "Hook perso",
  "new",
  "75",
  "fast",
  "Agence Alpha",
  "Julie",
  "Martin",
  "julie.martin@alpha.fr",
  "nominatif_gerant",
  "high",
];

function makeRequest(id: string, format: string) {
  return new Request(`http://localhost/api/campaigns/${id}/export?format=${format}`);
}

describe("GET /api/campaigns/[id]/export", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCampaignById).mockResolvedValue({
      campaign: {} as never,
      sheetId: "sheet-1",
      sheetUrl: "https://example.com",
    });
    vi.mocked(readChildQualifiedLeads).mockResolvedValue([MOCK_ROW]);
  });

  it("retourne 400 si format invalide", async () => {
    const res = await GET(new Request("http://localhost/api/campaigns/cmp_x/export"), {
      params: Promise.resolve({ id: "cmp_x" }),
    });
    expect(res.status).toBe(400);
  });

  it("retourne 404 si campagne inconnue", async () => {
    vi.mocked(getCampaignById).mockResolvedValue(null);
    const res = await GET(makeRequest("nope", "csv"), {
      params: Promise.resolve({ id: "nope" }),
    });
    expect(res.status).toBe(404);
  });

  it("format=csv — BOM UTF-8 (octets), Content-Disposition, header 16 colonnes", async () => {
    const res = await GET(makeRequest("cmp_x", "csv"), {
      params: Promise.resolve({ id: "cmp_x" }),
    });
    expect(res.status).toBe(200);
    const buf = new Uint8Array(await res.arrayBuffer());
    expect(buf[0]).toBe(0xef);
    expect(buf[1]).toBe(0xbb);
    expect(buf[2]).toBe(0xbf);
    const text = new TextDecoder("utf-8").decode(buf);
    expect(res.headers.get("Content-Type")).toContain("text/csv");
    expect(res.headers.get("Content-Disposition")).toContain("flinty-cmp_x-qualified.csv");
    const firstLine = text.split(/\r?\n/)[0] ?? "";
    expect(firstLine).toContain('"score_reason"');
    expect(firstLine).toContain('"personalized_hook"');
  });

  it("format=json — array JSON", async () => {
    const res = await GET(makeRequest("cmp_x", "json"), {
      params: Promise.resolve({ id: "cmp_x" }),
    });
    expect(res.status).toBe(200);
    const data = JSON.parse(await res.text());
    expect(Array.isArray(data)).toBe(true);
    expect(data[0].email_gerant).toBe("julie.martin@alpha.fr");
  });

  it("format=instantly — filtre sans email", async () => {
    vi.mocked(readChildQualifiedLeads).mockResolvedValue([
      MOCK_ROW,
      [
        "lead_002",
        "cmp_x",
        "Sans mail",
        "",
        "",
        "50",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "new",
        "",
        "",
        "Sans mail",
        "",
        "",
        "",
        "",
        "",
      ],
    ]);
    const res = await GET(makeRequest("cmp_x", "instantly"), {
      params: Promise.resolve({ id: "cmp_x" }),
    });
    const text = await res.text();
    const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);
    expect(lines.length).toBe(2);
    expect(text).toContain("julie.martin@alpha.fr");
  });
});
