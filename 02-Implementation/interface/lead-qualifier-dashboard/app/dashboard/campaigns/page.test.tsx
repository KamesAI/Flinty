import { describe, expect, it, vi } from "vitest";

const { redirectMock } = vi.hoisted(() => ({
  redirectMock: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

import CampaignsRedirectPage from "./page";

describe("CampaignsRedirectPage", () => {
  it("redirige /dashboard/campaigns vers /dashboard/campaigns/overview", () => {
    expect(() => CampaignsRedirectPage()).toThrow(
      "NEXT_REDIRECT:/dashboard/campaigns/overview"
    );
    expect(redirectMock).toHaveBeenCalledWith("/dashboard/campaigns/overview");
  });
});
