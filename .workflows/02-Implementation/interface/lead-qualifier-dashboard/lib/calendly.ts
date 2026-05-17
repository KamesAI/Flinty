import type { CalendlySlot } from "./types";

export { type CalendlySlot };

const CALENDLY_API_BASE = "https://api.calendly.com";

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

function getCalendlyToken(): string {
  const token = process.env.CALENDLY_TOKEN;
  if (!token) throw new Error("CALENDLY_TOKEN env var missing");
  return token;
}

/**
 * Récupère les N prochains slots disponibles pour un event type.
 * Calendly v2 API — endpoint: GET /event_type_available_times
 */
export async function getAvailableSlots(
  eventTypeUri: string,
  count = 3
): Promise<CalendlySlot[]> {
  const token = getCalendlyToken();
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
  const token = getCalendlyToken();
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
  const token = getCalendlyToken();
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
