import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  formatSlotsNatural,
  getCalendlySchedulingUrl,
  parseCalendlySlots,
  buildCalendlyAuthUrl,
  getCalendlyToken,
  type RawCalendlyAvailability,
} from "./calendly";

vi.mock("./sheets", () => ({
  getCalendlyAccount: vi.fn(),
  upsertCalendlyAccount: vi.fn(),
}));

import { getCalendlyAccount, upsertCalendlyAccount } from "./sheets";

const PARIS_TZ = "Europe/Paris";

describe("buildCalendlyAuthUrl", () => {
  it("construit l'URL OAuth avec client_id et redirect_uri", () => {
    const url = buildCalendlyAuthUrl("client_123", "https://app.kamesai.com/api/calendly/auth/callback");
    expect(url).toContain("https://auth.calendly.com/oauth/authorize");
    expect(url).toContain("client_id=client_123");
    expect(url).toContain("response_type=code");
    expect(url).toContain(encodeURIComponent("https://app.kamesai.com/api/calendly/auth/callback"));
  });
});

describe("parseCalendlySlots", () => {
  it("extrait 3 premiers slots d'une réponse Calendly", () => {
    const raw: RawCalendlyAvailability = {
      collection: [
        { start_time: "2026-05-15T09:00:00.000000Z", scheduling_url: "https://calendly.com/e/1" },
        { start_time: "2026-05-15T10:30:00.000000Z", scheduling_url: "https://calendly.com/e/2" },
        { start_time: "2026-05-15T14:00:00.000000Z", scheduling_url: "https://calendly.com/e/3" },
        { start_time: "2026-05-16T09:00:00.000000Z", scheduling_url: "https://calendly.com/e/4" },
      ],
    };
    const slots = parseCalendlySlots(raw, 3);
    expect(slots).toHaveLength(3);
    expect(slots[0].start_time).toBe("2026-05-15T09:00:00.000000Z");
    expect(slots[0].scheduling_url).toBe("https://calendly.com/e/1");
  });

  it("retourne moins si moins disponible", () => {
    const raw: RawCalendlyAvailability = {
      collection: [
        { start_time: "2026-05-15T09:00:00.000000Z", scheduling_url: "https://calendly.com/e/1" },
      ],
    };
    const slots = parseCalendlySlots(raw, 3);
    expect(slots).toHaveLength(1);
  });

  it("retourne vide si collection vide", () => {
    expect(parseCalendlySlots({ collection: [] }, 3)).toHaveLength(0);
  });
});

describe("formatSlotsNatural", () => {
  it("formate 3 slots en texte naturel français", () => {
    const slots = [
      { start_time: "2026-05-15T09:00:00.000000Z", scheduling_url: "https://calendly.com/e/1" },
      { start_time: "2026-05-16T14:30:00.000000Z", scheduling_url: "https://calendly.com/e/2" },
      { start_time: "2026-05-18T10:00:00.000000Z", scheduling_url: "https://calendly.com/e/3" },
    ];
    const text = formatSlotsNatural(slots, PARIS_TZ);
    // Should contain day and time info
    expect(text).toContain("https://calendly.com/e/1");
    expect(text).toContain("https://calendly.com/e/2");
    expect(text).toContain("https://calendly.com/e/3");
    // Should mention vendredi 15 mai (UTC+2 → 11h Paris)
    expect(text.toLowerCase()).toMatch(/vendredi|samedi|lundi/);
  });

  it("retourne message si aucun slot", () => {
    const text = formatSlotsNatural([], PARIS_TZ);
    expect(text).toBeTruthy();
    expect(text.length).toBeGreaterThan(10);
  });
});

describe("getCalendlyToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CALENDLY_TOKEN = "pat-token";
    process.env.CALENDLY_CLIENT_ID = "client-id";
    process.env.CALENDLY_CLIENT_SECRET = "client-secret";
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("retourne le token OAuth non expire du workspace", async () => {
    vi.mocked(getCalendlyAccount).mockResolvedValueOnce({
      account_id: "calendly-workspace-a",
      type: "calendly",
      provider: "calendly",
      status: "connected",
      connected_at: "2026-05-18T08:00:00.000Z",
      workspace_id: "workspace-a",
      access_token: "oauth-access",
      refresh_token: "oauth-refresh",
      token_expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    });

    await expect(getCalendlyToken("workspace-a")).resolves.toBe("oauth-access");
    expect(upsertCalendlyAccount).not.toHaveBeenCalled();
  });

  it("refresh le token OAuth expire puis met a jour Accounts", async () => {
    vi.setSystemTime(new Date("2026-05-18T10:00:00.000Z"));
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      access_token: "oauth-access-new",
      refresh_token: "oauth-refresh-new",
      expires_in: 3600,
      token_type: "bearer",
    }), { status: 200 })));
    vi.mocked(getCalendlyAccount).mockResolvedValueOnce({
      account_id: "calendly-workspace-a",
      type: "calendly",
      provider: "calendly",
      status: "connected",
      connected_at: "2026-05-18T08:00:00.000Z",
      workspace_id: "workspace-a",
      access_token: "oauth-access-old",
      refresh_token: "oauth-refresh-old",
      token_expires_at: "2026-05-18T09:59:00.000Z",
    });

    await expect(getCalendlyToken("workspace-a")).resolves.toBe("oauth-access-new");
    expect(upsertCalendlyAccount).toHaveBeenCalledWith(
      expect.objectContaining({
        workspace_id: "workspace-a",
        access_token: "oauth-access-new",
        refresh_token: "oauth-refresh-new",
        status: "connected",
      })
    );
  });

  it("fallback sur le PAT si aucun compte OAuth n'est configure", async () => {
    vi.mocked(getCalendlyAccount).mockResolvedValueOnce(null);

    await expect(getCalendlyToken("workspace-a")).resolves.toBe("pat-token");
  });
});

describe("getCalendlySchedulingUrl", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    delete process.env.CALENDLY_SCHEDULING_URL;
    process.env.CALENDLY_TOKEN = "pat-token";
    process.env.CALENDLY_EVENT_TYPE_URI = "https://api.calendly.com/event_types/type_1";
  });

  it("retourne CALENDLY_SCHEDULING_URL si configure", async () => {
    process.env.CALENDLY_SCHEDULING_URL = "https://calendly.com/kames-ai/30min";
    await expect(getCalendlySchedulingUrl()).resolves.toBe("https://calendly.com/kames-ai/30min");
  });

  it("résout le scheduling_url public depuis l'URI API event type", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      resource: { scheduling_url: "https://calendly.com/kames-ai/30min" },
    }), { status: 200 })));

    await expect(getCalendlySchedulingUrl()).resolves.toBe("https://calendly.com/kames-ai/30min");
  });

  it("retourne directement une URL publique non API", async () => {
    await expect(getCalendlySchedulingUrl("https://calendly.com/kames-ai/30min")).resolves.toBe(
      "https://calendly.com/kames-ai/30min"
    );
  });
});
