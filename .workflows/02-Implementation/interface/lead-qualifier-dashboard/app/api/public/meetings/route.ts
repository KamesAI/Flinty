import { NextResponse } from "next/server";

import { getMeetings, parseIndexCampaigns, readIndex } from "@/lib/sheets";
import { filterMeetingsByWorkspace } from "@/lib/public-api";
import { resolveWorkspaceIdFromRequest, unauthorizedResponse } from "@/lib/public-api-server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const workspaceId = await resolveWorkspaceIdFromRequest(request);
  if (!workspaceId) return unauthorizedResponse();

  const [campaigns, meetings] = await Promise.all([
    readIndex().then(parseIndexCampaigns),
    getMeetings(),
  ]);
  return NextResponse.json({
    workspace_id: workspaceId,
    meetings: filterMeetingsByWorkspace(meetings, campaigns, workspaceId),
  });
}
