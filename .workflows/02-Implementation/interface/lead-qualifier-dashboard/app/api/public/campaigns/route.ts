import { NextResponse } from "next/server";

import { parseIndexCampaigns, readIndex } from "@/lib/sheets";
import { filterCampaignsByWorkspace, toPublicCampaign } from "@/lib/public-api";
import { resolveWorkspaceIdFromRequest, unauthorizedResponse } from "@/lib/public-api-server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const workspaceId = await resolveWorkspaceIdFromRequest(request);
  if (!workspaceId) return unauthorizedResponse();

  const campaigns = parseIndexCampaigns(await readIndex());
  return NextResponse.json({
    workspace_id: workspaceId,
    campaigns: filterCampaignsByWorkspace(campaigns, workspaceId).map(toPublicCampaign),
  });
}
