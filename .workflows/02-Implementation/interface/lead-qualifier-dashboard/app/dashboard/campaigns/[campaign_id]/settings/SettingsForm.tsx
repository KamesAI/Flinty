"use client";

import { useMemo, useState, useTransition } from "react";
import { Save } from "lucide-react";
import { toast, Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";

export interface CampaignSettingsState {
  setter_enabled: boolean;
  setter_validation: boolean;
  setter_validation_locked_until: string;
  warmup_campaign: boolean;
  warmup_started_at: string;
  warmup_day: number;
  warmup_max_daily_sends: number;
  warmup_positive_replies: number;
  warmup_completed: boolean;
  setter_tone: "formal" | "casual";
  setter_signature: string;
  calendly_event_uri: string;
}

export function SettingsForm({
  campaignId,
  initialSettings,
}: {
  campaignId: string;
  initialSettings: CampaignSettingsState;
}) {
  const [settings, setSettings] = useState(initialSettings);
  const [isPending, startTransition] = useTransition();

  const validationLocked = useMemo(() => {
    if (!settings.setter_validation_locked_until) return false;
    const until = new Date(settings.setter_validation_locked_until).getTime();
    return Number.isFinite(until) && until > Date.now();
  }, [settings.setter_validation_locked_until]);

  function update<K extends keyof CampaignSettingsState>(key: K, value: CampaignSettingsState[K]) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  function save() {
    startTransition(async () => {
      const res = await fetch(`/api/campaigns/${campaignId}/settings`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          setter_enabled: settings.setter_enabled,
          setter_validation: settings.setter_validation,
          warmup_campaign: settings.warmup_campaign,
          setter_tone: settings.setter_tone,
          setter_signature: settings.setter_signature,
          calendly_event_uri: settings.calendly_event_uri,
        }),
      });

      if (!res.ok) {
        toast.error("Erreur");
        return;
      }

      const payload = await res.json();
      if (payload.settings) setSettings(payload.settings);
      toast.success("Sauvegardé");
    });
  }

  return (
    <form
      className="max-w-2xl space-y-8"
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      <Toaster position="top-center" />

      <section className="space-y-5">
        <div>
          <h2 className="text-base font-semibold text-slate-950">AI Setter</h2>
          <p className="mt-1 text-sm text-slate-500">Paramètres propres à cette campagne.</p>
        </div>

        <label className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3">
          <span>
            <span className="block text-sm font-medium text-slate-900">Activer Setter</span>
            <span className="block text-xs text-slate-500">Génère des réponses aux prospects.</span>
          </span>
          <input
            type="checkbox"
            checked={settings.setter_enabled}
            onChange={(event) => update("setter_enabled", event.target.checked)}
            className="size-5 accent-primary"
          />
        </label>

        <label className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3">
          <span>
            <span className="block text-sm font-medium text-slate-900">Validation humaine</span>
            <span className="block text-xs text-slate-500">Obligatoire pendant le warm-up.</span>
          </span>
          <input
            type="checkbox"
            checked={settings.setter_validation}
            disabled={validationLocked}
            onChange={(event) => update("setter_validation", event.target.checked)}
            className="size-5 accent-primary disabled:opacity-40"
          />
        </label>

        <label className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3">
          <span>
            <span className="block text-sm font-medium text-slate-900">Mode warm-up</span>
            <span className="block text-xs text-slate-500">
              Cap progressif, scoring bypassé et replies positives suivies.
            </span>
          </span>
          <input
            type="checkbox"
            checked={settings.warmup_campaign}
            onChange={(event) => update("warmup_campaign", event.target.checked)}
            className="size-5 accent-primary"
          />
        </label>

        <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm sm:grid-cols-3">
          <div>
            <span className="block text-xs font-medium uppercase text-slate-500">Jour</span>
            <span className="mt-1 block font-semibold text-slate-950">
              J{Math.min(settings.warmup_day, 14)}/J14
            </span>
          </div>
          <div>
            <span className="block text-xs font-medium uppercase text-slate-500">Cap</span>
            <span className="mt-1 block font-semibold text-slate-950">
              {settings.warmup_max_daily_sends} emails/jour
            </span>
          </div>
          <div>
            <span className="block text-xs font-medium uppercase text-slate-500">Replies positives</span>
            <span className="mt-1 block font-semibold text-slate-950">
              {settings.warmup_positive_replies}
            </span>
          </div>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-900">Validation verrouillée jusqu'au</span>
          <input
            readOnly
            value={settings.setter_validation_locked_until || "Non verrouillée"}
            className="h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-900">Ton</span>
          <select
            value={settings.setter_tone}
            onChange={(event) => update("setter_tone", event.target.value as "formal" | "casual")}
            className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
          >
            <option value="formal">Formel</option>
            <option value="casual">Casual</option>
          </select>
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-900">Signature Setter</span>
          <textarea
            value={settings.setter_signature}
            onChange={(event) => update("setter_signature", event.target.value)}
            rows={3}
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
          />
        </label>
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-semibold text-slate-950">Calendly</h2>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-900">Event URI</span>
          <input
            value={settings.calendly_event_uri}
            onChange={(event) => update("calendly_event_uri", event.target.value)}
            className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
          />
        </label>
      </section>

      <Button type="submit" disabled={isPending}>
        <Save className="size-4" />
        {isPending ? "Sauvegarde..." : "Sauvegarder"}
      </Button>
    </form>
  );
}
