import { NextResponse } from "next/server";
import { getCalendlyToken, listCalendlyEventTypes } from "@/lib/calendly";
import { DEFAULT_WORKSPACE_ID } from "@/lib/workspaces";

export async function GET(req: Request) {
  const workspaceId = req.headers.get("x-workspace-id") ?? DEFAULT_WORKSPACE_ID;
  try {
    const token = await getCalendlyToken(workspaceId);
    const eventTypes = await listCalendlyEventTypes(token);
    return NextResponse.json(eventTypes);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
