"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ExternalLink } from "lucide-react";

type EmailHealthStatus = "active" | "paused_high_bounce" | "paused_high_complaint";

interface EmailHealthPayload {
  domain: string;
  status: EmailHealthStatus | "domain_not_found";
  reason?: string;
  last_check_at?: string;
}

const statusLabels: Record<string, string> = {
  paused_high_bounce: "Pause automatique : taux de bounce 7j au-dessus de 5%",
  paused_high_complaint: "Pause automatique : taux de complaint 7j au-dessus de 0,3%",
  domain_not_found: "Domaine email introuvable dans Email_Health",
};

export function getEmailHealthStatusLabel(status: string) {
  return statusLabels[status] || "Pause automatique email";
}

export function formatEmailHealthCheckedAt(value?: string) {
  if (!value) return "date inconnue";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Paris",
  }).format(date);
}

export function EmailHealthBanner() {
  const [emailHealth, setEmailHealth] = useState<EmailHealthPayload | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadEmailHealth() {
      try {
        const response = await fetch("/api/email-health", { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as EmailHealthPayload;
        if (!cancelled) setEmailHealth(payload);
      } catch {
        if (!cancelled) setEmailHealth(null);
      }
    }

    loadEmailHealth();
    const interval = window.setInterval(loadEmailHealth, 60_000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  if (!emailHealth || emailHealth.status === "active") return null;

  const label = getEmailHealthStatusLabel(emailHealth.reason || emailHealth.status);
  const checkedAt = formatEmailHealthCheckedAt(emailHealth.last_check_at);
  const sheetUrl = "https://docs.google.com/spreadsheets/d/14Uf6GlvmlCxzaFxENExW-FkCV0CZNQ_7zwzik9SAelY/edit#gid=0";

  return (
    <div className="relative z-10 border-b border-red-200 bg-red-50 px-4 py-3 text-red-950">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" strokeWidth={2} />
          <div className="min-w-0">
            <p className="font-semibold">{label}</p>
            <p className="mt-0.5 text-red-800">
              {emailHealth.domain} · Dernier check {checkedAt}
            </p>
          </div>
        </div>
        <a
          href={sheetUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex shrink-0 items-center gap-2 rounded-md border border-red-200 bg-white px-3 py-2 font-medium text-red-900 transition-colors hover:bg-red-100"
        >
          Email_Health
          <ExternalLink className="h-4 w-4" strokeWidth={2} />
        </a>
      </div>
    </div>
  );
}
