export type EventType = "sent" | "opened" | "clicked" | "replied" | "bounced";
export type EmailType = "j0" | "j3" | "j7";

export interface EmailEvent {
  event_id: string;
  lead_id: string;
  campaign_id: string;
  event_type: EventType;
  email_type: EmailType;
  timestamp: string;
  metadata: string;
}

export const EMAIL_EVENTS_SHEET_NAME = "Email_Events";
export const EMAIL_EVENTS_HEADER = [
  "event_id",
  "lead_id",
  "campaign_id",
  "event_type",
  "email_type",
  "timestamp",
  "metadata",
] as const;

export function parseEmailEventRows(rows: string[][]): EmailEvent[] {
  if (!rows.length) return [];
  const [, ...data] = rows;
  return data
    .filter((r) => (r[0] ?? "").trim().length > 0)
    .map((r) => ({
      event_id: r[0] ?? "",
      lead_id: r[1] ?? "",
      campaign_id: r[2] ?? "",
      event_type: (r[3] ?? "sent") as EventType,
      email_type: (r[4] ?? "j0") as EmailType,
      timestamp: r[5] ?? "",
      metadata: r[6] ?? "",
    }));
}

export function getEventLabel(event_type: EventType): string {
  switch (event_type) {
    case "sent":    return "Email envoyé";
    case "opened":  return "Ouvert";
    case "clicked": return "Lien cliqué";
    case "replied": return "Répondu";
    case "bounced": return "Bounced";
  }
}

export function getEventIcon(event_type: EventType): string {
  switch (event_type) {
    case "sent":    return "📧";
    case "opened":  return "👁";
    case "clicked": return "🖱";
    case "replied": return "💬";
    case "bounced": return "⚠️";
  }
}

export function getEmailTypeLabel(email_type: EmailType): string {
  switch (email_type) {
    case "j0": return "J0";
    case "j3": return "J+3";
    case "j7": return "J+7";
  }
}
