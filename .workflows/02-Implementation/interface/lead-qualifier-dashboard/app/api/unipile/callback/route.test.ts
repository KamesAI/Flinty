import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

vi.mock("@/lib/sheets", () => ({
  upsertLinkedInAccount: vi.fn(),
}));

import { upsertLinkedInAccount } from "@/lib/sheets";

describe("GET /api/unipile/callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("stocke account_id puis redirige vers la page settings avec succes", async () => {
    const response = await GET(
      new Request("https://flinty.test/api/unipile/callback?account_id=acc_123&status=connected")
    );

    expect(upsertLinkedInAccount).toHaveBeenCalledWith(
      expect.objectContaining({
        account_id: "acc_123",
        type: "linkedin",
        provider: "unipile",
        status: "connected",
        workspace_id: "kames-default",
      })
    );
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://flinty.test/dashboard/settings/linkedin/connect?success=true"
    );
  });

  it("redirige avec erreur si account_id manque", async () => {
    const response = await GET(new Request("https://flinty.test/api/unipile/callback"));

    expect(upsertLinkedInAccount).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe(
      "https://flinty.test/dashboard/settings/linkedin/connect?error=missing_account_id"
    );
  });
});
