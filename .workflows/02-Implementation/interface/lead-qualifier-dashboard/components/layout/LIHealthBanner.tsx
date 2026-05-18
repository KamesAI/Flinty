"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";

type LinkedInHealthStatus =
  | "active"
  | "paused_captcha"
  | "paused_warning"
  | "paused_low_accept"
  | "paused_follow_mode";

interface LinkedInHealthPayload {
  status: LinkedInHealthStatus;
  reason?: string;
  pause_started_at?: string;
}

const STATUS_MESSAGES: Record<Exclude<LinkedInHealthStatus, "active">, { message: string; ttlDays: number }> = {
  paused_captcha: { message: "Captcha LinkedIn detecte", ttlDays: 1 },
  paused_warning: { message: "Alerte LinkedIn activite inhabituelle", ttlDays: 14 },
  paused_low_accept: { message: "Taux d'acceptation <20% - verifiez votre ICP", ttlDays: 7 },
  paused_follow_mode: { message: "Mode Suivre detecte sur plusieurs profils", ttlDays: 7 },
};

export function getLinkedInHealthStatusLabel(status: string) {
  return STATUS_MESSAGES[status as keyof typeof STATUS_MESSAGES]?.message ?? "Compte LinkedIn en pause";
}

export function formatLinkedInHealthEta(status: string, pauseStartedAt?: string, now = new Date()) {
  const info = STATUS_MESSAGES[status as keyof typeof STATUS_MESSAGES];
  if (!info || !pauseStartedAt) return "Reprise automatique en attente";

  const start = new Date(pauseStartedAt).getTime();
  if (!Number.isFinite(start)) return "Reprise automatique en attente";

  const resumeAt = start + info.ttlDays * 24 * 60 * 60 * 1000;
  const remainingMs = Math.max(0, resumeAt - now.getTime());
  const remainingHours = Math.ceil(remainingMs / (60 * 60 * 1000));

  if (remainingHours <= 0) return "Reprise automatique imminente";
  if (remainingHours < 48) return `Reprise automatique dans ${remainingHours}h`;
  return `Reprise automatique dans ${Math.ceil(remainingHours / 24)} jours`;
}

export function LIHealthBanner() {
  const [health, setHealth] = useState<LinkedInHealthPayload | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadHealth() {
      try {
        const response = await fetch("/api/li-health", { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as LinkedInHealthPayload;
        if (!cancelled) setHealth(payload);
      } catch {
        if (!cancelled) setHealth(null);
      }
    }

    loadHealth();
    const interval = window.setInterval(loadHealth, 300_000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  if (!health || health.status === "active") return null;

  const label = health.reason || getLinkedInHealthStatusLabel(health.status);
  const eta = formatLinkedInHealthEta(health.status, health.pause_started_at);

  return (
    <div className="relative z-10 border-b border-red-200 bg-red-50 px-4 py-3 text-red-950">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" strokeWidth={2} />
          <div className="min-w-0">
            <p className="font-semibold">Compte LinkedIn en pause - {label}</p>
            <p className="mt-0.5 text-red-800">{eta}</p>
          </div>
        </div>
        <Link
          href="/dashboard/settings/linkedin/connect"
          className="inline-flex shrink-0 items-center gap-2 rounded-md border border-red-200 bg-white px-3 py-2 font-medium text-red-900 transition-colors hover:bg-red-100"
        >
          Voir details
          <ArrowRight className="h-4 w-4" strokeWidth={2} />
        </Link>
      </div>
    </div>
  );
}
