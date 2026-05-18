import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const createHostedAuthLinkMock = vi.fn();

vi.mock("@/lib/unipile", () => ({
  createUnipileClient: vi.fn(() => ({
    createHostedAuthLink: createHostedAuthLinkMock,
  })),
}));

describe("POST /api/unipile/auth/initiate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createHostedAuthLinkMock.mockResolvedValue({ url: "https://auth.unipile.com/link/abc" });
  });

  it("cree une URL hosted auth Unipile avec les redirects dashboard", async () => {
    const response = await POST(new Request("https://flinty.test/api/unipile/auth/initiate"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.url).toBe("https://auth.unipile.com/link/abc");
    expect(createHostedAuthLinkMock).toHaveBeenCalledWith({
      providers: ["LINKEDIN"],
      successRedirectUrl: "https://flinty.test/api/unipile/callback",
      failureRedirectUrl: "https://flinty.test/dashboard/settings/linkedin/connect?error=auth_failed",
    });
  });
});
