import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

vi.mock("@/lib/calendly", () => ({
  exchangeCalendlyCode: vi.fn(),
}));

vi.mock("@/lib/sheets", () => ({
  upsertCalendlyAccount: vi.fn(),
}));

import { exchangeCalendlyCode } from "@/lib/calendly";
import { upsertCalendlyAccount } from "@/lib/sheets";

describe("GET /api/calendly/auth/callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(exchangeCalendlyCode).mockResolvedValue({
      access_token: "access_123",
      refresh_token: "refresh_123",
      expires_in: 3600,
      token_type: "bearer",
    });
  });

  it("echange le code et stocke les tokens Calendly sans les exposer au client", async () => {
    const res = await GET(
      new Request("https://flinty.test/api/calendly/auth/callback?code=abc", {
        headers: { cookie: "calendly_oauth_workspace=workspace-a" },
      })
    );

    expect(upsertCalendlyAccount).toHaveBeenCalledWith(
      expect.objectContaining({
        account_id: "calendly-workspace-a",
        type: "calendly",
        workspace_id: "workspace-a",
        access_token: "access_123",
        refresh_token: "refresh_123",
      })
    );
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(
      "https://flinty.test/dashboard/settings/calendly/connect?success=1"
    );
    expect(res.headers.get("location")).not.toContain("access_123");
  });
});
