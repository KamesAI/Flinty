import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

vi.mock("@/lib/calendly", () => ({
  getAvailableSlots: vi.fn(),
  formatSlotsNatural: vi.fn(() => "slots naturels"),
}));

vi.mock("@/lib/sheets", () => ({
  getWorkspace: vi.fn(),
}));

import { getAvailableSlots } from "@/lib/calendly";
import { getWorkspace } from "@/lib/sheets";

describe("GET /api/calendly/slots", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.CALENDLY_EVENT_TYPE_URI;
    vi.mocked(getWorkspace).mockResolvedValue(null);
    vi.mocked(getAvailableSlots).mockResolvedValue([
      {
        start_time: "2026-05-18T10:00:00.000Z",
        end_time: "2026-05-18T10:30:00.000Z",
        scheduling_url: "https://calendly.com/kames/demo",
      },
    ]);
  });

  it("utilise le workspace courant pour recuperer les slots OAuth", async () => {
    const res = await GET(
      new Request("http://localhost/api/calendly/slots?event_type_uri=https://api.calendly.com/event_types/abc", {
        headers: { "x-workspace-id": "workspace-a" },
      })
    );

    expect(res.status).toBe(200);
    expect(getAvailableSlots).toHaveBeenCalledWith(
      "https://api.calendly.com/event_types/abc",
      3,
      "workspace-a"
    );
  });

  it("fallback sur l'event type par defaut du workspace si absent de la query", async () => {
    vi.mocked(getWorkspace).mockResolvedValueOnce({
      workspace_id: "workspace-a",
      name: "Workspace A",
      owner_email: "a@example.com",
      created_at: "2026-05-18T00:00:00.000Z",
      default_calendly_event_uri: "https://api.calendly.com/event_types/default",
    });

    const res = await GET(
      new Request("http://localhost/api/calendly/slots", {
        headers: { "x-workspace-id": "workspace-a" },
      })
    );

    expect(res.status).toBe(200);
    expect(getAvailableSlots).toHaveBeenCalledWith(
      "https://api.calendly.com/event_types/default",
      3,
      "workspace-a"
    );
  });
});
