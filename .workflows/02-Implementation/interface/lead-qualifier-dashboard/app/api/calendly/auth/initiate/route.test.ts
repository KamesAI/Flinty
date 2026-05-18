import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

vi.mock("@/lib/calendly", () => ({
  buildCalendlyAuthUrl: vi.fn(() => "https://auth.calendly.com/oauth/authorize?client_id=client_1"),
}));

import { buildCalendlyAuthUrl } from "@/lib/calendly";

describe("GET /api/calendly/auth/initiate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CALENDLY_CLIENT_ID = "client_1";
  });

  it("redirige vers Calendly OAuth et stocke le workspace dans un cookie httpOnly", async () => {
    const res = await GET(
      new Request("https://flinty.test/api/calendly/auth/initiate", {
        headers: { "x-workspace-id": "workspace-a" },
      })
    );

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("https://auth.calendly.com/oauth/authorize");
    expect(res.headers.get("set-cookie")).toContain("calendly_oauth_workspace=workspace-a");
    expect(buildCalendlyAuthUrl).toHaveBeenCalledWith(
      "client_1",
      "https://flinty.test/api/calendly/auth/callback"
    );
  });
});
