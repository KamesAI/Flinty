import { NextResponse } from "next/server";
import { saveCampaignEmailTemplates } from "@/lib/sheets";
import { EMAIL_TEMPLATE_SECTIONS, type EmailTemplateEntry } from "@/lib/email-templates";

function isValidTemplateEntry(entry: unknown): entry is Omit<EmailTemplateEntry, "campaign_id" | "updated_at"> {
  if (!entry || typeof entry !== "object") return false;

  const candidate = entry as Record<string, unknown>;
  const allowedPairs = EMAIL_TEMPLATE_SECTIONS.flatMap((section) =>
    section.variants.map((variant) => `${section.key}:${variant.key}`)
  );

  return (
    typeof candidate.sequence_key === "string" &&
    typeof candidate.variant_key === "string" &&
    typeof candidate.label === "string" &&
    typeof candidate.subject === "string" &&
    typeof candidate.body === "string" &&
    allowedPairs.includes(`${candidate.sequence_key}:${candidate.variant_key}`)
  );
}

export async function POST(req: Request) {
  const body = await req.json();
  const campaignId = body?.campaign_id;
  const entries = body?.entries;

  if (typeof campaignId !== "string" || campaignId.trim().length === 0) {
    return NextResponse.json(
      { success: false, message: "campaign_id requis" },
      { status: 400 }
    );
  }

  if (!Array.isArray(entries) || !entries.every(isValidTemplateEntry)) {
    return NextResponse.json(
      { success: false, message: "Format de templates invalide" },
      { status: 400 }
    );
  }

  const templates = await saveCampaignEmailTemplates(campaignId, entries);
  return NextResponse.json({ success: true, templates });
}
