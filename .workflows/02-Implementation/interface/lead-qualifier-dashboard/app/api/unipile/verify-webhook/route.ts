import { NextResponse } from "next/server";
import { verifyUnipileWebhook } from "@/lib/unipile";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const signature =
    req.headers.get("x-unipile-signature") ??
    req.headers.get("x-signature") ??
    "";
  const rawBody = await req.text();
  const valid = verifyUnipileWebhook(rawBody, signature);

  if (!valid) {
    return NextResponse.json({ valid: false }, { status: 401 });
  }

  return NextResponse.json({ valid: true });
}
