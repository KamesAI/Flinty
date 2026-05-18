import { NextResponse } from "next/server";
import { listWorkspaces } from "@/lib/sheets";

export async function GET() {
  const workspaces = await listWorkspaces();
  return NextResponse.json(workspaces);
}
