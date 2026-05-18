import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, PUT } from "./route";

vi.mock("@/lib/sheets", () => ({
  getCalendlyAccount: vi.fn(),
  getWorkspace: vi.fn(),
  upsertWorkspace: vi.fn(),
}));

import { getCalendlyAccount, getWorkspace, upsertWorkspace } from "@/lib/sheets";

describe("/api/workspaces/settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getWorkspace).mockResolvedValue({
      workspace_id: "workspace-a",
      name: "Workspace A",
      owner_email: "a@example.com",
      created_at: "2026-05-18T00:00:00.000Z",
      default_calendly_event_uri: "https://api.calendly.com/event_types/type_1",
    });
    vi.mocked(getCalendlyAccount).mockResolvedValue(null);
  });

  it("retourne le default event type et le statut Calendly sans tokens", async () => {
    vi.mocked(getCalendlyAccount).mockResolvedValueOnce({
      account_id: "calendly-workspace-a",
      type: "calendly",
      provider: "calendly",
      status: "connected",
      connected_at: "2026-05-18T00:00:00.000Z",
      workspace_id: "workspace-a",
      access_token: "secret-access",
      refresh_token: "secret-refresh",
      token_expires_at: "2026-05-18T01:00:00.000Z",
    });

    const res = await GET(
      new Request("http://localhost/api/workspaces/settings", {
        headers: { "x-workspace-id": "workspace-a" },
      })
    );
    const body = await res.json();

    expect(body.calendly_status).toBe("connected");
    expect(body.default_calendly_event_uri).toBe("https://api.calendly.com/event_types/type_1");
    expect(JSON.stringify(body)).not.toContain("secret-access");
  });

  it("met a jour l'event type Calendly par defaut du workspace", async () => {
    const res = await PUT(
      new Request("http://localhost/api/workspaces/settings", {
        method: "PUT",
        headers: {
          "content-type": "application/json",
          "x-workspace-id": "workspace-a",
        },
        body: JSON.stringify({
          default_calendly_event_uri: "https://api.calendly.com/event_types/type_2",
        }),
      })
    );

    expect(res.status).toBe(200);
    expect(upsertWorkspace).toHaveBeenCalledWith(
      expect.objectContaining({
        workspace_id: "workspace-a",
        default_calendly_event_uri: "https://api.calendly.com/event_types/type_2",
      })
    );
  });
});
