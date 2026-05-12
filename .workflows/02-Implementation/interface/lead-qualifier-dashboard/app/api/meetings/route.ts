import { NextResponse } from "next/server";
import { getMeetings } from "@/lib/sheets";
import { getWeekWindow, isMeetingWithinWindow } from "@/lib/meetings";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const campaignId = searchParams.get("campaign_id");
  const status = searchParams.get("status");
  const weekStart = searchParams.get("week_start");

  let meetings = await getMeetings();

  if (campaignId) {
    meetings = meetings.filter((meeting) => meeting.campaign_id === campaignId);
  }

  if (status) {
    meetings = meetings.filter((meeting) => meeting.status === status);
  }

  if (weekStart) {
    const window = getWeekWindow(new Date(weekStart));
    meetings = meetings.filter((meeting) => isMeetingWithinWindow(meeting, window));
  }

  return NextResponse.json(meetings);
}
