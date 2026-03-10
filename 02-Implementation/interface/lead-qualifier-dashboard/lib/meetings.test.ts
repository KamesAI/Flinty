import { describe, expect, it } from "vitest";
import {
  buildMeetingCarouselDays,
  formatMeetingWeekLabel,
  getWeekWindow,
  isMeetingWithinWindow,
  parseMeetingRows,
  type Meeting,
} from "./meetings";

describe("parseMeetingRows", () => {
  it("parse les meetings et garde les champs essentiels", () => {
    const meetings = parseMeetingRows([
      [
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
      ],
      [
        "meet_1",
        "lead_1",
        "camp_1",
        "calendly",
        "Demo Kames",
        "2026-03-10T09:00:00.000Z",
        "2026-03-10T09:30:00.000Z",
        "Europe/Paris",
        "scheduled",
        "https://calendly.com/event",
        "Thomas",
        "thomas@example.com",
        '{"event_type":"demo"}',
      ],
    ]);

    expect(meetings).toHaveLength(1);
    expect(meetings[0]).toMatchObject({
      meeting_id: "meet_1",
      lead_id: "lead_1",
      campaign_id: "camp_1",
      source: "calendly",
      status: "scheduled",
      attendee_name: "Thomas",
    });
  });
});

describe("meeting week helpers", () => {
  const referenceDate = new Date("2026-03-08T12:00:00.000Z");
  const meeting: Meeting = {
    meeting_id: "meet_1",
    lead_id: "lead_1",
    campaign_id: "camp_1",
    source: "calendly",
    title: "Weekly demo",
    start_at: "2026-03-10T09:00:00.000Z",
    end_at: "2026-03-10T09:30:00.000Z",
    timezone: "Europe/Paris",
    status: "scheduled",
    booking_url: "https://calendly.com/event",
    attendee_name: "Thomas",
    attendee_email: "thomas@example.com",
    metadata: "",
  };

  it("calcule la fenetre de la semaine courante", () => {
    const window = getWeekWindow(referenceDate);

    expect(window.start.toISOString()).toBe("2026-03-02T00:00:00.000Z");
    expect(window.end.toISOString()).toBe("2026-03-08T23:59:59.999Z");
  });

  it("detecte si un meeting tombe dans une fenetre donnee", () => {
    const window = getWeekWindow(new Date("2026-03-09T12:00:00.000Z"));

    expect(isMeetingWithinWindow(meeting, window)).toBe(true);
  });

  it("formate un libelle de semaine lisible", () => {
    const window = getWeekWindow(new Date("2026-03-09T12:00:00.000Z"));

    expect(formatMeetingWeekLabel(window.start, window.end)).toContain("mars");
  });

  it("genere un carrousel de jours consecutifs avec les compteurs de meetings", () => {
    const days = buildMeetingCarouselDays(
      [
        meeting,
        {
          ...meeting,
          meeting_id: "meet_2",
          start_at: "2026-03-11T14:00:00.000Z",
          end_at: "2026-03-11T14:30:00.000Z",
        },
      ],
      new Date("2026-03-10T08:00:00.000Z"),
      5
    );

    expect(days).toHaveLength(5);
    expect(days[0]).toMatchObject({
      key: "2026-03-10",
      meetingCount: 1,
      isToday: true,
    });
    expect(days[1]).toMatchObject({
      key: "2026-03-11",
      meetingCount: 1,
      isToday: false,
    });
    expect(days[4]).toMatchObject({
      key: "2026-03-14",
      meetingCount: 0,
    });
  });
});
