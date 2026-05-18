import { NextResponse } from "next/server";
import { z } from "zod";
import { getCalendlyAccount, getWorkspace, upsertWorkspace } from "@/lib/sheets";
import { DEFAULT_WORKSPACE_ID } from "@/lib/workspaces";

const WorkspaceSettingsSchema = z.object({
  default_calendly_event_uri: z.string().trim().max(500),
});

function currentWorkspaceId(req: Request) {
  return req.headers.get("x-workspace-id") ?? DEFAULT_WORKSPACE_ID;
}

export async function GET(req: Request) {
  const workspaceId = currentWorkspaceId(req);
  const [workspace, calendlyAccount] = await Promise.all([
    getWorkspace(workspaceId),
    getCalendlyAccount(workspaceId),
  ]);

  return NextResponse.json({
    workspace_id: workspaceId,
    name: workspace?.name ?? "Kames",
    owner_email: workspace?.owner_email ?? "",
    created_at: workspace?.created_at ?? "",
    default_calendly_event_uri: workspace?.default_calendly_event_uri ?? "",
    calendly_status: calendlyAccount?.status ?? "disconnected",
    calendly_connected_at: calendlyAccount?.connected_at ?? "",
  });
}

export async function PUT(req: Request) {
  const workspaceId = currentWorkspaceId(req);
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const parsed = WorkspaceSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const existing = await getWorkspace(workspaceId);
  const workspace = {
    workspace_id: workspaceId,
    name: existing?.name ?? "Kames",
    owner_email: existing?.owner_email ?? "",
    created_at: existing?.created_at || new Date().toISOString(),
    default_calendly_event_uri: parsed.data.default_calendly_event_uri,
  };

  await upsertWorkspace(workspace);
  return NextResponse.json({ ok: true, workspace });
}
