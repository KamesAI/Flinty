import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

vi.mock("@/lib/calendly", () => ({
  getCalendlyToken: vi.fn(),
  listCalendlyEventTypes: vi.fn(),
}));

import { getCalendlyToken, listCalendlyEventTypes } from "@/lib/calendly";

describe("GET /api/calendly/event-types", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCalendlyToken).mockResolvedValue("oauth-token");
    vi.mocked(listCalendlyEventTypes).mockResolvedValue([
      {
        uri: "https://api.calendly.com/event_types/type_1",
        name: "Audit IA",
        slug: "audit-ia",
        active: true,
        scheduling_url: "https://calendly.com/kames/audit-ia",
        duration: 30,
      },
    ]);
  });

  it("liste les event types du workspace courant avec le token OAuth/PAT fallback", async () => {
    const res = await GET(
      new Request("http://localhost/api/calendly/event-types", {
        headers: { "x-workspace-id": "workspace-a" },
      })
    );

    expect(res.status).toBe(200);
    expect(getCalendlyToken).toHaveBeenCalledWith("workspace-a");
    expect(await res.json()).toHaveLength(1);
  });
});
