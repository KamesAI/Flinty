"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { CalendarCheck, CheckCircle2, LinkIcon, Save, Unplug } from "lucide-react";
import { toast, Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";

interface WorkspaceSettingsPayload {
  workspace_id: string;
  name: string;
  default_calendly_event_uri: string;
  calendly_status: "connected" | "expired" | "disconnected";
  calendly_connected_at?: string;
}

interface CalendlyEventType {
  uri: string;
  name: string;
  scheduling_url: string;
  duration: number;
}

function formatConnectedAt(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Paris",
  }).format(date);
}

export function CalendlyConnectClient({
  success,
  error,
}: {
  success?: string;
  error?: string;
}) {
  const [settings, setSettings] = useState<WorkspaceSettingsPayload | null>(null);
  const [eventTypes, setEventTypes] = useState<CalendlyEventType[]>([]);
  const [selectedEventType, setSelectedEventType] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const settingsResponse = await fetch("/api/workspaces/settings", { cache: "no-store" });
      if (settingsResponse.ok) {
        const payload = (await settingsResponse.json()) as WorkspaceSettingsPayload;
        if (!cancelled) {
          setSettings(payload);
          setSelectedEventType(payload.default_calendly_event_uri);
        }
      }

      const eventTypesResponse = await fetch("/api/calendly/event-types", { cache: "no-store" });
      if (eventTypesResponse.ok) {
        const payload = (await eventTypesResponse.json()) as CalendlyEventType[];
        if (!cancelled) setEventTypes(payload);
      }
    }

    load().catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const connected = settings?.calendly_status === "connected";
  const selectedEvent = useMemo(
    () => eventTypes.find((eventType) => eventType.uri === selectedEventType),
    [eventTypes, selectedEventType]
  );

  function saveDefaultEventType() {
    startTransition(async () => {
      const response = await fetch("/api/workspaces/settings", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ default_calendly_event_uri: selectedEventType }),
      });

      if (!response.ok) {
        toast.error("Erreur");
        return;
      }

      const payload = await response.json();
      if (payload.workspace) {
        setSettings((current) =>
          current
            ? { ...current, default_calendly_event_uri: payload.workspace.default_calendly_event_uri }
            : current
        );
      }
      toast.success("Sauvegardé");
    });
  }

  return (
    <div className="max-w-3xl space-y-6">
      <Toaster position="top-center" />

      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Calendly</h1>
        <p className="mt-1 text-sm text-slate-500">
          Connexion OAuth et event type par défaut du workspace.
        </p>
      </div>

      {success ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-900">
          Calendly connecté.
        </div>
      ) : null}
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-900">
          Connexion impossible : {error}
        </div>
      ) : null}

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              {connected ? <CheckCircle2 className="size-5" /> : <Unplug className="size-5" />}
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-slate-950">
                {connected ? "Calendly connecté" : "Calendly déconnecté"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {connected
                  ? `Connecté depuis le ${formatConnectedAt(settings?.calendly_connected_at) || "date inconnue"}`
                  : "Aucun compte OAuth Calendly stocké pour ce workspace."}
              </p>
              <p className="mt-2 truncate font-mono text-xs text-slate-400">
                {settings?.workspace_id ?? "kames-default"}
              </p>
            </div>
          </div>
          <Button asChild>
            <a href="/api/calendly/auth/initiate">
              <LinkIcon className="size-4" />
              Connecter Calendly
            </a>
          </Button>
        </div>
      </section>

      <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-2">
          <CalendarCheck className="size-4 text-primary" />
          <h2 className="text-base font-semibold text-slate-950">Event type par défaut</h2>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-900">Event type</span>
          <select
            value={selectedEventType}
            onChange={(event) => setSelectedEventType(event.target.value)}
            className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
          >
            <option value="">Aucun event type par défaut</option>
            {eventTypes.map((eventType) => (
              <option key={eventType.uri} value={eventType.uri}>
                {eventType.name} · {eventType.duration} min
              </option>
            ))}
          </select>
        </label>

        {selectedEvent ? (
          <p className="truncate text-sm text-slate-500">{selectedEvent.scheduling_url}</p>
        ) : null}

        <Button type="button" onClick={saveDefaultEventType} disabled={isPending}>
          <Save className="size-4" />
          {isPending ? "Sauvegarde..." : "Sauvegarder"}
        </Button>
      </section>
    </div>
  );
}
