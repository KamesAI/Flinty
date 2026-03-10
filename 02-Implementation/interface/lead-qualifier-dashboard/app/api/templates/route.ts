import { NextResponse } from "next/server";
import { saveCampaignEmailTemplates } from "@/lib/sheets";
import {
  normalizeTemplateEntryInput,
  validateTemplateEntryInput,
  type EmailTemplateEntryInput,
} from "@/lib/email-templates";

function isValidTemplateEntry(entry: unknown): entry is EmailTemplateEntryInput {
  if (!entry || typeof entry !== "object") return false;
  return validateTemplateEntryInput(entry as Partial<EmailTemplateEntryInput>).valid;
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

  const normalizedEntries = entries.map((entry) => normalizeTemplateEntryInput(entry));
  const templates = await saveCampaignEmailTemplates(campaignId, normalizedEntries);
  return NextResponse.json({ success: true, templates });
}
