import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { DEFAULT_WORKSPACE_ID } from "@/lib/workspaces";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  if (!request.headers.get("x-workspace-id")) {
    response.headers.set("x-workspace-id", DEFAULT_WORKSPACE_ID);
  }
  return response;
}

export const config = {
  matcher: ["/api/:path*", "/dashboard/:path*"],
};
