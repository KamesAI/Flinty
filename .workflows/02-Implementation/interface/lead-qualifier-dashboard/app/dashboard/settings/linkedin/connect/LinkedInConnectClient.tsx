"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Activity, CheckCircle2, LinkIcon, PauseCircle, RefreshCw, Unplug } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AccountStatus {
  status: "connected" | "expired" | "paused" | "disconnected";
  account_id: string;
  connected_at?: string;
  paused_reason?: string;
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

function statusCopy(account: AccountStatus | null) {
  if (!account || account.status === "disconnected") {
    return {
      icon: Unplug,
      title: "LinkedIn deconnecte",
      detail: "Aucun account_id Unipile stocke dans Accounts.",
      tone: "slate",
    };
  }
  if (account.status === "connected") {
    return {
      icon: CheckCircle2,
      title: "Compte connecte",
      detail: `Connecte depuis le ${formatConnectedAt(account.connected_at) || "date inconnue"}`,
      tone: "green",
    };
  }
  if (account.status === "paused") {
    return {
      icon: PauseCircle,
      title: "Compte suspendu",
      detail: account.paused_reason || "Pause active cote LinkedIn health monitor.",
      tone: "red",
    };
  }
  return {
    icon: RefreshCw,
    title: "Connexion expiree",
    detail: "Reconnectez LinkedIn via Unipile hosted auth.",
    tone: "amber",
  };
}

export function LinkedInConnectClient({
  success,
  error,
}: {
  success?: string;
  error?: string;
}) {
  const [account, setAccount] = useState<AccountStatus | null>(null);
  const [isPending, startTransition] = useTransition();
  const copy = statusCopy(account);
  const Icon = copy.icon;

  useEffect(() => {
    let cancelled = false;

    async function loadStatus() {
      const response = await fetch("/api/unipile/status", { cache: "no-store" });
      if (!response.ok) return;
      const payload = (await response.json()) as AccountStatus;
      if (!cancelled) setAccount(payload);
    }

    loadStatus();
    return () => {
      cancelled = true;
    };
  }, []);

  function connect() {
    startTransition(async () => {
      const response = await fetch("/api/unipile/auth/initiate", { method: "POST" });
      const payload = (await response.json()) as { url?: string; error?: string };
      if (response.ok && payload.url) {
        window.location.href = payload.url;
        return;
      }
      window.location.href = `/dashboard/settings/linkedin/connect?error=${encodeURIComponent(payload.error || "auth_failed")}`;
    });
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Compte LinkedIn</h1>
        <p className="mt-1 text-sm text-slate-500">Connexion via Unipile hosted auth, sans session LinkedIn stockee dans Flinty.</p>
        <Link
          href="/dashboard/settings/linkedin/health"
          className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#006596] hover:underline"
        >
          <Activity className="size-4" />
          Santé LinkedIn
        </Link>
      </div>

      {success ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-900">
          Compte connecte.
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
              <Icon className="size-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-slate-950">{copy.title}</h2>
              <p className="mt-1 text-sm text-slate-500">{copy.detail}</p>
              {account?.account_id ? (
                <p className="mt-2 truncate font-mono text-xs text-slate-400">{account.account_id}</p>
              ) : null}
            </div>
          </div>
          <Button type="button" onClick={connect} disabled={isPending}>
            <LinkIcon className="size-4" />
            {isPending ? "Ouverture..." : "Connecter LinkedIn"}
          </Button>
        </div>
      </section>
    </div>
  );
}
