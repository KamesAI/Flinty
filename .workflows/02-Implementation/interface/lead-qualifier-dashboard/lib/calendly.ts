import type { CalendlySlot } from "./types";
import type { CalendlyAccountRow } from "./sheets";

export { type CalendlySlot };

const CALENDLY_API_BASE = "https://api.calendly.com";
const CALENDLY_AUTH_BASE = "https://auth.calendly.com";

export interface RawCalendlySlot {
  start_time: string;
  scheduling_url: string;
}

export interface RawCalendlyAvailability {
  collection: RawCalendlySlot[];
}

export interface CalendlyScheduledEvent {
  uri: string;
  name?: string;
  start_time: string;
  end_time?: string;
  event_type?: string;
}

export interface CalendlyInvitee {
  email: string;
  name?: string;
}

interface CalendlyScheduledEventsResponse {
  collection: CalendlyScheduledEvent[];
}

interface CalendlyInviteesResponse {
  collection: CalendlyInvitee[];
}

function getCalendlyPAT(): string {
  const token = process.env.CALENDLY_TOKEN;
  if (!token) throw new Error("CALENDLY_TOKEN env var missing");
  return token;
}

export function buildCalendlyAuthUrl(clientId: string, redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
  });
  return `${CALENDLY_AUTH_BASE}/oauth/authorize?${params.toString()}`;
}

export interface CalendlyTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export async function exchangeCalendlyCode(
  code: string,
  redirectUri: string
): Promise<CalendlyTokenResponse> {
  const clientId = process.env.CALENDLY_CLIENT_ID;
  const clientSecret = process.env.CALENDLY_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("CALENDLY_CLIENT_ID/SECRET manquants");

  const res = await fetch(`${CALENDLY_AUTH_BASE}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }).toString(),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Calendly token exchange error ${res.status}: ${body}`);
  }
  return res.json() as Promise<CalendlyTokenResponse>;
}

async function refreshCalendlyToken(refreshToken: string): Promise<CalendlyTokenResponse> {
  const clientId = process.env.CALENDLY_CLIENT_ID;
  const clientSecret = process.env.CALENDLY_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("CALENDLY_CLIENT_ID/SECRET manquants");

  const res = await fetch(`${CALENDLY_AUTH_BASE}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }).toString(),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Calendly token refresh error ${res.status}: ${body}`);
  }
  return res.json() as Promise<CalendlyTokenResponse>;
}

export async function getCalendlyToken(workspaceId: string): Promise<string> {
  const { getCalendlyAccount, upsertCalendlyAccount } = await import("./sheets");
  const account = await getCalendlyAccount(workspaceId);

  if (!account || !account.access_token) {
    return getCalendlyPAT();
  }

  const expiresAt = account.token_expires_at ? new Date(account.token_expires_at).getTime() : 0;
  const bufferMs = 5 * 60 * 1000; // refresh 5min avant expiry
  if (Date.now() < expiresAt - bufferMs) {
    return account.access_token;
  }

  if (!account.refresh_token) return getCalendlyPAT();

  const refreshed = await refreshCalendlyToken(account.refresh_token);
  const newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();
  const updated: import("./sheets").CalendlyAccountRow = {
    ...account,
    access_token: refreshed.access_token,
    refresh_token: refreshed.refresh_token,
    token_expires_at: newExpiresAt,
    status: "connected",
  };
  await upsertCalendlyAccount(updated);
  return refreshed.access_token;
}

export interface CalendlyEventType {
  uri: string;
  name: string;
  slug: string;
  active: boolean;
  scheduling_url: string;
  duration: number;
}

