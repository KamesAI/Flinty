import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { getCampaignById } from "@/lib/campaigns";
import { readCampaignConfig } from "@/lib/replies";
import { buildWarmupState } from "@/lib/warmup";
import { SettingsForm, type CampaignSettingsState } from "./SettingsForm";

function boolFromConfig(value: string | undefined, fallback: boolean) {
  if (!value) return fallback;
  return value.toLowerCase() === "true";
}

function settingsFromConfig(config: Record<string, string>): CampaignSettingsState {
  const warmup = buildWarmupState(config, Number.parseInt(config.warmup_positive_replies ?? "0", 10) || 0);
  return {
    setter_enabled: boolFromConfig(config.setter_enabled, false),
    setter_validation: boolFromConfig(config.setter_validation, true),
    setter_validation_locked_until: config.setter_validation_locked_until ?? "",
    warmup_campaign: boolFromConfig(config.warmup_campaign, false),
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

export default async function CampaignSettingsPage({
  params,
}: {
  params: Promise<{ campaign_id: string }>;
}) {
  const { campaign_id } = await params;
  const resolved = await getCampaignById(campaign_id);
  if (!resolved?.sheetId) notFound();

  const config = await readCampaignConfig(resolved.sheetId, campaign_id);
  const settings = settingsFromConfig(config);

  return (
    <div className="px-1 py-2 sm:px-2 sm:py-3">
      <nav className="mb-5 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/dashboard/campaigns/overview" className="transition-colors hover:text-foreground">
          Campagnes
        </Link>
        <ChevronRight className="size-3.5" />
        <Link
          href={`/dashboard/campaigns/${campaign_id}`}
          className="truncate transition-colors hover:text-foreground"
        >
          {resolved.campaign.nom}
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">Paramètres</span>
      </nav>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Paramètres campagne</h1>
        <p className="mt-1 text-sm text-slate-500">AI Setter, warm-up, validation humaine, Calendly et Loom.</p>
      </div>

      <SettingsForm campaignId={campaign_id} initialSettings={settings} />
    </div>
  );
}
