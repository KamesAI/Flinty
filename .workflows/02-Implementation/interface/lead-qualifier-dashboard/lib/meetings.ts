export type MeetingSource = "calendly" | "manual" | "other";
export type MeetingStatus = "scheduled" | "completed" | "cancelled" | "no_show";

export interface Meeting {
  meeting_id: string;
  lead_id: string;
  campaign_id: string;
  source: MeetingSource;
  title: string;
  start_at: string;
  end_at: string;
  timezone: string;
  status: MeetingStatus;
  booking_url: string;
  attendee_name: string;
  attendee_email: string;
  metadata: string;
}

export interface MeetingWeekWindow {
  start: Date;
  end: Date;
}

export interface MeetingCarouselDay {
  key: string;
  isoDate: string;
  weekdayLabel: string;
  dayLabel: string;
  monthLabel: string;
  meetingCount: number;
  isToday: boolean;
}

export interface MeetingWeekDayChip {
  isoDate: string;
  weekdayInitial: string;
  dayNumber: string;
  isCurrentDay: boolean;
}

export const MEETINGS_SHEET_NAME = "Meetings";
export const MEETINGS_HEADER = [
  "meeting_id",
  "lead_id",
  "campaign_id",
  "source",
  "title",
  "start_at",
  "end_at",
  "timezone",
  "status",
  "booking_url",
  "attendee_name",
  "attendee_email",
  "metadata",
] as const;

export function parseMeetingRows(rows: string[][]): Meeting[] {
  if (!rows.length) return [];

  const [, ...data] = rows;
  return data
    .filter((row) => (row[0] ?? "").trim().length > 0)
    .map((row) => ({
      meeting_id: row[0] ?? "",
      lead_id: row[1] ?? "",
      campaign_id: row[2] ?? "",
      source: ((row[3] ?? "calendly") as MeetingSource) || "calendly",
      title: row[4] ?? "",
      start_at: row[5] ?? "",
      end_at: row[6] ?? "",
      timezone: row[7] ?? "Europe/Paris",
      status: ((row[8] ?? "scheduled") as MeetingStatus) || "scheduled",
      booking_url: row[9] ?? "",
      attendee_name: row[10] ?? "",
      attendee_email: row[11] ?? "",
      metadata: row[12] ?? "",
    }));
}

function toUtcStartOfDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function formatDatePart(date: Date, locale: string, timeZone: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(locale, { timeZone, ...options }).format(date);
}

export function getMeetingDayKey(dateInput: string | Date, timeZone = "Europe/Paris") {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";

  return `${year}-${month}-${day}`;
}

export function getWeekWindow(referenceDate = new Date()): MeetingWeekWindow {
  const currentDay = referenceDate.getUTCDay() || 7;
  const monday = new Date(referenceDate);
  monday.setUTCDate(referenceDate.getUTCDate() - currentDay + 1);

  const start = toUtcStartOfDay(monday);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  end.setUTCHours(23, 59, 59, 999);

  return { start, end };
}

export function getIsoWeekNumber(referenceDate = new Date()) {
  const date = new Date(
    Date.UTC(
      referenceDate.getUTCFullYear(),
      referenceDate.getUTCMonth(),
      referenceDate.getUTCDate()
    )
  );
  const day = date.getUTCDay() || 7;

  date.setUTCDate(date.getUTCDate() + 4 - day);

  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export function buildMeetingWeekDays(
  referenceDate = new Date(),
  timeZone = "Europe/Paris"
): MeetingWeekDayChip[] {
  const weekWindow = getWeekWindow(referenceDate);
  const todayKey = getMeetingDayKey(referenceDate, timeZone);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekWindow.start);
    date.setUTCDate(weekWindow.start.getUTCDate() + index);
    const isoDate = getMeetingDayKey(date, timeZone);

    return {
      isoDate,
      weekdayInitial: formatDatePart(date, "fr-FR", timeZone, { weekday: "narrow" }).toUpperCase(),
      dayNumber: formatDatePart(date, "fr-FR", timeZone, { day: "2-digit" }),
      isCurrentDay: isoDate === todayKey,
    };
  });
}

export function buildMeetingCarouselDays(
  meetings: Pick<Meeting, "start_at" | "timezone">[],
  referenceDate = new Date(),
  totalDays = 10,
  timeZone = "Europe/Paris"
): MeetingCarouselDay[] {
  const counts = new Map<string, number>();

  for (const meeting of meetings) {
    const key = getMeetingDayKey(meeting.start_at, meeting.timezone || timeZone);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const anchorDate = new Date(referenceDate);
  anchorDate.setUTCHours(12, 0, 0, 0);
  const todayKey = getMeetingDayKey(anchorDate, timeZone);

  return Array.from({ length: totalDays }, (_, index) => {
    const date = new Date(anchorDate);
    date.setUTCDate(anchorDate.getUTCDate() + index);
    const key = getMeetingDayKey(date, timeZone);

    return {
      key,
      isoDate: key,
      weekdayLabel: formatDatePart(date, "fr-FR", timeZone, { weekday: "short" }).replace(".", ""),
      dayLabel: formatDatePart(date, "fr-FR", timeZone, { day: "2-digit" }),
      monthLabel: formatDatePart(date, "fr-FR", timeZone, { month: "short" }).replace(".", ""),
      meetingCount: counts.get(key) ?? 0,
      isToday: key === todayKey,
    };
  });
}

export function isMeetingWithinWindow(meeting: Pick<Meeting, "start_at">, window: MeetingWeekWindow) {
  const meetingDate = new Date(meeting.start_at);
  return meetingDate >= window.start && meetingDate <= window.end;
}

export function formatMeetingWeekLabel(start: Date, end: Date) {
  const formatter = new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
  });

  return `Semaine du ${formatter.format(start)} au ${formatter.format(end)}`;
}

export function getMeetingStatusLabel(status: MeetingStatus) {
  switch (status) {
    case "scheduled":
      return "Planifié";
    case "completed":
      return "Réalisé";
    case "cancelled":
      return "Annulé";
    case "no_show":
      return "No-show";
    default:
      return status;
  }
}

export function getMeetingStatusClasses(status: MeetingStatus) {
  switch (status) {
    case "scheduled":
      return "bg-blue-500/20 text-blue-300";
    case "completed":
      return "bg-emerald-500/20 text-emerald-300";
    case "cancelled":
      return "bg-rose-500/20 text-rose-300";
    case "no_show":
      return "bg-amber-500/20 text-amber-300";
    default:
      return "bg-zinc-800 text-zinc-300";
  }
}

export function getMeetingSourceLabel(source: MeetingSource) {
  if (source === "calendly") return "Calendly";
  if (source === "manual") return "Manuel";
  return "Autre";
}
