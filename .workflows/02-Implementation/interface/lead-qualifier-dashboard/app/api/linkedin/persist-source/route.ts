import { NextResponse } from "next/server";
import { z } from "zod";
import {
  appendContactRegistryEntry,
  appendToChildSheet,
  getContactRegistryLinkedInUrls,
  parseIndexCampaigns,
  readIndex,
} from "@/lib/sheets";

export const dynamic = "force-dynamic";

const LeadSchema = z.object({
  name: z.string().trim().min(1),
  linkedin_url: z.string().trim().min(1),
  title: z.string().default(""),
  company: z.string().default(""),
  source_channel: z.enum(["linkedin_search", "post_engagers", "profile_visitors", "external_post"]),
});

const PersistSourceSchema = z.object({
  campaign_id: z.string().trim().min(1),
  sheet_id: z.string().trim().optional(),
  leads: z.array(LeadSchema).max(100),
});

function isAuthorized(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true;
  return req.headers.get("authorization") === `Bearer ${cronSecret}`;
}

function normalizeLinkedInUrl(url: string) {
  return url.trim().toLowerCase().replace(/\/+$/, "");
}

async function resolveSheetId(campaignId: string, explicitSheetId?: string) {
  if (explicitSheetId) return explicitSheetId;
  const campaign = parseIndexCampaigns(await readIndex()).find(
    (candidate) => candidate.campaign_id === campaignId
  );
  return campaign?.sheet_id ?? "";
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const parsed = PersistSourceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const sheetId = await resolveSheetId(parsed.data.campaign_id, parsed.data.sheet_id);
  if (!sheetId) {
    return NextResponse.json({ error: "Campagne introuvable ou sheet_id manquant" }, { status: 404 });
  }

  const existingUrls = await getContactRegistryLinkedInUrls(parsed.data.campaign_id);
  const seen = new Set(existingUrls);
  const insertedLeadIds: string[] = [];
  let skippedDuplicates = 0;
  const now = new Date().toISOString();

  for (const [index, lead] of parsed.data.leads.entries()) {
    const normalizedUrl = normalizeLinkedInUrl(lead.linkedin_url);
    if (seen.has(normalizedUrl)) {
      skippedDuplicates += 1;
      continue;
    }
    seen.add(normalizedUrl);

    const leadId = `li_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 8)}`;
    await appendToChildSheet(sheetId, "Leads_Raw!A:N", [
      leadId,
      parsed.data.campaign_id,
      lead.name,
      lead.linkedin_url,
      lead.title,
      lead.company,
      lead.source_channel,
      "linkedin",
      "",
      "",
      "",
      "",
      "",
      now,
    ]);
    await appendContactRegistryEntry({
      contact_key: normalizedUrl,
      email: "",
      domain: "",
      linkedin_url: lead.linkedin_url,
      last_contacted_at: now,
      campaign_id: parsed.data.campaign_id,
      statut: "sourced",
      source_channel: lead.source_channel,
    });
    insertedLeadIds.push(leadId);
  }

  return NextResponse.json({
    ok: true,
    inserted_count: insertedLeadIds.length,
    skipped_duplicates: skippedDuplicates,
    lead_ids: insertedLeadIds,
  });
}
