"use client";

import React from "react";
import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Search, Send, Users } from "lucide-react";
import { toast, Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";

type LinkedInChannel = "linkedin_search" | "post_engagers" | "profile_visitors" | "external_post";

interface LinkedInAccountStatus {
  status: "connected" | "expired" | "paused" | "disconnected";
}

const CHANNELS: Array<{ value: LinkedInChannel; label: string }> = [
  { value: "linkedin_search", label: "Recherche ICP" },
  { value: "post_engagers", label: "Engagements post" },
  { value: "profile_visitors", label: "Visiteurs profil" },
  { value: "external_post", label: "Post externe" },
];

export function LinkedInSourcingPanel({
  campaignId,
  initialSector,
  initialLocation,
  initialIcp,
  sourcedCount,
}: {
  campaignId: string;
  initialSector: string;
  initialLocation: string;
  initialIcp: string;
  sourcedCount: number;
}) {
  const [channel, setChannel] = useState<LinkedInChannel>("linkedin_search");
  const [status, setStatus] = useState<LinkedInAccountStatus | null>(null);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    title: "",
    sector: initialSector,
    company_size: "",
    location: initialLocation,
    post_url: "",
  });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/unipile/status", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: LinkedInAccountStatus) => {
        if (!cancelled) setStatus(payload);
      })
      .catch(() => {
        if (!cancelled) setStatus({ status: "disconnected" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const connected = status?.status === "connected";
  const params = useMemo(() => {
    if (channel === "linkedin_search") {
      return {
        title: form.title,
        sector: form.sector,
        company_size: form.company_size,
        location: form.location,
        icp_md: initialIcp,
      };
    }
    if (channel === "profile_visitors") return {};
    return { post_url: form.post_url };
  }, [channel, form, initialIcp]);

  function update(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function source() {
    startTransition(async () => {
      const response = await fetch("/api/linkedin/source", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ campaign_id: campaignId, channel, params }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        toast.error(payload.error || "Sourcing LinkedIn impossible");
        return;
      }

      toast.success("Sourcing lance (WF9)");
    });
  }

  return (
    <section className="mt-5 rounded-lg border border-slate-200 bg-white p-4">
      <Toaster position="top-center" />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
            <Search className="size-4 text-primary" />
            Sourcing LinkedIn
          </div>
          <p className="mt-1 text-sm text-slate-500">{sourcedCount} leads LinkedIn deja sources.</p>
        </div>
        {!connected ? (
          <Link
            href="/dashboard/settings/linkedin/connect"
            className="inline-flex h-9 items-center rounded-md border border-slate-200 px-3 text-sm font-medium text-primary hover:bg-primary/5"
          >
            Connecter LinkedIn
          </Link>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[220px_1fr_auto] lg:items-end">
        <label className="block space-y-2">
          <span className="text-xs font-medium uppercase text-slate-500">Canal</span>
          <select
            value={channel}
            onChange={(event) => setChannel(event.target.value as LinkedInChannel)}
            className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
          >
            {CHANNELS.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
        </label>

        {channel === "linkedin_search" ? (
          <div className="grid gap-3 sm:grid-cols-4">
            <input className="h-10 rounded-md border border-slate-200 px-3 text-sm" placeholder="Titre" value={form.title} onChange={(event) => update("title", event.target.value)} />
            <input className="h-10 rounded-md border border-slate-200 px-3 text-sm" placeholder="Secteur" value={form.sector} onChange={(event) => update("sector", event.target.value)} />
            <input className="h-10 rounded-md border border-slate-200 px-3 text-sm" placeholder="Taille entreprise" value={form.company_size} onChange={(event) => update("company_size", event.target.value)} />
            <input className="h-10 rounded-md border border-slate-200 px-3 text-sm" placeholder="Localisation" value={form.location} onChange={(event) => update("location", event.target.value)} />
          </div>
        ) : channel === "profile_visitors" ? (
          <div className="flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600">
            <Users className="size-4" />
            Utilise automatiquement les visiteurs du compte connecte.
          </div>
        ) : (
          <input
            className="h-10 rounded-md border border-slate-200 px-3 text-sm"
            placeholder="URL du post LinkedIn"
            value={form.post_url}
            onChange={(event) => update("post_url", event.target.value)}
          />
        )}

        <Button type="button" disabled={!connected || isPending} onClick={source}>
          <Send className="size-4" />
          {isPending ? "Lancement..." : "Sourcer"}
        </Button>
      </div>
    </section>
  );
}
