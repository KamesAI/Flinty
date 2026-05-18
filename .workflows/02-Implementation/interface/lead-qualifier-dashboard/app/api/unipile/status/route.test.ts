import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

vi.mock("@/lib/sheets", () => ({
  getLatestLinkedInAccount: vi.fn(),
}));

import { getLatestLinkedInAccount } from "@/lib/sheets";

describe("GET /api/unipile/status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retourne disconnected sans compte LinkedIn", async () => {
    vi.mocked(getLatestLinkedInAccount).mockResolvedValueOnce(null);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ status: "disconnected", account_id: "" });
  });

  it("retourne le dernier compte LinkedIn stocke dans Accounts", async () => {
    vi.mocked(getLatestLinkedInAccount).mockResolvedValueOnce({
      account_id: "acc_123",
      type: "linkedin",
      provider: "unipile",
      status: "connected",
      connected_at: "2026-05-18T08:00:00.000Z",
      paused_reason: "",
      pause_started_at: "",
      workspace_id: "kames-default",
    });

    const response = await GET();
    const body = await response.json();

    expect(body).toMatchObject({
      account_id: "acc_123",
      status: "connected",
      connected_at: "2026-05-18T08:00:00.000Z",
    });
  });
});