export async function listCalendlyEventTypes(token: string): Promise<CalendlyEventType[]> {
  const userRes = await fetch(`${CALENDLY_API_BASE}/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!userRes.ok) throw new Error(`Calendly users/me error ${userRes.status}`);
  const userData = await userRes.json() as { resource: { uri: string } };
  const userUri = userData.resource.uri;

  const params = new URLSearchParams({ user: userUri, active: "true" });
  const res = await fetch(`${CALENDLY_API_BASE}/event_types?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Calendly event_types error ${res.status}: ${body}`);
  }
  const data = await res.json() as { collection: CalendlyEventType[] };
  return data.collection ?? [];
}

export async function getCalendlySchedulingUrl(eventTypeUri?: string): Promise<string> {
  if (process.env.CALENDLY_SCHEDULING_URL) return process.env.CALENDLY_SCHEDULING_URL;

  const uri = eventTypeUri || process.env.CALENDLY_EVENT_TYPE_URI || "";
  if (!uri) return "";
  if (!uri.includes("api.calendly.com")) return uri;

  const token = getCalendlyPAT();
  const res = await fetch(uri, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) return "";
  const data = await res.json() as { resource?: { scheduling_url?: string }; scheduling_url?: string };
  return data.resource?.scheduling_url ?? data.scheduling_url ?? "";
}

/**
 * Récupère les N prochains slots disponibles pour un event type.
 * Calendly v2 API — endpoint: GET /event_type_available_times
 */
export async function getAvailableSlots(
  eventTypeUri: string,
  count = 3,
  workspaceId?: string
): Promise<CalendlySlot[]> {
  const token = workspaceId ? await getCalendlyToken(workspaceId) : getCalendlyPAT();
  const now = new Date();
  const startTime = now.toISOString();
  const endTime = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(); // +14 jours

  const params = new URLSearchParams({
    event_type: eventTypeUri,
    start_time: startTime,
    end_time: endTime,
  });

  const res = await fetch(
    `${CALENDLY_API_BASE}/event_type_available_times?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      next: { revalidate: 300 }, // cache 5min côté Next.js
    }
  );

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Calendly API error ${res.status}: ${body}`);
  }

  const data: RawCalendlyAvailability = await res.json();
  return parseCalendlySlots(data, count).map((s) => ({
    start_time: s.start_time,
    end_time: s.start_time, // Calendly available_times ne renvoie pas end_time directement
    scheduling_url: s.scheduling_url,
  }));
}

export async function fetchCalendlyScheduledEvents(
  minStartTime: Date,
  maxStartTime: Date
): Promise<CalendlyScheduledEvent[]> {
  const token = getCalendlyPAT();
  const userUri = process.env.CALENDLY_USER_URI;
  if (!userUri) throw new Error("CALENDLY_USER_URI env var missing");

  const params = new URLSearchParams({
    min_start_time: minStartTime.toISOString(),
    max_start_time: maxStartTime.toISOString(),
    status: "active",
    user: userUri,
  });

  const res = await fetch(`${CALENDLY_API_BASE}/scheduled_events?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Calendly scheduled_events error ${res.status}: ${body}`);
  }

  const data: CalendlyScheduledEventsResponse = await res.json();
  return data.collection ?? [];
}

export async function fetchCalendlyEventInvitees(
  eventUri: string
): Promise<CalendlyInvitee[]> {
  const token = getCalendlyPAT();
  const eventUuid = extractCalendlyId(eventUri);
  const res = await fetch(`${CALENDLY_API_BASE}/scheduled_events/${eventUuid}/invitees`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Calendly invitees error ${res.status}: ${body}`);
  }

  const data: CalendlyInviteesResponse = await res.json();
  return data.collection ?? [];
}

export function extractCalendlyId(uri: string): string {
  return uri.split("/").filter(Boolean).at(-1) ?? uri;
}

export function parseCalendlySlots(
  raw: RawCalendlyAvailability,
  count = 3
): RawCalendlySlot[] {
  return raw.collection.slice(0, count);
}

/**
 * Formate les slots en texte naturel français pour insertion dans un email/DM.
 * Ex: "- Vendredi 15 mai à 11h00 → https://calendly.com/..."
 */
export function formatSlotsNatural(
  slots: RawCalendlySlot[],
  timeZone = "Europe/Paris"
): string {
  if (slots.length === 0) {
    return "Je n'ai pas de créneaux disponibles en ce moment — n'hésitez pas à consulter mon agenda directement.";
  }

  const lines = slots.map((slot) => {
    const date = new Date(slot.start_time);
    const label = new Intl.DateTimeFormat("fr-FR", {
      timeZone,
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
    return `- ${label} → ${slot.scheduling_url}`;
  });

  return lines.join("\n");
}

/**
 * Vérifie la signature HMAC d'un webhook Calendly.
 * Header: Calendly-Webhook-Signature: t=<timestamp>,v1=<sig>
 */
export async function verifyCalendlyWebhookSignature(
  body: string,
  signatureHeader: string,
  secret: string
): Promise<boolean> {
  const parts = Object.fromEntries(
    signatureHeader.split(",").map((part) => part.split("=", 2) as [string, string])
  );
  const timestamp = parts["t"];
  const signature = parts["v1"];
  if (!timestamp || !signature) return false;

  const payload = `${timestamp}.${body}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const expected = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return expected === signature;
}
