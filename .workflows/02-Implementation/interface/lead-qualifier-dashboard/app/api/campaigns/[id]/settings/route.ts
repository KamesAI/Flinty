import { NextResponse } from "next/server";
import { z } from "zod";
import { getCampaignById } from "@/lib/campaigns";
import { readCampaignConfig } from "@/lib/replies";
import { updateConfigValue } from "@/lib/sheets";
import { buildWarmupState, configBool } from "@/lib/warmup";

const SettingsSchema = z.object({
  setter_enabled: z.boolean(),
  setter_validation: z.boolean(),
  warmup_campaign: z.boolean(),
  setter_tone: z.enum(["formal", "casual"]),
  setter_signature: z.string().trim().min(1).max(120),
  calendly_event_uri: z.string().trim().max(500),
  loom_video_url: z.string().trim().url().or(z.literal("")).default(""),
});

function toBool(value: string | undefined, fallback: boolean) {
  if (!value) return fallback;
  return value.toLowerCase() === "true";
}

function normalizeSettings(config: Record<string, string>) {
  const warmup = buildWarmupState(config, Number.parseInt(config.warmup_positive_replies ?? "0", 10) || 0);
  return {
    setter_enabled: toBool(config.setter_enabled, false),
    setter_validation: toBool(config.setter_validation, true),
    setter_validation_locked_until: config.setter_validation_locked_until ?? "",
    warmup_campaign: configBool(config.warmup_campaign, false),
    warmup_started_at: config.warmup_started_at ?? "",
    warmup_day: warmup.day,
    warmup_max_daily_sends: warmup.maxDailySends,
    warmup_positive_replies: warmup.positiveReplies,
    warmup_completed: warmup.completed,
    setter_tone: config.setter_tone === "casual" ? "casual" : "formal",
    setter_signature: config.setter_signature || "Thomas",
    calendly_event_uri: config.calendly_event_uri || process.env.CALENDLY_EVENT_TYPE_URI || "",
    loom_video_url: config.loom_video_url || "",
  };
}

async function resolveCampaign(id: string) {
  const resolved = await getCampaignById(id);
  if (!resolved?.sheetId) return null;
  return resolved;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const resolved = await resolveCampaign(id);
  if (!resolved) return NextResponse.json({ error: "Campagne introuvable" }, { status: 404 });

  const config = await readCampaignConfig(resolved.sheetId, id);
  return NextResponse.json(normalizeSettings(config));
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const resolved = await resolveCampaign(id);
  if (!resolved) return NextResponse.json({ error: "Campagne introuvable" }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const parsed = SettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const existingConfig: Record<string, string> = await readCampaignConfig(resolved.sheetId, id)
    .catch(() => ({}));
  const warmupStartedAt = existingConfig.warmup_started_at || new Date().toISOString();
  const values = {
    setter_enabled: parsed.data.setter_enabled ? "TRUE" : "FALSE",
    setter_validation: parsed.data.setter_validation ? "TRUE" : "FALSE",
    warmup_campaign: parsed.data.warmup_campaign ? "TRUE" : "FALSE",
    ...(parsed.data.warmup_campaign ? { warmup_started_at: warmupStartedAt } : {}),
    setter_tone: parsed.data.setter_tone,
    setter_signature: parsed.data.setter_signature,
    calendly_event_uri: parsed.data.calendly_event_uri,
    loom_video_url: parsed.data.loom_video_url,
  };

  await Promise.all(
    Object.entries(values).map(([key, value]) =>
      updateConfigValue(resolved.sheetId, id, key, value)
    )
  );

  const config = await readCampaignConfig(resolved.sheetId, id).catch(() => values);
  return NextResponse.json({ ok: true, settings: normalizeSettings({ ...config, ...values }) });
}
