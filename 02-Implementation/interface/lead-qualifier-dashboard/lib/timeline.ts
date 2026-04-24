import type { EmailEvent } from "./email-events";
import type { Meeting } from "./meetings";
import { getEventIcon, getEventLabel, getEmailTypeLabel } from "./email-events";
import { getMeetingStatusLabel, getMeetingSourceLabel } from "./meetings";

export type TimelineItemType =
  | "email_sent"
  | "email_opened"
  | "email_clicked"
  | "email_replied"
  | "email_bounced"
  | "meeting_scheduled"
  | "meeting_completed"
  | "meeting_cancelled"
  | "meeting_no_show";

export interface TimelineItem {
  id: string;
  type: TimelineItemType;
  channel: "email" | "meeting";
  timestamp: string;
  title: string;
  subtitle?: string;
  status?: string;
  raw: EmailEvent | Meeting;
}

export function emailEventToTimelineItem(event: EmailEvent): TimelineItem {
  return {
    id: event.event_id,
    type: `email_${event.event_type}` as TimelineItemType,
    channel: "email",
    timestamp: event.timestamp,
    title: getEventLabel(event.event_type),
    subtitle: getEmailTypeLabel(event.email_type),
    raw: event,
  };
}

export function meetingToTimelineItem(meeting: Meeting): TimelineItem {
  return {
    id: meeting.meeting_id,
    type: `meeting_${meeting.status}` as TimelineItemType,
    channel: "meeting",
    timestamp: meeting.start_at,
    title: meeting.title || "Meeting",
    subtitle: getMeetingSourceLabel(meeting.source),
    status: getMeetingStatusLabel(meeting.status),
    raw: meeting,
  };
}

export function buildTimeline(
  emailEvents: EmailEvent[],
  meetings: Meeting[]
): TimelineItem[] {
  const items: TimelineItem[] = [
    ...emailEvents.map(emailEventToTimelineItem),
    ...meetings.map(meetingToTimelineItem),
  ];
  return items.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export function getTimelineIcon(item: TimelineItem): string {
  if (item.channel === "email") {
    const event = item.raw as EmailEvent;
    return getEventIcon(event.event_type);
  }
  const meeting = item.raw as Meeting;
  switch (meeting.status) {
    case "scheduled": return "📅";
    case "completed": return "✅";
    case "cancelled": return "❌";
    case "no_show":   return "👻";
    default:          return "📅";
  }
}

export function getTimelineChannelBadge(item: TimelineItem): {
  label: string;
  classes: string;
} {
  if (item.channel === "email") {
    return { label: "Email", classes: "bg-blue-900/40 text-blue-400" };
  }
  return { label: "Meeting", classes: "bg-blue-900/40 text-blue-400" };
}
